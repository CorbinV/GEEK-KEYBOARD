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
  KEY_RETURN_ORDER,
  normalizeToHidCode,
  resolveKeyFunctionByRawTriplet,
  resolveKeyNameByCode,
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
export type GetBasicKeyParams   = { config: number; layer: number; pageNo: number; pageSize: number };
export type GetKeyInfoParams    = { key: string; config?: number; layer?: number };

// ─── 协议常量 ─────────────────────────────────────────────────────────────────

const FLAG                    = 0x55; // 命令标志
const GET_Base                = [0x04, 0x00, 0x20, 0x20] as const;
const GET_Func_COMMAND        = 0x05; // 获取功能配置命令
const GET_KEY_DEFAULT_COMMAND = 0x07; // 获取默认按键配置命令
const GET_KEY_CURRENT_COMMAND = 0x08; // 获取当前按键配置命令
const GET_KEY_TARY_COMMAND    = 0xa0; // 获取按键触发参数命令
const DATA_LENGTH             = 51;   // 数据长度
const KEY_LAYER_LENGTH        = 512;  // 按键层长度
const KEY_ITEM_SIZE           = 3;    // 按键项大小
const KEY_TARY_ITEM_SIZE      = 8;    // 按键触发参数项大小
const KEY_COUNT               = Math.floor(KEY_LAYER_LENGTH / KEY_ITEM_SIZE); // 按键槽位数（170）
const ADVANCED_MT_TYPE        = 9;    // 高级键MT类型
const ADVANCED_SUPER_TYPES    = new Set([5, 6, 7, 8, 10, 11]); // 高级键Super类型集合

// ─── 内部工具 ─────────────────────────────────────────────────────────────────

/**
 * 组装 64 字节出包：[command, bytes[0], bytes[1], …, 0…]
 * 中间层直接将此数组作为 sendReport(0, new Uint8Array(outPacket)) 的参数。
 */
export function buildOutPacket(command: number, bytes: number[] = []): OutPacket {
  const out = new Array<number>(64).fill(0);
  out[0] = command & 0xff;
  bytes.forEach((v, i) => { if (i + 1 < 64) out[i + 1] = v & 0xff; });
  return out;
}

const shiftFrom16Bit = (v: number): [number, number] => [v & 0xff, v >> 8];

export const getFuncPacketBytes = (offset: number, size: number): number[] => {
  const [lo, hi] = shiftFrom16Bit(offset);
  return [GET_Func_COMMAND, 0x00, (lo + hi + size) & 0xff, size, lo, hi];
};

export const getCommandPacketBytes = (command: number, offset: number, size: number): number[] => {
  const [lo, hi] = shiftFrom16Bit(offset);
  return [command, 0x00, (lo + hi + size) & 0xff, size, lo, hi];
};

const resolveRawCodeValue = (extByte: number, codeByte: number): number => {
  if (codeByte !== 0) return codeByte;
  if (extByte > 0) return Number(`10${extByte.toString(16).padStart(2, "0")}00`);
  return 0;
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
      layer_count:  4,
      layer_index:  funcData[1] ?? 0,
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
  const currentLayerIndex  = funcData[1] ?? layer;
  // Perf_Cfg_mask：bit1=断触优化开关，bit5-7=防抖等级
  const perfCfgMask   = funcData[7] ?? 0;
  const anti_break_sw = (perfCfgMask >> 1) & 0x01;
  const debounce_lvl  = (perfCfgMask >> 5) & 0x07;

  const totalKeys = KEY_COUNT;
  const keyTaryLayerSize   = totalKeys * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const keyTaryOffset      = layer * keyTaryLayerSize + config * keyTaryProfileSize;

  const rawTaryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, keyTaryOffset, keyTaryLayerSize, DATA_LENGTH,
  );

  const getPositionInfo = (rawLayer: number[], keyIndex: number) => {
    const base     = keyIndex * KEY_ITEM_SIZE;
    const ext      = rawLayer[base + 1] ?? 0;
    const codeByte = rawLayer[base + 2] ?? 0;
    const code     = normalizeToHidCode(resolveRawCodeValue(ext, codeByte));
    const name     = resolveKeyNameByCode(code, KEY_RETURN_ORDER[keyIndex] ?? `K${keyIndex}`);
    return { name, code };
  };

  const getKeyTary = (keyIndex: number): number[] => {
    const start           = keyIndex * KEY_TARY_ITEM_SIZE;
    const raw             = rawTaryData.slice(start, start + KEY_TARY_ITEM_SIZE);

    // Byte 1: [4bit 快速触发开关][4bit SOCD优先级策略（保留）]
    const rt_switch       = (raw[1] ?? 0) & 0x0F;

    // Bytes 2-3 (16-bit LE): [9bit 触发死区(1~35)][7bit 预留精度切换]
    const trigger         = (raw[2] ?? 0) | ((raw[3] ?? 0) << 8);
    const trigger_dz      = trigger & 0x1FF;

    // Bytes 4-5 (16-bit LE): [9bit 触发灵敏度][7bit RT顶部死区]
    const press_region    = (raw[4] ?? 0) | ((raw[5] ?? 0) << 8);
    const press_rt        = press_region & 0x1FF;
    const press_dz        = (press_region >> 9) & 0x7F;

    // Bytes 6-7 (16-bit LE): [9bit 抬起灵敏度][7bit RT底部死区]
    const release_region  = (raw[6] ?? 0) | ((raw[7] ?? 0) << 8);
    const release_rt      = release_region & 0x1FF;
    const release_dz      = (release_region >> 9) & 0x7F;

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
    const base     = i * KEY_ITEM_SIZE;
    const rawType  = rawLayerData[base] ?? 0;
    const ext      = rawLayerData[base + 1] ?? 0;
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
  const end   = Math.min(start + pageSize, orderedKeyNames.length);

  const keys: GetBasicKeyResult["data"]["keys"]  = {};
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
      def, keys, smart, pageNo, pageSize,
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
  let layer  = request.layer;

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
  if (!Number.isInteger(layer))  layer  = perfFuncData[1] ?? 0;
  const perfCfgMask   = perfFuncData[7] ?? 0;
  const anti_break_sw = (perfCfgMask >> 1) & 0x01;
  const debounce_lvl  = (perfCfgMask >> 5) & 0x07;

  const totalKeys      = KEY_COUNT;
  const keyTaryLayerSize   = totalKeys * KEY_TARY_ITEM_SIZE;
  const keyTaryOffset  = (layer as number) * keyTaryLayerSize + (config as number) * (keyTaryLayerSize * 4);

  const rawTaryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, keyTaryOffset, keyTaryLayerSize, DATA_LENGTH,
  );

  const normalizeKey = (v: string) => {
    const u = v.trim().toUpperCase();
    return u.startsWith("DIGIT_") ? u.slice(6) : u;
  };
  const wantedKey = normalizeKey(key);

  for (let i = 0; i < totalKeys; i++) {
    const base     = i * KEY_ITEM_SIZE;
    const rawType  = rawLayerData[base] ?? 0;
    const ext      = rawLayerData[base + 1] ?? 0;
    const codeByte = rawLayerData[base + 2] ?? 0;
    const outType  = convertKeyTypeForOutput(rawType, codeByte);

    const extDef   = rawDefaultLayerData[base + 1] ?? 0;
    const codeDef  = rawDefaultLayerData[base + 2] ?? 0;
    const posCode  = normalizeToHidCode(resolveRawCodeValue(extDef, codeDef));
    const keyName  = resolveKeyNameByCode(posCode, KEY_RETURN_ORDER[i] ?? `K${i}`);
    if (normalizeKey(keyName) !== wantedKey) continue;

    const start = i * KEY_TARY_ITEM_SIZE;
    const raw   = rawTaryData.slice(start, start + KEY_TARY_ITEM_SIZE);
    const enable = 1;

    // Byte 1: [4bit 快速触发开关][4bit SOCD优先级策略（保留）]
    const rt_switch       = (raw[1] ?? 0) & 0x0F;

    // Bytes 2-3 (16-bit LE): [9bit 触发死区(1~35)][7bit 预留精度切换]
    const trigger         = (raw[2] ?? 0) | ((raw[3] ?? 0) << 8);
    const trigger_dz      = trigger & 0x1FF;

    // Bytes 4-5 (16-bit LE): [9bit 触发灵敏度][7bit RT顶部死区]
    const press_region    = (raw[4] ?? 0) | ((raw[5] ?? 0) << 8);
    const press_rt        = press_region & 0x1FF;
    const press_dz        = (press_region >> 9) & 0x7F;

    // Bytes 6-7 (16-bit LE): [9bit 抬起灵敏度][7bit RT底部死区]
    const release_region  = (raw[6] ?? 0) | ((raw[7] ?? 0) << 8);
    const release_rt      = release_region & 0x1FF;
    const release_dz      = (release_region >> 9) & 0x7F;

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
    if (outType === ADVANCED_MT_TYPE)         out.mt    = [outType, posCode];
    else if (ADVANCED_SUPER_TYPES.has(outType)) out.super = [outType, posCode];

    return { name: "getKeyInfo", code: 0, data: out };
  }

  return { name: "getKeyInfo", code: 1, data: { key }, message: `key not found: ${key}` };
}

// ─── Session 结果类型 ──────────────────────────────────────────────────────────

type GetBasicConfigResult = { name: "getBasicConfig"; code: number; data: BasicConfig };
type SetConfigLayerIndexResult = { name: "setConfigLayerIndex"; code: number; data: Pick<BasicConfig, "config_index" | "layer_index"> };
type GetBasicKeyResult = {
  name: "getBasicKey";
  code: number;
  data: {
    len: number;
    config: number;
    layer: number;
    name: number;
    def: number[];
    keys: Record<string, { type: number; code: number; tary: number[] }>;
    smart: Record<string, { super?: [number, number]; mt?: [number, number] }>;
    pageNo: number;
    pageSize: number;
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

// ========== 推导核心 ========== start
// 导出类型名必须为： SessionResultMap 
export type SessionResultMap = {
  getBasicConfig: GetBasicConfigResult;
  setConfigLayerIndex: SetConfigLayerIndexResult;
  getBasicKey: GetBasicKeyResult;
  getKeyInfo: GetKeyInfoResult;
};
// ========== 推导核心 ========== end

// ─── 统一分发入口 ─────────────────────────────────────────────────────────────

export type SessionRequest =
  | { name: "getBasicConfig"; data?: null }
  | { name: "setConfigLayerIndex"; data: SetBasicConfigParams }
  | { name: "getBasicKey";    data: GetBasicKeyParams }
  | { name: "getKeyInfo";     data: GetKeyInfoParams };

// ========== 推导核心 ========== start
export function createSession<T extends SessionRequest>(
  request: T,
): DeviceSession<SessionResultMap[T["name"]]>;
// ========== 推导核心 ========== end

export function createSession(request: SessionRequest): DeviceSession<unknown> {
  switch (request.name) {
    case "getBasicConfig": return getBasicConfig();
    case "setConfigLayerIndex": return setConfigLayerIndex(request.data.config_index, request.data.layer_index);
    case "getBasicKey":    return getBasicKey(request.data);
    case "getKeyInfo":     return getKeyInfo(request.data);
  }
}
