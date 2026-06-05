/**
 * 基本配置模块 — Generator 驱动版
 *
 * 通信分层：SDK ↔ 中间层 ↔ 设备
 *  1. 中间层传入 JSON 参数，调用 verifierSessions[method](params) 创建 session
 *  2. SDK（generator）yield 64 字节指令包（OutPacket）给中间层
 *  3. 中间层将指令发送给设备，接收设备 64 字节回包（InPacket）
 *  4. 中间层将 InPacket 通过 session.next(inPacket) 传回 SDK
 *  5. 重复 2–4 直至 generator 结束（done = true）
 *  6. generator 最终 value 为 JSON 结果
 */
import {
  convertKeyTypeForOutput,
  encodeKeyTripletFromOutput,
  EVENT_TO_CODE_MAP,
  isKnownEventKeyCode,
  KEY_RETURN_ORDER,
  normalizeToHidCode,
  resolveHidCodeFromDefaultKeyTriplet,
  resolveKeyFunctionByRawTriplet,
  resolveKeyNameByCode,
  resolveRawCodeValue,
} from "./KeyCodeName";

// ─── 公开类型 ─────────────────────────────────────────────────────────────────

/** 64 字节：设备 → 中间层 → SDK */
export type InPacket = number[];
/** 64 字节：SDK → 中间层 → 设备 */
export type OutPacket = number[];

/**
 * SDK 会话类型
 * - yield  OutPacket（SDK 发出的指令）
 * - next   InPacket （设备回包，由中间层传入）
 * - return T        （最终 JSON 结果）
 */
export type DeviceSession<T> = AsyncGenerator<OutPacket, T, InPacket>;

export type BasicConfig = {
  config_count: number;
  config_index: number;
  layer_count: number;
  layer_index: number;
};

export type SetBasicConfigParams = { config_index: number; layer_index: number };
export type GetBasicKeyParams = { config: number; layer: number; pageNo: number; pageSize: number };
export type GetKeyInfoParams = { key: string; config?: number; layer?: number };
export type SetKeyInfoKeyParams = {
  key: string;
  type: number;
  code: number;
  enable?: number;
  tary?: number[];
  super?: number[];
  mt?: number[];
};
export type SetKeyInfoParams = { keys: SetKeyInfoKeyParams[]; config?: number; layer?: number };
export type ResetKeyInfoParams = { key: string; config?: number; layer?: number };
export type ResetRTParams = { key: string[]; config?: number; layer?: number };
export type GetRateParams = Record<string, never>;
export type GetPerfParams = { key: string[]; config?: number; layer?: number };
export type SetPerfParams = { key: string[]; tary: number[]; config?: number; layer?: number };
export type SetRateParams = { index: number };
export type SetBiCalibrationParams = { switch: number };
export type SetCalibrationParams = { switch: number };

// ─── 协议常量 ─────────────────────────────────────────────────────────────────

const FLAG = 0x55; // 命令标志
const GET_Version_COMMAND = 0x03; // 获取固件版本命令
const GET_Base = [0x04, 0x00, 0x20, 0x20] as const;
const GET_Func_COMMAND = 0x05; // 获取功能配置命令
const SET_Func_COMMAND = 0x06; // 设置功能配置命令
const GET_KEY_DEFAULT_COMMAND = 0x07; // 获取默认按键配置命令
const GET_KEY_CURRENT_COMMAND = 0x08; // 获取当前按键配置命令
const SET_KEY_CURRENT_COMMAND = 0x09; // 设置当前按键配置命令
const GET_KEY_TARY_COMMAND = 0xa0; // 获取按键触发参数命令
const SET_KEY_TARY_COMMAND = 0xa1; // 设置按键触发参数命令
const GET_DKS_COMMAND = 0xa2; // 获取 DKS 高级按键数据命令
const SET_DKS_COMMAND = 0xa3; // 设置 DKS 高级按键数据命令
const GET_TGL_COMMAND = 0xa6; // 获取 TGL 高级按键数据命令
const SET_TGL_COMMAND = 0xa7; // 设置 TGL 高级按键数据命令
const TGL_AREA_SIZE = 128;  // TGL 数据区大小（每个板载）
const TGL_ENTRY_SIZE = 3;    // 每条 TGL 数据大小（字节）
const PERF_CFG_MASK_OFFSET = 7;    // funcData 中 Perf_Cfg_mask 的字节偏移
const RATE_CFG_OFFSET = 12;   // funcData 中轮询率的字节偏移
const CALIBRATION_CFG_OFFSET = 15;   // funcData 中校准开关的字节偏移（bit3）
const DKS_AREA_SIZE = 768;  // DKS 数据区大小（每个板载）
const DKS_ENTRY_SIZE = 24;   // 每条 DKS 数据大小（字节）
const DATA_LENGTH = 51;   // 数据长度
const KEY_LAYER_LENGTH = 512;  // 按键层长度
const KEY_ITEM_SIZE = 3;    // 按键项大小
const KEY_TARY_ITEM_SIZE = 8;    // 按键触发参数项大小
const KEY_COUNT = Math.floor(KEY_LAYER_LENGTH / KEY_ITEM_SIZE); // 按键槽位数（170）
const ADVANCED_MT_TYPE = 9;    // 高级键MT类型
const ADVANCED_SUPER_TYPES = new Set([5, 6, 7, 8, 10, 11]); // 高级键Super类型集合

// resetKeyInfo：需要特殊处理的高级类型首字节集合（0x90/0x95/0x94/0x92/0x91/0x93）
const KEY_TYPE_ADVANCED_FIRST_BYTES = new Set([0x90, 0x95, 0x94, 0x92, 0x91, 0x93]);

/**
 * resetKeyInfo 默认触发参数（逻辑值，共 8 项）：
 * [触发死区(10~400), 快速触发开关, 触发灵敏度, 抬起灵敏度,
 *  断触优化开关, 防抖等级, RT顶部死区(0-127), RT底部死区(0-127)]
 *
 * 说明：
 *  - 触发死区 / 触发灵敏度 / 抬起灵敏度 存储时需 -1（设备值 = 逻辑值 - 1）
 *  - 断触优化开关 / 防抖等级 通过 0x06 写入 Perf_Cfg_mask（全局，不在 0xa1 数据里）
 *  - 0xa1 数据实际只含：轴体(1) 触发模式(1) 行程(2) 触发灵敏度+顶部死区(2) 抬起灵敏度+底部死区(2)
 */
const RESET_DEFAULT_TARY = [150, 1, 20, 20, 0, 1, 5, 5] as const;
const RESET_RT_TARY = [150, 1, 20, 20, 0, 1, 5, 5] as const;
const DEFAULT_TARY_AXIS = 0xa0;    // 0xa1 触发参数默认轴体
const RATE_SUPPORT = [1000, 2000, 4000, 8000] as const;

// ─── 内部工具 ─────────────────────────────────────────────────────────────────

/**
 * 组装 64 字节出包：[command, bytes[0], bytes[1], …, 0…]
 * 中间层直接将此数组作为 sendReport(0, new Uint8Array(outPacket)) 的参数。
 */
function buildOutPacket(command: number, bytes: number[] = []): OutPacket {
  const out = new Array<number>(64).fill(0);
  out[0] = command & 0xff;
  bytes.forEach((v, i) => { if (i + 1 < 64) out[i + 1] = v & 0xff; });
  return out;
}

const shiftFrom16Bit = (v: number): [number, number] => [v & 0xff, v >> 8];

const getFuncPacketBytes = (offset: number, size: number): number[] => {
  const [lo, hi] = shiftFrom16Bit(offset);
  return [GET_Func_COMMAND, 0x00, (lo + hi + size) & 0xff, size, lo, hi];
};

const getCommandPacketBytes = (command: number, offset: number, size: number): number[] => {
  const [lo, hi] = shiftFrom16Bit(offset);
  return [command, 0x00, (lo + hi + size) & 0xff, size, lo, hi];
};

const normalizeKeyName = (v: string) => {
  const u = v.trim().toUpperCase();
  return u.startsWith("DIGIT_") ? u.slice(6) : u;
};

/** 从 0x07 默认矩阵 [type,ext,code] 建立按键名 → 槽位索引（仅按实际定义，不按 KEY_RETURN_ORDER 下标强绑） */
const buildKeyIndexMapFromDefaultLayer = (
  rawDefaultLayerData: number[],
): Record<string, number> => {
  const keyIndexMap: Record<string, number> = {};
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const rawType = rawDefaultLayerData[base] ?? 0;
    const extDef = rawDefaultLayerData[base + 1] ?? 0;
    const codeDef = rawDefaultLayerData[base + 2] ?? 0;
    const hidCode = resolveHidCodeFromDefaultKeyTriplet(rawType, extDef, codeDef);
    if (!isKnownEventKeyCode(hidCode)) continue;
    const kName = resolveKeyNameByCode(hidCode, KEY_RETURN_ORDER[i] ?? `K${i}`);
    const nk = normalizeKeyName(kName);
    if (keyIndexMap[nk] === undefined) keyIndexMap[nk] = i;
  }
  return keyIndexMap;
};

/** 按按键名在 0x07 默认矩阵中查找槽位（名称或 EVENT_TO_CODE_MAP 的 code 匹配） */
const resolveKeySlotIndex = (
  rawDefaultLayerData: number[],
  keyName: string,
): number | undefined => {
  const nk = normalizeKeyName(keyName);
  const expectedCode = EVENT_TO_CODE_MAP[nk];

  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hidCode = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultLayerData[base] ?? 0,
      rawDefaultLayerData[base + 1] ?? 0,
      rawDefaultLayerData[base + 2] ?? 0,
    );
    if (!isKnownEventKeyCode(hidCode)) continue;
    const resolvedName = normalizeKeyName(
      resolveKeyNameByCode(hidCode, KEY_RETURN_ORDER[i] ?? `K${i}`),
    );
    if (resolvedName === nk) return i;
    if (
      expectedCode !== undefined &&
      hidCode === normalizeToHidCode(expectedCode)
    ) {
      return i;
    }
  }
  return undefined;
};

// ─── 分包读取 Generator（内部复用） ──────────────────────────────────────────

async function* readChunkedDataGen(
  commandFlag: number,
  totalLength: number,
  packetLength: number,
): DeviceSession<number[]> {
  const chunks: number[] = [];
  for (let offset = 0; offset < totalLength; offset += packetLength) {
    const size = Math.min(packetLength, totalLength - offset);
    const inPacket: InPacket = yield buildOutPacket(
      commandFlag,
      getFuncPacketBytes(offset, size),
    );
    chunks.push(...inPacket.slice(8, 8 + size));
  }
  return chunks.slice(0, totalLength);
}

async function* readChunkedDataByCommandGen(
  commandFlag: number,
  command: number,
  startOffset: number,
  totalLength: number,
  packetLength: number,
): DeviceSession<number[]> {
  const chunks: number[] = [];
  for (let offset = 0; offset < totalLength; offset += packetLength) {
    const size = Math.min(packetLength, totalLength - offset);
    const inPacket: InPacket = yield buildOutPacket(
      commandFlag,
      getCommandPacketBytes(command, startOffset + offset, size),
    );
    chunks.push(...inPacket.slice(8, 8 + size));
  }
  return chunks.slice(0, totalLength);
}

// ─── 导出 Session ─────────────────────────────────────────────────────────────

/**
 *
 * 读取板载/层数基本配置
 *
 *  */
export async function* getBasicConfig(): DeviceSession<{ name: "getBasicConfig"; code: number; data: BasicConfig }> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  return {
    name: "getBasicConfig",
    code: 0,
    data: {
      config_count: baseIn[9] ?? 0,
      config_index: baseIn[8] ?? 0,
      layer_count: 4,
      layer_index: funcData[1] ?? 0,
    },
  };
}

/**
 *
 * 切换板载
 *
 *  */
export async function* setConfigLayerIndex(
  config_index: number,
  layer_index: number,
): DeviceSession<{ name: "setConfigLayerIndex"; code: number; data: Pick<BasicConfig, "config_index" | "layer_index"> }> {
  if (!Number.isInteger(config_index) || config_index < 0)
    throw new Error("config_index must be a non-negative integer");
  const checkSum = (0x01 + config_index) & 0xff;
  const dataIn: InPacket = yield buildOutPacket(FLAG, [
    0x0e, 0x00, checkSum, 0x01, 0x00, 0x00, 0x00, config_index,
  ]);
  return {
    name: "setConfigLayerIndex",
    code: 0,
    data: {
      config_index: dataIn[8] ?? config_index,
      layer_index,
    },
  };
}



/**
 *
 * 读取指定层分页按键列表
 *
 *  */
export async function* getBasicKey(
  request: GetBasicKeyParams,
): DeviceSession<GetBasicKeyResult> {
  const { config, layer, pageNo, pageSize } = request;
  if (!Number.isInteger(config) || config < 0)
    throw new Error("config must be a non-negative integer");
  if (!Number.isInteger(layer) || layer < 0)
    throw new Error("layer must be a non-negative integer");
  if (!Number.isInteger(pageNo) || pageNo < 1)
    throw new Error("pageNo must be an integer starting from 1");
  if (!Number.isInteger(pageSize) || pageSize < 1)
    throw new Error("pageSize must be a positive integer");

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );
  const rawLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  // 获取板载/层数基本配置
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  // 获取功能配置
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  const currentConfigIndex = baseIn[8] ?? config;
  const currentLayerIndex = funcData[1] ?? layer;
  // Perf_Cfg_mask：bit1=断触优化开关，bit5-7=防抖等级
  const perfCfgMask = funcData[7] ?? 0;
  const anti_break_sw = (perfCfgMask >> 1) & 0x01;
  const debounce_lvl = (perfCfgMask >> 5) & 0x07;

  const totalKeys = KEY_COUNT;
  const keyTaryLayerSize = totalKeys * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const keyTaryOffset = layer * keyTaryLayerSize + config * keyTaryProfileSize;

  const rawTaryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, keyTaryOffset, keyTaryLayerSize, DATA_LENGTH,
  );

  const getPositionInfo = (rawLayer: number[], keyIndex: number) => {
    const base = keyIndex * KEY_ITEM_SIZE;
    const ext = rawLayer[base + 1] ?? 0;
    const codeByte = rawLayer[base + 2] ?? 0;
    const code = normalizeToHidCode(resolveRawCodeValue(ext, codeByte));
    const name = resolveKeyNameByCode(code, KEY_RETURN_ORDER[keyIndex] ?? `K${keyIndex}`);
    return { name, code };
  };

  const getKeyTary = (keyIndex: number): number[] => {
    const start = keyIndex * KEY_TARY_ITEM_SIZE;
    const raw = rawTaryData.slice(start, start + KEY_TARY_ITEM_SIZE);

    // Byte 1: [4bit 快速触发开关][4bit SOCD优先级策略（保留）]
    const rt_switch = (raw[1] ?? 0) & 0x0F;

    // Bytes 2-3 (16-bit LE): [9bit 触发死区(10~400)][7bit 预留精度切换]
    const trigger = (raw[2] ?? 0) | ((raw[3] ?? 0) << 8);
    const trigger_dz = trigger & 0x1FF;

    // Bytes 4-5 (16-bit LE): [9bit 触发灵敏度][7bit RT顶部死区]
    const press_region = (raw[4] ?? 0) | ((raw[5] ?? 0) << 8);
    const press_rt = press_region & 0x1FF;
    const press_dz = (press_region >> 9) & 0x7F;

    // Bytes 6-7 (16-bit LE): [9bit 抬起灵敏度][7bit RT底部死区]
    const release_region = (raw[6] ?? 0) | ((raw[7] ?? 0) << 8);
    const release_rt = release_region & 0x1FF;
    const release_dz = (release_region >> 9) & 0x7F;

    return [
      trigger_dz + 1,     // 触发死区
      rt_switch,          // 快速触发开关
      press_rt + 1,       // 触发灵敏度（0-511）
      release_rt + 1,     // 抬起灵敏度（0-511）
      anti_break_sw,      // 断触优化开关（Perf_Cfg_mask bit1）
      debounce_lvl,       // 防抖等级（Perf_Cfg_mask bit5-7）
      press_dz,           // RT顶部死区（0-127）
      release_dz,         // RT底部死区（0-127）
    ];
  };

  type KeyEntry = {
    rawType: number; rawExt: number; code: number;
    codeByte: number; tary: number[]; keyIndex: number; func?: string;
  };
  const keysByName: Record<string, KeyEntry> = {};

  for (let i = 0; i < totalKeys; i++) {
    const base = i * KEY_ITEM_SIZE;
    const rawType = rawLayerData[base] ?? 0;
    const ext = rawLayerData[base + 1] ?? 0;
    const codeByte = rawLayerData[base + 2] ?? 0;
    const { name: keyName, code: positionCode } = getPositionInfo(rawDefaultLayerData, i);
    if (!keysByName[keyName]) {
      keysByName[keyName] = {
        rawType, rawExt: ext, code: positionCode, codeByte,
        tary: getKeyTary(i), keyIndex: i,
        func: resolveKeyFunctionByRawTriplet(rawType, ext, codeByte),
      };
    }
  }

  const orderedKeyNames = KEY_RETURN_ORDER.filter((n) => !!keysByName[n]);
  const start = (pageNo - 1) * pageSize;
  const end = Math.min(start + pageSize, orderedKeyNames.length);

  const keys: GetBasicKeyResult["data"]["keys"] = {};
  const smart: GetBasicKeyResult["data"]["smart"] = {};

  for (let i = start; i < end; i++) {
    const keyName = orderedKeyNames[i];
    const { rawType, code, codeByte, tary, func } = keysByName[keyName];
    const outName = func ?? keyName;
    const outType = convertKeyTypeForOutput(rawType, codeByte);
    if (outType === ADVANCED_MT_TYPE) {
      smart[outName] = { ...(smart[outName] ?? {}), mt: [outType, code] };
      continue;
    }
    if (ADVANCED_SUPER_TYPES.has(outType)) {
      smart[outName] = { ...(smart[outName] ?? {}), super: [outType, code] };
      continue;
    }
    keys[outName] = { type: outType, code, tary };
  }

  const def = keysByName["ESC"]?.tary ?? [];

  return {
    name: "getBasicKey",
    code: 0,
    data: {
      len: orderedKeyNames.length,
      config: currentConfigIndex,
      layer: currentLayerIndex,
      name: layer,
      disable: [],
      def, keys, smart,
    },
  };
}


/**
 *
 * 读取指定按键详情
 *
 *  */
export async function* getKeyInfo(
  request: GetKeyInfoParams,
): DeviceSession<GetKeyInfoResult> {
  const key = String(request?.key ?? "").trim();
  if (!key) throw new Error("request.key is required");

  // config/layer 先取入参，缺省值在读取 0x04+0x05 后填充
  let config = request.config;
  let layer = request.layer;

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = (layer as number) * KEY_LAYER_LENGTH + (config as number) * profileSize;

  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );
  const rawLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  // 读取功能配置（0x05）获取全局 Perf_Cfg_mask：bit1=断触优化开关，bit5-7=防抖等级
  const perfBaseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const perfFuncData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  if (!Number.isInteger(config)) config = perfBaseIn[8] ?? 0;
  if (!Number.isInteger(layer)) layer = perfFuncData[1] ?? 0;
  const perfCfgMask = perfFuncData[7] ?? 0;
  const anti_break_sw = (perfCfgMask >> 1) & 0x01;
  const debounce_lvl = (perfCfgMask >> 5) & 0x07;

  const totalKeys = KEY_COUNT;
  const keyTaryLayerSize = totalKeys * KEY_TARY_ITEM_SIZE;
  const keyTaryOffset = (layer as number) * keyTaryLayerSize + (config as number) * (keyTaryLayerSize * 4);

  const rawTaryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, keyTaryOffset, keyTaryLayerSize, DATA_LENGTH,
  );

  const normalizeKey = (v: string) => {
    const u = v.trim().toUpperCase();
    return u.startsWith("DIGIT_") ? u.slice(6) : u;
  };
  const wantedKey = normalizeKey(key);

  for (let i = 0; i < totalKeys; i++) {
    const base = i * KEY_ITEM_SIZE;
    const rawType = rawLayerData[base] ?? 0;
    const ext = rawLayerData[base + 1] ?? 0;
    const codeByte = rawLayerData[base + 2] ?? 0;
    const outType = convertKeyTypeForOutput(rawType, codeByte);

    const extDef = rawDefaultLayerData[base + 1] ?? 0;
    const codeDef = rawDefaultLayerData[base + 2] ?? 0;
    const posCode = normalizeToHidCode(resolveRawCodeValue(extDef, codeDef));
    const keyName = resolveKeyNameByCode(posCode, KEY_RETURN_ORDER[i] ?? `K${i}`);
    if (normalizeKey(keyName) !== wantedKey) continue;

    const start = i * KEY_TARY_ITEM_SIZE;
    const raw = rawTaryData.slice(start, start + KEY_TARY_ITEM_SIZE);
    const enable = 1;

    // Byte 1: [4bit 快速触发开关][4bit SOCD优先级策略（保留）]
    const rt_switch = (raw[1] ?? 0) & 0x0F;

    // Bytes 2-3 (16-bit LE): [9bit 触发死区(10~400)][7bit 预留精度切换]
    const trigger = (raw[2] ?? 0) | ((raw[3] ?? 0) << 8);
    const trigger_dz = trigger & 0x1FF;

    // Bytes 4-5 (16-bit LE): [9bit 触发灵敏度][7bit RT顶部死区]
    const press_region = (raw[4] ?? 0) | ((raw[5] ?? 0) << 8);
    const press_rt = press_region & 0x1FF;
    const press_dz = (press_region >> 9) & 0x7F;

    // Bytes 6-7 (16-bit LE): [9bit 抬起灵敏度][7bit RT底部死区]
    const release_region = (raw[6] ?? 0) | ((raw[7] ?? 0) << 8);
    const release_rt = release_region & 0x1FF;
    const release_dz = (release_region >> 9) & 0x7F;

    const out: GetKeyInfoResult["data"] = {
      key: keyName,
      type: outType,
      code: posCode,
      enable,
      tary: [
        trigger_dz + 1,   // 触发死区
        rt_switch,        // 快速触发开关（Perf_Cfg_mask bit0）
        press_rt + 1,     // 触发灵敏度（0-511）
        release_rt + 1,   // 抬起灵敏度（0-511）
        anti_break_sw,    // 断触优化开关（Perf_Cfg_mask bit1）
        debounce_lvl,     // 防抖等级（Perf_Cfg_mask bit5-7）
        press_dz,         // RT顶部死区（0-127）
        release_dz,       // RT底部死区（0-127）
      ],
      super: [],
      mt: [],
    };
    if (outType === ADVANCED_MT_TYPE) out.mt = [outType, posCode];
    else if (ADVANCED_SUPER_TYPES.has(outType)) out.super = [outType, posCode];

    return { name: "getKeyInfo", code: 0, data: out };
  }

  return { name: "getKeyInfo", code: 1, data: { key }, message: `key not found: ${key}` };
}

/**
 *
 * 批量设置按键定义及触发参数
 *
 * 流程（每个 key）：
 *  1. 0x07 默认矩阵定位槽位 index
 *  2. type + code → [type, ext, code] 三字节，0x09 写入改键定义
 *  3. tary 存在时（固定 8 项）0xa1 写入该键触发参数，轴体默认 0xa0
 *  4. super / mt 暂不处理
 *
 */
export async function* setKeyInfo(
  request: SetKeyInfoParams,
): DeviceSession<SetKeyInfoResult> {
  const entries = request.keys;
  if (!Array.isArray(entries) || entries.length === 0)
    return { name: "setKeyInfo", code: 3, message: "request.keys must be a non-empty array" };

  const normalizeTary = (tary: number[] | undefined): number[] | null => {
    if (tary === undefined) return null;
    if (!Array.isArray(tary) || tary.length !== 8) return null;
    return [...tary];
  };

  const validateTary = (tary: number[]): string | null => {
    const [
      tary_trigger_dz, tary_rt_switch, tary_press_rt, tary_release_rt,
      tary_anti_break, tary_debounce, tary_press_dz, tary_release_dz,
    ] = tary;
    if (!Number.isInteger(tary_trigger_dz) || tary_trigger_dz < 10 || tary_trigger_dz > 400)
      return "tary[0] 触发死区 must be 10~400";
    if (!Number.isInteger(tary_rt_switch) || tary_rt_switch < 0 || tary_rt_switch > 15)
      return "tary[1] 快速触发开关 must be 0~15";
    if (!Number.isInteger(tary_press_rt) || tary_press_rt < 1 || tary_press_rt > 512)
      return "tary[2] 触发灵敏度 must be 1~512";
    if (!Number.isInteger(tary_release_rt) || tary_release_rt < 1 || tary_release_rt > 512)
      return "tary[3] 抬起灵敏度 must be 1~512";
    if (!Number.isInteger(tary_anti_break) || tary_anti_break < 0 || tary_anti_break > 1)
      return "tary[4] 断触优化开关 must be 0 or 1";
    if (!Number.isInteger(tary_debounce) || tary_debounce < 0 || tary_debounce > 7)
      return "tary[5] 防抖等级 must be 0~7";
    if (!Number.isInteger(tary_press_dz) || tary_press_dz < 0 || tary_press_dz > 127)
      return "tary[6] RT顶部死区 must be 0~127";
    if (!Number.isInteger(tary_release_dz) || tary_release_dz < 0 || tary_release_dz > 127)
      return "tary[7] RT底部死区 must be 0~127";
    return null;
  };

  const encodeTaryDevBytes = (tary: number[]): number[] => {
    const [
      tary_trigger_dz, tary_rt_switch, tary_press_rt, tary_release_rt,
      tary_press_dz, tary_release_dz,
    ] = [tary[0], tary[1], tary[2], tary[3], tary[6], tary[7]];
    const dev_trigger_dz = (tary_trigger_dz - 1) & 0x1ff;
    const dev_press_rt = (tary_press_rt - 1) & 0x1ff;
    const dev_release_rt = (tary_release_rt - 1) & 0x1ff;
    const press_region = dev_press_rt | ((tary_press_dz & 0x7f) << 9);
    const release_region = dev_release_rt | ((tary_release_dz & 0x7f) << 9);
    return [
      DEFAULT_TARY_AXIS,
      tary_rt_switch & 0x0f,
      dev_trigger_dz & 0xff,
      (dev_trigger_dz >> 8) & 0xff,
      press_region & 0xff,
      (press_region >> 8) & 0xff,
      release_region & 0xff,
      (release_region >> 8) & 0xff,
    ];
  };

  for (const entry of entries) {
    const key = String(entry?.key ?? "").trim();
    if (!key) return { name: "setKeyInfo", code: 3, message: "each key entry requires key" };
    if (!Number.isInteger(entry.type)) return { name: "setKeyInfo", code: 3, message: `key ${key}: type is required` };
    if (!Number.isInteger(entry.code)) return { name: "setKeyInfo", code: 3, message: `key ${key}: code is required` };
    const enable = entry.enable ?? 1;
    if (enable !== 0 && enable !== 1)
      return { name: "setKeyInfo", code: 3, message: `key ${key}: enable must be 0 or 1` };
    const normalizedTary = normalizeTary(entry.tary);
    if (entry.tary !== undefined && normalizedTary === null)
      return { name: "setKeyInfo", code: 3, message: `key ${key}: tary must be an array of 8 numbers` };
    if (normalizedTary) {
      const taryErr = validateTary(normalizedTary);
      if (taryErr) return { name: "setKeyInfo", code: 3, message: `key ${key}: ${taryErr}` };
    }
  }

  let config = request.config;
  let layer = request.layer;

  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  if (!Number.isInteger(config)) config = baseIn[8] ?? 0;
  if (!Number.isInteger(layer)) layer = funcData[1] ?? 0;

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = (layer as number) * KEY_LAYER_LENGTH + (config as number) * profileSize;

  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  const keyTaryLayerSize = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  let lastPerfMask: { anti_break: number; debounce: number } | null = null;

  for (const entry of entries) {
    const key = String(entry.key).trim();
    const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, key);
    if (keyIndex === undefined)
      return { name: "setKeyInfo", code: 1, message: `key not found: ${key}` };

    const [defType, defExt, defCode] = encodeKeyTripletFromOutput(entry.type, entry.code);
    const keyDefAbsOff = layerOffset + keyIndex * KEY_ITEM_SIZE;
    const [dLo, dHi] = shiftFrom16Bit(keyDefAbsOff);
    const defChecksum = (dLo + dHi + KEY_ITEM_SIZE + defType + defExt + defCode) & 0xff;
    yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, defChecksum, KEY_ITEM_SIZE,
      dLo, dHi, 0x00,
      defType, defExt, defCode,
    ]);

    const normalizedTary = normalizeTary(entry.tary);
    if (normalizedTary) {
      const taryDevBytes = encodeTaryDevBytes(normalizedTary);
      const taryAbsOff = (layer as number) * keyTaryLayerSize
        + (config as number) * keyTaryProfileSize
        + keyIndex * KEY_TARY_ITEM_SIZE;
      const [tLo, tHi] = shiftFrom16Bit(taryAbsOff);
      const tarySize = taryDevBytes.length;
      const taryChecksum = (tLo + tHi + tarySize + taryDevBytes.reduce((s, v) => s + v, 0)) & 0xff;
      yield buildOutPacket(FLAG, [
        SET_KEY_TARY_COMMAND, 0x00, taryChecksum, tarySize,
        tLo, tHi, 0x00,
        ...taryDevBytes,
      ]);
      lastPerfMask = { anti_break: normalizedTary[4], debounce: normalizedTary[5] };
    }
  }

  if (lastPerfMask) {
    const perfCfgMask = ((lastPerfMask.anti_break & 0x01) << 1) | ((lastPerfMask.debounce & 0x07) << 5);
    const [pLo, pHi] = shiftFrom16Bit(PERF_CFG_MASK_OFFSET);
    const perfSize = 1;
    const perfChecksum = (pLo + pHi + perfSize + perfCfgMask) & 0xff;
    yield buildOutPacket(FLAG, [
      SET_Func_COMMAND, 0x00, perfChecksum, perfSize,
      pLo, pHi, 0x00,
      perfCfgMask,
    ]);
  }

  return { name: "setKeyInfo", code: 0 };
}

/**
 *
 * 批量获取指定按键的触发参数
 *
 * 流程：
 *  1. 0x04 + 0x05 读取当前 config / layer 及 Perf_Cfg_mask（断触优化开关 + 防抖等级）
 *  2. 0x07 读取默认矩阵，建立按键名称 → keyIndex 映射
 *  3. 0xa0 读取当前层完整触发参数数据
 *  4. key 非空数组：仅返回指定按键；key 为 []：读 0x07 默认定义，解析为 EVENT_TO_CODE_MAP 中的键（0x10 0x00 code / 修饰键 RAW_VALUE 转换）
 *  5. 逐键提取触发参数；每个按键固定返回 8 项 tary（非 pageSize 个按键）
 *
 * 返回数组格式（8项）：
 *  [触发死区(10~400), 快速触发开关, 触发灵敏度, 抬起灵敏度,
 *   断触优化开关, 防抖等级, RT顶部死区(0-127), RT底部死区(0-127)]
 *
 */
export async function* getPerf(
  request: GetPerfParams,
): DeviceSession<GetPerfResult> {
  if (!Array.isArray(request.key))
    throw new Error("request.key is required and must be an array");
  const reqKeys = request.key;

  let config = request.config;
  let layer = request.layer;

  // ── 步骤一：0x04 + 0x05 获取 config / layer / Perf_Cfg_mask ────────────
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  if (!Number.isInteger(config)) config = baseIn[8] ?? 0;
  if (!Number.isInteger(layer)) layer = funcData[1] ?? 0;
  const perfCfgMask = funcData[PERF_CFG_MASK_OFFSET] ?? 0;
  const anti_break_sw = (perfCfgMask >> 1) & 0x01;
  const debounce_lvl = (perfCfgMask >> 5) & 0x07;

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = (layer as number) * KEY_LAYER_LENGTH + (config as number) * profileSize;

  // ── 步骤二：0x07 读取默认矩阵，建立 keyName → keyIndex 映射 ────────────
  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  // ── 读取当前层完整触发参数 ────────────────────────────────
  const keyTaryLayerSize = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const keyTaryOffset = (layer as number) * keyTaryLayerSize + (config as number) * keyTaryProfileSize;

  const rawTaryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, keyTaryOffset, keyTaryLayerSize, DATA_LENGTH,
  );

  type KeySlot = { name: string; index: number };
  const buildAllKeySlotsFromDefault = (): KeySlot[] => {
    const byName = new Map<string, KeySlot>();
    for (let i = 0; i < KEY_COUNT; i++) {
      const base = i * KEY_ITEM_SIZE;
      const rawType = rawDefaultLayerData[base] ?? 0;
      const extDef = rawDefaultLayerData[base + 1] ?? 0;
      const codeDef = rawDefaultLayerData[base + 2] ?? 0;
      const hidCode = resolveHidCodeFromDefaultKeyTriplet(rawType, extDef, codeDef);
      if (!isKnownEventKeyCode(hidCode)) continue;
      const name = resolveKeyNameByCode(hidCode, KEY_RETURN_ORDER[i] ?? `K${i}`);
      const nk = normalizeKeyName(name);
      if (!byName.has(nk)) byName.set(nk, { name, index: i });
    }
    const ordered: KeySlot[] = [];
    for (const n of KEY_RETURN_ORDER) {
      const slot = byName.get(normalizeKeyName(n));
      if (slot) ordered.push(slot);
    }
    for (const slot of byName.values()) {
      if (!ordered.some((s) => normalizeKeyName(s.name) === normalizeKeyName(slot.name))) {
        ordered.push(slot);
      }
    }
    return ordered;
  };

  const targetSlots: KeySlot[] =
    reqKeys.length > 0
      ? reqKeys.flatMap((keyName) => {
        const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, keyName);
        return keyIndex !== undefined
          ? [{ name: keyName.trim().toUpperCase(), index: keyIndex }]
          : [];
      })
      : buildAllKeySlotsFromDefault();

  const extractTary = (keyIndex: number): number[] => {
    const taryStart = keyIndex * KEY_TARY_ITEM_SIZE;
    const raw = rawTaryData.slice(taryStart, taryStart + KEY_TARY_ITEM_SIZE);
    const rt_switch = (raw[1] ?? 0) & 0x0f;
    const trigger = (raw[2] ?? 0) | ((raw[3] ?? 0) << 8);
    const trigger_dz = trigger & 0x1ff;
    const press_region = (raw[4] ?? 0) | ((raw[5] ?? 0) << 8);
    const press_rt = press_region & 0x1ff;
    const press_dz = (press_region >> 9) & 0x7f;
    const release_region = (raw[6] ?? 0) | ((raw[7] ?? 0) << 8);
    const release_rt = release_region & 0x1ff;
    const release_dz = (release_region >> 9) & 0x7f;
    return [
      trigger_dz + 1,
      rt_switch,
      press_rt + 1,
      release_rt + 1,
      anti_break_sw,
      debounce_lvl,
      press_dz,
      release_dz,
    ];
  };

  const resultKeys: Record<string, number[]> = {};
  for (const { name, index } of targetSlots) {
    resultKeys[name] = extractTary(index);
  }

  return {
    name: "getPerf",
    code: 0,
    data: {
      len: Object.keys(resultKeys).length,
      keys: resultKeys,
    },
  };
}

/**
 *
 * 批量设置指定按键的触发参数
 *
 * 流程：
 *  1. 参数合法性校验（不合法直接返回 code:3，不与设备通信）
 *  2. 0x04 + 0x05 读取当前 config / layer
 *  3. 0x07 读取默认矩阵，建立按键名称 → keyIndex 映射
 *  4. 0xa1 按 keyIndex 偏移逐键写入触发参数
 *  5. 0x06 写入 Perf_Cfg_mask（断触优化开关 + 防抖等级，全局设置）
 *
 * tary 数组格式（8项）：
 *  [触发死区(10~400), 快速触发开关(0~15), 触发灵敏度(1~512), 抬起灵敏度(1~512),
 *   断触优化开关(0~1), 防抖等级(0~7), RT顶部死区(0~127), RT底部死区(0~127)]
 *
 */
export async function* setPerf(
  request: SetPerfParams,
): DeviceSession<SetPerfResult> {
  const reqKeys = request.key;
  const tary = request.tary;

  // ── 参数校验（不触发设备通信）───────────────────────────────────────────
  if (!Array.isArray(reqKeys) || reqKeys.length === 0)
    return { name: "setPerf", code: 3, message: "request.key must be a non-empty array" };
  if (!Array.isArray(tary) || tary.length !== 8)
    return { name: "setPerf", code: 3, message: "request.tary must be an array of 8 numbers" };

  const [
    tary_trigger_dz,   // [0] 触发死区 10~400
    tary_rt_switch,    // [1] 快速触发开关 0~15
    tary_press_rt,     // [2] 触发灵敏度 1~512
    tary_release_rt,   // [3] 抬起灵敏度 1~512
    tary_anti_break,   // [4] 断触优化开关 0~1
    tary_debounce,     // [5] 防抖等级 0~7
    tary_press_dz,     // [6] RT顶部死区 0~127
    tary_release_dz,   // [7] RT底部死区 0~127
  ] = tary;

  if (!Number.isInteger(tary_trigger_dz) || tary_trigger_dz < 10 || tary_trigger_dz > 400)
    return { name: "setPerf", code: 3, message: "tary[0] 触发死区 must be 10~400" };
  if (!Number.isInteger(tary_rt_switch) || tary_rt_switch < 0 || tary_rt_switch > 2)
    return { name: "setPerf", code: 3, message: "tary[1] 快速触发开关 must be 0~15" };
  if (!Number.isInteger(tary_press_rt) || tary_press_rt < 1 || tary_press_rt > 512)
    return { name: "setPerf", code: 3, message: "tary[2] 触发灵敏度 must be 1~512" };
  if (!Number.isInteger(tary_release_rt) || tary_release_rt < 1 || tary_release_rt > 512)
    return { name: "setPerf", code: 3, message: "tary[3] 抬起灵敏度 must be 1~512" };
  if (!Number.isInteger(tary_anti_break) || tary_anti_break < 0 || tary_anti_break > 1)
    return { name: "setPerf", code: 3, message: "tary[4] 断触优化开关 must be 0 or 1" };
  if (!Number.isInteger(tary_debounce) || tary_debounce < 0 || tary_debounce > 7)
    return { name: "setPerf", code: 3, message: "tary[5] 防抖等级 must be 0~7" };
  if (!Number.isInteger(tary_press_dz) || tary_press_dz < 0 || tary_press_dz > 50)
    return { name: "setPerf", code: 3, message: "tary[6] RT顶部死区 must be 0~127" };
  if (!Number.isInteger(tary_release_dz) || tary_release_dz < 0 || tary_release_dz > 50)
    return { name: "setPerf", code: 3, message: "tary[7] RT底部死区 must be 0~127" };

  let config = request.config;
  let layer = request.layer;

  // ── 步骤一：0x04 + 0x05 获取 config / layer ─────────────────────────────
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  if (!Number.isInteger(config)) config = baseIn[8] ?? 0;
  if (!Number.isInteger(layer)) layer = funcData[1] ?? 0;

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = (layer as number) * KEY_LAYER_LENGTH + (config as number) * profileSize;

  // ── 步骤二：0x07 读取默认矩阵，建立 keyName → keyIndex 映射 ────────────
  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  // ── 步骤三：编码 8 字节设备格式 ─────────────────────────────────────────
  const dev_trigger_dz = (tary_trigger_dz - 1) & 0x1ff;
  const dev_press_rt = (tary_press_rt - 1) & 0x1ff;
  const dev_release_rt = (tary_release_rt - 1) & 0x1ff;
  const press_region = dev_press_rt | ((tary_press_dz & 0x7f) << 9);
  const release_region = dev_release_rt | ((tary_release_dz & 0x7f) << 9);

  const taryDevBytes = [
    DEFAULT_TARY_AXIS,                  // 轴体（保持默认）
    tary_rt_switch & 0x0f,              // 触发模式低 4bit
    dev_trigger_dz & 0xff,              // 行程低字节
    (dev_trigger_dz >> 8) & 0xff,       // 行程高字节
    press_region & 0xff,              // 触发灵敏度+顶部死区低字节
    (press_region >> 8) & 0xff,        // 触发灵敏度+顶部死区高字节
    release_region & 0xff,              // 抬起灵敏度+底部死区低字节
    (release_region >> 8) & 0xff,       // 抬起灵敏度+底部死区高字节
  ];

  // ── 步骤四：0xa1 逐键写入触发参数 ──────────────────────────────────────
  const keyTaryLayerSize = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const tarySize = taryDevBytes.length; // 8

  for (const keyName of reqKeys) {
    const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, keyName);
    if (keyIndex === undefined) {
      return { name: "setPerf", code: 1, message: `key not found: ${keyName}` };
    }

    const taryAbsOff = (layer as number) * keyTaryLayerSize
      + (config as number) * keyTaryProfileSize
      + keyIndex * KEY_TARY_ITEM_SIZE;
    const [tLo, tHi] = shiftFrom16Bit(taryAbsOff);
    const taryChecksum = (tLo + tHi + tarySize + taryDevBytes.reduce((s, v) => s + v, 0)) & 0xff;
    yield buildOutPacket(FLAG, [
      SET_KEY_TARY_COMMAND, 0x00, taryChecksum, tarySize,
      tLo, tHi, 0x00,
      ...taryDevBytes,
    ]);
  }

  // ── 步骤五：0x06 写入 Perf_Cfg_mask（断触优化开关 + 防抖等级，全局）──
  // Perf_Cfg_mask: bit1 = anti_break_sw, bit5-7 = debounce_lvl
  const perfCfgMask = ((tary_anti_break & 0x01) << 1) | ((tary_debounce & 0x07) << 5);
  const [pLo, pHi] = shiftFrom16Bit(PERF_CFG_MASK_OFFSET);
  const perfSize = 1;
  const perfChecksum = (pLo + pHi + perfSize + perfCfgMask) & 0xff;
  yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, perfChecksum, perfSize,
    pLo, pHi, 0x00,
    perfCfgMask,
  ]);

  return { name: "setPerf", code: 0 };
}

/**
 *
 * 重置指定按键为出厂默认定义及触发参数
 *
 * 流程：
 *  1. 读取当前 config / layer（0x04 + 0x05）
 *  2. 0x07 读取默认矩阵，定位按键索引（找到 [0x10, 0x00, HID_code] 位置）
 *  3. 0x08 读取当前板载所有4层按键数据，取出该键的3字节定义
 *  4. 若首字节属于高级类型（0x90 DKS/0x91 TGL/0x95/0x94/0x92/0x93）→ 0x90/0x91 已实现，其余预留
 *     否则 → 0x09 下发默认3字节定义
 *  5. 0xa1 按 keyIndex×8 偏移下发默认触发参数 [10,10,1,20,20,1,1]
 *  6. 返回结果
 *
 */
export async function* resetKeyInfo(
  request: ResetKeyInfoParams,
): DeviceSession<ResetKeyInfoResult> {
  const key = String(request?.key ?? "").trim();
  if (!key) throw new Error("request.key is required");

  let config = request.config;
  let layer = request.layer;

  const profileSize = KEY_LAYER_LENGTH * 4;

  // ── 步骤一：获取当前 config / layer ──────────────────────────────────────
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  if (!Number.isInteger(config)) config = baseIn[8] ?? 0;
  if (!Number.isInteger(layer)) layer = funcData[1] ?? 0;

  const layerOffset = (layer as number) * KEY_LAYER_LENGTH + (config as number) * profileSize;

  // ── 步骤二：0x07 读取默认矩阵，定位按键索引 ─────────────────────────────
  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  const wantedKey = normalizeKeyName(key);
  const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, key) ?? -1;
  let posCode = 0;
  if (keyIndex >= 0) {
    const base = keyIndex * KEY_ITEM_SIZE;
    posCode = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultLayerData[base] ?? 0,
      rawDefaultLayerData[base + 1] ?? 0,
      rawDefaultLayerData[base + 2] ?? 0,
    );
  }

  if (keyIndex === -1) {
    return {
      name: "resetKeyInfo",
      code: 1,
      data: { key, type: 0, code: 0, tary: [], super: [], mt: [] },
      message: `key not found: ${key}`,
    };
  }

  // ── 步骤三：0x08 读取当前板载全部4层按键数据 ────────────────────────────
  const allLayersOffset = (config as number) * profileSize;
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  // 在当前层中取该键的3字节定义
  const currentLayerBase = (layer as number) * KEY_LAYER_LENGTH + keyIndex * KEY_ITEM_SIZE;
  const rawType = rawAllLayersData[currentLayerBase] ?? 0;

  // ── 步骤四：按首字节判断类型，决定重置策略 ─────────────────────────────

  /** 向设备下发 0x09，将指定槽位写为 [t, e, c] 三字节定义 */
  const yieldSetKeyDef = (absOff: number, t: number, e: number, c: number) => {
    const [lo, hi] = shiftFrom16Bit(absOff);
    const chk = (lo + hi + KEY_ITEM_SIZE + t + e + c) & 0xff;
    return buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, chk, KEY_ITEM_SIZE,
      lo, hi, 0x00,
      t, e, c,
    ]);
  };

  if (rawType === 0x90 || rawType === 0x91) {
    // ── DKS 高级按键（0x90）/ TGL 高级按键（0x91）重置流程 ─────────────

    // 在 DKS 数据区中的索引（定义第二字节）
    const aDksIdx = rawAllLayersData[currentLayerBase + 1] ?? 0;

    // 统计当前层全部同类型按键，按 DKS 索引升序排列
    type DksEntry = { keyI: number; dksIdx: number };
    const dksEntries: DksEntry[] = [];
    const curLayerBase = (layer as number) * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = curLayerBase + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === rawType) {
        dksEntries.push({ keyI: i, dksIdx: rawAllLayersData[b + 1] ?? 0 });
      }
    }
    dksEntries.sort((a, b) => a.dksIdx - b.dksIdx);
    const totalDks = dksEntries.length;

    // 0x09：将按键恢复为默认按键定义
    const defBase = keyIndex * KEY_ITEM_SIZE;
    const defType = rawDefaultLayerData[defBase] ?? 0x10;
    const defExt = rawDefaultLayerData[defBase + 1] ?? 0x00;
    const defCode = rawDefaultLayerData[defBase + 2] ?? (posCode & 0xff);
    yield yieldSetKeyDef(layerOffset + keyIndex * KEY_ITEM_SIZE, defType, defExt, defCode);

    // 0x09：将同类型按键中 DKS 索引 > aDksIdx 的其他按键索引各减 1（填补空缺）
    for (const entry of dksEntries) {
      if (entry.keyI === keyIndex) continue;
      if (entry.dksIdx <= aDksIdx) continue;
      const newDksIdx = entry.dksIdx - 1;
      yield yieldSetKeyDef(
        layerOffset + entry.keyI * KEY_ITEM_SIZE,
        rawType, newDksIdx, 0x00,
      );
    }

    // 按类型选择对应的数据区命令、区域大小、条目大小
    const isTgl = rawType === 0x91;
    const GET_ADV_COMMAND = isTgl ? GET_TGL_COMMAND : GET_DKS_COMMAND;
    const SET_ADV_COMMAND = isTgl ? SET_TGL_COMMAND : SET_DKS_COMMAND;
    const ADV_AREA_SIZE = isTgl ? TGL_AREA_SIZE : DKS_AREA_SIZE;
    const ADV_ENTRY_SIZE = isTgl ? TGL_ENTRY_SIZE : DKS_ENTRY_SIZE;

    const advAreaOffset = (config as number) * ADV_AREA_SIZE;

    // 读取需要平移的那段数据（aDksIdx+1 ~ totalDks-1），跳过无关区域
    //   moveCount = 需要平移的条目数；为 0 时跳过读取
    const moveCount = totalDks - 1 - aDksIdx;
    const partialDksData: number[] = moveCount > 0
      ? yield* readChunkedDataByCommandGen(
        FLAG, GET_ADV_COMMAND,
        advAreaOffset + (aDksIdx + 1) * ADV_ENTRY_SIZE,  // 从需要平移的开始
        moveCount * ADV_ENTRY_SIZE,                        // 只读需要平移的部分
        DATA_LENGTH,
      )
      : [];

    // 将读取到的每条数据依次写到前一个槽位
    for (let i = 0; i < moveCount; i++) {
      const entryData = partialDksData.slice(i * ADV_ENTRY_SIZE, (i + 1) * ADV_ENTRY_SIZE);
      const writeOff = advAreaOffset + (aDksIdx + i) * ADV_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(writeOff);
      const wChk = (wLo + wHi + ADV_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
      yield buildOutPacket(FLAG, [
        SET_ADV_COMMAND, 0x00, wChk, ADV_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...entryData,
      ]);
    }

    // 末尾条目清零
    const clearOff = advAreaOffset + (totalDks - 1) * ADV_ENTRY_SIZE;
    const [cLo, cHi] = shiftFrom16Bit(clearOff);
    const clearData = new Array<number>(ADV_ENTRY_SIZE).fill(0);
    const cChk = (cLo + cHi + ADV_ENTRY_SIZE) & 0xff;
    yield buildOutPacket(FLAG, [
      SET_ADV_COMMAND, 0x00, cChk, ADV_ENTRY_SIZE,
      cLo, cHi, 0x00,
      ...clearData,
    ]);

  } else if (KEY_TYPE_ADVANCED_FIRST_BYTES.has(rawType)) {
    // TODO: 其他高级类型（0x95/0x92/0x93/0x94）预留
  } else {
    // 非高级类型：0x09 下发默认3字节定义（来自默认矩阵）
    const defBase = keyIndex * KEY_ITEM_SIZE;
    const defType = rawDefaultLayerData[defBase] ?? 0x10;
    const defExt = rawDefaultLayerData[defBase + 1] ?? 0x00;
    const defCode = rawDefaultLayerData[defBase + 2] ?? (posCode & 0xff);
    yield yieldSetKeyDef(layerOffset + keyIndex * KEY_ITEM_SIZE, defType, defExt, defCode);
  }

  // ── 步骤五：0xa1 按 keyIndex×8 偏移写入默认触发参数 ─────────────────────
  // 拆解逻辑值
  const [
    tary_trigger_dz,   // 触发死区(10~400)，设备值 = 逻辑值 - 1
    tary_rt_switch,    // 快速触发开关（4bit，0-15）
    tary_press_rt,     // 触发灵敏度，设备值 = 逻辑值 - 1
    tary_release_rt,   // 抬起灵敏度，设备值 = 逻辑值 - 1
    tary_anti_break,   // 断触优化开关 → 0x06
    tary_debounce,     // 防抖等级     → 0x06
    tary_press_dz,     // RT 顶部死区（0-127）
    tary_release_dz,   // RT 底部死区（0-127）
  ] = RESET_DEFAULT_TARY;

  // 编码为 8 字节设备格式
  // Byte 0: 轴体
  // Byte 1: 触发模式 = rt_switch[3:0]
  // Bytes 2-3 (16-bit LE): [8:0] = trigger_dz(设备值), [15:9] = 预留
  // Bytes 4-5 (16-bit LE): [8:0] = press_rt(设备值),   [15:9] = press_dz
  // Bytes 6-7 (16-bit LE): [8:0] = release_rt(设备值), [15:9] = release_dz
  const dev_trigger_dz = (tary_trigger_dz - 1) & 0x1ff;
  const dev_press_rt = (tary_press_rt - 1) & 0x1ff;
  const dev_release_rt = (tary_release_rt - 1) & 0x1ff;
  const press_region = dev_press_rt | ((tary_press_dz & 0x7f) << 9);
  const release_region = dev_release_rt | ((tary_release_dz & 0x7f) << 9);

  const taryDevBytes = [
    0x00,                               // 轴体（默认）
    tary_rt_switch & 0x0f,              // 触发模式（低 4 bit）
    dev_trigger_dz & 0xff,              // 行程低字节
    (dev_trigger_dz >> 8) & 0xff,       // 行程高字节
    press_region & 0xff,                // 触发灵敏度+顶部死区 低字节
    (press_region >> 8) & 0xff,         // 触发灵敏度+顶部死区 高字节
    release_region & 0xff,              // 抬起灵敏度+底部死区 低字节
    (release_region >> 8) & 0xff,       // 抬起灵敏度+底部死区 高字节
  ];

  const keyTaryLayerSize = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const taryAbsOff = (layer as number) * keyTaryLayerSize
    + (config as number) * keyTaryProfileSize
    + keyIndex * KEY_TARY_ITEM_SIZE;
  const [tLo, tHi] = shiftFrom16Bit(taryAbsOff);
  const tarySize = taryDevBytes.length; // 8
  const taryChecksum = (tLo + tHi + tarySize + taryDevBytes.reduce((s, v) => s + v, 0)) & 0xff;
  yield buildOutPacket(FLAG, [
    SET_KEY_TARY_COMMAND, 0x00, taryChecksum, tarySize,
    tLo, tHi, 0x00,
    ...taryDevBytes,
  ]);

  // ── 步骤五（续）：0x06 写入 Perf_Cfg_mask（断触优化开关 + 防抖等级）────
  // Perf_Cfg_mask: bit1 = anti_break_sw, bit5-7 = debounce_lvl
  const perfCfgMask = ((tary_anti_break & 0x01) << 1) | ((tary_debounce & 0x07) << 5);
  const [pLo, pHi] = shiftFrom16Bit(PERF_CFG_MASK_OFFSET);
  const perfSize = 1;
  const perfChecksum = (pLo + pHi + perfSize + perfCfgMask) & 0xff;
  yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, perfChecksum, perfSize,
    pLo, pHi, 0x00,
    perfCfgMask,
  ]);

  // ── 返回结果 ──────────────────────────────────────────────────────
  const retDefBase = keyIndex * KEY_ITEM_SIZE;
  const retDefType = rawDefaultLayerData[retDefBase] ?? 0x10;
  const retDefCode = rawDefaultLayerData[retDefBase + 2] ?? (posCode & 0xff);
  const outType = convertKeyTypeForOutput(retDefType, retDefCode);

  return {
    name: "resetKeyInfo",
    code: 0,
    data: {
      key: wantedKey,
      type: outType,
      code: posCode,
      tary: [...RESET_DEFAULT_TARY],
      super: [],
      mt: [],
    },
  };
}

/**
 *
 * 重置指定 RT 按键的触发参数
 *
 * 流程：
 *  1. 读取当前 config / layer（0x04 + 0x05）
 *  2. 0x07 读取默认矩阵，定位按键索引
 *  3. 0xa1 按 keyIndex×8 偏移下发 RT 默认触发参数
 *
 * 触发参数：
 *  [触发死区(15), 快速触发开关(1), 触发灵敏度(20), 抬起灵敏度(20),
 *   断触优化开关(0), 防抖等级(1), RT顶部死区(5), RT底部死区(5)]
 *
 */
export async function* resetRT(
  request: ResetRTParams,
): DeviceSession<ResetRTResult> {
  const reqKeys = request?.key;
  if (!Array.isArray(reqKeys) || reqKeys.length === 0) {
    return { name: "resetRT", code: 3, message: "request.key must be a non-empty array" };
  }

  let config = request.config;
  let layer = request.layer;

  // ── 获取当前 config / layer ──────────────────────────────────────
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  if (!Number.isInteger(config)) config = baseIn[8] ?? 0;
  if (!Number.isInteger(layer)) layer = funcData[1] ?? 0;

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = (layer as number) * KEY_LAYER_LENGTH + (config as number) * profileSize;

  // ── 0x07 读取默认矩阵，定位按键索引 ─────────────────────────────
  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  // ── 0xa1 按 keyIndex×8 偏移下发 RT 默认触发参数 ─────────────────
  const [
    tary_trigger_dz,
    tary_rt_switch,
    tary_press_rt,
    tary_release_rt,
    tary_anti_break,
    tary_debounce,
    tary_press_dz,
    tary_release_dz,
  ] = RESET_RT_TARY;

  const dev_trigger_dz = (tary_trigger_dz - 1) & 0x1ff;
  const dev_press_rt = (tary_press_rt - 1) & 0x1ff;
  const dev_release_rt = (tary_release_rt - 1) & 0x1ff;
  const press_region = dev_press_rt | ((tary_press_dz & 0x7f) << 9);
  const release_region = dev_release_rt | ((tary_release_dz & 0x7f) << 9);

  const taryDevBytes = [
    0xa0,
    tary_rt_switch & 0x0f,
    dev_trigger_dz & 0xff,
    (dev_trigger_dz >> 8) & 0xff,
    press_region & 0xff,
    (press_region >> 8) & 0xff,
    release_region & 0xff,
    (release_region >> 8) & 0xff,
  ];

  const keyTaryLayerSize = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const tarySize = taryDevBytes.length;

  for (const keyName of reqKeys) {
    const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, String(keyName));
    if (keyIndex === undefined) {
      return { name: "resetRT", code: 1, message: `key not found: ${keyName}` };
    }

    const taryAbsOff = (layer as number) * keyTaryLayerSize
      + (config as number) * keyTaryProfileSize
      + keyIndex * KEY_TARY_ITEM_SIZE;
    const [tLo, tHi] = shiftFrom16Bit(taryAbsOff);
    const taryChecksum = (tLo + tHi + tarySize + taryDevBytes.reduce((s, v) => s + v, 0)) & 0xff;
    yield buildOutPacket(FLAG, [
      SET_KEY_TARY_COMMAND, 0x00, taryChecksum, tarySize,
      tLo, tHi, 0x00,
      ...taryDevBytes,
    ]);
  }

  return { name: "resetRT", code: 0 };
}

// ─── Session 结果类型 ──────────────────────────────────────────────────────────

type GetBasicConfigResult = {
  name: "getBasicConfig";
  code: number;
  data: BasicConfig;
};

type SetConfigLayerIndexResult = {
  name: "setConfigLayerIndex";
  code: number;
  data: Pick<BasicConfig, "config_index" | "layer_index">;
};

type GetBasicKeyResult = {
  name: "getBasicKey";
  code: number;
  data: {
    len: number;
    config: number;
    layer: number;
    name: number;
    def: number[];
    disable: number;
    keys: Record<string, { type: number; code: number; tary: number[] }>;
    smart: Record<string, { super?: [number, number]; mt?: [number, number] }>;
  };
};

type GetKeyInfoResult = {
  name: "getKeyInfo";
  code: number;
  data: {
    key: string;
    type?: number;
    code?: number;
    enable?: number;
    tary?: number[];
    super?: number[];
    mt?: number[];
  };
  message?: string;
};

type SetKeyInfoResult = {
  name: "setKeyInfo";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

type GetPerfResult = {
  name: "getPerf";
  code: number;
  data: {
    len: number;
    keys: Record<string, number[]>;
  };
  message?: string;
};

type SetPerfResult = {
  name: "setPerf";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

type GetRateResult = {
  name: "getRate";
  code: number;
  data: {
    rate: number[];
    index: number;
  };
};

type SetRateResult = {
  name: "setRate";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

type ResetRTResult = {
  name: "resetRT";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

type ResetKeyInfoResult = {
  name: "resetKeyInfo";
  code: number;
  data: {
    key: string;
    type: number;
    code: number;
    tary: number[];
    super: number[];
    mt: number[];
  };
  message?: string;
};

type GetDeviceInfoResult = {
  name: "getDeviceInfo";
  code: number;
  data: {
    Zkm: number;
    connect: number;
    battery: number;
    bleMtu: number;
    bleOtaMtu: number;
    usbMtu: number;
    usbOtaMtu: number;
    firmwares: Array<{
      version: number;
      id: number;
      type: number;
      model: string;
    }>;
  };
};

type GetCalibrationResult = {
  name: "getCalibration";
  code: number;
  data: {
    switch: number; // 0=关 1=开
  };
};

type SetBiCalibrationResult = {
  name: "setBiCalibration";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

type SetCalibrationResult = {
  name: "setCalibration";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

// ========== 推导核心 ========== start
// 导出类型名必须为： SessionResultMap
export type SessionResultMap = {
  getBasicConfig: GetBasicConfigResult;
  setConfigLayerIndex: SetConfigLayerIndexResult;
  getBasicKey: GetBasicKeyResult;
  getKeyInfo: GetKeyInfoResult;
  setKeyInfo: SetKeyInfoResult;
  getPerf: GetPerfResult;
  setPerf: SetPerfResult;
  getRate: GetRateResult;
  setRate: SetRateResult;
  resetRT: ResetRTResult;
  resetKeyInfo: ResetKeyInfoResult;
  getDeviceInfo: GetDeviceInfoResult;
  getCalibration: GetCalibrationResult;
  setBiCalibration: SetBiCalibrationResult;
  setCalibration: SetCalibrationResult;
};
// ========== 推导核心 ========== end

/**
 *
 * 读取轮询率
 *
 * 流程：
 *  1. 发送 0x05 读取功能配置
 *  2. 解析返回数据第 13 字节低 3 位
 *  3. 返回支持的轮询率和当前轮询率索引
 *
 * 约定：
 *  - 1 => 8K
 *  - 2 => 4K
 *  - 3 => 2K
 *  - 4 => 1K
 *
 */
export async function* getRate(): DeviceSession<GetRateResult> {
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  const rawRate = (funcData[12] ?? 0) & 0x07;
  const indexMap: Record<number, number> = {
    1: 3, // 8K
    2: 2, // 4K
    3: 1, // 2K
    4: 0, // 1K
  };

  return {
    name: "getRate",
    code: 0,
    data: {
      rate: [...RATE_SUPPORT],
      index: indexMap[rawRate] ?? 0,
    },
  };
}

/**
 *
 * 设置轮询率
 *
 * index 与 RATE_SUPPORT 对应：0=1K Hz, 1=2K Hz, 2=4K Hz, 3=8K Hz
 *
 *  1. 参数校验
 *  2. 读取功能配置，取出 funcData[12]（轮询率字节）
 *  3. 清除低 3 bit，写入新 rawRate
 *  4. 0x06 仅写回该字节
 *
 */
export async function* setRate(
  request: SetRateParams,
): DeviceSession<SetRateResult> {
  // index → rawRate 映射（与 getRate indexMap 互逆）
  const indexToRaw: Record<number, number> = { 0: 4, 1: 3, 2: 2, 3: 1 };
  const rawRate = indexToRaw[request.index];
  if (rawRate === undefined)
    return { name: "setRate", code: 3, message: "index must be 0~3 (0=1K, 1=2K, 2=4K, 3=8K)" };

  // 读取功能配置
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);

  // 修改轮询率 bit[2:0]
  const oldByte = funcData[RATE_CFG_OFFSET] ?? 0;
  const newByte = (oldByte & ~0x07) | (rawRate & 0x07);

  // 写回轮询率字节
  const [lo, hi] = shiftFrom16Bit(RATE_CFG_OFFSET - 8);
  const size = 1;
  const checksum = (lo + hi + size + newByte) & 0xff;
  yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, checksum, size,
    lo, hi, 0x00,
    newByte,
  ]);

  return { name: "setRate", code: 0 };
}

/**
 *
 * 读取设备信息
 *
 *  1. 0x03 读取固件版本，返回包第 8-9 字节（16-bit LE）为版本号
 *
 */
export async function* getDeviceInfo(): DeviceSession<GetDeviceInfoResult> {
  const inPacket: InPacket = yield buildOutPacket(FLAG, [GET_Version_COMMAND]);
  const version = (inPacket[8] ?? 0) | ((inPacket[9] ?? 0) << 8);

  return {
    name: "getDeviceInfo",
    code: 0,
    data: {
      Zkm: 1,
      connect: 0,
      battery: 80,
      bleMtu: 64,
      bleOtaMtu: 256,
      usbMtu: 64,
      usbOtaMtu: 512,
      firmwares: [
        { version, id: 0, type: 1, model: "rk-s75*" },
      ],
    },
  };
}

/**
 *
 * 读取双向校准开关
 *
 * 流程：
 *  1. 0x05 读取功能配置
 *  2. funcData[15]（第 16 字节，0-indexed）bit3 = 校准开关（0=关, 1=开）
 *
 */
export async function* getCalibration(): DeviceSession<GetCalibrationResult> {
  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);
  const calibSwitch = (funcData[15] ?? 0) >> 3 & 0x01;

  return {
    name: "getCalibration",
    code: 0,
    data: { switch: calibSwitch },
  };
}

/**
 *
 * 设置双向校准开关
 *
 * 流程：
 *  1. 参数校验（switch 不为 0/1 → code:3，不与设备通信）
 *  2. 0x05 读取功能配置，取出 funcData[15]（第 16 字节）
 *  3. 修改 bit2（0=关, 1=开），保留其他 bit
 *  4. 0x06 仅写回该字节
 *
 */
export async function* setBiCalibration(
  request: SetBiCalibrationParams,
): DeviceSession<SetBiCalibrationResult> {
  const sw = request.switch;
  if (sw !== 0 && sw !== 1)
    return { name: "setBiCalibration", code: 3, message: "switch must be 0 or 1" };

  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);

  const oldByte = funcData[CALIBRATION_CFG_OFFSET] ?? 0;
  const newByte = (oldByte & ~(1 << 2)) | ((sw & 0x01) << 2);

  const [lo, hi] = shiftFrom16Bit(CALIBRATION_CFG_OFFSET);
  const size = 1;
  const checksum = (lo + hi + size + newByte) & 0xff;
  yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, checksum, size,
    lo, hi, 0x00,
    newByte,
  ]);

  return { name: "setBiCalibration", code: 0 };
}

/**
 *
 * 设置手动校准开关
 *
 * 流程：
 *  1. 参数校验（switch 不为 0/1 → code:3，不与设备通信）
 *  2. 0x05 读取功能配置，取出 funcData[15]（第 16 字节）
 *  3. 修改 bit3（0=关, 1=开），保留其他 bit
 *  4. 0x06 仅写回该字节
 *
 */
export async function* setCalibration(
  request: SetCalibrationParams,
): DeviceSession<SetCalibrationResult> {
  const sw = request.switch;
  if (sw !== 0 && sw !== 1)
    return { name: "setCalibration", code: 3, message: "switch must be 0 or 1" };

  const funcData: number[] = yield* readChunkedDataGen(FLAG, 64, DATA_LENGTH);

  const oldByte = funcData[CALIBRATION_CFG_OFFSET] ?? 0;
  const newByte = (oldByte & ~(1 << 3)) | ((sw & 0x01) << 3);

  const [lo, hi] = shiftFrom16Bit(CALIBRATION_CFG_OFFSET);
  const size = 1;
  const checksum = (lo + hi + size + newByte) & 0xff;
  yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, checksum, size,
    lo, hi, 0x00,
    newByte,
  ]);

  return { name: "setCalibration", code: 0 };
}

// ─── 统一分发入口 ─────────────────────────────────────────────────────────────

/**
 * 按名称分发 Session。
 * 传入 `{ name, data }` 即可，无需关心具体函数签名。
 *
 * @example
 * const session = createSession({ name: "getBasicKey", data: { config:0, layer:0, pageNo:1, pageSize:25 } });
 * let step = await session.next();
 * while (!step.done) {
 *   step = await session.next(await sendToDevice(step.value));
 * }
 * console.log(step.value);
 */
export type SessionRequest =
  | { name: "getBasicConfig"; data?: null }
  | { name: "setConfigLayerIndex"; data: SetBasicConfigParams }
  | { name: "getBasicKey"; data: GetBasicKeyParams }
  | { name: "getKeyInfo"; data: GetKeyInfoParams }
  | { name: "setKeyInfo"; data: SetKeyInfoParams }
  | { name: "getPerf"; data: GetPerfParams }
  | { name: "setPerf"; data: SetPerfParams }
  | { name: "getRate"; data?: null }
  | { name: "setRate"; data: SetRateParams }
  | { name: "resetRT"; data: ResetRTParams }
  | { name: "resetKeyInfo"; data: ResetKeyInfoParams }
  | { name: "getDeviceInfo"; data?: null }
  | { name: "getCalibration"; data?: null }
  | { name: "setBiCalibration"; data: SetBiCalibrationParams }
  | { name: "setCalibration"; data: SetCalibrationParams };

// ========== 推导核心 ========== start
export function createSession<T extends SessionRequest>(
  request: T,
): DeviceSession<SessionResultMap[T["name"]]>;
// ========== 推导核心 ========== end

export function createSession(request: SessionRequest): DeviceSession<unknown> {
  switch (request.name) {
    case "getBasicConfig": return getBasicConfig();
    case "setConfigLayerIndex": return setConfigLayerIndex(request.data.config_index, request.data.layer_index);
    case "getBasicKey": return getBasicKey(request.data);
    case "getKeyInfo": return getKeyInfo(request.data);
    case "setKeyInfo": return setKeyInfo(request.data);
    case "getPerf": return getPerf(request.data);
    case "setPerf": return setPerf(request.data);
    case "getRate": return getRate();
    case "setRate": return setRate(request.data);
    case "resetRT": return resetRT(request.data);
    case "resetKeyInfo": return resetKeyInfo(request.data);
    case "getDeviceInfo": return getDeviceInfo();
    case "getCalibration": return getCalibration();
    case "setBiCalibration": return setBiCalibration(request.data);
    case "setCalibration": return setCalibration(request.data);
  }
}
export {
  getFuncPacketBytes,
  buildOutPacket,
  getCommandPacketBytes
}
