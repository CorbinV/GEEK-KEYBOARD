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

export type SetBasicConfigParams  = { config_index: number; layer_index: number };
export type GetBasicKeyParams    = { layer: number; pageNo: number; pageSize: number; config?: number };
export type GetKeyInfoParams     = { key: string; layer?: number };
export type GetKeyInfoData       = {
  key: string;
  type: number;
  code: number;
  enable: number;
  tary: number[];
  super: number[];
  mt: number[];
};
export type SetKeyInfoKeyParams  = {
  key: string;
  type?: number;
  code?: number;
  enable?: number;
  tary?: number[];
  super?: number[];
  mt?: number[];
};
export type SetKeyInfoParams     = { keys: SetKeyInfoKeyParams[]; layer?: number };
export type ResetKeyInfoParams   = { key: string; layer?: number };
export type ResetRTParams        = { key: string[]; layer?: number };
export type GetRateParams        = Record<string, never>;
export type GetPerfParams        = { key: string[]; layer?: number };
export type SetPerfParams        = { key: string[]; tary: number[]; layer?: number };
export type SetRateParams        = { index: number };
export type SetBiCalibrationParams = { switch: number };
export type SetCalibrationParams   = { switch: number };

export type GetLightData = {
  isRGB: number;
  pattern: number;
  brightness: number;
  speed: number;
  sleep: number;
  R: number;
  G: number;
  B: number;
};

export type SetLightParams = {
  isRGB:      number;
  pattern:    number;
  brightness: number;
  speed:      number;
  sleep:      number;
  R:          number;
  G:          number;
  B:          number;
};

export type DKSKeyItem = {
  type:  number;   // 按键类型
  code:  number;   // 按键 HID code
  key:   string;   // 按键名称
  range: number[];
};

export type DKSShortcut = {
  type:            number;     // 5 = DKS
  code:            number;     // 按键 HID code
  name:            string;     // DKS 条目索引
  simulation:      number;     // 默认 1
  simulationRange: number[];   // 默认 [200, 200]
  range:           number[];   // 来自 0xa2 条目前 4 字节
  keys:            DKSKeyItem[]; // 来自 0xa2 条目后 20 字节（4 × 5 字节）
};

export type GetDKSParams = {
  type:   number;   // 5 = DKS
  code:   number;   // 按键 HID code
  layer?: number;   // 目标层
};

export type DelDKSParams = {
  code:   number;   // 要删除的 DKS 按键 HID code
  layer?: number;
};

export type DelTGLParams = {
  code: number;   // TGL 数据区索引（0-based），扫描全部层
};

export type MTKeyItem = {
  key:  string;
  code: number;
  type: number;
};

export type MTEntry = {
  type: number;       // 固定 9（MT）
  code: number;       // MT 数据区索引（0-based，与 RS/SOCD/OKS 共用 0xa4 区域）
  time: number;       // 时间参数（0x92 三字节第 3 字节）
  keys: MTKeyItem[];  // [0]=0xa4 条目前 3 字节，[1]=后 3 字节
};

export type GetMTListParams = {
  pageNo:   number;
  pageSize: number;
};

export type GetMTParams = {
  type: number;   // 9 = MT
  code: number;   // MT 数据区索引（0-based）
};

export type SetMTParams = {
  type:   number;       // 9 = MT
  code:   number;       // MT 数据区索引；已存在 → 修改，不存在 → 新增
  time:   number;       // 时间参数（写入 0x92 三字节第 3 字节）
  keys:   MTKeyItem[];  // [0]=功能键0（绑定键，写入 0x08 + 0xa4 前3字节），[1]=功能键1（0xa4 后3字节）
  layer?: number;
};

export type DelMTParams = {
  code: number;   // MT 数据区索引（0-based），扫描全部层
};

export type RSKeyItem = {
  key:  string;
  code: number;
  type: number;
};

export type RSEntry = {
  type: number;       // 固定 11（RS）
  code: number;       // 共享数据区索引（0-based，与 SOCD/OKS 共用 0xa4 区域）
  keys: RSKeyItem[];  // [0]=功能键0（0xa4 前3字节），[1]=功能键1（后3字节）
};

export type GetRSListParams = {
  pageNo:   number;
  pageSize: number;
};

export type GetRSParams = {
  type: number;   // 11 = RS
  code: number;   // 共享数据区索引（0-based）
};

export type SetRSParams = {
  type:   number;       // 11 = RS
  code:   number;       // 共享数据区索引；已存在 → 修改，不存在 → 新增
  keys:   RSKeyItem[];  // [0]=功能键0（绑定键，写入 0x08 + 0xa4 前3字节），[1]=功能键1（0xa4 后3字节）
  layer?: number;
};

export type DelRSParams = {
  code: number;   // 共享数据区索引（0-based），扫描全部层
};

export type SOCDKeyItem = {
  key:  string;
  code: number;
  type: number;
};

export type SOCDEntry = {
  type:    number;         // 固定 8（SOCD）
  code:    number;         // 共享数据区索引（0-based，与 RS/OKS 共用 0xa4 区域）
  trigger: number;         // SOCD 优先级：0=最后按下优先, 1=key1优先, 2=key2优先
  keys:    SOCDKeyItem[];  // [0]=功能键0（0xa4 前3字节），[1]=功能键1（后3字节）
};

/** getSOCDList 无需传参 */
export type GetSOCDListParams = Record<string, never>;

export type GetSOCDParams = {
  type: number;   // 8 = SOCD
  code: number;   // 共享数据区索引（0-based）
};

export type SetSOCDParams = {
  type:    number;         // 8 = SOCD
  code:    number;         // 共享数据区索引；已存在 → 修改，不存在 → 新增
  trigger: number;         // SOCD 优先级（0/1/2）
  keys:    SOCDKeyItem[];  // [0]=功能键0（绑定键，写入 0x08 + 0xa4 前3字节），[1]=功能键1（0xa4 后3字节）
  layer?:  number;
};

export type DelSOCDParams = {
  code: number;   // 共享数据区索引（0-based），扫描全部层
};

export type OKSKeyItem = {
  key:  string;
  code: number;
  type: number;
};

export type OKSEntry = {
  type: number;       // 固定 7（OKS）
  code: number;       // 共享数据区索引（0-based，与 RS/SOCD 共用 0xa4 区域）
  keys: OKSKeyItem[]; // [0]=功能键0（0xa4 前3字节），[1]=功能键1（后3字节）
};

/** getOKSList 无需传参 */
export type GetOKSListParams = Record<string, never>;

export type GetOKSParams = {
  type: number;   // 7 = OKS
  code: number;   // 共享数据区索引（0-based）
};

export type SetOKSParams = {
  type:   number;       // 7 = OKS
  code:   number;       // 共享数据区索引；已存在 → 修改，不存在 → 新增
  keys:   OKSKeyItem[]; // [0]=功能键0（绑定键，写入 0x08 + 0xa4 前3字节），[1]=功能键1（0xa4 后3字节）
  layer?: number;
};

export type DelOKSParams = {
  code: number;   // 共享数据区索引（0-based），扫描全部层
};

export type ShortcutKeyItem = {
  type: number;   // 固定 3
  code: number;   // HID code（修饰键 0xe0-0xe7 或直接键码）
};

export type ShortcutEntry = {
  type: number;   // 固定 3
  code: number;   // 绑定按键 HID code（来自 0x07 默认矩阵）
};

export type ShortcutDetail = {
  type: number;              // 固定 3
  code: number;              // 绑定按键 HID code（来自 0x07 默认矩阵）
  keys: ShortcutKeyItem[];   // 修饰键列表 + 主键（来自 byte[1] 和 byte[2]）
};

/** getShortcuts 无需传参 */
export type GetShortcutsParams = Record<string, never>;

export type GetShortcutParams = {
  type:   number;   // 3 = Shortcut
  code:   number;   // 按键 HID code（0x07 默认矩阵匹配）
  layer?: number;
};

export type AddShortcutParams = {
  type:   number;         // 3 = Shortcut
  code:   number;         // 目标按键 HID code
  keys:   ShortcutKeyItem[];
  layer?: number;
};

export type DelShortcutParams = {
  code:   number;   // 要删除的按键 HID code
  layer?: number;
};

export type LockShortcutEntry = {
  enable: number;   // 0=启用（锁定，硬件 bit=1）  1=不启用（未锁定，硬件 bit=0）
  keys:   number[]; // 组合键 HID code 列表
};

export type LockShortcutsData = {
  defaultLock: LockShortcutEntry[];
  customLock:  LockShortcutEntry[];
};

/** getLockShortcuts 无需传参 */
export type GetLockShortcutsParams = Record<string, never>;

export type SetLockShortcutsParams = LockShortcutsData;

export type MacroEntry = {
  name: string;   // M0, M1, ...
  type: number;   // 固定 6
  code: number;   // 宏索引
};

/** getMacros 无需传参 */
export type GetMacrosParams = Record<string, never>;

export type GetMacroParams = {
  type: number;   // 6 = 宏
  code: number;   // 宏索引 0~31
  key?: string;   // 可选，绑定按键名（用于读取 loop / stopType）
};

export type SetMacroParams = {
  attr: {
    type:         number;   // 固定 6
    code:         number;   // 宏索引 0~31
    name?:        string;
    trigger?:     number;
    triggerDelay?: number;
    loop:         number;   // 1~254 循环次数；stopType=1 时无意义
    delay?:       number[];
    stopType:     number;   // 0=按次数停；1=一直循环直到松键
    key?:         string;   // 可选，绑定按键名
  };
  keys: MacroActionKey[];
};

export type DelMacroParams = {
  code: number;   // 宏索引 0~31
};

export type SetDKSParams = {
  type:             number;
  code:             number;
  key:              string;
  simulation:       number;
  simulationRange:  number[];
  range:            number[];
  keys:             DKSKeyItem[];
  layer?:           number;
};

export type GetTGLListParams = {
  pageNo:   number;
  pageSize: number;
};

export type GetTGLParams = {
  type: number;   // 10 = TGL
  code: number;   // TGL 数据区索引（0-based）
};

export type SetTGLParams = {
  type:   number;       // 10 = TGL
  code:   number;       // TGL 数据区索引；已存在 → 修改，不存在 → 新增
  keys:   TGLKeyItem[]; // keys[0]=绑定按键（写入 0x08）  keys[1]=TGL 数据（写入 0xa6）
  layer?: number;
};

export type TGLKeyItem = {
  key:  string;
  code: number;
  type: number;
};

export type TGLEntry = {
  type: number;       // 固定 10（TGL）
  code: number;
  keys: TGLKeyItem[];
};

/** 设备主动上报的校准事件（仅响应，无请求） */
export type OnCalibrationResult = {
  name: "onCalibration";
  code: number;
  data: { key: string }[];
  message?: string;
};

// ─── 协议常量 ─────────────────────────────────────────────────────────────────

const FLAG                    = 0x55; // 命令标志
const GET_Version_COMMAND     = 0x03; // 获取固件版本命令
const GET_Base                = [0x04, 0x00, 0x20, 0x20] as const;
const GET_Func_COMMAND        = 0x05; // 获取功能配置命令
const SET_Func_COMMAND        = 0x06; // 设置功能配置命令
const GET_KEY_DEFAULT_COMMAND = 0x07; // 获取默认按键配置命令
const GET_KEY_CURRENT_COMMAND = 0x08; // 获取当前按键配置命令
const SET_KEY_CURRENT_COMMAND = 0x09; // 设置当前按键配置命令
const GET_KEY_TARY_COMMAND    = 0xa0; // 获取按键触发参数命令
const SET_KEY_TARY_COMMAND    = 0xa1; // 设置按键触发参数命令
const ON_CALIBRATION_REPORT   = 0xa0; // 设备主动上报：校准事件标识（buffer[0]）
const GET_DKS_COMMAND         = 0xa2; // 获取 DKS 高级按键数据命令
const SET_DKS_COMMAND         = 0xa3; // 设置 DKS 高级按键数据命令
const GET_MT_COMMAND          = 0xa4; // 获取 MT 高级按键数据命令
const SET_MT_COMMAND          = 0xa5; // 设置 MT 高级按键数据命令
const GET_TGL_COMMAND         = 0xa6; // 获取 TGL 高级按键数据命令
const SET_TGL_COMMAND         = 0xa7; // 设置 TGL 高级按键数据命令
const GET_MACRO_COMMAND       = 0x0c; // 获取宏数据命令
const SET_MACRO_COMMAND       = 0x0d; // 设置宏数据命令
const DKS_AREA_SIZE           = 768;  // DKS 数据区大小（每个板载）
const DKS_ENTRY_SIZE          = 24;   // 每条 DKS 数据大小（字节）
const TGL_AREA_SIZE           = 128;  // TGL 数据区大小（每个板载）
const TGL_ENTRY_SIZE          = 3;    // 每条 TGL 数据大小（字节）
const MT_AREA_SIZE            = 256;  // MT 数据区大小（每个板载）
const MT_ENTRY_SIZE           = 6;    // 每条 MT 数据大小（字节）
const PERF_CFG_MASK_OFFSET    = 7;    // funcData 中 Perf_Cfg_mask 的字节偏移
const RATE_CFG_OFFSET         = 4;    // funcData 中轮询率的字节偏移
const LOCK_CFG_OFFSET         = 6;    // funcData 第 6 字节：高 4 位为默认组合键锁
const LOCK_BIT_WIN            = 0x01; // 高 4 位 bit0：Win 锁
const LOCK_BIT_ALT_TAB        = 0x02; // 高 4 位 bit1：Alt+Tab 锁
const LOCK_BIT_ALT_F4         = 0x04; // 高 4 位 bit2：Alt+F4 锁
const LOCK_BIT_APP            = 0x08; // 高 4 位 bit3：App 锁
const CALIBRATION_CFG_OFFSET  = 7;    // funcData 中校准开关的字节偏移（bit3）
const LIGHT_PATTERN_OFFSET    = 8;    // funcData 灯光模式
const LIGHT_BRIGHTNESS_OFFSET = 9;    // funcData 亮度
const LIGHT_SPEED_OFFSET      = 10;   // funcData 速度
const LIGHT_IS_RGB_OFFSET     = 12;   // funcData 是否 RGB
const LIGHT_R_OFFSET          = 14;   // funcData R
const LIGHT_G_OFFSET          = 15;   // funcData G
const LIGHT_B_OFFSET          = 16;   // funcData B
const DATA_LENGTH             = 51;   // 数据长度
const KEY_LAYER_LENGTH        = 512;  // 按键层长度
const KEY_ITEM_SIZE           = 3;    // 按键项大小
const KEY_TARY_ITEM_SIZE      = 8;    // 按键触发参数项大小
const KEY_COUNT               = Math.floor(KEY_LAYER_LENGTH / KEY_ITEM_SIZE); // 按键槽位数（170）
const ADVANCED_MT_TYPE        = 9;    // 高级键MT类型
const ADVANCED_RS_TYPE        = 11;   // 高级键RS类型
const ADVANCED_SOCD_TYPE      = 8;    // 高级键SOCD类型
const ADVANCED_OKS_TYPE       = 7;    // 高级键OKS类型
const ADVANCED_SUPER_TYPES    = new Set([5, 6, 7, 8, 10, 11]); // 高级键Super类型集合
const SHORTCUT_RAW_TYPE       = 0x10;
const ADVANCED_SHORTCUT_TYPE  = 3;
const ADVANCED_MACRO_TYPE     = 6;    // 宏类型
const MACRO_AREA_SIZE         = 2048; // 每个板载宏数据区大小
const MACRO_PTR_REGION_SIZE   = 64;   // 宏指针区大小（32 × 2 字节）
const MACRO_DATA_START        = 0x40; // 宏数据区起始偏移（跳过指针区）
const MACRO_PTR_BASE          = 0x0000; // 宏指针基地址（指针值即数组本地偏移，基地址为 0）
const MACRO_EMPTY_PTR         = 0x0040; // 空宏指针值（设备写入 0x40 0x00）
const MACRO_DATA_PTR_MIN      = 0x0044; // 有效宏指针最小值（0x0040 + 4 字节起始标记）
const MACRO_MAX_COUNT         = 32; // 宏最多 32 个

// resetKeyInfo：需要特殊处理的高级类型首字节集合（0x90/0x95/0x94/0x92/0x91/0x93）
const KEY_TYPE_ADVANCED_FIRST_BYTES = new Set([0x90, 0x95, 0x94, 0x92, 0x91, 0x93]);

/**
 * OKS(0x95) / SOCD(0x94) / RS(0x93) / MT(0x92) 共用同一个 256 字节功能实现区，
 * 每条占 6 字节，第二字节（索引）在四种类型中全局累加。
 * 设置/删除时必须把这四种类型都纳入索引管理范围。
 */
const SHARED_ADV_AREA_TYPES = new Set([0x92, 0x93, 0x94, 0x95]);

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
const RESET_RT_TARY      = [150, 1, 20, 20, 0, 1, 5, 5] as const;
const DEFAULT_TARY_AXIS  = 0xa0;    // 0xa1 触发参数默认轴体
const RATE_SUPPORT       = [1000, 2000, 4000, 8000] as const;

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
    const base     = i * KEY_ITEM_SIZE;
    const rawType  = rawDefaultLayerData[base] ?? 0;
    const extDef   = rawDefaultLayerData[base + 1] ?? 0;
    const codeDef  = rawDefaultLayerData[base + 2] ?? 0;
    const hidCode  = resolveHidCodeFromDefaultKeyTriplet(rawType, extDef, codeDef);
    if (!isKnownEventKeyCode(hidCode)) continue;
    const kName    = resolveKeyNameByCode(hidCode, KEY_RETURN_ORDER[i] ?? `K${i}`);
    const nk       = normalizeKeyName(kName);
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
    const base    = i * KEY_ITEM_SIZE;
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

/** 三字节 [type, ext, code] → TGL keys 项 */
const parseTGLKeyFromTriplet = (
  rawType: number,
  extByte: number,
  codeByte: number,
  fallbackKey: string,
): TGLKeyItem => {
  const hidCode = resolveHidCodeFromDefaultKeyTriplet(rawType, extByte, codeByte);
  return {
    key:  resolveKeyNameByCode(hidCode, fallbackKey),
    code: hidCode,
    type: convertKeyTypeForOutput(rawType, codeByte),
  };
};

/** TGL keys 项 → 三字节 [type, ext, code]（写入 0xa7） */
const encodeTGLKeyToTriplet = (item: TGLKeyItem): [number, number, number] =>
  encodeKeyTripletFromOutput(item.type, item.code);

/** 三字节 [type, ext, code] → MT keys 项 */
const parseMTKeyFromTriplet = (
  rawType: number,
  extByte: number,
  codeByte: number,
  fallbackKey: string,
): MTKeyItem => {
  const hidCode = resolveHidCodeFromDefaultKeyTriplet(rawType, extByte, codeByte);
  return {
    key:  resolveKeyNameByCode(hidCode, fallbackKey),
    code: hidCode,
    type: convertKeyTypeForOutput(rawType, codeByte),
  };
};

/** MT keys 项 → 三字节 [type, ext, code]（写入 0xa5） */
const encodeMTKeyToTriplet = (item: MTKeyItem): [number, number, number] =>
  encodeKeyTripletFromOutput(item.type, item.code);

/** 三字节 [type, ext, code] → RS keys 项 */
const parseRSKeyFromTriplet = (
  rawType: number,
  extByte: number,
  codeByte: number,
  fallbackKey: string,
): RSKeyItem => {
  const hidCode = resolveHidCodeFromDefaultKeyTriplet(rawType, extByte, codeByte);
  return {
    key:  resolveKeyNameByCode(hidCode, fallbackKey),
    code: hidCode,
    type: convertKeyTypeForOutput(rawType, codeByte),
  };
};

/** RS keys 项 → 三字节 [type, ext, code]（写入 0xa5） */
const encodeRSKeyToTriplet = (item: RSKeyItem): [number, number, number] =>
  encodeKeyTripletFromOutput(item.type, item.code);

/** 三字节 [type, ext, code] → SOCD keys 项 */
const parseSOCDKeyFromTriplet = (
  rawType: number,
  extByte: number,
  codeByte: number,
  fallbackKey: string,
): SOCDKeyItem => {
  const hidCode = resolveHidCodeFromDefaultKeyTriplet(rawType, extByte, codeByte);
  return {
    key:  resolveKeyNameByCode(hidCode, fallbackKey),
    code: hidCode,
    type: convertKeyTypeForOutput(rawType, codeByte),
  };
};

/** SOCD keys 项 → 三字节 [type, ext, code]（写入 0xa5） */
const encodeSOCDKeyToTriplet = (item: SOCDKeyItem): [number, number, number] =>
  encodeKeyTripletFromOutput(item.type, item.code);

/** 三字节 [type, ext, code] → OKS keys 项 */
const parseOKSKeyFromTriplet = (
  rawType: number,
  extByte: number,
  codeByte: number,
  fallbackKey: string,
): OKSKeyItem => {
  const hidCode = resolveHidCodeFromDefaultKeyTriplet(rawType, extByte, codeByte);
  return {
    key:  resolveKeyNameByCode(hidCode, fallbackKey),
    code: hidCode,
    type: convertKeyTypeForOutput(rawType, codeByte),
  };
};

/** OKS keys 项 → 三字节 [type, ext, code]（写入 0xa5） */
const encodeOKSKeyToTriplet = (item: OKSKeyItem): [number, number, number] =>
  encodeKeyTripletFromOutput(item.type, item.code);

/**
 * 解析组合键修饰字节 → ShortcutKeyItem[]
 *
 * byte[1] 各 bit 含义（USB HID Modifier Bitmap）：
 *   bit0=L-Ctrl(0xe0)  bit1=L-Shift(0xe1)  bit2=L-Alt(0xe2)  bit3=L-Win(0xe3)
 *   bit4=R-Ctrl(0xe4)  bit5=R-Shift(0xe5)  bit6=R-Alt(0xe6)  bit7=R-Win(0xe7)
 */
function parseShortcutModifierByte(modByte: number): ShortcutKeyItem[] {
  const items: ShortcutKeyItem[] = [];
  for (let i = 0; i < 8; i++) {
    if (modByte & (1 << i)) {
      items.push({ type: ADVANCED_SHORTCUT_TYPE, code: 0xe0 + i });
    }
  }
  return items;
}

/**
 * 将 ShortcutKeyItem[] 编码为设备写入的两个字节：
 *   [modifierByte, mainCodeByte]
 *
 * 规则：
 *   - code 在 0xe0~0xe7（修饰键）→ 按固定映射转为对应 bit 值后 OR 拼接到 modifierByte：
 *       0xe0=L-Ctrl→0x01  0xe1=L-Shift→0x02  0xe2=L-Alt→0x04  0xe3=L-Win→0x08
 *       0xe4=R-Ctrl→0x10  0xe5=R-Shift→0x20  0xe6=R-Alt→0x40  0xe7=R-Win→0x80
 *     例：[{code:224},{code:225}] → 0x01|0x02 = 0x03
 *   - code < 0xe0（主键）→ mainCodeByte = code（以最后一个为准）
 */
/** funcData 第 6 字节高 4 位 → defaultLock 列表（始终返回全部项，enable=0 表示已锁定，enable=1 表示未锁定） */
function parseDefaultLockFromFuncByte(cfgByte: number): LockShortcutEntry[] {
  const mask   = (cfgByte >> 4) & 0x0f;
  // API 语义与硬件相反：硬件 bit=1 → enable=0（锁定），硬件 bit=0 → enable=1（未锁定）
  const win    = (mask & LOCK_BIT_WIN)     ? 0 : 1;
  const altTab = (mask & LOCK_BIT_ALT_TAB) ? 0 : 1;
  const altF4  = (mask & LOCK_BIT_ALT_F4)  ? 0 : 1;
  const app    = (mask & LOCK_BIT_APP)     ? 0 : 1;
  return [
    { enable: win,    keys: [0xe3] },         // L-Win
    { enable: win,    keys: [0xe7] },         // R-Win
    { enable: altTab, keys: [0xe2, 0x2b] },   // L-Alt + Tab
    { enable: altTab, keys: [0xe6, 0x2b] },   // R-Alt + Tab
    { enable: altF4,  keys: [0xe2, 0x3d] },   // L-Alt + F4
    { enable: altF4,  keys: [0xe6, 0x3d] },   // R-Alt + F4
    { enable: app,    keys: [0x76] },         // Menu(App)
  ];
}

/** defaultLock 列表 → funcData 第 6 字节高 4 位锁定位 */
function encodeLockMaskFromDefaultLock(entries: LockShortcutEntry[]): number {
  let mask = 0;
  for (const entry of entries) {
    if (entry.enable) continue; // enable=1 表示未锁定，跳过；enable=0 表示锁定，置硬件 bit=1
    const keys = entry.keys ?? [];
    if (keys.length === 1 && (keys[0] === 0xe3 || keys[0] === 0xe7)) {
      mask |= LOCK_BIT_WIN;
      continue;
    }
    if (keys.length === 1 && keys[0] === 0x76) {
      mask |= LOCK_BIT_APP;
      continue;
    }
    if (keys.length !== 2) continue;
    const hasLAlt = keys.includes(0xe2);
    const hasRAlt = keys.includes(0xe6);
    if (!hasLAlt && !hasRAlt) continue;
    if (keys.includes(0x2b)) mask |= LOCK_BIT_ALT_TAB;
    else if (keys.includes(0x3d)) mask |= LOCK_BIT_ALT_F4;
  }
  return mask & 0x0f;
}

/** 读取宏指针区中第 index 个宏的起始地址（2 字节 LE，返回指针值如 0x4044） */
function readMacroPtrAddr(ptrData: number[], index: number): number {
  return (ptrData[index * 2] ?? 0) | ((ptrData[index * 2 + 1] ?? 0) << 8);
}

/** 将宏指针值转换为 macroArea 数组本地偏移（ptr - MACRO_PTR_BASE） */
function macroPtrToLocalOffset(ptr: number): number {
  return ptr - MACRO_PTR_BASE;
}

/** 写入宏指针区中第 index 个宏的起始地址 */
function writeMacroPtrAddr(ptrData: number[], index: number, addr: number): void {
  ptrData[index * 2]     = addr & 0xff;
  ptrData[index * 2 + 1] = (addr >> 8) & 0xff;
}

/** 向后查找下一个有效宏的指针值；未找到时返回 MACRO_PTR_BASE + MACRO_AREA_SIZE */
function findNextMacroPtrAddr(
  ptrData: number[],
  fromIndex: number,
  cur: number,
): number {
  for (let j = fromIndex + 1; j < MACRO_MAX_COUNT; j++) {
    const addr = readMacroPtrAddr(ptrData, j);
    if (addr !== MACRO_EMPTY_PTR && addr > cur) return addr;
  }
  return MACRO_PTR_BASE + MACRO_AREA_SIZE;
}

/** 计算宏数据区已占用末尾的本地偏移（数组索引） */
function getMacroDataEnd(ptrData: number[]): number {
  let end = MACRO_DATA_START;
  for (let i = 0; i < MACRO_MAX_COUNT; i++) {
    const cur = readMacroPtrAddr(ptrData, i);
    if (cur === MACRO_EMPTY_PTR || cur < MACRO_DATA_PTR_MIN) continue;
    end = Math.max(end, macroPtrToLocalOffset(findNextMacroPtrAddr(ptrData, i, cur)));
  }
  return end;
}

/** 构建空的宏数据区：指针区全部 0x40,0x00，数据区清零 */
function buildEmptyMacroArea(): number[] {
  const area = new Array<number>(MACRO_AREA_SIZE).fill(0);
  for (let i = 0; i < MACRO_MAX_COUNT; i++) {
    writeMacroPtrAddr(area, i, MACRO_EMPTY_PTR);
  }
  return area;
}

/** 宏指针区每 2 字节为一个起始地址（低字节在前），解析已录制宏列表 */
function parseMacroListFromPointers(ptrData: number[]): MacroEntry[] {
  const macros: MacroEntry[] = [];
  const slotCount = Math.min(MACRO_MAX_COUNT, Math.floor(MACRO_PTR_REGION_SIZE / 2));

  for (let i = 0; i < slotCount; i++) {
    const cur = readMacroPtrAddr(ptrData, i);
    if (cur === MACRO_EMPTY_PTR) continue;
    if (cur < MACRO_DATA_PTR_MIN) continue;

    const next = findNextMacroPtrAddr(ptrData, i, cur);
    const gap  = next - cur;
    if (gap < 4 || gap % 4 !== 0) continue;

    macros.push({
      name: `M${i}`,
      type: ADVANCED_MACRO_TYPE,
      code: i,
    });
  }
  return macros;
}

/** 0x0d 分包写入宏数据区 */
async function* writeMacroAreaDataGen(
  macroAreaOffset: number,
  areaOffset: number,
  data: number[],
): DeviceSession<number> {
  for (let i = 0; i < data.length; i += DATA_LENGTH) {
    const chunk = data.slice(i, Math.min(i + DATA_LENGTH, data.length));
    const writeOff = macroAreaOffset + areaOffset + i;
    const [wLo, wHi] = shiftFrom16Bit(writeOff);
    const size = chunk.length;
    const wChk = (wLo + wHi + size + chunk.reduce((s, v) => s + v, 0)) & 0xff;
    const wIn: InPacket = yield buildOutPacket(FLAG, [
      SET_MACRO_COMMAND, 0x00, wChk, size,
      wLo, wHi, 0x00,
      ...chunk,
    ]);
    const wCode = parseWriteResponseCode(wIn);
    if (wCode !== 0) return wCode;
  }
  return 0;
}

function encodeShortcutKeys(keys: ShortcutKeyItem[]): [modifierByte: number, mainCodeByte: number] {
  let modifierByte = 0;
  let mainCodeByte = 0;
  for (const k of keys) {
    if (k.code >= 0xe0 && k.code <= 0xe7) {
      modifierByte |= (1 << (k.code - 0xe0)) & 0xff;
    } else if (k.code < 0xe0) {
      mainCodeByte = k.code & 0xff;
    }
  }
  return [modifierByte, mainCodeByte];
}

// ─── 写命令响应码解析 ──────────────────────────────────────────────────────────

/**
 * 解析写命令设备回包，返回 0/1/2/3：
 *   0 = 成功
 *   1 = 失败（无数据：回包全为 0）
 *   2 = 不支持（[8..12] = 0x75,0x6e,0x6b,0x6e,0x77 "unknw"）
 *   3 = 参数错误（[0]=0xab，[8..12]=0x63,0x73,0x65,0x72,0x72 "cserr"）
 */
function parseWriteResponseCode(inPacket: InPacket): number {
  if (
    inPacket[8]  === 0x75 && inPacket[9]  === 0x6e &&
    inPacket[10] === 0x6b && inPacket[11] === 0x6e &&
    inPacket[12] === 0x77
  ) return 2;
  if (
    inPacket[0]  === 0xab &&
    inPacket[8]  === 0x63 && inPacket[9]  === 0x73 &&
    inPacket[10] === 0x65 && inPacket[11] === 0x72 &&
    inPacket[12] === 0x72
  ) return 3;
  if (inPacket.every((b) => b === 0)) return 1;
  return 0;
}

/**
 * 解析 DKS 按键 range 字段
 *
 */
function parseDKSKeyRange(b3: number, b4: number): number[] {
  const raw = (b3 & 0xff) | ((b4 & 0xff) << 8);

  const selected:   [boolean, boolean, boolean, boolean] = [
    Boolean((raw >> 0) & 1),
    Boolean((raw >> 3) & 1),
    Boolean((raw >> 6) & 1),
    Boolean((raw >> 9) & 1),
  ];
  const continuous: [boolean, boolean, boolean, boolean] = [
    Boolean((raw >> 1) & 1),
    Boolean((raw >> 4) & 1),
    Boolean((raw >> 7) & 1),
    false,                    // 触点 3 只有 1 bit，无连续位
  ];

  const range: number[] = [];
  let i = 0;
  while (i < 4) {
    if (!selected[i]) { i++; continue; }

    if (!continuous[i]) {
      range.push(i, i);
      i++;
    } else {
      // 顺着链找末端：持续向后，直到遇到"非连续"或"未选中"的触点
      let j = i + 1;
      while (j < 4 && selected[j] && continuous[j]) j++;
      // j 处：选中但非连续 → 链尾；或未选中 → 链尾为 j-1
      if (j < 4 && selected[j]) {
        range.push(i, j); // 链末端已选中 → j 留到下一轮独立处理
        i = j;
      } else {
        range.push(i, j); // 链末端未选中 → 链尾仍记录为 j（链"试图到达"的位置）
        i = j + 1;        // j 未选中，直接跳过
      }
    }
  }
  return range;
}

function encodeDKSKeyRange(range: number[]): [number, number] {
  const selected:   boolean[] = [false, false, false, false];
  const continuous: boolean[] = [false, false, false, false];

  for (let i = 0; i + 1 < range.length; i += 2) {
    const from = range[i]!;
    const to   = range[i + 1]!;
    if (from === to) {
      if (from >= 0 && from <= 3) selected[from] = true;
    } else {
      for (let k = from; k < to && k <= 3; k++) {
        if (k >= 0) { selected[k] = true; continuous[k] = true; }
      }
      if (to >= 0 && to <= 3) selected[to] = true;
    }
  }

  // bit2 (next_valid)：触点 i 已选中，且触点 i+1 连续时置 1
  let value = 0;
  for (let j = 0; j <= 2; j++) {
    const sel  = selected[j]   ? 1 : 0;
    const cont = continuous[j] ? 1 : 0;
    const nxt  = (selected[j] && continuous[j + 1]) ? 1 : 0;
    value |= (sel | (cont << 1) | (nxt << 2)) << (j * 3);
  }
  value |= (selected[3] ? 1 : 0) << 9;

  return [value & 0xff, (value >> 8) & 0xff];
}

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

/** 0x04 读取当前板载 index；0x05 以 config×64 为偏移读取该板载功能配置区；layer 换算为板载内局部层（0~3） */
async function* resolveConfigLayerGen(
  requestLayer?: number,
): DeviceSession<{ config: number; layer: number; funcData: number[] }> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, config * 64, 64, DATA_LENGTH,
  );
  // funcData[1] / requestLayer 均为全局层级（0~12），板载内局部层 = 全局层 - config × 4
  const rawLayer = Number.isInteger(requestLayer) ? (requestLayer as number) : (funcData[1] ?? 0);
  const layer    = rawLayer - config * 4;
  return { config, layer, funcData };
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
  const resCode = parseWriteResponseCode(dataIn);
  return {
    name: "setConfigLayerIndex",
    code: resCode,
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
  const { layer, pageNo, pageSize } = request;
  if (!Number.isInteger(layer) || layer < 0)
    throw new Error("layer must be a non-negative integer");
  if (!Number.isInteger(pageNo) || pageNo < 1)
    throw new Error("pageNo must be an integer starting from 1");
  if (!Number.isInteger(pageSize) || pageSize < 1)
    throw new Error("pageSize must be a positive integer");

  const { config: devConfig, layer: devLocalLayer, funcData } = yield* resolveConfigLayerGen(layer);
  const config     = request.config ?? devConfig;
  const localLayer = request.config !== undefined ? (layer - config * 4) : devLocalLayer;
  const perfCfgMask   = funcData[PERF_CFG_MASK_OFFSET] ?? 0;
  const anti_break_sw = (perfCfgMask >> 1) & 0x01;
  const debounce_lvl  = (perfCfgMask >> 5) & 0x07;

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = localLayer * KEY_LAYER_LENGTH + config * profileSize;

  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );
  const rawLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  const totalKeys = KEY_COUNT;
  const keyTaryLayerSize   = totalKeys * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const keyTaryOffset      = localLayer * keyTaryLayerSize + config * keyTaryProfileSize;

  const rawTaryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, keyTaryOffset, keyTaryLayerSize, DATA_LENGTH,
  );

  const getPositionInfo = (rawLayer: number[], keyIndex: number) => {
    const base     = keyIndex * KEY_ITEM_SIZE;
    const rawType  = rawLayer[base] ?? 0;
    const ext      = rawLayer[base + 1] ?? 0;
    const codeByte = rawLayer[base + 2] ?? 0;
    const code     = resolveHidCodeFromDefaultKeyTriplet(rawType, ext, codeByte);
    const name     = resolveKeyNameByCode(code, KEY_RETURN_ORDER[keyIndex] ?? `K${keyIndex}`);
    return { name, code };
  };

  const getKeyTary = (keyIndex: number): number[] => {
    const start           = keyIndex * KEY_TARY_ITEM_SIZE;
    const raw             = rawTaryData.slice(start, start + KEY_TARY_ITEM_SIZE);

    // Byte 1: [4bit 快速触发开关][4bit SOCD优先级策略（保留）]
    const rt_switch       = (raw[1] ?? 0) & 0x0F;

    // Bytes 2-3 (16-bit LE): [9bit 触发死区(10~400)][7bit 预留精度切换]
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

  const def = { tary: keysByName["ESC"]?.tary ?? [] };

  return {
    name: "getBasicKey",
    code: 0,
    data: {
      len: orderedKeyNames.length,
      config,
      layer: localLayer,
      name: localLayer,
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

  const { config, layer, funcData } = yield* resolveConfigLayerGen(request.layer);
  const perfCfgMask   = funcData[PERF_CFG_MASK_OFFSET] ?? 0;
  const anti_break_sw = (perfCfgMask >> 1) & 0x01;
  const debounce_lvl  = (perfCfgMask >> 5) & 0x07;

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );
  const rawLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  const totalKeys      = KEY_COUNT;
  const keyTaryLayerSize   = totalKeys * KEY_TARY_ITEM_SIZE;
  const keyTaryOffset  = layer * keyTaryLayerSize + config * (keyTaryLayerSize * 4);

  const rawTaryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, keyTaryOffset, keyTaryLayerSize, DATA_LENGTH,
  );

  const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, key);
  if (keyIndex === undefined) {
    return { name: "getKeyInfo", code: 1, data: { key, type: 0, code: 0, enable: 0, tary: [], super: [], mt: [] }, message: `key not found: ${key}` };
  }

  {
    const base     = keyIndex * KEY_ITEM_SIZE;
    const rawType  = rawLayerData[base] ?? 0;
    const ext      = rawLayerData[base + 1] ?? 0;
    const codeByte = rawLayerData[base + 2] ?? 0;
    const outType  = convertKeyTypeForOutput(rawType, codeByte);

    const posCode = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultLayerData[base] ?? 0,
      rawDefaultLayerData[base + 1] ?? 0,
      rawDefaultLayerData[base + 2] ?? 0,
    );
    const keyName = resolveKeyNameByCode(posCode, KEY_RETURN_ORDER[keyIndex] ?? `K${keyIndex}`);

    const start = keyIndex * KEY_TARY_ITEM_SIZE;
    const raw   = rawTaryData.slice(start, start + KEY_TARY_ITEM_SIZE);
    const enable = 1;

    // Byte 1: [4bit 快速触发开关][4bit SOCD优先级策略（保留）]
    const rt_switch       = (raw[1] ?? 0) & 0x0F;

    // Bytes 2-3 (16-bit LE): [9bit 触发死区(10~400)][7bit 预留精度切换]
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

    const out: GetKeyInfoData = {
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

    return { name: "getKeyInfo", code: 0, data: out, message: "" };
  }
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

  const normalizeTary = (tary: number[]): number[] | null => {
    if (!Array.isArray(tary) || tary.length !== 8) return null;
    return [...tary];
  };

  const validateAdvKeyField = (
    field: "super" | "mt",
    value: unknown,
    key: string,
  ): string | null => {
    if (!Array.isArray(value))
      return `key ${key}: ${field} must be an array`;
    if (value.length === 0) return null;
    if (value.length !== 2)
      return `key ${key}: ${field} must be [] or [type, code]`;
    if (!Number.isInteger(value[0]) || !Number.isInteger(value[1]))
      return `key ${key}: ${field} must contain integers`;
    return null;
  };

  const validateTary = (tary: number[]): string | null => {
    const [
      tary_trigger_dz, tary_rt_switch, tary_press_rt, tary_release_rt,
      tary_anti_break, tary_debounce, tary_press_dz, tary_release_dz,
    ] = tary;
    if (!Number.isInteger(tary_trigger_dz) || tary_trigger_dz < 10 || tary_trigger_dz > 400)
      return "tary[0] 触发死区 must be 10~400";
    if (!Number.isInteger(tary_rt_switch)  || tary_rt_switch  < 0  || tary_rt_switch  > 15)
      return "tary[1] 快速触发开关 must be 0~15";
    if (!Number.isInteger(tary_press_rt)   || tary_press_rt   < 1  || tary_press_rt   > 512)
      return "tary[2] 触发灵敏度 must be 1~512";
    if (!Number.isInteger(tary_release_rt) || tary_release_rt < 1  || tary_release_rt > 512)
      return "tary[3] 抬起灵敏度 must be 1~512";
    if (!Number.isInteger(tary_anti_break) || tary_anti_break < 0  || tary_anti_break > 1)
      return "tary[4] 断触优化开关 must be 0 or 1";
    if (!Number.isInteger(tary_debounce)   || tary_debounce   < 0  || tary_debounce   > 7)
      return "tary[5] 防抖等级 must be 0~7";
    if (!Number.isInteger(tary_press_dz)   || tary_press_dz   < 0  || tary_press_dz   > 127)
      return "tary[6] RT顶部死区 must be 0~127";
    if (!Number.isInteger(tary_release_dz) || tary_release_dz < 0  || tary_release_dz > 127)
      return "tary[7] RT底部死区 must be 0~127";
    return null;
  };

  const encodeTaryDevBytes = (tary: number[]): number[] => {
    const [
      tary_trigger_dz, tary_rt_switch, tary_press_rt, tary_release_rt,
      tary_press_dz, tary_release_dz,
    ] = [tary[0], tary[1], tary[2], tary[3], tary[6], tary[7]];
    const dev_trigger_dz = (tary_trigger_dz - 1) & 0x1ff;
    const dev_press_rt   = (tary_press_rt   - 1) & 0x1ff;
    const dev_release_rt = (tary_release_rt - 1) & 0x1ff;
    const press_region   = dev_press_rt   | ((tary_press_dz   & 0x7f) << 9);
    const release_region = dev_release_rt | ((tary_release_dz & 0x7f) << 9);
    return [
      DEFAULT_TARY_AXIS,
      tary_rt_switch & 0x0f,
      dev_trigger_dz & 0xff,
      (dev_trigger_dz >> 8) & 0xff,
      press_region   & 0xff,
      (press_region  >> 8) & 0xff,
      release_region & 0xff,
      (release_region >> 8) & 0xff,
    ];
  };

  for (const entry of entries) {
    const key = String(entry?.key ?? "").trim();
    if (!key) return { name: "setKeyInfo", code: 3, message: "each key entry requires key" };
    if (!Number.isInteger(entry.type)) return { name: "setKeyInfo", code: 3, message: `key ${key}: type is required` };
    if (!Number.isInteger(entry.code)) return { name: "setKeyInfo", code: 3, message: `key ${key}: code is required` };
    if (!Number.isInteger(entry.enable) || (entry.enable !== 0 && entry.enable !== 1))
      return { name: "setKeyInfo", code: 3, message: `key ${key}: enable is required and must be 0 or 1` };
    const normalizedTary = normalizeTary(entry.tary ?? []);
    if (normalizedTary === null)
      return { name: "setKeyInfo", code: 3, message: `key ${key}: tary is required and must be an array of 8 numbers` };
    const taryErr = validateTary(normalizedTary);
    if (taryErr) return { name: "setKeyInfo", code: 3, message: `key ${key}: ${taryErr}` };
    const superErr = validateAdvKeyField("super", entry.super ?? [], key);
    if (superErr) return { name: "setKeyInfo", code: 3, message: superErr };
    const mtErr = validateAdvKeyField("mt", entry.mt ?? [], key);
    if (mtErr) return { name: "setKeyInfo", code: 3, message: mtErr };
  }

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  const keyTaryLayerSize   = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  let lastPerfMask: { anti_break: number; debounce: number } | null = null;

  for (const entry of entries) {
    const key = String(entry.key).trim();
    const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, key);
    if (keyIndex === undefined)
      return { name: "setKeyInfo", code: 1, message: `key not found: ${key}` };

    const [defType, defExt, defCode] = encodeKeyTripletFromOutput(entry.type ?? 0, entry.code ?? 0);
    const keyDefAbsOff = layerOffset + keyIndex * KEY_ITEM_SIZE;
    const [dLo, dHi]   = shiftFrom16Bit(keyDefAbsOff);
    const defChecksum  = (dLo + dHi + KEY_ITEM_SIZE + defType + defExt + defCode) & 0xff;
    const w1In: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, defChecksum, KEY_ITEM_SIZE,
      dLo, dHi, 0x00,
      defType, defExt, defCode,
    ]);
    const w1Code = parseWriteResponseCode(w1In);
    if (w1Code !== 0) return { name: "setKeyInfo", code: w1Code, message: `key ${key}: write key def failed` };

    const normalizedTary = normalizeTary(entry.tary ?? [])!;
    const taryDevBytes = encodeTaryDevBytes(normalizedTary);
    const taryAbsOff   = (layer as number) * keyTaryLayerSize
                       + (config as number) * keyTaryProfileSize
                       + keyIndex * KEY_TARY_ITEM_SIZE;
    const [tLo, tHi]   = shiftFrom16Bit(taryAbsOff);
    const tarySize     = taryDevBytes.length;
    const taryChecksum = (tLo + tHi + tarySize + taryDevBytes.reduce((s, v) => s + v, 0)) & 0xff;
    const w2In: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_TARY_COMMAND, 0x00, taryChecksum, tarySize,
      tLo, tHi, 0x00,
      ...taryDevBytes,
    ]);
    const w2Code = parseWriteResponseCode(w2In);
    if (w2Code !== 0) return { name: "setKeyInfo", code: w2Code, message: `key ${key}: write tary failed` };
    lastPerfMask = { anti_break: normalizedTary[4], debounce: normalizedTary[5] };
  }

  if (lastPerfMask) {
    const perfCfgMask  = ((lastPerfMask.anti_break & 0x01) << 1) | ((lastPerfMask.debounce & 0x07) << 5);
    const [pLo, pHi]   = shiftFrom16Bit(config * 64 + PERF_CFG_MASK_OFFSET);
    const perfSize     = 1;
    const perfChecksum = (pLo + pHi + perfSize + perfCfgMask) & 0xff;
    const wPerfIn: InPacket = yield buildOutPacket(FLAG, [
      SET_Func_COMMAND, 0x00, perfChecksum, perfSize,
      pLo, pHi, 0x00,
      perfCfgMask,
    ]);
    const wPerfCode = parseWriteResponseCode(wPerfIn);
    if (wPerfCode !== 0) return { name: "setKeyInfo", code: wPerfCode, message: "write perf mask failed" };
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

  const { config, layer, funcData } = yield* resolveConfigLayerGen(request.layer);
  const perfCfgMask   = funcData[PERF_CFG_MASK_OFFSET] ?? 0;
  const anti_break_sw = (perfCfgMask >> 1) & 0x01;
  const debounce_lvl  = (perfCfgMask >> 5) & 0x07;

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  // ── 步骤二：0x07 读取默认矩阵，建立 keyName → keyIndex 映射 ────────────
  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  // ── 读取当前层完整触发参数 ────────────────────────────────
  const keyTaryLayerSize   = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const keyTaryOffset      = layer * keyTaryLayerSize + config * keyTaryProfileSize;

  const rawTaryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, keyTaryOffset, keyTaryLayerSize, DATA_LENGTH,
  );

  type KeySlot = { name: string; index: number };
  const buildAllKeySlotsFromDefault = (): KeySlot[] => {
    const byName = new Map<string, KeySlot>();
    for (let i = 0; i < KEY_COUNT; i++) {
      const base     = i * KEY_ITEM_SIZE;
      const rawType  = rawDefaultLayerData[base] ?? 0;
      const extDef   = rawDefaultLayerData[base + 1] ?? 0;
      const codeDef  = rawDefaultLayerData[base + 2] ?? 0;
      const hidCode  = resolveHidCodeFromDefaultKeyTriplet(rawType, extDef, codeDef);
      if (!isKnownEventKeyCode(hidCode)) continue;
      const name     = resolveKeyNameByCode(hidCode, KEY_RETURN_ORDER[i] ?? `K${i}`);
      const nk       = normalizeKeyName(name);
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
    const taryStart      = keyIndex * KEY_TARY_ITEM_SIZE;
    const raw            = rawTaryData.slice(taryStart, taryStart + KEY_TARY_ITEM_SIZE);
    const rt_switch      = (raw[1] ?? 0) & 0x0f;
    const trigger        = (raw[2] ?? 0) | ((raw[3] ?? 0) << 8);
    const trigger_dz     = trigger & 0x1ff;
    const press_region   = (raw[4] ?? 0) | ((raw[5] ?? 0) << 8);
    const press_rt       = press_region & 0x1ff;
    const press_dz       = (press_region >> 9) & 0x7f;
    const release_region = (raw[6] ?? 0) | ((raw[7] ?? 0) << 8);
    const release_rt     = release_region & 0x1ff;
    const release_dz     = (release_region >> 9) & 0x7f;
    return [
      trigger_dz + 1,
      rt_switch,
      press_rt   + 1,
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
    message: "",
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
  const tary    = request.tary;

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
  if (!Number.isInteger(tary_rt_switch)  || tary_rt_switch  < 0  || tary_rt_switch  > 2)
    return { name: "setPerf", code: 3, message: "tary[1] 快速触发开关 must be 0~15" };
  if (!Number.isInteger(tary_press_rt)   || tary_press_rt   < 1  || tary_press_rt   > 512)
    return { name: "setPerf", code: 3, message: "tary[2] 触发灵敏度 must be 1~512" };
  if (!Number.isInteger(tary_release_rt) || tary_release_rt < 1  || tary_release_rt > 512)
    return { name: "setPerf", code: 3, message: "tary[3] 抬起灵敏度 must be 1~512" };
  if (!Number.isInteger(tary_anti_break) || tary_anti_break < 0  || tary_anti_break > 1)
    return { name: "setPerf", code: 3, message: "tary[4] 断触优化开关 must be 0 or 1" };
  if (!Number.isInteger(tary_debounce)   || tary_debounce   < 0  || tary_debounce   > 7)
    return { name: "setPerf", code: 3, message: "tary[5] 防抖等级 must be 0~7" };
  if (!Number.isInteger(tary_press_dz)   || tary_press_dz   < 0  || tary_press_dz   > 50)
    return { name: "setPerf", code: 3, message: "tary[6] RT顶部死区 must be 0~127" };
  if (!Number.isInteger(tary_release_dz) || tary_release_dz < 0  || tary_release_dz > 50)
    return { name: "setPerf", code: 3, message: "tary[7] RT底部死区 must be 0~127" };

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  // ── 步骤二：0x07 读取默认矩阵，建立 keyName → keyIndex 映射 ────────────
  const rawDefaultLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  // ── 步骤三：编码 8 字节设备格式 ─────────────────────────────────────────
  const dev_trigger_dz  = (tary_trigger_dz - 1) & 0x1ff;
  const dev_press_rt    = (tary_press_rt   - 1) & 0x1ff;
  const dev_release_rt  = (tary_release_rt - 1) & 0x1ff;
  const press_region    = dev_press_rt   | ((tary_press_dz   & 0x7f) << 9);
  const release_region  = dev_release_rt | ((tary_release_dz & 0x7f) << 9);

  const taryDevBytes = [
    DEFAULT_TARY_AXIS,                  // 轴体（保持默认）
    tary_rt_switch & 0x0f,              // 触发模式低 4bit
    dev_trigger_dz & 0xff,              // 行程低字节
    (dev_trigger_dz >> 8) & 0xff,       // 行程高字节
    press_region   & 0xff,              // 触发灵敏度+顶部死区低字节
    (press_region  >> 8) & 0xff,        // 触发灵敏度+顶部死区高字节
    release_region & 0xff,              // 抬起灵敏度+底部死区低字节
    (release_region >> 8) & 0xff,       // 抬起灵敏度+底部死区高字节
  ];

  // ── 步骤四：0xa1 逐键写入触发参数 ──────────────────────────────────────
  const keyTaryLayerSize   = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const tarySize           = taryDevBytes.length; // 8

  for (const keyName of reqKeys) {
    const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, keyName);
    if (keyIndex === undefined) {
      return { name: "setPerf", code: 1, message: `key not found: ${keyName}` };
    }

    const taryAbsOff   = (layer  as number) * keyTaryLayerSize
                       + (config as number) * keyTaryProfileSize
                       + keyIndex * KEY_TARY_ITEM_SIZE;
    const [tLo, tHi]   = shiftFrom16Bit(taryAbsOff);
    const taryChecksum = (tLo + tHi + tarySize + taryDevBytes.reduce((s, v) => s + v, 0)) & 0xff;
    const wTaryIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_TARY_COMMAND, 0x00, taryChecksum, tarySize,
      tLo, tHi, 0x00,
      ...taryDevBytes,
    ]);
    const wTaryCode = parseWriteResponseCode(wTaryIn);
    if (wTaryCode !== 0) return { name: "setPerf", code: wTaryCode, message: `key ${keyName}: write tary failed` };
  }

  // ── 步骤五：0x06 写入 Perf_Cfg_mask（断触优化开关 + 防抖等级，全局）──
  // Perf_Cfg_mask: bit1 = anti_break_sw, bit5-7 = debounce_lvl
  const perfCfgMask  = ((tary_anti_break & 0x01) << 1) | ((tary_debounce & 0x07) << 5);
  const [pLo, pHi]   = shiftFrom16Bit(config * 64 + PERF_CFG_MASK_OFFSET);
  const perfSize     = 1;
  const perfChecksum = (pLo + pHi + perfSize + perfCfgMask) & 0xff;
  const wPerfIn: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, perfChecksum, perfSize,
    pLo, pHi, 0x00,
    perfCfgMask,
  ]);
  const wPerfCode = parseWriteResponseCode(wPerfIn);
  if (wPerfCode !== 0) return { name: "setPerf", code: wPerfCode, message: "write perf mask failed" };

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

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

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

    // 在 DKS/TGL 数据区中的索引（定义第二字节）
    const aDksIdx = rawAllLayersData[currentLayerBase + 1] ?? 0;

    // 统计该板载全部 4 层同类型按键，按 DKS 索引升序排列
    // DKS/TGL 索引是全板载唯一的（可跨层共享），必须全层扫描才能正确维护
    type DksEntry = { layerIdx: number; keyI: number; dksIdx: number };
    const dksEntries: DksEntry[] = [];
    for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
      const lBase = layerIdx * KEY_LAYER_LENGTH;
      for (let i = 0; i < KEY_COUNT; i++) {
        const b = lBase + i * KEY_ITEM_SIZE;
        if ((rawAllLayersData[b] ?? 0) === rawType) {
          dksEntries.push({ layerIdx, keyI: i, dksIdx: rawAllLayersData[b + 1] ?? 0 });
        }
      }
    }
    dksEntries.sort((a, b) => a.dksIdx - b.dksIdx);
    const totalDks = dksEntries.length > 0
      ? Math.max(...dksEntries.map((e) => e.dksIdx)) + 1
      : 0;

    // 0x09：将按键恢复为默认按键定义
    const defBase = keyIndex * KEY_ITEM_SIZE;
    const defType = rawDefaultLayerData[defBase]     ?? 0x10;
    const defExt  = rawDefaultLayerData[defBase + 1] ?? 0x00;
    const defCode = rawDefaultLayerData[defBase + 2] ?? (posCode & 0xff);
    const wDefIn: InPacket = yield yieldSetKeyDef(layerOffset + keyIndex * KEY_ITEM_SIZE, defType, defExt, defCode);
    const wDefCode = parseWriteResponseCode(wDefIn);
    if (wDefCode !== 0) return { name: "resetKeyInfo", code: wDefCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "write key def failed" };

    // 0x09：全部 4 层中 dksIdx > aDksIdx 的同类型按键索引各减 1（填补空缺）
    for (const entry of dksEntries) {
      if (entry.layerIdx === (layer as number) && entry.keyI === keyIndex) continue;
      if (entry.dksIdx <= aDksIdx) continue;
      const newDksIdx = entry.dksIdx - 1;
      const rawOff    = entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
      const wShiftIn: InPacket = yield yieldSetKeyDef(
        allLayersOffset + rawOff,
        rawType, newDksIdx, 0x00,
      );
      const wShiftCode = parseWriteResponseCode(wShiftIn);
      if (wShiftCode !== 0) return { name: "resetKeyInfo", code: wShiftCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "shift key index failed" };
    }

    // 按类型选择对应的数据区命令、区域大小、条目大小
    const isTgl           = rawType === 0x91;
    const GET_ADV_COMMAND = isTgl ? GET_TGL_COMMAND : GET_DKS_COMMAND;
    const SET_ADV_COMMAND = isTgl ? SET_TGL_COMMAND : SET_DKS_COMMAND;
    const ADV_AREA_SIZE   = isTgl ? TGL_AREA_SIZE   : DKS_AREA_SIZE;
    const ADV_ENTRY_SIZE  = isTgl ? TGL_ENTRY_SIZE  : DKS_ENTRY_SIZE;

    const advAreaOffset = (config as number) * ADV_AREA_SIZE;

    // 读取需要平移的那段数据（aDksIdx+1 ~ totalDks-1），跳过无关区域
    //   moveCount = 需要平移的条目数；为 0 时跳过读取
    const moveCount  = totalDks - 1 - aDksIdx;
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
      const writeOff  = advAreaOffset + (aDksIdx + i) * ADV_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(writeOff);
      const wChk = (wLo + wHi + ADV_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
      const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
        SET_ADV_COMMAND, 0x00, wChk, ADV_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...entryData,
      ]);
      const wAdvCode = parseWriteResponseCode(wAdvIn);
      if (wAdvCode !== 0) return { name: "resetKeyInfo", code: wAdvCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "write adv entry failed" };
    }

    // 末尾条目清零
    const clearOff  = advAreaOffset + (totalDks - 1) * ADV_ENTRY_SIZE;
    const [cLo, cHi] = shiftFrom16Bit(clearOff);
    const clearData  = new Array<number>(ADV_ENTRY_SIZE).fill(0);
    const cChk = (cLo + cHi + ADV_ENTRY_SIZE) & 0xff;
    const wClearIn: InPacket = yield buildOutPacket(FLAG, [
      SET_ADV_COMMAND, 0x00, cChk, ADV_ENTRY_SIZE,
      cLo, cHi, 0x00,
      ...clearData,
    ]);
    const wClearCode = parseWriteResponseCode(wClearIn);
    if (wClearCode !== 0) return { name: "resetKeyInfo", code: wClearCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "clear adv entry failed" };

  } else if (KEY_TYPE_ADVANCED_FIRST_BYTES.has(rawType)) {
    // ── OKS(0x95)/SOCD(0x94)/RS(0x93)/MT(0x92) 共用 256 字节功能区重置流程 ──
    // 索引在四种类型间全局累加，需跨类型、跨层整体维护

    const sharedIdx = rawAllLayersData[currentLayerBase + 1] ?? 0;

    // 收集全部 4 层所有共享类型条目，按 entryIdx 升序
    type SharedRstEntry = { layerIdx: number; keyI: number; entryIdx: number; keyType: number };
    const sharedEntries: SharedRstEntry[] = [];
    for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
      const lBase = layerIdx * KEY_LAYER_LENGTH;
      for (let i = 0; i < KEY_COUNT; i++) {
        const b  = lBase + i * KEY_ITEM_SIZE;
        const bt = rawAllLayersData[b] ?? 0;
        if (SHARED_ADV_AREA_TYPES.has(bt)) {
          sharedEntries.push({ layerIdx, keyI: i, entryIdx: rawAllLayersData[b + 1] ?? 0, keyType: bt });
        }
      }
    }
    sharedEntries.sort((a, b) => a.entryIdx - b.entryIdx);
    const totalShared = sharedEntries.length > 0
      ? Math.max(...sharedEntries.map((e) => e.entryIdx)) + 1
      : 0;

    // 0x09：将按键恢复为默认按键定义
    const defBase = keyIndex * KEY_ITEM_SIZE;
    const defType = rawDefaultLayerData[defBase]     ?? 0x10;
    const defExt  = rawDefaultLayerData[defBase + 1] ?? 0x00;
    const defCode = rawDefaultLayerData[defBase + 2] ?? (posCode & 0xff);
    const wDefIn: InPacket = yield yieldSetKeyDef(layerOffset + keyIndex * KEY_ITEM_SIZE, defType, defExt, defCode);
    const wDefCode = parseWriteResponseCode(wDefIn);
    if (wDefCode !== 0) return { name: "resetKeyInfo", code: wDefCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "write key def failed" };

    // 0x09：全部 4 层中 entryIdx > sharedIdx 的共享类型按键索引各减 1
    // 保留各条目原始 keyType 字节和 byte[2]（MT=time, RS/SOCD=key1SlotIdx）
    for (const entry of sharedEntries) {
      if (entry.layerIdx === (layer as number) && entry.keyI === keyIndex) continue;
      if (entry.entryIdx <= sharedIdx) continue;
      const newIdx    = entry.entryIdx - 1;
      const rawOff    = entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
      const origByte2 = rawAllLayersData[rawOff + 2] ?? 0;
      const wShiftIn: InPacket = yield yieldSetKeyDef(
        allLayersOffset + rawOff,
        entry.keyType, newIdx, origByte2,
      );
      const wShiftCode = parseWriteResponseCode(wShiftIn);
      if (wShiftCode !== 0) return { name: "resetKeyInfo", code: wShiftCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "shift key index failed" };
    }

    // 0xa4 读取 sharedIdx+1 ~ totalShared-1 条目，依次写到 sharedIdx ~ totalShared-2
    const advAreaOffset = (config as number) * MT_AREA_SIZE;
    const moveCount     = totalShared - 1 - sharedIdx;

    const partialSharedData: number[] = moveCount > 0
      ? yield* readChunkedDataByCommandGen(
          FLAG, GET_MT_COMMAND,
          advAreaOffset + (sharedIdx + 1) * MT_ENTRY_SIZE,
          moveCount * MT_ENTRY_SIZE,
          DATA_LENGTH,
        )
      : [];

    for (let i = 0; i < moveCount; i++) {
      const entryData = partialSharedData.slice(i * MT_ENTRY_SIZE, (i + 1) * MT_ENTRY_SIZE);
      const writeOff  = advAreaOffset + (sharedIdx + i) * MT_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(writeOff);
      const wChk = (wLo + wHi + MT_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
      const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
        SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...entryData,
      ]);
      const wAdvCode = parseWriteResponseCode(wAdvIn);
      if (wAdvCode !== 0) return { name: "resetKeyInfo", code: wAdvCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "write adv entry failed" };
    }

    // 0xa5 清零末尾条目（totalShared-1）
    const clearOff  = advAreaOffset + (totalShared - 1) * MT_ENTRY_SIZE;
    const [cLo, cHi] = shiftFrom16Bit(clearOff);
    const clearData  = new Array<number>(MT_ENTRY_SIZE).fill(0);
    const cChk = (cLo + cHi + MT_ENTRY_SIZE) & 0xff;
    const wClearIn: InPacket = yield buildOutPacket(FLAG, [
      SET_MT_COMMAND, 0x00, cChk, MT_ENTRY_SIZE,
      cLo, cHi, 0x00,
      ...clearData,
    ]);
    const wClearCode = parseWriteResponseCode(wClearIn);
    if (wClearCode !== 0) return { name: "resetKeyInfo", code: wClearCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "clear adv entry failed" };

  } else {
    // 非高级类型：0x09 下发默认3字节定义（来自默认矩阵）
    const defBase = keyIndex * KEY_ITEM_SIZE;
    const defType = rawDefaultLayerData[defBase]     ?? 0x10;
    const defExt  = rawDefaultLayerData[defBase + 1] ?? 0x00;
    const defCode = rawDefaultLayerData[defBase + 2] ?? (posCode & 0xff);
    const wNormalIn: InPacket = yield yieldSetKeyDef(layerOffset + keyIndex * KEY_ITEM_SIZE, defType, defExt, defCode);
    const wNormalCode = parseWriteResponseCode(wNormalIn);
    if (wNormalCode !== 0) return { name: "resetKeyInfo", code: wNormalCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "write key def failed" };
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
  const dev_trigger_dz   = (tary_trigger_dz - 1) & 0x1ff;
  const dev_press_rt     = (tary_press_rt   - 1) & 0x1ff;
  const dev_release_rt   = (tary_release_rt - 1) & 0x1ff;
  const press_region     = dev_press_rt   | ((tary_press_dz   & 0x7f) << 9);
  const release_region   = dev_release_rt | ((tary_release_dz & 0x7f) << 9);

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

  const keyTaryLayerSize   = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const taryAbsOff   = (layer  as number) * keyTaryLayerSize
                     + (config as number) * keyTaryProfileSize
                     + keyIndex * KEY_TARY_ITEM_SIZE;
  const [tLo, tHi]   = shiftFrom16Bit(taryAbsOff);
  const tarySize     = taryDevBytes.length; // 8
  const taryChecksum = (tLo + tHi + tarySize + taryDevBytes.reduce((s, v) => s + v, 0)) & 0xff;
  const wTaryIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_TARY_COMMAND, 0x00, taryChecksum, tarySize,
    tLo, tHi, 0x00,
    ...taryDevBytes,
  ]);
  const wTaryCode = parseWriteResponseCode(wTaryIn);
  if (wTaryCode !== 0) return { name: "resetKeyInfo", code: wTaryCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "write tary failed" };

  // ── 步骤五（续）：0x06 写入 Perf_Cfg_mask（断触优化开关 + 防抖等级）────
  // Perf_Cfg_mask: bit1 = anti_break_sw, bit5-7 = debounce_lvl
  const perfCfgMask  = ((tary_anti_break & 0x01) << 1) | ((tary_debounce & 0x07) << 5);
  const [pLo, pHi]   = shiftFrom16Bit(config * 64 + PERF_CFG_MASK_OFFSET);
  const perfSize     = 1;
  const perfChecksum = (pLo + pHi + perfSize + perfCfgMask) & 0xff;
  const wPerfIn: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, perfChecksum, perfSize,
    pLo, pHi, 0x00,
    perfCfgMask,
  ]);
  const wPerfCode = parseWriteResponseCode(wPerfIn);
  if (wPerfCode !== 0) return { name: "resetKeyInfo", code: wPerfCode, data: { key, type: 0, code: 0, tary: [], super: [], mt: [] }, message: "write perf mask failed" };

  // ── 返回结果 ──────────────────────────────────────────────────────
  const retDefBase = keyIndex * KEY_ITEM_SIZE;
  const retDefType = rawDefaultLayerData[retDefBase]     ?? 0x10;
  const retDefCode = rawDefaultLayerData[retDefBase + 2] ?? (posCode & 0xff);
  const outType    = convertKeyTypeForOutput(retDefType, retDefCode);

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

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);

  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

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

  const dev_trigger_dz  = (tary_trigger_dz - 1) & 0x1ff;
  const dev_press_rt    = (tary_press_rt   - 1) & 0x1ff;
  const dev_release_rt  = (tary_release_rt - 1) & 0x1ff;
  const press_region    = dev_press_rt   | ((tary_press_dz   & 0x7f) << 9);
  const release_region  = dev_release_rt | ((tary_release_dz & 0x7f) << 9);

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

  const keyTaryLayerSize   = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const keyTaryProfileSize = keyTaryLayerSize * 4;
  const tarySize           = taryDevBytes.length;

  for (const keyName of reqKeys) {
    const keyIndex = resolveKeySlotIndex(rawDefaultLayerData, String(keyName));
    if (keyIndex === undefined) {
      return { name: "resetRT", code: 1, message: `key not found: ${keyName}` };
    }

    const taryAbsOff   = (layer as number) * keyTaryLayerSize
                       + (config as number) * keyTaryProfileSize
                       + keyIndex * KEY_TARY_ITEM_SIZE;
    const [tLo, tHi]   = shiftFrom16Bit(taryAbsOff);
    const taryChecksum = (tLo + tHi + tarySize + taryDevBytes.reduce((s, v) => s + v, 0)) & 0xff;
    const wIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_TARY_COMMAND, 0x00, taryChecksum, tarySize,
      tLo, tHi, 0x00,
      ...taryDevBytes,
    ]);
    const wCode = parseWriteResponseCode(wIn);
    if (wCode !== 0) return { name: "resetRT", code: wCode, message: `key ${keyName}: write tary failed` };
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
    def: { tary: number[] };
    disable: number[];
    keys: Record<string, { type: number; code: number; tary: number[] }>;
    smart: Record<string, { super?: [number, number]; mt?: [number, number] }>;
  };
};

type GetKeyInfoResult = {
  name: "getKeyInfo";
  code: number;
  data: GetKeyInfoData;
  message: string;
};

type SetKeyInfoResult = {
  name: "setKeyInfo";
  code: number;
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
  code: number;
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
  code: number;
  message?: string;
};

type ResetRTResult = {
  name: "resetRT";
  code: number;
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
    Zkm:       number;
    connect:   number;
    battery:   number;
    bleMtu:    number;
    bleOtaMtu: number;
    usbMtu:    number;
    usbOtaMtu: number;
    firmwares: Array<{
      version: number;
      id:      number;
      type:    number;
      model:   string;
    }>;
  };
};

type GetCalibrationResult = {
  name: "getCalibration";
  code: number;
  data: {
    switch: number;
  };
};

type GetLightResult = {
  name: "getLight";
  code: number;
  data: GetLightData;
};



type SetLightResult = {
  name: "setLight";
  code: number;
  message?: string;
};



type GetDKSListResult = {
  name: "getDKSList";
  code: number;
  data: { shortcuts: DKSShortcut[] };
};

type GetTGLListResult = {
  name: "getTGLList";
  code: number;
  data: { len: number; tgl: TGLEntry[] };
};

type GetTGLResult = {
  name: "getTGL";
  code: number;
  data: TGLEntry;
  message?: string;
};

type SetTGLResult = {
  name: "setTGL";
  code: number;
  message?: string;
};

type GetDKSResult = {
  name: "getDKS";
  code: number;
  data: DKSShortcut;
  message?: string;
};


type DelDKSResult = {
  name: "delDKS";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

type DelTGLResult = {
  name: "delTGL";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

type GetMTListResult = {
  name: "getMTList";
  code: number;
  data: { len: number; mt: MTEntry[] };
};

type GetMTResult = {
  name: "getMT";
  code: number;
  data: MTEntry;
  message?: string;
};

type SetMTResult = {
  name: "setMT";
  code: number;
  message?: string;
};

type DelMTResult = {
  name: "delMT";
  code: number;
  message?: string;
};

type GetRSListResult = {
  name: "getRSList";
  code: number;
  data: { len: number; rs: RSEntry[] };
};

type GetRSResult = {
  name: "getRS";
  code: number;
  data: RSEntry;
  message?: string;
};

type SetRSResult = {
  name: "setRS";
  code: number;
  message?: string;
};

type DelRSResult = {
  name: "delRS";
  code: number;
  message?: string;
};

type GetSOCDListResult = {
  name: "getSOCDList";
  code: number;
  data: { len: number; socd: SOCDEntry[] };
};

type GetSOCDResult = {
  name: "getSOCD";
  code: number;
  data: SOCDEntry;
  message?: string;
};

type SetSOCDResult = {
  name: "setSOCD";
  code: number;
  message?: string;
};

type DelSOCDResult = {
  name: "delSOCD";
  code: number;
  message?: string;
};

type GetOKSListResult = {
  name: "getOKSList";
  code: number;
  data: { len: number; oks: OKSEntry[] };
};

type GetOKSResult = {
  name: "getOKS";
  code: number;
  data: OKSEntry;
  message?: string;
};

type SetOKSResult = {
  name: "setOKS";
  code: number;
  message?: string;
};

type DelOKSResult = {
  name: "delOKS";
  code: number;
  message?: string;
};

type GetShortcutsResult = {
  name: "getShortcuts";
  code: number;
  data: { shortcuts: ShortcutEntry[] };
};

type GetShortcutResult = {
  name: "getShortcut";
  code: number;
  data: ShortcutDetail;
  message?: string;
};

type AddShortcutResult = {
  name: "addShortcut";
  code: number;
  message?: string;
};

type DelShortcutResult = {
  name: "delShortcut";
  code: number;
  message?: string;
};



type SetDKSResult = {
  name: "setDKS";
  code: number;   // 0=成功 1=失败 2=不支持 3=参数错误
  message?: string;
};

type SetBiCalibrationResult = {
  name: "setBiCalibration";
  code: number;
  message?: string;
};

type SetCalibrationResult = {
  name: "setCalibration";
  code: number;
  message?: string;
};

type ResetKeyboardResult = {
  name: "resetKeyboard";
  code: number;
  message?: string;
};

type GetLockShortcutsResult = {
  name: "getLockShortcuts";
  code: number;
  data: LockShortcutsData;
};

type SetLockShortcutsResult = {
  name: "setLockShortcuts";
  code: number;
  message?: string;
};

type GetMacrosResult = {
  name: "getMacros";
  code: number;
  data: { macro: MacroEntry[] };
};

type DelMacroResult = {
  name: "delMacro";
  code: number;
  message?: string;
};

type MacroAttr = {
  type:         number;
  code:         number;
  name:         string;
  trigger:      number;
  triggerDelay: number;
  loop:         number;
  delay:        number[];
  stopType:     number;
  key?:         string;
};

type MacroActionKey = {
  inx: number;    // 按键序号（相同按键同一 inx）
  iT:  number;    // 与前一动作的间隔时间（ms）
  dT:  number;    // 按下到抬起的持续时间（ms）；抬起事件为 0，结束抬起为上一动作 delay
  kT:  number;    // 按键类型（bit0-5：1=修饰键 2=普通键 3=鼠标）
  kv:  number[];  // 按键值：按下=[code]，抬起=[]
};

type GetMacroResult = {
  name: "getMacro";
  code: number;
  data?: { attr: MacroAttr; keys: MacroActionKey[] };
  message?: string;
};

type SetMacroResult = {
  name: "setMacro";
  code: number;
  message?: string;
};

// ========== 推导核心 ========== start
// 导出类型名必须为： SessionResultMap
export type SessionResultMap = {
  getBasicConfig:      GetBasicConfigResult;
  setConfigLayerIndex: SetConfigLayerIndexResult;
  getBasicKey:         GetBasicKeyResult;
  getKeyInfo:          GetKeyInfoResult;
  setKeyInfo:          SetKeyInfoResult;
  getPerf:             GetPerfResult;
  setPerf:             SetPerfResult;
  getRate:             GetRateResult;
  setRate:             SetRateResult;
  resetRT:             ResetRTResult;
  resetKeyInfo:        ResetKeyInfoResult;
  getDeviceInfo:       GetDeviceInfoResult;
  getCalibration:      GetCalibrationResult;
  getLight:            GetLightResult;
  setLight:            SetLightResult;
  getDKSList:          GetDKSListResult;
  getTGLList:          GetTGLListResult;
  getTGL:              GetTGLResult;
  setTGL:              SetTGLResult;
  getDKS:              GetDKSResult;
  setDKS:              SetDKSResult;
  delDKS:              DelDKSResult;
  delTGL:              DelTGLResult;
  getMTList:           GetMTListResult;
  getMT:               GetMTResult;
  setMT:               SetMTResult;
  delMT:               DelMTResult;
  getRSList:           GetRSListResult;
  getRS:               GetRSResult;
  setRS:               SetRSResult;
  delRS:               DelRSResult;
  getSOCDList:         GetSOCDListResult;
  getSOCD:             GetSOCDResult;
  setSOCD:             SetSOCDResult;
  delSOCD:             DelSOCDResult;
  getOKSList:          GetOKSListResult;
  getOKS:              GetOKSResult;
  setOKS:              SetOKSResult;
  delOKS:              DelOKSResult;
  getShortcuts:        GetShortcutsResult;
  getShortcut:         GetShortcutResult;
  addShortcut:         AddShortcutResult;
  delShortcut:         DelShortcutResult;
  setBiCalibration:    SetBiCalibrationResult;
  setCalibration:      SetCalibrationResult;
  resetKeyboard:       ResetKeyboardResult;
  getLockShortcuts:    GetLockShortcutsResult;
  setLockShortcuts:    SetLockShortcutsResult;
  getMacros:           GetMacrosResult;
  getMacro:            GetMacroResult;
  setMacro:            SetMacroResult;
  delMacro:            DelMacroResult;
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
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, config * 64, 64, DATA_LENGTH,
  );
  const rawRate = (funcData[RATE_CFG_OFFSET] ?? 0) & 0x07;
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

  // 读取当前板载 + 功能配置
  const rBaseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = rBaseIn[8] ?? 0;
  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, config * 64, 64, DATA_LENGTH,
  );

  // 修改轮询率 bit[2:0]
  const oldByte = funcData[RATE_CFG_OFFSET] ?? 0;
  const newByte = (oldByte & ~0x07) | (rawRate & 0x07);

  // 写回轮询率字节
  const [lo, hi]  = shiftFrom16Bit(config * 64 + RATE_CFG_OFFSET);
  const size      = 1;
  const checksum  = (lo + hi + size + newByte) & 0xff;
  const wIn: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, checksum, size,
    lo, hi, 0x00,
    newByte,
  ]);
  const wCode = parseWriteResponseCode(wIn);
  if (wCode !== 0) return { name: "setRate", code: wCode, message: "write rate failed" };

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
  const version = (inPacket[8] ?? 0) | ((inPacket[9] ?? 0) << 8) - 0x99;

  return {
    name: "getDeviceInfo",
    code: 0,
    data: {
      Zkm:       1,
      connect:   0,
      battery:   100,
      bleMtu:    64,
      bleOtaMtu: 256,
      usbMtu:    64,
      usbOtaMtu: 512,
      firmwares: [
        { version, id: 0, type: 10, model: "m68" },
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
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, config * 64, 64, DATA_LENGTH,
  );
  const calibSwitch = (funcData[CALIBRATION_CFG_OFFSET] ?? 0) >> 3 & 0x01;

  return {
    name: "getCalibration",
    code: 0,
    data: { switch: calibSwitch },
  };
}

/**
 *
 * 读取锁组合键配置
 *
 * 流程：
 *  1. 0x04 读取当前板载号
 *  2. 0x05 读取功能配置，解析第 6 字节（funcData[5]）高 4 位
 *     bit0=Win 锁  bit1=Alt+Tab 锁  bit2=Alt+F4 锁  bit3=App 锁（1=锁定）
 *  3. customLock 默认返回空数组
 *
 */
export async function* getLockShortcuts(
  _request?: GetLockShortcutsParams,
): DeviceSession<GetLockShortcutsResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, config * 64, 64, DATA_LENGTH,
  );

  const lockByte    = funcData[LOCK_CFG_OFFSET] ?? 0;
  const defaultLock = parseDefaultLockFromFuncByte(lockByte);

  return {
    name: "getLockShortcuts",
    code: 0,
    data: {
      defaultLock,
      customLock: [],
    },
  };
}

/**
 *
 * 设置锁组合键配置
 *
 * 流程：
 *  1. 0x04 读取当前板载号
 *  2. 0x05 读取功能配置，取出 funcData[5]
 *  3. 根据 defaultLock 编码高 4 位锁定位，保留低 4 位
 *  4. 0x06 写回 funcData[5]（customLock 暂不支持写入，忽略）
 *
 */
export async function* setLockShortcuts(
  request: SetLockShortcutsParams,
): DeviceSession<SetLockShortcutsResult> {
  if (!Array.isArray(request.defaultLock)) {
    return { name: "setLockShortcuts", code: 3, message: "defaultLock must be an array" };
  }

  const rBaseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = rBaseIn[8] ?? 0;
  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, config * 64, 64, DATA_LENGTH,
  );

  const oldByte   = funcData[LOCK_CFG_OFFSET] ?? 0;
  const lockMask  = encodeLockMaskFromDefaultLock(request.defaultLock);
  const newByte   = (oldByte & 0x0f) | ((lockMask & 0x0f) << 4);

  const [lo, hi] = shiftFrom16Bit(config * 64 + LOCK_CFG_OFFSET);
  const size     = 1;
  const checksum = (lo + hi + size + newByte) & 0xff;
  const wIn: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, checksum, size,
    lo, hi, 0x00,
    newByte,
  ]);
  const wCode = parseWriteResponseCode(wIn);
  if (wCode !== 0) return { name: "setLockShortcuts", code: wCode, message: "write lock shortcuts failed" };

  return { name: "setLockShortcuts", code: 0 };
}

/**
 *
 * 读取宏列表
 *
 * 流程：
 *  1. 0x04 读取当前板载号（config）
 *  2. 0x0c 读取该板载宏区前 64 字节（指针区）
 *     - 每 2 字节为一个宏数据起始地址（低字节在前）
 *     - 0x40, 0x00 = 未录制；已录制时起始地址从 0x44 起
 *     - 与下一个有效指针间隔 >= 4 且为 4 的倍数，表示该宏有数据
 *  3. 组装 macro 列表：name=M{index}，type=6，code=宏索引
 *
 */
export async function* getMacros(
  _request?: GetMacrosParams,
): DeviceSession<GetMacrosResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const macroAreaOffset = config * MACRO_AREA_SIZE;

  const ptrData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_MACRO_COMMAND, macroAreaOffset, MACRO_PTR_REGION_SIZE, DATA_LENGTH,
  );

  const macro = parseMacroListFromPointers(ptrData);

  return {
    name: "getMacros",
    code: 0,
    data: { macro },
  };
}

/**
 * 将 getMacro 响应格式的 keys 数组重新编码为设备 4 字节动作序列。
 *
 * 每个动作格式：[delay_lo, delay_hi, ctrl, keyCode]
 *   ctrl = rawTypeBits | (press?0x40:0) | (end?0x80:0)
 *   rawTypeBits: kT=1(keyboard) → modifier(0xE0-0xE7)=1 else 2；kT=2(mouse) → 3
 *
 * delay 规则：
 *   最后一个动作（END）：delay=2（占位符）
 *   倒数第二个动作：     delay = END.dT
 *   其他动作：           delay = keys[i+1].iT
 */
function encodeMacroActions(keys: MacroActionKey[]): number[] {
  if (keys.length === 0) return [];

  // 建立 inx → keyCode 映射（从 press 动作中提取）
  const inxToCode = new Map<number, number>();
  for (const k of keys) {
    if (k.kv.length > 0) inxToCode.set(k.inx, k.kv[0]!);
  }

  const bytes: number[] = [];
  const lastIdx = keys.length - 1;

  for (let i = 0; i < keys.length; i++) {
    const k       = keys[i]!;
    const isPress = k.kv.length > 0;
    const isEnd   = i === lastIdx;
    const keyCode = isPress ? (k.kv[0] ?? 0) : (inxToCode.get(k.inx) ?? 0);

    // kT=1(键盘) → modifier 编码 1，普通键编码 2；kT=2(鼠标) → 编码 3
    const rawTypeBits = k.kT === 2 ? 3
      : (keyCode >= 0xe0 && keyCode <= 0xe7 ? 1 : 2);
    const ctrl = (rawTypeBits & 0x3f) | (isPress ? 0x40 : 0) | (isEnd ? 0x80 : 0);

    let delay: number;
    if (isEnd) {
      delay = 2;                          // 结束动作 delay 固定为占位符
    } else if (i === lastIdx - 1) {
      delay = keys[lastIdx]!.dT;          // 倒数第二个动作取 END 的 dT
    } else {
      delay = keys[i + 1]!.iT;           // 其余取下一动作的 iT
    }

    bytes.push(delay & 0xff, (delay >> 8) & 0xff, ctrl & 0xff, keyCode & 0xff);
  }

  return bytes;
}

/**
 *
 * 读取指定宏配置
 *
 * 流程：
 *  1. 0x04 读取当前板载号
 *  2. 0x0c 读取完整宏区（2048 字节）
 *  3. 按 code 取指针，判空返回空 keys
 *  4. 若传入 key：读 0x07（默认矩阵）定位槽位，再读 0x08 第 3 字节解析 loop/stopType
 *  5. 从指针起始位置逐 4 字节解析动作，直到 bit7=1（结束标志）
 *  6. 构造 iT / dT / inx 响应格式
 *
 */
export async function* getMacro(
  request: GetMacroParams,
): DeviceSession<GetMacroResult> {
  const { code, key } = request;

  if (request.type !== ADVANCED_MACRO_TYPE) {
    return { name: "getMacro", code: 3, message: "type must be 6 (Macro)" };
  }
  if (!Number.isInteger(code) || code < 0 || code >= MACRO_MAX_COUNT) {
    return { name: "getMacro", code: 3, message: "code must be an integer between 0 and 31" };
  }

  // 1. 读取板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config           = baseIn[8] ?? 0;
  const macroAreaOffset  = config * MACRO_AREA_SIZE;

  const defaultAttr: MacroAttr = {
    type:         ADVANCED_MACRO_TYPE,
    code,
    name:         `M${code}`,
    trigger:      0,
    triggerDelay: 0,
    loop:         1,
    delay:        [0, 0],
    stopType:     0,
    ...(key !== undefined ? { key } : {}),
  };

  // 2. 读取完整宏区
  const macroArea: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_MACRO_COMMAND, macroAreaOffset, MACRO_AREA_SIZE, DATA_LENGTH,
  );

  // 3. 校验指针
  const ptr         = readMacroPtrAddr(macroArea, code);
  const startOffset = macroPtrToLocalOffset(ptr);

  if (ptr < MACRO_DATA_PTR_MIN) {
    return { name: "getMacro", code: 0, data: { attr: defaultAttr, keys: [] } };
  }

  // 4. 若传入 key，读 0x07 + 0x08 获取 loop / stopType
  let loop     = 1;
  let stopType = 0;

  if (key !== undefined) {
    const profileStride    = KEY_LAYER_LENGTH * 4;  // 4 层
    const defaultLayerData = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND,
      config * profileStride,
      KEY_LAYER_LENGTH,
      DATA_LENGTH,
    );
    const keySlot = resolveKeySlotIndex(defaultLayerData, key) ?? -1;
    if (keySlot >= 0) {
      const currentLayerData = yield* readChunkedDataByCommandGen(
        FLAG, GET_KEY_CURRENT_COMMAND,
        config * profileStride,
        KEY_LAYER_LENGTH,
        DATA_LENGTH,
      );
      const byte2 = currentLayerData[keySlot * KEY_ITEM_SIZE + 2] ?? 0;
      if (byte2 === 0xff) {
        loop     = 0;
        stopType = 1;
      } else if (byte2 >= 1 && byte2 <= 254) {
        loop     = byte2;
        stopType = 0;
      }
    }
  }

  // 5. 从 startOffset 解析原始动作
  type RawAction = { delay: number; ctrl: number; keyCode: number };
  const rawActions: RawAction[] = [];

  let offset = startOffset;
  while (offset + 3 < MACRO_AREA_SIZE) {
    const delay   = (macroArea[offset] ?? 0) | ((macroArea[offset + 1] ?? 0) << 8);
    const ctrl    = macroArea[offset + 2] ?? 0;
    const keyCode = macroArea[offset + 3] ?? 0;
    rawActions.push({ delay, ctrl, keyCode });
    offset += 4;
    if (ctrl & 0x80) break; // bit7 = 结束标志
  }

  if (rawActions.length === 0) {
    return {
      name: "getMacro",
      code: 0,
      data: { attr: { ...defaultAttr, loop, stopType }, keys: [] },
    };
  }

  // 6. 构造响应 keys
  const inxMap = new Map<number, number>(); // keyCode → inx
  let nextInx  = 1;
  const responseKeys: MacroActionKey[] = [];

  for (let i = 0; i < rawActions.length; i++) {
    const action  = rawActions[i]!;
    const isEnd   = (action.ctrl & 0x80) !== 0;
    const isPress = (action.ctrl & 0x40) !== 0;
    const keyType = action.ctrl & 0x3f;
    const kc      = action.keyCode;

    if (!inxMap.has(kc)) inxMap.set(kc, nextInx++);
    const inx = inxMap.get(kc)!;

    let iT: number;
    let dT: number;

    if (isEnd) {
      // 结束动作：iT=0，dT=前一动作的 delay（宏尾延迟）
      iT = 0;
      dT = rawActions[i - 1]?.delay ?? 0;
    } else {
      // iT = 前一动作的 delay（首个动作为 0）
      iT = i === 0 ? 0 : (rawActions[i - 1]?.delay ?? 0);

      if (isPress) {
        // dT = 从本动作到匹配抬起之间所有 delay 的累加（即按住时长）
        let releaseIdx = rawActions.length - 1; // 默认取最后一个（END）
        for (let j = i + 1; j < rawActions.length; j++) {
          const a = rawActions[j]!;
          if (a.keyCode === kc && (a.ctrl & 0x40) === 0) {
            releaseIdx = j;
            break;
          }
        }
        dT = 0;
        for (let k = i; k < releaseIdx; k++) {
          dT += rawActions[k]!.delay;
        }
      } else {
        dT = 0;
      }
    }

    // raw bits: 1=modifier, 2=normal keyboard, 3=mouse → response kT: 1=keyboard, 2=mouse
    const kT = keyType <= 2 ? 1 : 2;

    responseKeys.push({
      inx,
      iT,
      dT,
      kT,
      kv: isPress ? [kc] : [],
    });
  }

  return {
    name: "getMacro",
    code: 0,
    data: {
      attr: { ...defaultAttr, loop, stopType },
      keys: responseKeys,
    },
  };
}

/**
 *
 * 新增或修改宏配置
 *
 * 流程：
 *  1. 参数校验
 *  2. 将 keys 编码为设备 4 字节动作序列
 *  3. 0x04 读取当前板载号，0x0c 读取完整宏区
 *  4. 判断新增 / 修改：
 *     新增：按 code 索引顺序找插入点，右移后续数据，更新高位指针
 *     修改：删旧数据（左/右移动），写入新数据，更新 >= oldEnd 的指针
 *  5. 若为第一个宏，写入数据区起始标记（0x00 0x00 0x80 0x00）
 *  6. 0x0d 写回宏区
 *  7. 若 attr.key 存在，将按键矩阵 0x08 槽位写为 [0x70, code, loopStopByte]
 *
 */
export async function* setMacro(
  request: SetMacroParams,
): DeviceSession<SetMacroResult> {
  const { attr, keys } = request;
  const code = attr.code;

  if (attr.type !== ADVANCED_MACRO_TYPE) {
    return { name: "setMacro", code: 3, message: "attr.type must be 6 (Macro)" };
  }
  if (!Number.isInteger(code) || code < 0 || code >= MACRO_MAX_COUNT) {
    return { name: "setMacro", code: 3, message: "attr.code must be 0-31" };
  }
  if (!keys || keys.length === 0) {
    return { name: "setMacro", code: 3, message: "keys must not be empty" };
  }

  // 1. 编码动作序列
  const encodedBytes = encodeMacroActions(keys);
  if (encodedBytes.length === 0) {
    return { name: "setMacro", code: 3, message: "failed to encode macro actions" };
  }
  const newLen = encodedBytes.length;

  // 2. 读取板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config          = baseIn[8] ?? 0;
  const macroAreaOffset = config * MACRO_AREA_SIZE;

  // 3. 读取完整宏区
  const macroArea: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_MACRO_COMMAND, macroAreaOffset, MACRO_AREA_SIZE, DATA_LENGTH,
  );

  const oldPtr    = readMacroPtrAddr(macroArea, code);
  const isNew     = oldPtr < MACRO_DATA_PTR_MIN;
  const dataEnd   = getMacroDataEnd(macroArea);    // 当前数据末尾（本地偏移）

  if (isNew) {
    // ── 新增 ──────────────────────────────────────────────────────────────────

    // 找插入点：所有 code 索引 < code 的宏的数据末尾
    let insertOffset = MACRO_DATA_PTR_MIN;
    for (let i = 0; i < code; i++) {
      const iPtr = readMacroPtrAddr(macroArea, i);
      if (iPtr < MACRO_DATA_PTR_MIN) continue;
      insertOffset = Math.max(insertOffset, findNextMacroPtrAddr(macroArea, i, iPtr));
    }

    // 若数据区为空，先写入起始标记（4 字节）
    if (dataEnd <= MACRO_DATA_START) {
      macroArea[MACRO_DATA_START]     = 0x00;
      macroArea[MACRO_DATA_START + 1] = 0x00;
      macroArea[MACRO_DATA_START + 2] = 0x80;
      macroArea[MACRO_DATA_START + 3] = 0x00;
    }

    // 右移 [insertOffset, dataEnd) → [insertOffset+newLen, dataEnd+newLen)
    const effectiveDataEnd = Math.max(dataEnd, MACRO_DATA_PTR_MIN);
    for (let i = effectiveDataEnd - 1; i >= insertOffset; i--) {
      macroArea[i + newLen] = macroArea[i] ?? 0;
    }

    // 写入新数据
    for (let i = 0; i < newLen; i++) {
      macroArea[insertOffset + i] = encodedBytes[i] ?? 0;
    }

    // 设置指针
    writeMacroPtrAddr(macroArea, code, insertOffset);

    // 更新 ptr >= insertOffset 的其他宏指针
    for (let i = 0; i < MACRO_MAX_COUNT; i++) {
      if (i === code) continue;
      const ptr = readMacroPtrAddr(macroArea, i);
      if (ptr >= MACRO_DATA_PTR_MIN && ptr >= insertOffset) {
        writeMacroPtrAddr(macroArea, i, ptr + newLen);
      }
    }

  } else {
    // ── 修改 ──────────────────────────────────────────────────────────────────

    const oldStart  = oldPtr;                                         // 本地偏移
    const oldEndPtr = findNextMacroPtrAddr(macroArea, code, oldPtr); // 下一宏指针
    const oldEnd    = oldEndPtr;                                      // 本地偏移
    const oldLen    = oldEnd - oldStart;
    const delta     = newLen - oldLen;

    if (delta > 0) {
      // 扩大：右移 [oldEnd, dataEnd)
      for (let i = dataEnd - 1; i >= oldEnd; i--) {
        macroArea[i + delta] = macroArea[i] ?? 0;
      }
    } else if (delta < 0) {
      // 缩小：左移 [oldEnd, dataEnd)
      for (let i = 0; i < dataEnd - oldEnd; i++) {
        macroArea[oldEnd + delta + i] = macroArea[oldEnd + i] ?? 0;
      }
      // 清空末尾多余部分
      for (let i = dataEnd + delta; i < dataEnd; i++) {
        macroArea[i] = 0;
      }
    }

    if (delta !== 0) {
      // 更新 ptr >= oldEnd 的其他宏指针
      for (let i = 0; i < MACRO_MAX_COUNT; i++) {
        if (i === code) continue;
        const ptr = readMacroPtrAddr(macroArea, i);
        if (ptr >= MACRO_DATA_PTR_MIN && ptr >= oldEnd) {
          writeMacroPtrAddr(macroArea, i, ptr + delta);
        }
      }
    }

    // 写入新数据（位置不变，仍从 oldStart 开始）
    for (let i = 0; i < newLen; i++) {
      macroArea[oldStart + i] = encodedBytes[i] ?? 0;
    }
  }

  // 4. 写回宏区
  const wCode: number = yield* writeMacroAreaDataGen(macroAreaOffset, 0, macroArea);
  if (wCode !== 0) {
    return { name: "setMacro", code: wCode, message: "write macro area failed" };
  }

  // 5. 若 attr.key 存在，更新 0x08 按键矩阵绑定
  if (attr.key !== undefined) {
    const profileStride    = KEY_LAYER_LENGTH * 4;
    const defaultLayerData = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND,
      config * profileStride,
      KEY_LAYER_LENGTH,
      DATA_LENGTH,
    );
    const keySlot = resolveKeySlotIndex(defaultLayerData, attr.key) ?? -1;
    if (keySlot < 0) {
      return { name: "setMacro", code: 3, message: `key "${attr.key}" not found in default layout` };
    }

    // stopType=1 → 0xFF；否则取 loop 值（1-254），0 时写 0
    const loopStopByte = attr.stopType === 1 ? 0xff
      : Math.min(254, Math.max(0, attr.loop));

    const keyOffset = config * profileStride + keySlot * KEY_ITEM_SIZE;
    const [kLo, kHi] = shiftFrom16Bit(keyOffset);
    const kChk = (kLo + kHi + KEY_ITEM_SIZE + 0x70 + code + loopStopByte) & 0xff;
    const wKeyIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
      kLo, kHi, 0x00,
      0x70, code, loopStopByte,
    ]);
    const kResult = parseWriteResponseCode(wKeyIn);
    if (kResult !== 0) {
      return { name: "setMacro", code: kResult, message: "write key binding to 0x08 failed" };
    }
  }

  return { name: "setMacro", code: 0 };
}

/**
 *
 * 删除指定宏
 *
 * 流程：
 *  1. 0x04 读取当前板载号
 *  2. 0x0c 读取该板载完整宏区（2048 字节）
 *  3. 按 code 取指针地址；< MACRO_DATA_PTR_MIN 或无数据则返回参数错误
 *  4. 仅 1 个宏：清空宏区，所有指针恢复 MACRO_EMPTY_PTR
 *  5. 多个宏：计算删除长度，被删指针恢复 MACRO_EMPTY_PTR，后续指针减长度，数据区前移
 *  6. 0x0d 写回宏区
 *
 */
export async function* delMacro(
  request: DelMacroParams,
): DeviceSession<DelMacroResult> {
  const macroIndex = request.code;
  if (!Number.isInteger(macroIndex) || macroIndex < 0 || macroIndex >= MACRO_MAX_COUNT) {
    return { name: "delMacro", code: 3, message: "code must be an integer between 0 and 31" };
  }

  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const macroAreaOffset = config * MACRO_AREA_SIZE;

  const macroArea: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_MACRO_COMMAND, macroAreaOffset, MACRO_AREA_SIZE, DATA_LENGTH,
  );

  const curAddr = readMacroPtrAddr(macroArea, macroIndex);
  if (curAddr === MACRO_EMPTY_PTR || curAddr < MACRO_DATA_PTR_MIN) {
    return { name: "delMacro", code: 3, message: `macro ${macroIndex} has no recorded data` };
  }

  const recorded = parseMacroListFromPointers(
    macroArea.slice(0, MACRO_PTR_REGION_SIZE),
  );

  if (recorded.length === 0) {
    return { name: "delMacro", code: 3, message: "no macro data in profile" };
  }

  let writeData: number[];

  if (recorded.length === 1) {
    // 仅一个宏：清空整个宏区，指针全部恢复 0x40,0x00
    writeData = buildEmptyMacroArea();
  } else {
    // 指针值 → 本地数组偏移
    const deleteStart = macroPtrToLocalOffset(curAddr);
    const nextPtr     = findNextMacroPtrAddr(macroArea, macroIndex, curAddr);
    const deleteEnd   = macroPtrToLocalOffset(nextPtr);
    const deleteLen   = deleteEnd - deleteStart;   // 纯长度，指针空间差等于字节长度
    if (deleteLen < 4 || deleteLen % 4 !== 0) {
      return { name: "delMacro", code: 3, message: "invalid macro data length" };
    }

    const dataEnd = getMacroDataEnd(macroArea); // 返回本地偏移

    // 被删宏指针恢复 MACRO_EMPTY_PTR
    writeMacroPtrAddr(macroArea, macroIndex, MACRO_EMPTY_PTR);

    // 后续宏指针值减去删除长度（指针空间里做偏移减法）
    for (let i = macroIndex + 1; i < MACRO_MAX_COUNT; i++) {
      const addr = readMacroPtrAddr(macroArea, i);
      if (addr !== MACRO_EMPTY_PTR && addr >= MACRO_DATA_PTR_MIN) {
        writeMacroPtrAddr(macroArea, i, addr - deleteLen);
      }
    }

    // 数据区前移： [deleteEnd, dataEnd) → [deleteStart, ...)
    for (let i = 0; i < dataEnd - deleteEnd; i++) {
      macroArea[deleteStart + i] = macroArea[deleteEnd + i] ?? 0;
    }
    for (let i = deleteStart + (dataEnd - deleteEnd); i < dataEnd; i++) {
      macroArea[i] = 0;
    }

    writeData = macroArea;
  }

  const wCode: number = yield* writeMacroAreaDataGen(macroAreaOffset, 0, writeData);
  if (wCode !== 0) return { name: "delMacro", code: wCode, message: "write macro area failed" };

  return { name: "delMacro", code: 0 };
}

/**
 *
 * 读取灯光模式
 *
 * 流程：
 *  1. 0x04 读取当前板载号（config_index）
 *  2. 0x05 以 config × 64 为偏移读取该板载功能配置区（一包 51 字节，灯光字段均在前 24 字节内）
 *  3. 从原始 inPacket 解析响应码与灯光字段
 *
 */
export async function* getLight(): DeviceSession<GetLightResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const boardOffset = config * 64;

  // 先做一次原始包读取用于 resCode 判断
  const checkPacket: InPacket = yield buildOutPacket(FLAG, getFuncPacketBytes(boardOffset, DATA_LENGTH));
  const resCode = parseWriteResponseCode(checkPacket);

  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, boardOffset, 64, DATA_LENGTH,
  );

  // LIGHT_*_OFFSET 常量以原始包位置为准（含 8 字节包头），funcData 已去头，故减 8
  const d = (offset: number) => funcData[offset] ?? 0;

  return {
    name: "getLight",
    code: resCode,
    data: {
      pattern:    d(LIGHT_PATTERN_OFFSET),
      brightness: d(LIGHT_BRIGHTNESS_OFFSET),
      speed:      d(LIGHT_SPEED_OFFSET),
      sleep:      0,
      isRGB:      d(LIGHT_IS_RGB_OFFSET),
      R:          d(LIGHT_R_OFFSET),
      G:          d(LIGHT_G_OFFSET),
      B:          d(LIGHT_B_OFFSET),
    },
  };
}

/**
 *
 * 设置灯光数据
 *
 * 流程：
 *  1. 0x04 读取当前板载号（config_index），计算 boardBase = config × 64
 *  2. 0x06 写入第 16-18 字节（pattern / brightness / speed）
 *  3. 0x06 写入第 20 字节（isRGB）
 *  4. 0x06 写入第 22-24 字节（R / G / B）
 *
 */
export async function* setLight(
  request: SetLightParams,
): DeviceSession<SetLightResult> {
  // 步骤一：读取当前板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const boardBase = config * 64;

  // 步骤二：写入 pattern / brightness / speed（第 16-18 字节，连续 3 字节）
  const seg1 = [request.pattern & 0xff, request.brightness & 0xff, request.speed & 0xff];
  const [s1lo, s1hi] = shiftFrom16Bit(boardBase + LIGHT_PATTERN_OFFSET);
  const s1size     = seg1.length;
  const s1checksum = (s1lo + s1hi + s1size + seg1.reduce((a, b) => a + b, 0)) & 0xff;
  const w1In: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, s1checksum, s1size,
    s1lo, s1hi, 0x00,
    ...seg1,
  ]);
  const w1Code = parseWriteResponseCode(w1In);
  if (w1Code !== 0) return { name: "setLight", code: w1Code, message: "write pattern/brightness/speed failed" };

  // 步骤三：写入 isRGB（第 20 字节）
  const isRGBByte = request.isRGB & 0xff;
  const [s2lo, s2hi] = shiftFrom16Bit(boardBase + LIGHT_IS_RGB_OFFSET);
  const s2size     = 1;
  const s2checksum = (s2lo + s2hi + s2size + isRGBByte) & 0xff;
  const w2In: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, s2checksum, s2size,
    s2lo, s2hi, 0x00,
    isRGBByte,
  ]);
  const w2Code = parseWriteResponseCode(w2In);
  if (w2Code !== 0) return { name: "setLight", code: w2Code, message: "write isRGB failed" };

  // 步骤四：写入 R / G / B（第 22-24 字节，连续 3 字节）
  const seg3 = [request.R & 0xff, request.G & 0xff, request.B & 0xff];
  const [s3lo, s3hi] = shiftFrom16Bit(boardBase + LIGHT_R_OFFSET);
  const s3size     = seg3.length;
  const s3checksum = (s3lo + s3hi + s3size + seg3.reduce((a, b) => a + b, 0)) & 0xff;
  const w3In: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, s3checksum, s3size,
    s3lo, s3hi, 0x00,
    ...seg3,
  ]);
  const w3Code = parseWriteResponseCode(w3In);
  if (w3Code !== 0) return { name: "setLight", code: w3Code, message: "write R/G/B failed" };

  return { name: "setLight", code: 0 };
}

/**
 *
 * 读取 DKS 快捷键列表
 *
 * 流程：
 *  1. 0x04 读取当前板载号（config）
 *  2. 0x08 读取该板载全部 4 层按键数据（4 × 512 字节），扫描类型为 0x90 的 DKS 按键
 *     - 0x90 第 2 字节 = DKS 条目索引（dksIndex）；第 1 字节（type）已确认为 0x90
 *     - 收集所有唯一 dksIndex 及其首次出现的 keySlot
 *  3. 0x07 读取该板载第 0 层默认按键数据（512 字节），用于解析 shortcuts[].code / name
 *  4. 0xa2 读取该板载 DKS 数据区（768 字节）
 *     - 无头部；条目 N 直接起始于 N × DKS_ENTRY_SIZE（24 字节）
 *     - 每条 24 字节：前 4 字节 = range，后 20 字节 = keys（4 × 5 字节）
 *  5. 组装 shortcuts 列表返回
 *
 */
export async function* getDKSList(): DeviceSession<GetDKSListResult> {
  // 步骤一：读取当前板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4; // 2048 字节 / 板载（4 层 × 512）

  // 步骤二：读取该板载全部 4 层 0x08 数据，扫描 0x90 类型按键
  const allLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  // dksIndex → 首次出现的 keySlot（在某层中的槽位索引）
  const dksMap = new Map<number, number>();
  for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
    const layerBase = layerIdx * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const base = layerBase + i * KEY_ITEM_SIZE;
      if ((allLayersData[base] ?? 0) === 0x90) {
        const dksIdx = allLayersData[base + 1] ?? 0;
        if (!dksMap.has(dksIdx)) dksMap.set(dksIdx, i);
      }
    }
  }

  if (dksMap.size === 0) {
    return { name: "getDKSList", code: 0, data: { shortcuts: [] } };
  }

  // 步骤三：读取该板载第 0 层 0x07 默认按键数据
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, config * profileSize, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  // 步骤四：读取该板载 0xa2 DKS 数据区（768 字节）
  const dksData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_DKS_COMMAND, config * DKS_AREA_SIZE, DKS_AREA_SIZE, DATA_LENGTH,
  );

  // 步骤五：组装 shortcuts（按 dksIndex 升序）
  const shortcuts: DKSShortcut[] = [];
  const sortedEntries = [...dksMap.entries()].sort((a, b) => a[0] - b[0]);

  for (const [dksIdx, keySlot] of sortedEntries) {
    // 从 0x07 解析该槽位的 HID code 和按键名
    const defBase  = keySlot * KEY_ITEM_SIZE;
    const hidCode  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[defBase] ?? 0,
      rawDefaultData[defBase + 1] ?? 0,
      rawDefaultData[defBase + 2] ?? 0,
    );
    const keyName  = resolveKeyNameByCode(hidCode, KEY_RETURN_ORDER[keySlot] ?? `K${keySlot}`);

    // 条目 N 直接起始于 N × DKS_ENTRY_SIZE（无头部）
    const entryBase = dksIdx * DKS_ENTRY_SIZE;

    // 前 4 字节：range
    const range: number[] = [
      dksData[entryBase + 0] ?? 0,
      dksData[entryBase + 1] ?? 0,
      dksData[entryBase + 2] ?? 0,
      dksData[entryBase + 3] ?? 0,
    ];

    // 后 20 字节：keys（4 × 5 字节），5 字节结构为 [type, ext, code, rangeB0, rangeB1]
    const keys: DKSKeyItem[] = [];
    for (let k = 0; k < 4; k++) {
      const kBase = entryBase + 4 + k * 5;
      const b0 = dksData[kBase] ?? 0;     // type byte
      const b1 = dksData[kBase + 1] ?? 0; // ext byte
      const b2 = dksData[kBase + 2] ?? 0; // code byte
      const b3 = dksData[kBase + 3] ?? 0; // range 原始字节 0
      const b4 = dksData[kBase + 4] ?? 0; // range 原始字节 1

      const kHidCode = resolveHidCodeFromDefaultKeyTriplet(b0, b1, b2);
      if (kHidCode === 0) continue;
      const kName    = resolveKeyNameByCode(kHidCode, `K${k}`);
      keys.push({
        type:  convertKeyTypeForOutput(b0, b2),
        code:  kHidCode,
        key:   kName,
        range: parseDKSKeyRange(b3, b4),
      });
    }

    shortcuts.push({
      type:            5,
      code:            hidCode,
      name:            String(dksIdx),
      simulation:      1,
      simulationRange: [200, 200],
      range,
      keys,
    });
  }

  return { name: "getDKSList", code: 0, data: { shortcuts } };
}

/**
 *
 * 获取设备全部 TGL 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载（config），不使用 layer
 *  2. 0x08 读取该板载 4 层数据，扫描 0x91 类型：[0x91, tglIdx, 0x00]
 *  3. 0x07 读取该板载第 0 层默认矩阵，用 0x08 中 0x91 所在槽位取 keys[0]（各层均对应同一 0x07 默认层）
 *  4. 0xa6 按 tglIdx（第 2 字节）× 3 读取功能区 3 字节，解析为 keys[1]
 *
 * pageNo / pageSize 暂不做分页处理。
 *
 */
export async function* getTGLList(
  _request: GetTGLListParams,
): DeviceSession<GetTGLListResult> {
  // 步骤一：读取当前板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // 步骤二：读取 0x08 全 4 层，建立 tglIdx → 首次出现的 { layerIdx, keySlot } 映射
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  const slotMap = new Map<number, { layerIdx: number; keySlot: number }>();
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) !== 0x91) continue;
      const idx = rawAllLayersData[b + 1] ?? 0;
      if (!slotMap.has(idx)) slotMap.set(idx, { layerIdx: li, keySlot: i });
    }
  }

  if (slotMap.size === 0) {
    return { name: "getTGLList", code: 0, data: { len: 0, tgl: [] } };
  }

  // 步骤三：对每个 tglIdx 逐条读取 0xa6 功能键数据 + 0x07 绑定键（带层缓存）
  const defaultLayerCache = new Map<number, number[]>();
  const getDefaultLayer = async function* (li: number): AsyncGenerator<OutPacket, number[], InPacket> {
    if (!defaultLayerCache.has(li)) {
      const off = li * KEY_LAYER_LENGTH + config * profileSize;
      const data: number[] = yield* readChunkedDataByCommandGen(
        FLAG, GET_KEY_DEFAULT_COMMAND, off, KEY_LAYER_LENGTH, DATA_LENGTH,
      );
      defaultLayerCache.set(li, data);
    }
    return defaultLayerCache.get(li)!;
  };

  const sortedIndices = [...slotMap.keys()].sort((a, b) => a - b);
  const tgl: TGLEntry[] = [];

  for (const tglIdx of sortedIndices) {
    const slot = slotMap.get(tglIdx)!;

    // 读取 0xa6 该索引的 3 字节
    const entryData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_TGL_COMMAND,
      config * TGL_AREA_SIZE + tglIdx * TGL_ENTRY_SIZE,
      TGL_ENTRY_SIZE,
      DATA_LENGTH,
    );
    const funcKey = parseTGLKeyFromTriplet(
      entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0,
      `TGL${tglIdx}`,
    );

    // 读取 0x07 绑定键默认定义
    const rawDefault = yield* getDefaultLayer(slot.layerIdx);
    const db         = slot.keySlot * KEY_ITEM_SIZE;
    const boundKey   = parseTGLKeyFromTriplet(
      rawDefault[db] ?? 0, rawDefault[db + 1] ?? 0, rawDefault[db + 2] ?? 0,
      KEY_RETURN_ORDER[slot.keySlot] ?? `K${slot.keySlot}`,
    );

    tgl.push({ type: 10, code: tglIdx, keys: [boundKey, funcKey] });
  }

  return { name: "getTGLList", code: 0, data: { len: tgl.length, tgl } };
}

/**
 *
 * 读取指定 TGL 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载号（config）
 *  2. 0xa6 以 config × TGL_AREA_SIZE + code × 3 读取 3 字节 TGL 功能键定义 → keys[1]
 *  3. 0x08 读取该板载全部 4 层，扫描 0x91 且索引 = request.code 的槽位 → 绑定按键
 *  4. 0x07 读取绑定槽位所在层的默认键定义 → keys[0]
 *
 */
export async function* getTGL(
  request: GetTGLParams,
): DeviceSession<GetTGLResult> {
  const emptyData = (code: number): TGLEntry => ({ type: 10, code, keys: [] });

  if (request.type !== 10) {
    return { name: "getTGL", code: 3, data: emptyData(request.code), message: "type must be 10 (TGL)" };
  }

  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // ── 0xa6：code × 3 → TGL 功能键（keys[1]）───────────────────────────────
  const entryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_TGL_COMMAND,
    config * TGL_AREA_SIZE + request.code * TGL_ENTRY_SIZE,
    TGL_ENTRY_SIZE,
    DATA_LENGTH,
  );
  // 首字节为 0 表示该索引不存在，直接返回空 keys
  if ((entryData[0] ?? 0) === 0) {
    return { name: "getTGL", code: 0, data: emptyData(request.code) };
  }
  const funcKey = parseTGLKeyFromTriplet(
    entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0,
    `TGL${request.code}`,
  );

  // ── 0x08：全 4 层扫描 0x91，找索引 = request.code 的绑定槽位 ────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  let boundKeySlot  = -1;
  let boundLayerIdx = -1;
  outer: for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
    const layerBase = layerIdx * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = layerBase + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x91 && (rawAllLayersData[b + 1] ?? 0) === request.code) {
        boundKeySlot  = i;
        boundLayerIdx = layerIdx;
        break outer;
      }
    }
  }

  if (boundKeySlot < 0) {
    return { name: "getTGL", code: 0, data: emptyData(request.code) };
  }

  // ── 0x07：绑定槽位所在层的默认键 → keys[0] ───────────────────────────────
  const layerOffset = boundLayerIdx * KEY_LAYER_LENGTH + config * profileSize;
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );
  const defBase  = boundKeySlot * KEY_ITEM_SIZE;
  const boundKey = parseTGLKeyFromTriplet(
    rawDefaultData[defBase] ?? 0, rawDefaultData[defBase + 1] ?? 0, rawDefaultData[defBase + 2] ?? 0,
    KEY_RETURN_ORDER[boundKeySlot] ?? `K${boundKeySlot}`,
  );

  return {
    name: "getTGL",
    code: 0,
    data: { type: 10, code: request.code, keys: [boundKey, funcKey] },
  };
}

/**
 *
 * 设置指定 TGL 高级按键
 *
 * 流程：
 *  1. 验证 type===10，keys[0]（绑定键）与 keys[1]（TGL 数据）均存在
 *  2. 0x04/0x05 读取板载（config）与层（layer）
 *  3. 0x08 全 4 层扫描 0x91：
 *     - 找到 tglIdx = request.code 的已有绑定 → 修改模式
 *       a. 读 0x07 旧槽位默认值 → 0x09 恢复旧槽位
 *     - 找不到 → 新增模式
 *  4. 0x07 按 keys[0].code 找新 keySlot → 0x09 写 [0x91, request.code, 0x00]
 *  5. 0xa7 以 request.code × TGL_ENTRY_SIZE 写入 keys[1] 三字节
 *
 */
export async function* setTGL(
  request: SetTGLParams,
): DeviceSession<SetTGLResult> {
  if (request.type !== 10) {
    return { name: "setTGL", code: 3, message: "type must be 10 (TGL)" };
  }
  const bindKey = request.keys[0];
  const funcKey = request.keys[1];
  if (!bindKey || !Number.isInteger(bindKey.code)) {
    return { name: "setTGL", code: 3, message: "keys[0] (bind key) is required" };
  }
  if (!funcKey || !Number.isInteger(funcKey.code)) {
    return { name: "setTGL", code: 3, message: "keys[1] (TGL data) is required" };
  }

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize    = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：查找已绑定 request.code 的旧槽位 ───────────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  let oldKeySlot  = -1;
  let oldLayerIdx = -1;
  outer: for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x91 && (rawAllLayersData[b + 1] ?? 0) === request.code) {
        oldKeySlot  = i;
        oldLayerIdx = li;
        break outer;
      }
    }
  }

  const isModify = oldKeySlot >= 0;

  // ── 修改模式：读 0x07 旧槽位默认值 → 0x09 恢复旧槽位 ──────────────────────
  if (isModify) {
    const oldLayerOffset = oldLayerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawOldDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, oldLayerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const odb = oldKeySlot * KEY_ITEM_SIZE;
    const odType = rawOldDefault[odb] ?? 0x10;
    const odExt  = rawOldDefault[odb + 1] ?? 0x00;
    const odCode = rawOldDefault[odb + 2] ?? 0x00;
    const restoreOff = allLayersOffset + oldLayerIdx * KEY_LAYER_LENGTH + oldKeySlot * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(restoreOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + odType + odExt + odCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      odType, odExt, odCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "setTGL", code: wRestoreCode, message: "restore old bind key failed" };
  }

  // ── 0x07 当前局部层：按 keys[0].code 找新 keySlot ────────────────────────
  const layerOffset    = layer * KEY_LAYER_LENGTH + config * profileSize;
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let newKeySlot = -1;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0, rawDefaultData[base + 1] ?? 0, rawDefaultData[base + 2] ?? 0,
    );
    if (hid === bindKey.code) { newKeySlot = i; break; }
  }
  if (newKeySlot < 0) {
    return { name: "setTGL", code: 3, message: "bind key not found in default matrix" };
  }

  // ── 0x09：新 keySlot 写 [0x91, request.code, 0x00] ───────────────────────
  const keyWriteOff = layerOffset + newKeySlot * KEY_ITEM_SIZE;
  const [kLo, kHi]  = shiftFrom16Bit(keyWriteOff);
  const kChk = (kLo + kHi + KEY_ITEM_SIZE + 0x91 + request.code + 0x00) & 0xff;
  const wKeyIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
    kLo, kHi, 0x00,
    0x91, request.code, 0x00,
  ]);
  const wKeyCode = parseWriteResponseCode(wKeyIn);
  if (wKeyCode !== 0) return { name: "setTGL", code: wKeyCode, message: "write key TGL definition failed" };

  // ── 0xa7：request.code × 3 写入 keys[1] TGL 功能数据 ─────────────────────
  const entryData     = [...encodeTGLKeyToTriplet(funcKey)];
  const advAreaOffset = config * TGL_AREA_SIZE;
  const writeOff      = advAreaOffset + request.code * TGL_ENTRY_SIZE;
  const [wLo, wHi]    = shiftFrom16Bit(writeOff);
  const wChk = (wLo + wHi + TGL_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
  const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
    SET_TGL_COMMAND, 0x00, wChk, TGL_ENTRY_SIZE,
    wLo, wHi, 0x00,
    ...entryData,
  ]);
  const wAdvCode = parseWriteResponseCode(wAdvIn);
  if (wAdvCode !== 0) return { name: "setTGL", code: wAdvCode, message: "write TGL entry failed" };

  return { name: "setTGL", code: 0 };
}

/**
 *
 * 读取指定 DKS 高级按键
 *
 * 流程：
 *  1. 0x04/0x05 读取板载（config）与层（layer）
 *  2. 0x07 读取默认层，按 HID code 找 keySlot（遵循板载 + layer 偏移）
 *  3. 0x08 读取当前层，确认该槽位为 0x90 类型，取 dksIdx（第 2 字节）
 *  4. 0xa2 以 config × DKS_AREA_SIZE 为板载偏移，读取第 dksIdx 条目（24 字节）
 *  5. 解析条目：前 4 字节 = range，后 20 字节 = keys（4 × 5 字节）
 *
 */
export async function* getDKS(
  request: GetDKSParams,
): DeviceSession<GetDKSResult> {
  // ── 步骤一：板载 / 层 ──────────────────────────────────────────────────────
  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  // ── 步骤二：0x07 默认层 → keySlot（按 HID code 匹配）────────────────────
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let keySlot = -1;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0,
      rawDefaultData[base + 1] ?? 0,
      rawDefaultData[base + 2] ?? 0,
    );
    if (hid === request.code) { keySlot = i; break; }
  }
  if (keySlot < 0) {
    return { name: "getDKS", code: 3, data: { type: 5, code: request.code, name: "", simulation: 1, simulationRange: [200, 200], range: [], keys: [] }, message: "key not found in default matrix" };
  }

  // ── 步骤三：0x08 当前层 → 确认 0x90 类型，取 dksIdx ──────────────────────
  const allLayersOffset = config * profileSize;
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  const curLayerBase = layer * KEY_LAYER_LENGTH;
  const keyBase      = curLayerBase + keySlot * KEY_ITEM_SIZE;
  const rawType      = rawAllLayersData[keyBase] ?? 0;

  if (rawType !== 0x90) {
    return { name: "getDKS", code: 3, data: { type: 5, code: request.code, name: "", simulation: 1, simulationRange: [200, 200], range: [], keys: [] }, message: `key at slot ${keySlot} is not DKS (type=0x${rawType.toString(16)})` };
  }
  const dksIdx = rawAllLayersData[keyBase + 1] ?? 0;

  // ── 步骤四：0xa2 读取该 DKS 条目（遵循板载偏移）──────────────────────────
  const advAreaOffset = config * DKS_AREA_SIZE;
  const entryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_DKS_COMMAND,
    advAreaOffset + dksIdx * DKS_ENTRY_SIZE,
    DKS_ENTRY_SIZE,
    DATA_LENGTH,
  );

  // ── 步骤五：解析条目 ───────────────────────────────────────────────────────
  const defBase  = keySlot * KEY_ITEM_SIZE;
  const hidCode  = resolveHidCodeFromDefaultKeyTriplet(
    rawDefaultData[defBase] ?? 0,
    rawDefaultData[defBase + 1] ?? 0,
    rawDefaultData[defBase + 2] ?? 0,
  );
  const keyName  = resolveKeyNameByCode(hidCode, KEY_RETURN_ORDER[keySlot] ?? `K${keySlot}`);

  // 前 4 字节：range
  const range: number[] = [
    entryData[0] ?? 0,
    entryData[1] ?? 0,
    entryData[2] ?? 0,
    entryData[3] ?? 0,
  ];

  // 后 20 字节：keys（4 × 5 字节：[type, ext, code, rangeB0, rangeB1]）
  const keys: DKSKeyItem[] = [];
  for (let k = 0; k < 4; k++) {
    const kBase    = 4 + k * 5;
    const rawType  = entryData[kBase] ?? 0;
    const rawCode  = entryData[kBase + 2] ?? 0;
    const kHidCode = resolveHidCodeFromDefaultKeyTriplet(
      rawType,
      entryData[kBase + 1] ?? 0,
      rawCode,
    );
    if (kHidCode === 0) continue;
    const kName    = resolveKeyNameByCode(kHidCode, `K${k}`);
    keys.push({
      type:  convertKeyTypeForOutput(rawType, rawCode),
      code:  kHidCode,
      key:   kName,
      range: parseDKSKeyRange(entryData[kBase + 3] ?? 0, entryData[kBase + 4] ?? 0),
    });
  }

  return {
    name: "getDKS",
    code: 0,
    data: {
      type:            5,
      code:            hidCode,
      name:            `DKS-${dksIdx}`,
      simulation:      1,
      simulationRange: [200, 200],
      range,
      keys,
    },
  };
}

/**
 *
 * 设置指定 DKS 高级按键
 *
 * 流程：
 *  1. 验证 type === 5
 *  2. 0x04/0x05 读取板载（config）与层（layer）
 *  3. 0x07 读取默认层，按 HID code 找到 keySlot
 *  4. 0x08 读取该板载 4 层，扫描全部 0x90 取最大 dksIdx；当前层该槽位：
 *     - 已是 0x90 → 复用已有 dksIdx（更新）
 *     - 否则 → dksIdx = 无 DKS 时为 0，否则 maxDksIdx + 1
 *  5. 将 request.range（4 字节）与 request.keys（4 × 5 字节）编码为 24 字节
 *  6. 0xa3 将 24 字节写入 (config × DKS_AREA_SIZE + dksIdx × DKS_ENTRY_SIZE)
 *  7. 若是新条目：0x09 将 keySlot 处写为 [0x90, dksIdx, 0x00]
 *
 */
export async function* setDKS(
  request: SetDKSParams,
): DeviceSession<SetDKSResult> {
  if (request.type !== 5) {
    return { name: "setDKS", code: 3, message: "type must be 5 (DKS)" };
  }

  // ── 步骤一：板载 / 层 ───────────────────────────────────────────────────────
  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  // ── 步骤二：0x07 默认层 → keySlot（按 HID code 匹配）────────────────────
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let keySlot = -1;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0,
      rawDefaultData[base + 1] ?? 0,
      rawDefaultData[base + 2] ?? 0,
    );
    if (hid === request.code) { keySlot = i; break; }
  }
  if (keySlot < 0) {
    return { name: "setDKS", code: 3, message: "key not found in default matrix" };
  }

  // ── 步骤三：0x08 全板载 4 层 → 扫描 0x90 取最大 dksIdx，判断新建/更新 ───
  const allLayersOffset = config * profileSize;
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  let maxDksIdx = -1;
  for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
    const layerBase = layerIdx * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = layerBase + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x90) {
        maxDksIdx = Math.max(maxDksIdx, rawAllLayersData[b + 1] ?? 0);
      }
    }
  }

  const curLayerBase = layer * KEY_LAYER_LENGTH;
  const keyBase      = curLayerBase + keySlot * KEY_ITEM_SIZE;
  const rawType      = rawAllLayersData[keyBase] ?? 0;

  let dksIdx:     number;
  let isNewEntry: boolean;

  if (rawType === 0x90) {
    dksIdx     = rawAllLayersData[keyBase + 1] ?? 0;
    isNewEntry = false;
  } else {
    dksIdx     = maxDksIdx < 0 ? 0 : maxDksIdx + 1;
    isNewEntry = true;
  }

  // ── 步骤四：编码 24 字节 DKS 条目 ─────────────────────────────────────────
  // 前 4 字节：request.range（直接写入）
  const rangeBytes = [
    (request.range[0] ?? 0) & 0xff,
    (request.range[1] ?? 0) & 0xff,
    (request.range[2] ?? 0) & 0xff,
    (request.range[3] ?? 0) & 0xff,
  ];

  // 后 20 字节：4 个子按键，每个 5 字节 [type=0x10, ext=0x00, code, rangeB0, rangeB1]
  const keyBytes: number[] = [];
  for (let k = 0; k < 4; k++) {
    const ki = request.keys[k];
    if (!ki || ki.code === 0) {
      keyBytes.push(0x00, 0x00, 0x00, 0x00, 0x00);
    } else {
      const [rb0, rb1] = encodeDKSKeyRange(ki.range ?? []);
      keyBytes.push(0x10, 0x00, ki.code & 0xff, rb0, rb1);
    }
  }

  const entryData = [...rangeBytes, ...keyBytes]; // 4 + 20 = 24 字节

  // ── 步骤五：0xa3 写入 DKS 条目 ────────────────────────────────────────────
  const advAreaOffset = config * DKS_AREA_SIZE;
  const writeOff      = advAreaOffset + dksIdx * DKS_ENTRY_SIZE;
  const [wLo, wHi]    = shiftFrom16Bit(writeOff);
  const wChk = (wLo + wHi + DKS_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
  const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
    SET_DKS_COMMAND, 0x00, wChk, DKS_ENTRY_SIZE,
    wLo, wHi, 0x00,
    ...entryData,
  ]);
  const wAdvCode = parseWriteResponseCode(wAdvIn);
  if (wAdvCode !== 0) return { name: "setDKS", code: wAdvCode, message: "write DKS entry failed" };

  // ── 步骤六：新条目 → 0x09 将 keySlot 写为 [0x90, dksIdx, 0x00] ──────────
  if (isNewEntry) {
    const keyWriteOff   = layerOffset + keySlot * KEY_ITEM_SIZE;
    const [kLo, kHi]    = shiftFrom16Bit(keyWriteOff);
    const kChk = (kLo + kHi + KEY_ITEM_SIZE + 0x90 + dksIdx + 0x00) & 0xff;
    const wKeyIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
      kLo, kHi, 0x00,
      0x90, dksIdx, 0x00,
    ]);
    const wKeyCode = parseWriteResponseCode(wKeyIn);
    if (wKeyCode !== 0) return { name: "setDKS", code: wKeyCode, message: "write key DKS definition failed" };
  }

  return { name: "setDKS", code: 0 };
}

/**
 *
 * 删除指定 DKS 快捷键
 *
 * 流程：
 *  1. 0x04/0x05 读取板载（config）与层（layer）
 *  2. 0x07 读取默认层，按 HID code 找到 keySlot
 *     （LEFTCTRL / FN1 等通过 resolveHidCodeFromDefaultKeyTriplet 三字节匹配）
 *  3. 0x08 读取全板载4层，确认 keySlot 处类型为 0x90，取 dksIdx（第2字节）
 *  4. 收集该板载全部 4 层所有 0x90 按键，按 dksIdx 升序排列，得 totalDks
 *  5. 0x09 将该按键恢复为默认定义
 *  6. 0x09 将全部 4 层中 dksIdx > 被删条目 的其他 0x90 按键索引各减 1
 *  7. 0xa2 读取 aDksIdx+1 ~ totalDks-1 的条目，依次写到 aDksIdx ~ totalDks-2
 *  8. 0xa2 清零最后一个条目（totalDks-1）
 *
 */
export async function* delDKS(
  request: DelDKSParams,
): DeviceSession<DelDKSResult> {
  // ── 步骤一：读取板载（config）与层（layer）──────────────────────────────────
  // layer 有传参时使用传参，否则从 0x05 读设备当前层
  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  // ── 步骤二：0x07 默认层 → keySlot（按 HID code 匹配）────────────────────
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let keySlot = -1;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0,
      rawDefaultData[base + 1] ?? 0,
      rawDefaultData[base + 2] ?? 0,
    );
    if (hid === request.code) { keySlot = i; break; }
  }
  if (keySlot < 0) {
    return { name: "delDKS", code: 3, message: "key not found in default matrix" };
  }

  // ── 步骤三：0x08 全板载4层 → 确认 0x90 类型，获取 dksIdx ─────────────────
  const allLayersOffset = config * profileSize;
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  const curLayerBase = layer * KEY_LAYER_LENGTH;
  const keyBase      = curLayerBase + keySlot * KEY_ITEM_SIZE;
  const rawType      = rawAllLayersData[keyBase] ?? 0;

  if (rawType !== 0x90) {
    return { name: "delDKS", code: 3, message: `key at slot ${keySlot} is not DKS (type=0x${rawType.toString(16)})` };
  }
  const aDksIdx = rawAllLayersData[keyBase + 1] ?? 0;

  // ── 步骤四：收集该板载全部 4 层所有 0x90 按键，按 dksIdx 升序 ───────────
  type DksEntry = { layerIdx: number; keyI: number; dksIdx: number };
  const dksEntries: DksEntry[] = [];
  for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
    const layerBase = layerIdx * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = layerBase + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x90) {
        dksEntries.push({
          layerIdx,
          keyI: i,
          dksIdx: rawAllLayersData[b + 1] ?? 0,
        });
      }
    }
  }
  dksEntries.sort((a, b) => a.dksIdx - b.dksIdx);
  const totalDks = dksEntries.length > 0
    ? Math.max(...dksEntries.map((e) => e.dksIdx)) + 1
    : 0;

  // ── 步骤五：0x09 将该按键恢复为默认定义 ────────────────────────────────────
  const defBase   = keySlot * KEY_ITEM_SIZE;
  const defType   = rawDefaultData[defBase]     ?? 0x10;
  const defExt    = rawDefaultData[defBase + 1] ?? 0x00;
  const defCode   = rawDefaultData[defBase + 2] ?? 0x00;
  const [r1Lo, r1Hi] = shiftFrom16Bit(layerOffset + keySlot * KEY_ITEM_SIZE);
  const r1Chk = (r1Lo + r1Hi + KEY_ITEM_SIZE + defType + defExt + defCode) & 0xff;
  const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_CURRENT_COMMAND, 0x00, r1Chk, KEY_ITEM_SIZE,
    r1Lo, r1Hi, 0x00,
    defType, defExt, defCode,
  ]);
  const wRestoreCode = parseWriteResponseCode(wRestoreIn);
  if (wRestoreCode !== 0) return { name: "delDKS", code: wRestoreCode, message: "restore key def failed" };

  // ── 步骤六：0x09 全部 4 层中 dksIdx > aDksIdx 的其他 0x90 按键索引各减 1 ─
  for (const entry of dksEntries) {
    if (entry.layerIdx === layer && entry.keyI === keySlot) continue;
    if (entry.dksIdx <= aDksIdx)                         continue;
    const newIdx   = entry.dksIdx - 1;
    const writeOff = allLayersOffset + entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const [sLo, sHi] = shiftFrom16Bit(writeOff);
    const sChk = (sLo + sHi + KEY_ITEM_SIZE + 0x90 + newIdx + 0x00) & 0xff;
    const wShiftIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, sChk, KEY_ITEM_SIZE,
      sLo, sHi, 0x00,
      0x90, newIdx, 0x00,
    ]);
    const wShiftCode = parseWriteResponseCode(wShiftIn);
    if (wShiftCode !== 0) return { name: "delDKS", code: wShiftCode, message: "shift key index failed" };
  }

  // ── 步骤七：0xa2 平移条目：aDksIdx+1 ~ totalDks-1 → aDksIdx ~ totalDks-2 ─
  const advAreaOffset = config * DKS_AREA_SIZE;
  const moveCount     = totalDks - 1 - aDksIdx;

  if (moveCount > 0) {
    const partialData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_DKS_COMMAND,
      advAreaOffset + (aDksIdx + 1) * DKS_ENTRY_SIZE,
      moveCount * DKS_ENTRY_SIZE,
      DATA_LENGTH,
    );
    for (let i = 0; i < moveCount; i++) {
      const entryData = partialData.slice(i * DKS_ENTRY_SIZE, (i + 1) * DKS_ENTRY_SIZE);
      const writeOff  = advAreaOffset + (aDksIdx + i) * DKS_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(writeOff);
      const wChk = (wLo + wHi + DKS_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
      const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
        SET_DKS_COMMAND, 0x00, wChk, DKS_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...entryData,
      ]);
      const wAdvCode = parseWriteResponseCode(wAdvIn);
      if (wAdvCode !== 0) return { name: "delDKS", code: wAdvCode, message: `shift DKS entry ${i} failed` };
    }
  }

  // ── 步骤八：0xa2 清零末尾条目（totalDks-1）────────────────────────────────
  const clearOff  = advAreaOffset + (totalDks - 1) * DKS_ENTRY_SIZE;
  const [cLo, cHi] = shiftFrom16Bit(clearOff);
  const clearData  = new Array<number>(DKS_ENTRY_SIZE).fill(0);
  const cChk = (cLo + cHi + DKS_ENTRY_SIZE) & 0xff;
  const wClearIn: InPacket = yield buildOutPacket(FLAG, [
    SET_DKS_COMMAND, 0x00, cChk, DKS_ENTRY_SIZE,
    cLo, cHi, 0x00,
    ...clearData,
  ]);
  const wClearCode = parseWriteResponseCode(wClearIn);
  if (wClearCode !== 0) return { name: "delDKS", code: wClearCode, message: "clear last DKS entry failed" };

  return { name: "delDKS", code: 0 };
}

/**
 *
 * 删除指定 TGL 高级按键
 *
 * 流程：
 *  1. 0x04/0x05 读取板载（config）与层（layer，全局层换算为局部层）
 *  2. 0x07 读取当前局部层默认矩阵，按 HID code 找到 keySlot
 *  3. 0x08 读取当前层，确认 keySlot 处类型为 0x91，取 tglIdx（第2字节）
 *  4. 收集该板载全部 4 层所有 0x91 按键，按 tglIdx 升序排列
 *  5. 0x09 将该按键恢复为 0x07 同局部层默认定义
 *  6. 0x09 将全部 4 层中 tglIdx > 被删条目 的其他 0x91 按键索引各减 1
 *  7. 0xa6 读取 tglIdx+1 ~ totalTgl-1 的条目，依次写到 tglIdx ~ totalTgl-2
 *  8. 0xa7 清零最后一个条目（totalTgl-1）
 *
 */
export async function* delTGL(
  request: DelTGLParams,
): DeviceSession<DelTGLResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const profileSize    = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：收集所有 0x91 条目 ─────────────────────────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  type TglKEntry = { layerIdx: number; keyI: number; tglIdx: number };
  const tglEntries: TglKEntry[] = [];
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x91) {
        tglEntries.push({ layerIdx: li, keyI: i, tglIdx: rawAllLayersData[b + 1] ?? 0 });
      }
    }
  }

  // 找到绑定 request.code 的所有槽位（可能跨多层）
  const targets = tglEntries.filter((e) => e.tglIdx === request.code);
  if (targets.length === 0) {
    return { name: "delTGL", code: 3, message: `TGL index ${request.code} not found in key matrix` };
  }

  const totalTgl = Math.max(...tglEntries.map((e) => e.tglIdx)) + 1;

  // ── 0x09 恢复所有绑定该 code 的按键为 0x07 默认值 ────────────────────────
  for (const entry of targets) {
    const layerOffset = entry.layerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const db      = entry.keyI * KEY_ITEM_SIZE;
    const dType   = rawDefault[db] ?? 0x10;
    const dExt    = rawDefault[db + 1] ?? 0x00;
    const dCode   = rawDefault[db + 2] ?? 0x00;
    const rOff    = allLayersOffset + entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + dType + dExt + dCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      dType, dExt, dCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "delTGL", code: wRestoreCode, message: "restore key def failed" };
  }

  // ── 0x09 将 tglIdx > request.code 的 0x91 按键索引各减 1 ─────────────────
  for (const entry of tglEntries) {
    if (entry.tglIdx <= request.code) continue;
    const newIdx  = entry.tglIdx - 1;
    const sOff    = allLayersOffset + entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const [sLo, sHi] = shiftFrom16Bit(sOff);
    const sChk = (sLo + sHi + KEY_ITEM_SIZE + 0x91 + newIdx + 0x00) & 0xff;
    const wShiftIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, sChk, KEY_ITEM_SIZE,
      sLo, sHi, 0x00,
      0x91, newIdx, 0x00,
    ]);
    const wShiftCode = parseWriteResponseCode(wShiftIn);
    if (wShiftCode !== 0) return { name: "delTGL", code: wShiftCode, message: "shift key index failed" };
  }

  // ── 0xa7 平移：code+1 ~ totalTgl-1 → code ~ totalTgl-2 ───────────────────
  const advAreaOffset = config * TGL_AREA_SIZE;
  const moveCount     = totalTgl - 1 - request.code;

  if (moveCount > 0) {
    const partialData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_TGL_COMMAND,
      advAreaOffset + (request.code + 1) * TGL_ENTRY_SIZE,
      moveCount * TGL_ENTRY_SIZE,
      DATA_LENGTH,
    );
    for (let i = 0; i < moveCount; i++) {
      const eData  = partialData.slice(i * TGL_ENTRY_SIZE, (i + 1) * TGL_ENTRY_SIZE);
      const wOff   = advAreaOffset + (request.code + i) * TGL_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(wOff);
      const wChk = (wLo + wHi + TGL_ENTRY_SIZE + eData.reduce((s, v) => s + v, 0)) & 0xff;
      const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
        SET_TGL_COMMAND, 0x00, wChk, TGL_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...eData,
      ]);
      const wAdvCode = parseWriteResponseCode(wAdvIn);
      if (wAdvCode !== 0) return { name: "delTGL", code: wAdvCode, message: `shift TGL entry ${i} failed` };
    }
  }

  // ── 0xa7 清零末尾（totalTgl-1）────────────────────────────────────────────
  const clearOff  = advAreaOffset + (totalTgl - 1) * TGL_ENTRY_SIZE;
  const [cLo, cHi] = shiftFrom16Bit(clearOff);
  const clearData  = new Array<number>(TGL_ENTRY_SIZE).fill(0);
  const cChk = (cLo + cHi + TGL_ENTRY_SIZE) & 0xff;
  const wClearIn: InPacket = yield buildOutPacket(FLAG, [
    SET_TGL_COMMAND, 0x00, cChk, TGL_ENTRY_SIZE,
    cLo, cHi, 0x00,
    ...clearData,
  ]);
  const wClearCode = parseWriteResponseCode(wClearIn);
  if (wClearCode !== 0) return { name: "delTGL", code: wClearCode, message: "clear last TGL entry failed" };

  return { name: "delTGL", code: 0 };
}

/**
 *
 * 获取设备全部 MT 高级按键列表
 *
 * 流程：
 *  1. 0x04 读取板载（config）
 *  2. 0x08 读取该板载 4 层数据，扫描 0x92 类型：[0x92, mtIdx, time]
 *     - mtIdx（第 2 字节）= 数据区索引；time（第 3 字节）= 时间参数
 *     - 同一 mtIdx 只取首次出现的 time
 *  3. 0xa4 按 mtIdx × 6 读取 6 字节功能区：前 3 字节 → keys[0]，后 3 字节 → keys[1]
 *
 */
export async function* getMTList(
  _request: GetMTListParams,
): DeviceSession<GetMTListResult> {
  // 步骤一：读取当前板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // 步骤二：读取该板载全部 4 层 0x08 数据，扫描 0x92 类型按键
  const allLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  // mtIdx → 首次出现的 { keySlot, time }
  const mtMap = new Map<number, { keySlot: number; time: number }>();
  for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
    const layerBase = layerIdx * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const base = layerBase + i * KEY_ITEM_SIZE;
      if ((allLayersData[base] ?? 0) !== 0x92) continue;
      const mtIdx = allLayersData[base + 1] ?? 0;
      const time  = allLayersData[base + 2] ?? 0;
      if (!mtMap.has(mtIdx)) mtMap.set(mtIdx, { keySlot: i, time });
    }
  }

  if (mtMap.size === 0) {
    return { name: "getMTList", code: 0, data: { len: 0, mt: [] } };
  }

  // 步骤三：对每个 mtIdx 读取 0xa4 功能键
  const mt: MTEntry[] = [];
  const sortedEntries = [...mtMap.entries()].sort((a, b) => a[0] - b[0]);

  for (const [mtIdx, { keySlot, time }] of sortedEntries) {
    const entryData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_MT_COMMAND,
      config * MT_AREA_SIZE + mtIdx * MT_ENTRY_SIZE,
      MT_ENTRY_SIZE,
      DATA_LENGTH,
    );
    const key0 = parseMTKeyFromTriplet(
      entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0,
      KEY_RETURN_ORDER[keySlot] ?? `MT${mtIdx}`,
    );
    const key1 = parseMTKeyFromTriplet(
      entryData[3] ?? 0, entryData[4] ?? 0, entryData[5] ?? 0,
      `MT${mtIdx}B`,
    );

    mt.push({ type: ADVANCED_MT_TYPE, code: mtIdx, time, keys: [key0, key1] });
  }

  return { name: "getMTList", code: 0, data: { len: mt.length, mt } };
}

/**
 *
 * 读取指定 MT 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载（config）
 *  2. 0xa4 以 config × MT_AREA_SIZE + code × 6 读取 6 字节 → keys[0]/keys[1]
 *     首字节为 0 表示该索引不存在，返回空 keys
 *  3. 0x08 全 4 层扫描 0x92 且索引 = code 的槽位 → 取第 3 字节 time
 *     未找到则返回空 keys
 *
 */
export async function* getMT(
  request: GetMTParams,
): DeviceSession<GetMTResult> {
  const emptyData = (code: number): MTEntry => ({
    type: ADVANCED_MT_TYPE, code, time: 0, keys: [],
  });

  if (request.type !== ADVANCED_MT_TYPE) {
    return { name: "getMT", code: 3, data: emptyData(request.code), message: "type must be 9 (MT)" };
  }

  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // ── 0xa4：code × 6 → 功能键数据（keys[0]/keys[1]）─────────────────────
  const entryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_MT_COMMAND,
    config * MT_AREA_SIZE + request.code * MT_ENTRY_SIZE,
    MT_ENTRY_SIZE,
    DATA_LENGTH,
  );
  if ((entryData[0] ?? 0) === 0) {
    return { name: "getMT", code: 0, data: emptyData(request.code) };
  }
  const key0 = parseMTKeyFromTriplet(
    entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0, `MT${request.code}`,
  );
  const key1 = parseMTKeyFromTriplet(
    entryData[3] ?? 0, entryData[4] ?? 0, entryData[5] ?? 0, `MT${request.code}B`,
  );

  // ── 0x08 全 4 层扫描 0x92，找索引 = code 的槽位 → 取 time（第 3 字节）──
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  let time      = 0;
  let foundSlot = -1;
  outer: for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x92 && (rawAllLayersData[b + 1] ?? 0) === request.code) {
        time      = rawAllLayersData[b + 2] ?? 0;
        foundSlot = i;
        break outer;
      }
    }
  }
  if (foundSlot < 0) {
    return { name: "getMT", code: 0, data: emptyData(request.code) };
  }

  return {
    name: "getMT",
    code: 0,
    data: { type: ADVANCED_MT_TYPE, code: request.code, time, keys: [key0, key1] },
  };
}

/**
 *
 * 设置指定 MT 高级按键
 *
 * 流程：
 *  1. 验证 type===9，keys[0]（funcKey0，同时作为绑定键）/ keys[1]（funcKey1）均存在
 *  2. 0x04/0x05 读取板载（config）与层（layer）
 *  3. 0x08 全 4 层扫描 0x92，找索引 = code 的已有绑定 → 修改模式
 *     a. 读 0x07 旧槽位默认值 → 0x09 恢复旧槽位
 *  4. 0x07 按 keys[0].code 找新 keySlot
 *  5. 0x09 将 keySlot 写为 [0x92, code, time]
 *  6. 0xa5 以 code × 6 写入 keys[0]+keys[1] MT 功能数据
 *
 */
export async function* setMT(
  request: SetMTParams,
): DeviceSession<SetMTResult> {
  if (request.type !== ADVANCED_MT_TYPE) {
    return { name: "setMT", code: 3, message: "type must be 9 (MT)" };
  }
  const funcKey0 = request.keys[0];
  const funcKey1 = request.keys[1];
  if (!funcKey0 || !Number.isInteger(funcKey0.code)) {
    return { name: "setMT", code: 3, message: "keys[0] (funcKey0 / bind key) is required" };
  }
  if (!funcKey1 || !Number.isInteger(funcKey1.code)) {
    return { name: "setMT", code: 3, message: "keys[1] (funcKey1) is required" };
  }

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize     = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：查找已绑定 code 的旧槽位（0x92 类型）──────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  let oldKeySlot  = -1;
  let oldLayerIdx = -1;
  outer: for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x92 && (rawAllLayersData[b + 1] ?? 0) === request.code) {
        oldKeySlot  = i;
        oldLayerIdx = li;
        break outer;
      }
    }
  }

  // ── 修改模式：读 0x07 旧槽位默认值 → 0x09 恢复旧槽位 ──────────────────────
  if (oldKeySlot >= 0) {
    const oldLayerOffset = oldLayerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawOldDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, oldLayerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const odb    = oldKeySlot * KEY_ITEM_SIZE;
    const odType = rawOldDefault[odb]     ?? 0x10;
    const odExt  = rawOldDefault[odb + 1] ?? 0x00;
    const odCode = rawOldDefault[odb + 2] ?? 0x00;
    const rOff   = allLayersOffset + oldLayerIdx * KEY_LAYER_LENGTH + oldKeySlot * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + odType + odExt + odCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      odType, odExt, odCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "setMT", code: wRestoreCode, message: "restore old bind key failed" };
  }

  // ── 0x07 当前层：按 keys[0].code 找新 keySlot ────────────────────────────
  const layerOffset    = layer * KEY_LAYER_LENGTH + config * profileSize;
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let newKeySlot = -1;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0, rawDefaultData[base + 1] ?? 0, rawDefaultData[base + 2] ?? 0,
    );
    if (hid === funcKey0.code) { newKeySlot = i; break; }
  }
  if (newKeySlot < 0) {
    return { name: "setMT", code: 3, message: "bind key not found in default matrix" };
  }

  // ── 0x09：新 keySlot 写 [0x92, code, time] ───────────────────────────────
  const timeByte    = (request.time ?? 0) & 0xff;
  const keyWriteOff = layerOffset + newKeySlot * KEY_ITEM_SIZE;
  const [kLo, kHi]  = shiftFrom16Bit(keyWriteOff);
  const kChk = (kLo + kHi + KEY_ITEM_SIZE + 0x92 + request.code + timeByte) & 0xff;
  const wKeyIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
    kLo, kHi, 0x00,
    0x92, request.code, timeByte,
  ]);
  const wKeyCode = parseWriteResponseCode(wKeyIn);
  if (wKeyCode !== 0) return { name: "setMT", code: wKeyCode, message: "write key MT definition failed" };

  // ── 0xa5：code × 6 写入 keys[0]+keys[1] MT 功能数据 ─────────────────────
  const entryData     = [...encodeMTKeyToTriplet(funcKey0), ...encodeMTKeyToTriplet(funcKey1)];
  const advAreaOffset = config * MT_AREA_SIZE;
  const writeOff      = advAreaOffset + request.code * MT_ENTRY_SIZE;
  const [wLo, wHi]    = shiftFrom16Bit(writeOff);
  const wChk = (wLo + wHi + MT_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
  const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
    SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
    wLo, wHi, 0x00,
    ...entryData,
  ]);
  const wAdvCode = parseWriteResponseCode(wAdvIn);
  if (wAdvCode !== 0) return { name: "setMT", code: wAdvCode, message: "write MT entry failed" };

  return { name: "setMT", code: 0 };
}

/**
 *
 * 删除指定 MT 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载号（config）
 *  2. 0x08 全 4 层扫描所有共享类型（0x92-0x95）条目；找类型=0x92 且 entryIdx=code 的目标
 *  3. 0x09 逐一读取目标槽位的 0x07 默认值并恢复
 *  4. 0x09 将 entryIdx > code 的所有共享类型条目索引各减 1（保留原类型字节和 byte[2]）
 *  5. 0xa4 平移：code+1 ~ totalShared-1 → code ~ totalShared-2
 *  6. 0xa5 清零末尾条目
 *
 */
export async function* delMT(
  request: DelMTParams,
): DeviceSession<DelMTResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：收集所有共享类型条目 ──────────────────────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  type SharedEntry = { layerIdx: number; keyI: number; entryIdx: number; keyType: number };
  const sharedEntries: SharedEntry[] = [];
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b  = lb + i * KEY_ITEM_SIZE;
      const bt = rawAllLayersData[b] ?? 0;
      if (SHARED_ADV_AREA_TYPES.has(bt)) {
        sharedEntries.push({ layerIdx: li, keyI: i, entryIdx: rawAllLayersData[b + 1] ?? 0, keyType: bt });
      }
    }
  }

  const targets = sharedEntries.filter((e) => e.keyType === 0x92 && e.entryIdx === request.code);
  if (targets.length === 0) {
    return { name: "delMT", code: 3, message: `MT index ${request.code} not found in key matrix` };
  }
  const totalShared = sharedEntries.length > 0
    ? Math.max(...sharedEntries.map((e) => e.entryIdx)) + 1
    : 0;

  // ── 0x09 恢复所有绑定该 code 的 MT 按键为 0x07 默认值 ────────────────────
  for (const entry of targets) {
    const lOff = entry.layerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, lOff, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const db    = entry.keyI * KEY_ITEM_SIZE;
    const dType = rawDefault[db]     ?? 0x10;
    const dExt  = rawDefault[db + 1] ?? 0x00;
    const dCode = rawDefault[db + 2] ?? 0x00;
    const rOff  = allLayersOffset + entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + dType + dExt + dCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      dType, dExt, dCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "delMT", code: wRestoreCode, message: "restore key def failed" };
  }

  // ── 0x09 将 entryIdx > code 的所有共享类型按键索引各减 1 ──────────────────
  for (const entry of sharedEntries) {
    if (entry.entryIdx <= request.code) continue;
    const newIdx  = entry.entryIdx - 1;
    const rawOff  = entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const sOff    = allLayersOffset + rawOff;
    const [sLo, sHi] = shiftFrom16Bit(sOff);
    const origByte2  = rawAllLayersData[rawOff + 2] ?? 0;
    const sChk = (sLo + sHi + KEY_ITEM_SIZE + entry.keyType + newIdx + origByte2) & 0xff;
    const wShiftIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, sChk, KEY_ITEM_SIZE,
      sLo, sHi, 0x00,
      entry.keyType, newIdx, origByte2,
    ]);
    const wShiftCode = parseWriteResponseCode(wShiftIn);
    if (wShiftCode !== 0) return { name: "delMT", code: wShiftCode, message: "shift key index failed" };
  }

  // ── 0xa4 平移：code+1 ~ totalShared-1 → code ~ totalShared-2 ─────────────
  const advAreaOffset = config * MT_AREA_SIZE;
  const moveCount     = totalShared - 1 - request.code;

  if (moveCount > 0) {
    const partialData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_MT_COMMAND,
      advAreaOffset + (request.code + 1) * MT_ENTRY_SIZE,
      moveCount * MT_ENTRY_SIZE,
      DATA_LENGTH,
    );
    for (let i = 0; i < moveCount; i++) {
      const eData  = partialData.slice(i * MT_ENTRY_SIZE, (i + 1) * MT_ENTRY_SIZE);
      const wOff   = advAreaOffset + (request.code + i) * MT_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(wOff);
      const wChk = (wLo + wHi + MT_ENTRY_SIZE + eData.reduce((s, v) => s + v, 0)) & 0xff;
      const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
        SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...eData,
      ]);
      const wAdvCode = parseWriteResponseCode(wAdvIn);
      if (wAdvCode !== 0) return { name: "delMT", code: wAdvCode, message: `shift shared entry ${i} failed` };
    }
  }

  // ── 0xa5 清零末尾条目（totalShared-1）────────────────────────────────────
  const clearOff  = advAreaOffset + (totalShared - 1) * MT_ENTRY_SIZE;
  const [cLo, cHi] = shiftFrom16Bit(clearOff);
  const clearData  = new Array<number>(MT_ENTRY_SIZE).fill(0);
  const cChk = (cLo + cHi + MT_ENTRY_SIZE) & 0xff;
  const wClearIn: InPacket = yield buildOutPacket(FLAG, [
    SET_MT_COMMAND, 0x00, cChk, MT_ENTRY_SIZE,
    cLo, cHi, 0x00,
    ...clearData,
  ]);
  const wClearCode = parseWriteResponseCode(wClearIn);
  if (wClearCode !== 0) return { name: "delMT", code: wClearCode, message: "clear last shared entry failed" };

  return { name: "delMT", code: 0 };
}

/**
 *
 * 获取设备全部 RS 高级按键列表
 *
 * 流程：
 *  1. 0x04 读取板载（config）
 *  2. 0x08 读取该板载 4 层数据，扫描 0x93 类型：[0x93, rsIdx, key1SlotIdx]
 *     - rsIdx（第 2 字节）= 0xa4 功能区索引
 *     - key1SlotIdx（第 3 字节）= keys[1] 对应默认矩阵的槽位索引
 *  3. 0x07 读取第 0 层默认矩阵，用 0x08 中 0x93 所在槽位取 code
 *  4. 0xa4 按 rsIdx × 6 读取 6 字节：前 3 字节 → keys[0]，后 3 字节 → keys[1]
 *
 */
export async function* getRSList(
  _request: GetRSListParams,
): DeviceSession<GetRSListResult> {
  // 步骤一：读取当前板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // 步骤二：读取 0x08 全 4 层，建立 rsIdx → 首次出现的 { layerIdx, keySlot } 映射
  const allLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  const rsMap = new Map<number, { layerIdx: number; keySlot: number }>();
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((allLayersData[b] ?? 0) !== 0x93) continue;
      const rsIdx = allLayersData[b + 1] ?? 0;
      if (!rsMap.has(rsIdx)) rsMap.set(rsIdx, { layerIdx: li, keySlot: i });
    }
  }

  if (rsMap.size === 0) {
    return { name: "getRSList", code: 0, data: { len: 0, rs: [] } };
  }

  // 步骤三：对每个 rsIdx 逐条读取 0xa4 功能键
  const rs: RSEntry[] = [];
  for (const rsIdx of [...rsMap.keys()].sort((a, b) => a - b)) {
    const slot = rsMap.get(rsIdx)!;

    // 读取 0xa4 该索引的 6 字节
    const entryData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_MT_COMMAND,
      config * MT_AREA_SIZE + rsIdx * MT_ENTRY_SIZE,
      MT_ENTRY_SIZE,
      DATA_LENGTH,
    );
    const key0 = parseRSKeyFromTriplet(
      entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0,
      KEY_RETURN_ORDER[slot.keySlot] ?? `RS${rsIdx}`,
    );
    const key1 = parseRSKeyFromTriplet(
      entryData[3] ?? 0, entryData[4] ?? 0, entryData[5] ?? 0,
      `RS${rsIdx}B`,
    );

    rs.push({ type: ADVANCED_RS_TYPE, code: rsIdx, keys: [key0, key1] });
  }

  return { name: "getRSList", code: 0, data: { len: rs.length, rs } };
}

/**
 *
 * 读取指定 RS 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载号（config）
 *  2. 0xa4 以 config × MT_AREA_SIZE + code × 6 读取 6 字节 → keys[0]/keys[1]
 *     首字节为 0 表示该索引不存在，返回空 keys
 *
 */
export async function* getRS(
  request: GetRSParams,
): DeviceSession<GetRSResult> {
  const emptyData = (code: number): RSEntry => ({ type: ADVANCED_RS_TYPE, code, keys: [] });

  if (request.type !== ADVANCED_RS_TYPE) {
    return { name: "getRS", code: 3, data: emptyData(request.code), message: "type must be 11 (RS)" };
  }

  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // ── 0xa4：code × 6 → 功能键数据（keys[0]/keys[1]）─────────────────────
  const entryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_MT_COMMAND,
    config * MT_AREA_SIZE + request.code * MT_ENTRY_SIZE,
    MT_ENTRY_SIZE,
    DATA_LENGTH,
  );
  if ((entryData[0] ?? 0) === 0) {
    return { name: "getRS", code: 0, data: emptyData(request.code) };
  }
  const key0 = parseRSKeyFromTriplet(
    entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0, `RS${request.code}`,
  );
  const key1 = parseRSKeyFromTriplet(
    entryData[3] ?? 0, entryData[4] ?? 0, entryData[5] ?? 0, `RS${request.code}B`,
  );

  return {
    name: "getRS",
    code: 0,
    data: { type: ADVANCED_RS_TYPE, code: request.code, keys: [key0, key1] },
  };
}

/**
 *
 * 设置指定 RS 高级按键
 *
 * 流程：
 *  1. 验证 type===11，keys[0]（funcKey0，同时作为绑定键）/ keys[1]（funcKey1）均存在
 *  2. 0x04/0x05 读取板载（config）与层（layer）
 *  3. 0x08 全 4 层扫描 0x93，找索引 = code 的已有绑定 → 修改模式
 *     a. 读 0x07 旧槽位默认值 → 0x09 恢复旧槽位
 *  4. 0x07 按 keys[0].code 找新 keySlot，按 keys[1].code 找 key2SlotIdx
 *  5. 0x09 将 keySlot 写为 [0x93, code, key2SlotIdx]
 *  6. 0xa5 以 code × 6 写入 keys[0]+keys[1] 功能数据
 *
 */
export async function* setRS(
  request: SetRSParams,
): DeviceSession<SetRSResult> {
  if (request.type !== ADVANCED_RS_TYPE) {
    return { name: "setRS", code: 3, message: "type must be 11 (RS)" };
  }
  const funcKey0 = request.keys[0];
  const funcKey1 = request.keys[1];
  if (!funcKey0 || !Number.isInteger(funcKey0.code)) {
    return { name: "setRS", code: 3, message: "keys[0] (funcKey0 / bind key) is required" };
  }
  if (!funcKey1 || !Number.isInteger(funcKey1.code)) {
    return { name: "setRS", code: 3, message: "keys[1] (funcKey1) is required" };
  }

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize     = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：查找已绑定 code 的旧槽位（0x93 类型）──────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  let oldKeySlot  = -1;
  let oldLayerIdx = -1;
  outer: for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x93 && (rawAllLayersData[b + 1] ?? 0) === request.code) {
        oldKeySlot  = i;
        oldLayerIdx = li;
        break outer;
      }
    }
  }

  // ── 修改模式：读 0x07 旧槽位默认值 → 0x09 恢复旧槽位 ──────────────────────
  if (oldKeySlot >= 0) {
    const oldLayerOffset = oldLayerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawOldDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, oldLayerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const odb    = oldKeySlot * KEY_ITEM_SIZE;
    const odType = rawOldDefault[odb]     ?? 0x10;
    const odExt  = rawOldDefault[odb + 1] ?? 0x00;
    const odCode = rawOldDefault[odb + 2] ?? 0x00;
    const rOff   = allLayersOffset + oldLayerIdx * KEY_LAYER_LENGTH + oldKeySlot * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + odType + odExt + odCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      odType, odExt, odCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "setRS", code: wRestoreCode, message: "restore old bind key failed" };
  }

  // ── 0x07 当前层：按 keys[0].code 找新 keySlot，按 keys[1].code 找 key2SlotIdx ─
  const layerOffset    = layer * KEY_LAYER_LENGTH + config * profileSize;
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let newKeySlot  = -1;
  let key2SlotIdx = 0;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0, rawDefaultData[base + 1] ?? 0, rawDefaultData[base + 2] ?? 0,
    );
    if (hid === funcKey0.code && newKeySlot  < 0) newKeySlot  = i;
    if (hid === funcKey1.code)                    key2SlotIdx = i;
  }
  if (newKeySlot < 0) {
    return { name: "setRS", code: 3, message: "bind key not found in default matrix" };
  }

  // ── 0x09：新 keySlot 写 [0x93, code, key2SlotIdx] ────────────────────────
  const keyWriteOff = layerOffset + newKeySlot * KEY_ITEM_SIZE;
  const [kLo, kHi]  = shiftFrom16Bit(keyWriteOff);
  const kChk = (kLo + kHi + KEY_ITEM_SIZE + 0x93 + request.code + key2SlotIdx) & 0xff;
  const wKeyIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
    kLo, kHi, 0x00,
    0x93, request.code, key2SlotIdx,
  ]);
  const wKeyCode = parseWriteResponseCode(wKeyIn);
  if (wKeyCode !== 0) return { name: "setRS", code: wKeyCode, message: "write key RS definition failed" };

  // ── 0xa5：code × 6 写入 keys[0]+keys[1] RS 功能数据 ─────────────────────
  const entryData     = [...encodeRSKeyToTriplet(funcKey0), ...encodeRSKeyToTriplet(funcKey1)];
  const advAreaOffset = config * MT_AREA_SIZE;
  const writeOff      = advAreaOffset + request.code * MT_ENTRY_SIZE;
  const [wLo, wHi]    = shiftFrom16Bit(writeOff);
  const wChk = (wLo + wHi + MT_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
  const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
    SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
    wLo, wHi, 0x00,
    ...entryData,
  ]);
  const wAdvCode = parseWriteResponseCode(wAdvIn);
  if (wAdvCode !== 0) return { name: "setRS", code: wAdvCode, message: "write RS entry failed" };

  return { name: "setRS", code: 0 };
}

/**
 *
 * 删除指定 RS 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载号（config）
 *  2. 0x08 全 4 层扫描所有共享类型（0x92-0x95）条目；找类型=0x93 且 entryIdx=code 的目标
 *  3. 0x09 逐一读取目标槽位的 0x07 默认值并恢复
 *  4. 0x09 将 entryIdx > code 的所有共享类型条目索引各减 1（保留原类型字节和 byte[2]）
 *  5. 0xa4 平移：code+1 ~ totalShared-1 → code ~ totalShared-2
 *  6. 0xa5 清零末尾条目
 *
 */
export async function* delRS(
  request: DelRSParams,
): DeviceSession<DelRSResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：收集所有共享类型条目 ──────────────────────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  type SharedEntry = { layerIdx: number; keyI: number; entryIdx: number; keyType: number };
  const sharedEntries: SharedEntry[] = [];
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b  = lb + i * KEY_ITEM_SIZE;
      const bt = rawAllLayersData[b] ?? 0;
      if (SHARED_ADV_AREA_TYPES.has(bt)) {
        sharedEntries.push({ layerIdx: li, keyI: i, entryIdx: rawAllLayersData[b + 1] ?? 0, keyType: bt });
      }
    }
  }

  const targets = sharedEntries.filter((e) => e.keyType === 0x93 && e.entryIdx === request.code);
  if (targets.length === 0) {
    return { name: "delRS", code: 3, message: `RS index ${request.code} not found in key matrix` };
  }
  const totalShared = sharedEntries.length > 0
    ? Math.max(...sharedEntries.map((e) => e.entryIdx)) + 1
    : 0;

  // ── 0x09 恢复所有绑定该 code 的 RS 按键为 0x07 默认值 ────────────────────
  for (const entry of targets) {
    const lOff = entry.layerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, lOff, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const db    = entry.keyI * KEY_ITEM_SIZE;
    const dType = rawDefault[db]     ?? 0x10;
    const dExt  = rawDefault[db + 1] ?? 0x00;
    const dCode = rawDefault[db + 2] ?? 0x00;
    const rOff  = allLayersOffset + entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + dType + dExt + dCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      dType, dExt, dCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "delRS", code: wRestoreCode, message: "restore key def failed" };
  }

  // ── 0x09 将 entryIdx > code 的所有共享类型按键索引各减 1 ──────────────────
  for (const entry of sharedEntries) {
    if (entry.entryIdx <= request.code) continue;
    const newIdx  = entry.entryIdx - 1;
    const rawOff  = entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const sOff    = allLayersOffset + rawOff;
    const [sLo, sHi] = shiftFrom16Bit(sOff);
    const origByte2  = rawAllLayersData[rawOff + 2] ?? 0;
    const sChk = (sLo + sHi + KEY_ITEM_SIZE + entry.keyType + newIdx + origByte2) & 0xff;
    const wShiftIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, sChk, KEY_ITEM_SIZE,
      sLo, sHi, 0x00,
      entry.keyType, newIdx, origByte2,
    ]);
    const wShiftCode = parseWriteResponseCode(wShiftIn);
    if (wShiftCode !== 0) return { name: "delRS", code: wShiftCode, message: "shift key index failed" };
  }

  // ── 0xa4 平移：code+1 ~ totalShared-1 → code ~ totalShared-2 ─────────────
  const advAreaOffset = config * MT_AREA_SIZE;
  const moveCount     = totalShared - 1 - request.code;

  if (moveCount > 0) {
    const partialData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_MT_COMMAND,
      advAreaOffset + (request.code + 1) * MT_ENTRY_SIZE,
      moveCount * MT_ENTRY_SIZE,
      DATA_LENGTH,
    );
    for (let i = 0; i < moveCount; i++) {
      const eData  = partialData.slice(i * MT_ENTRY_SIZE, (i + 1) * MT_ENTRY_SIZE);
      const wOff   = advAreaOffset + (request.code + i) * MT_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(wOff);
      const wChk = (wLo + wHi + MT_ENTRY_SIZE + eData.reduce((s, v) => s + v, 0)) & 0xff;
      const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
        SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...eData,
      ]);
      const wAdvCode = parseWriteResponseCode(wAdvIn);
      if (wAdvCode !== 0) return { name: "delRS", code: wAdvCode, message: `shift shared entry ${i} failed` };
    }
  }

  // ── 0xa5 清零末尾条目（totalShared-1）────────────────────────────────────
  const clearOff  = advAreaOffset + (totalShared - 1) * MT_ENTRY_SIZE;
  const [cLo, cHi] = shiftFrom16Bit(clearOff);
  const clearData  = new Array<number>(MT_ENTRY_SIZE).fill(0);
  const cChk = (cLo + cHi + MT_ENTRY_SIZE) & 0xff;
  const wClearIn: InPacket = yield buildOutPacket(FLAG, [
    SET_MT_COMMAND, 0x00, cChk, MT_ENTRY_SIZE,
    cLo, cHi, 0x00,
    ...clearData,
  ]);
  const wClearCode = parseWriteResponseCode(wClearIn);
  if (wClearCode !== 0) return { name: "delRS", code: wClearCode, message: "clear last shared entry failed" };

  return { name: "delRS", code: 0 };
}

/**
 *
 * 获取设备全部 SOCD 高级按键列表
 *
 * 流程：
 *  1. 0x04/0x05 读取板载（config）和当前层（layer，用于 tary 读取）
 *  2. 0x08 读取该板载 4 层数据，扫描 0x94 类型：[0x94, socdIdx, key1SlotIdx]
 *  3. 0x07 读取第 0 层默认矩阵，通过 keySlot 取 code
 *  4. 0xa0 读取当前层触发参数，通过 keySlot 取 byte[1] 高 4 位 → trigger
 *  5. 0xa4 按 socdIdx × 6 读取 6 字节：前 3 → keys[0]，后 3 → keys[1]
 *
 */
export async function* getSOCDList(
  _request?: GetSOCDListParams,
): DeviceSession<GetSOCDListResult> {
  // 步骤一：读取当前板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // 步骤二：读取 0x08 全 4 层，建立 socdIdx → 首次出现的 { layerIdx, keySlot } 映射
  const allLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  const socdMap = new Map<number, { layerIdx: number; keySlot: number }>();
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((allLayersData[b] ?? 0) !== 0x94) continue;
      const socdIdx = allLayersData[b + 1] ?? 0;
      if (!socdMap.has(socdIdx)) socdMap.set(socdIdx, { layerIdx: li, keySlot: i });
    }
  }

  if (socdMap.size === 0) {
    return { name: "getSOCDList", code: 0, data: { len: 0, socd: [] } };
  }

  // 步骤三：对每个 socdIdx 逐条读取 0xa4 功能键 + 0xa0 触发参数（带层缓存）
  const taryLayerCache = new Map<number, number[]>();
  const getTaryLayer   = async function* (li: number): AsyncGenerator<OutPacket, number[], InPacket> {
    if (!taryLayerCache.has(li)) {
      const keyTaryLayerSize = KEY_COUNT * KEY_TARY_ITEM_SIZE;
      const off = li * keyTaryLayerSize + config * (keyTaryLayerSize * 4);
      const data: number[] = yield* readChunkedDataByCommandGen(
        FLAG, GET_KEY_TARY_COMMAND, off, keyTaryLayerSize, DATA_LENGTH,
      );
      taryLayerCache.set(li, data);
    }
    return taryLayerCache.get(li)!;
  };

  const socd: SOCDEntry[] = [];
  for (const socdIdx of [...socdMap.keys()].sort((a, b) => a - b)) {
    const slot = socdMap.get(socdIdx)!;

    // 读取 0xa4 该索引的 6 字节
    const entryData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_MT_COMMAND,
      config * MT_AREA_SIZE + socdIdx * MT_ENTRY_SIZE,
      MT_ENTRY_SIZE,
      DATA_LENGTH,
    );
    const key0 = parseSOCDKeyFromTriplet(
      entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0,
      KEY_RETURN_ORDER[slot.keySlot] ?? `SOCD${socdIdx}`,
    );
    const key1 = parseSOCDKeyFromTriplet(
      entryData[3] ?? 0, entryData[4] ?? 0, entryData[5] ?? 0,
      `SOCD${socdIdx}B`,
    );

    // 读取 0xa0 触发参数 byte[1] 高 4 位 → trigger
    const rawTary   = yield* getTaryLayer(slot.layerIdx);
    const taryByte1 = rawTary[slot.keySlot * KEY_TARY_ITEM_SIZE + 1] ?? 0;
    const trigger   = (taryByte1 >> 4) & 0x0F;

    socd.push({ type: ADVANCED_SOCD_TYPE, code: socdIdx, trigger, keys: [key0, key1] });
  }

  return { name: "getSOCDList", code: 0, data: { len: socd.length, socd } };
}

/**
 *
 * 读取指定 SOCD 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载号（config）
 *  2. 0xa4 以 code × 6 读取 6 字节 → keys[0]/keys[1]
 *     首字节为 0 表示该索引不存在，返回空 keys
 *  3. 0x08 全 4 层扫描 0x94 且索引 = code 的槽位（用于读取 trigger）
 *     未找到则返回空 keys
 *  4. 0xa0 读取 keySlot 触发参数，byte[1] 高 4 位 → trigger
 *
 */
export async function* getSOCD(
  request: GetSOCDParams,
): DeviceSession<GetSOCDResult> {
  const emptyData = (code: number): SOCDEntry => ({ type: ADVANCED_SOCD_TYPE, code, trigger: 0, keys: [] });

  if (request.type !== ADVANCED_SOCD_TYPE) {
    return { name: "getSOCD", code: 3, data: emptyData(request.code), message: "type must be 8 (SOCD)" };
  }

  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // ── 0xa4：code × 6 → 功能键数据（keys[0]/keys[1]）─────────────────────
  const entryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_MT_COMMAND,
    config * MT_AREA_SIZE + request.code * MT_ENTRY_SIZE,
    MT_ENTRY_SIZE,
    DATA_LENGTH,
  );
  if ((entryData[0] ?? 0) === 0) {
    return { name: "getSOCD", code: 0, data: emptyData(request.code) };
  }
  const key0 = parseSOCDKeyFromTriplet(
    entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0, `SOCD${request.code}`,
  );
  const key1 = parseSOCDKeyFromTriplet(
    entryData[3] ?? 0, entryData[4] ?? 0, entryData[5] ?? 0, `SOCD${request.code}B`,
  );

  // ── 0x08：全 4 层扫描 0x94，找索引 = code 的绑定槽位（用于读 trigger）──
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  let boundKeySlot  = -1;
  let boundLayerIdx = -1;
  outer: for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x94 && (rawAllLayersData[b + 1] ?? 0) === request.code) {
        boundKeySlot  = i;
        boundLayerIdx = li;
        break outer;
      }
    }
  }
  if (boundKeySlot < 0) {
    return { name: "getSOCD", code: 0, data: emptyData(request.code) };
  }

  // ── 0xa0：绑定槽位触发参数，byte[1] 高 4 位 → trigger ────────────────
  const keyTaryLayerSize = KEY_COUNT * KEY_TARY_ITEM_SIZE;
  const slotTaryOffset   = boundLayerIdx * keyTaryLayerSize + config * (keyTaryLayerSize * 4) + boundKeySlot * KEY_TARY_ITEM_SIZE;
  const taryEntry: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_TARY_COMMAND, slotTaryOffset, KEY_TARY_ITEM_SIZE, DATA_LENGTH,
  );
  const trigger = ((taryEntry[1] ?? 0) >> 4) & 0x0F;

  return {
    name: "getSOCD",
    code: 0,
    data: { type: ADVANCED_SOCD_TYPE, code: request.code, trigger, keys: [key0, key1] },
  };
}

/**
 *
 * 设置指定 SOCD 高级按键
 *
 * 流程：
 *  1. 验证 type===8，keys[0]（funcKey0，同时作为绑定键）/keys[1]（funcKey1）均存在，trigger 为 0/1/2
 *  2. 0x04/0x05 读取板载（config）与层（layer）
 *  3. 0x08 全 4 层扫描 0x94，找索引 = code 的已有绑定 → 修改模式
 *     a. 读 0x07 旧槽位默认值 → 0x09 恢复旧槽位
 *  4. 0x07 按 keys[0].code 找新 keySlot，按 keys[1].code 找 key2SlotIdx
 *  5. 0x09 将 keySlot 写为 [0x94, code, key2SlotIdx]
 *  6. 0xa5 以 code × 6 写入 keys[0]+keys[1] 功能数据
 *  7. 0xa0 读取 keySlot tary byte[1]，改写高 4 位为 trigger，0xa1 写回
 *
 */
export async function* setSOCD(
  request: SetSOCDParams,
): DeviceSession<SetSOCDResult> {
  if (request.type !== ADVANCED_SOCD_TYPE) {
    return { name: "setSOCD", code: 3, message: "type must be 8 (SOCD)" };
  }
  const funcKey0 = request.keys[0];
  const funcKey1 = request.keys[1];
  if (!funcKey0 || !Number.isInteger(funcKey0.code)) {
    return { name: "setSOCD", code: 3, message: "keys[0] (funcKey0 / bind key) is required" };
  }
  if (!funcKey1 || !Number.isInteger(funcKey1.code)) {
    return { name: "setSOCD", code: 3, message: "keys[1] (funcKey1) is required" };
  }
  if (![0, 1, 2].includes(request.trigger)) {
    return { name: "setSOCD", code: 3, message: "trigger must be 0, 1 or 2" };
  }

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize     = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：查找已绑定 code 的旧槽位（0x94 类型）──────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  let oldKeySlot  = -1;
  let oldLayerIdx = -1;
  outer: for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x94 && (rawAllLayersData[b + 1] ?? 0) === request.code) {
        oldKeySlot  = i;
        oldLayerIdx = li;
        break outer;
      }
    }
  }

  // ── 修改模式：读 0x07 旧槽位默认值 → 0x09 恢复旧槽位 ──────────────────────
  if (oldKeySlot >= 0) {
    const oldLayerOffset = oldLayerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawOldDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, oldLayerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const odb    = oldKeySlot * KEY_ITEM_SIZE;
    const odType = rawOldDefault[odb]     ?? 0x10;
    const odExt  = rawOldDefault[odb + 1] ?? 0x00;
    const odCode = rawOldDefault[odb + 2] ?? 0x00;
    const rOff   = allLayersOffset + oldLayerIdx * KEY_LAYER_LENGTH + oldKeySlot * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + odType + odExt + odCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      odType, odExt, odCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "setSOCD", code: wRestoreCode, message: "restore old bind key failed" };
  }

  // ── 0x07 当前层：按 keys[0].code 找新 keySlot，按 keys[1].code 找 key2SlotIdx ─
  const layerOffset    = layer * KEY_LAYER_LENGTH + config * profileSize;
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let newKeySlot  = -1;
  let key2SlotIdx = 0;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0, rawDefaultData[base + 1] ?? 0, rawDefaultData[base + 2] ?? 0,
    );
    if (hid === funcKey0.code && newKeySlot  < 0) newKeySlot  = i;
    if (hid === funcKey1.code)                    key2SlotIdx = i;
  }
  if (newKeySlot < 0) {
    return { name: "setSOCD", code: 3, message: "bind key not found in default matrix" };
  }

  // ── 0x09：新 keySlot 写 [0x94, code, key2SlotIdx] ────────────────────────
  const keyWriteOff = layerOffset + newKeySlot * KEY_ITEM_SIZE;
  const [kLo, kHi]  = shiftFrom16Bit(keyWriteOff);
  const kChk = (kLo + kHi + KEY_ITEM_SIZE + 0x94 + request.code + key2SlotIdx) & 0xff;
  const wKeyIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
    kLo, kHi, 0x00,
    0x94, request.code, key2SlotIdx,
  ]);
  const wKeyCode = parseWriteResponseCode(wKeyIn);
  if (wKeyCode !== 0) return { name: "setSOCD", code: wKeyCode, message: "write key SOCD definition failed" };

  // ── 0xa5：code × 6 写入 keys[0]+keys[1] SOCD 功能数据 ───────────────────
  const entryData     = [...encodeSOCDKeyToTriplet(funcKey0), ...encodeSOCDKeyToTriplet(funcKey1)];
  const advAreaOffset = config * MT_AREA_SIZE;
  const writeOff      = advAreaOffset + request.code * MT_ENTRY_SIZE;
  const [wLo, wHi]    = shiftFrom16Bit(writeOff);
  const wChk = (wLo + wHi + MT_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
  const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
    SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
    wLo, wHi, 0x00,
    ...entryData,
  ]);
  const wAdvCode = parseWriteResponseCode(wAdvIn);
  if (wAdvCode !== 0) return { name: "setSOCD", code: wAdvCode, message: "write SOCD entry failed" };

  // ── 0xa0 读取 newKeySlot tary byte[1]，改写高 4 位为 trigger，0xa1 写回 ──
  {
    const keyTaryLayerSize = KEY_COUNT * KEY_TARY_ITEM_SIZE;
    const slotTaryOffset   = layer * keyTaryLayerSize + config * (keyTaryLayerSize * 4) + newKeySlot * KEY_TARY_ITEM_SIZE;
    const taryEntry: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_TARY_COMMAND, slotTaryOffset, KEY_TARY_ITEM_SIZE, DATA_LENGTH,
    );
    const currentByte1 = taryEntry[1] ?? 0;
    const newByte1     = (currentByte1 & 0x0F) | ((request.trigger & 0x0F) << 4);
    const [tLo, tHi]   = shiftFrom16Bit(slotTaryOffset + 1);
    const tChk = (tLo + tHi + 1 + newByte1) & 0xff;
    const wTaryIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_TARY_COMMAND, 0x00, tChk, 1,
      tLo, tHi, 0x00,
      newByte1,
    ]);
    const wTaryCode = parseWriteResponseCode(wTaryIn);
    if (wTaryCode !== 0) return { name: "setSOCD", code: wTaryCode, message: "write SOCD trigger failed" };
  }

  return { name: "setSOCD", code: 0 };
}

/**
 *
 * 删除指定 SOCD 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载号（config）
 *  2. 0x08 全 4 层扫描所有共享类型（0x92-0x95）条目；找类型=0x94 且 entryIdx=code 的目标
 *  3. 0x09 逐一读取目标槽位的 0x07 默认值并恢复
 *  4. 0x09 将 entryIdx > code 的所有共享类型条目索引各减 1（保留原类型字节和 byte[2]）
 *  5. 0xa4 平移：code+1 ~ totalShared-1 → code ~ totalShared-2
 *  6. 0xa5 清零末尾条目
 *
 */
export async function* delSOCD(
  request: DelSOCDParams,
): DeviceSession<DelSOCDResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：收集所有共享类型条目 ──────────────────────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  type SharedEntry = { layerIdx: number; keyI: number; entryIdx: number; keyType: number };
  const sharedEntries: SharedEntry[] = [];
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b  = lb + i * KEY_ITEM_SIZE;
      const bt = rawAllLayersData[b] ?? 0;
      if (SHARED_ADV_AREA_TYPES.has(bt)) {
        sharedEntries.push({ layerIdx: li, keyI: i, entryIdx: rawAllLayersData[b + 1] ?? 0, keyType: bt });
      }
    }
  }

  const targets = sharedEntries.filter((e) => e.keyType === 0x94 && e.entryIdx === request.code);
  if (targets.length === 0) {
    return { name: "delSOCD", code: 3, message: `SOCD index ${request.code} not found in key matrix` };
  }
  const totalShared = sharedEntries.length > 0
    ? Math.max(...sharedEntries.map((e) => e.entryIdx)) + 1
    : 0;

  // ── 0x09 恢复所有绑定该 code 的 SOCD 按键为 0x07 默认值 ──────────────────
  for (const entry of targets) {
    const lOff = entry.layerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, lOff, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const db    = entry.keyI * KEY_ITEM_SIZE;
    const dType = rawDefault[db]     ?? 0x10;
    const dExt  = rawDefault[db + 1] ?? 0x00;
    const dCode = rawDefault[db + 2] ?? 0x00;
    const rOff  = allLayersOffset + entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + dType + dExt + dCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      dType, dExt, dCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "delSOCD", code: wRestoreCode, message: "restore key def failed" };
  }

  // ── 0x09 将 entryIdx > code 的所有共享类型按键索引各减 1 ──────────────────
  for (const entry of sharedEntries) {
    if (entry.entryIdx <= request.code) continue;
    const newIdx  = entry.entryIdx - 1;
    const rawOff  = entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const sOff    = allLayersOffset + rawOff;
    const [sLo, sHi] = shiftFrom16Bit(sOff);
    const origByte2  = rawAllLayersData[rawOff + 2] ?? 0;
    const sChk = (sLo + sHi + KEY_ITEM_SIZE + entry.keyType + newIdx + origByte2) & 0xff;
    const wShiftIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, sChk, KEY_ITEM_SIZE,
      sLo, sHi, 0x00,
      entry.keyType, newIdx, origByte2,
    ]);
    const wShiftCode = parseWriteResponseCode(wShiftIn);
    if (wShiftCode !== 0) return { name: "delSOCD", code: wShiftCode, message: "shift key index failed" };
  }

  // ── 0xa4 平移：code+1 ~ totalShared-1 → code ~ totalShared-2 ─────────────
  const advAreaOffset = config * MT_AREA_SIZE;
  const moveCount     = totalShared - 1 - request.code;

  if (moveCount > 0) {
    const partialData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_MT_COMMAND,
      advAreaOffset + (request.code + 1) * MT_ENTRY_SIZE,
      moveCount * MT_ENTRY_SIZE,
      DATA_LENGTH,
    );
    for (let i = 0; i < moveCount; i++) {
      const eData  = partialData.slice(i * MT_ENTRY_SIZE, (i + 1) * MT_ENTRY_SIZE);
      const wOff   = advAreaOffset + (request.code + i) * MT_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(wOff);
      const wChk = (wLo + wHi + MT_ENTRY_SIZE + eData.reduce((s, v) => s + v, 0)) & 0xff;
      const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
        SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...eData,
      ]);
      const wAdvCode = parseWriteResponseCode(wAdvIn);
      if (wAdvCode !== 0) return { name: "delSOCD", code: wAdvCode, message: `shift shared entry ${i} failed` };
    }
  }

  // ── 0xa5 清零末尾条目（totalShared-1）────────────────────────────────────
  const clearOff  = advAreaOffset + (totalShared - 1) * MT_ENTRY_SIZE;
  const [cLo, cHi] = shiftFrom16Bit(clearOff);
  const clearData  = new Array<number>(MT_ENTRY_SIZE).fill(0);
  const cChk = (cLo + cHi + MT_ENTRY_SIZE) & 0xff;
  const wClearIn: InPacket = yield buildOutPacket(FLAG, [
    SET_MT_COMMAND, 0x00, cChk, MT_ENTRY_SIZE,
    cLo, cHi, 0x00,
    ...clearData,
  ]);
  const wClearCode = parseWriteResponseCode(wClearIn);
  if (wClearCode !== 0) return { name: "delSOCD", code: wClearCode, message: "clear last shared entry failed" };

  return { name: "delSOCD", code: 0 };
}

/**
 *
 * 读取全部 OKS 高级按键列表
 *
 * 流程：
 *  1. 0x04 读取板载（config）
 *  2. 0x08 读取该板载全部 4 层，扫描 0x95 类型按键
 *     - byte[1] = oksIdx；用 oksIdx → keySlot 映射（同层同 keySlot 出现多次以首次为准）
 *  3. 0x07 读取局部层默认矩阵，取 keySlot → HID code
 *  4. 0xa4 读取全部 256 字节共享区，按 oksIdx × 6 解析 keys[0]/keys[1]
 *
 */
export async function* getOKSList(
  _request: GetOKSListParams,
): DeviceSession<GetOKSListResult> {
  // 步骤一：读取当前板载号
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // 步骤二：读取 0x08 全 4 层，建立 oksIdx → 首次出现的 { layerIdx, keySlot } 映射
  const allLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  const oksMap = new Map<number, { layerIdx: number; keySlot: number }>();
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((allLayersData[b] ?? 0) !== 0x95) continue;
      const oksIdx = allLayersData[b + 1] ?? 0;
      if (!oksMap.has(oksIdx)) oksMap.set(oksIdx, { layerIdx: li, keySlot: i });
    }
  }

  if (oksMap.size === 0) {
    return { name: "getOKSList", code: 0, data: { len: 0, oks: [] } };
  }

  // 步骤三：对每个 oksIdx 逐条读取 0xa4 功能键
  const oks: OKSEntry[] = [];
  for (const oksIdx of [...oksMap.keys()].sort((a, b) => a - b)) {
    const slot = oksMap.get(oksIdx)!;

    // 读取 0xa4 该索引的 6 字节
    const entryData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_MT_COMMAND,
      config * MT_AREA_SIZE + oksIdx * MT_ENTRY_SIZE,
      MT_ENTRY_SIZE,
      DATA_LENGTH,
    );
    const key0 = parseOKSKeyFromTriplet(
      entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0,
      KEY_RETURN_ORDER[slot.keySlot] ?? `OKS${oksIdx}`,
    );
    const key1 = parseOKSKeyFromTriplet(
      entryData[3] ?? 0, entryData[4] ?? 0, entryData[5] ?? 0,
      `OKS${oksIdx}B`,
    );

    oks.push({ type: ADVANCED_OKS_TYPE, code: oksIdx, keys: [key0, key1] });
  }

  return { name: "getOKSList", code: 0, data: { len: oks.length, oks } };
}

/**
 *
 * 读取指定 OKS 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载号（config）
 *  2. 0xa4 以 code × 6 读取 6 字节 → keys[0]/keys[1]
 *     首字节为 0 表示该索引不存在，返回空 keys
 *
 */
export async function* getOKS(
  request: GetOKSParams,
): DeviceSession<GetOKSResult> {
  const emptyData = (code: number): OKSEntry => ({ type: ADVANCED_OKS_TYPE, code, keys: [] });

  if (request.type !== ADVANCED_OKS_TYPE) {
    return { name: "getOKS", code: 3, data: emptyData(request.code), message: "type must be 7 (OKS)" };
  }

  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  // ── 0xa4：code × 6 → 功能键数据（keys[0]/keys[1]）─────────────────────
  const entryData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_MT_COMMAND,
    config * MT_AREA_SIZE + request.code * MT_ENTRY_SIZE,
    MT_ENTRY_SIZE,
    DATA_LENGTH,
  );
  if ((entryData[0] ?? 0) === 0) {
    return { name: "getOKS", code: 0, data: emptyData(request.code) };
  }
  const key0 = parseOKSKeyFromTriplet(
    entryData[0] ?? 0, entryData[1] ?? 0, entryData[2] ?? 0, `OKS${request.code}`,
  );
  const key1 = parseOKSKeyFromTriplet(
    entryData[3] ?? 0, entryData[4] ?? 0, entryData[5] ?? 0, `OKS${request.code}B`,
  );

  return {
    name: "getOKS",
    code: 0,
    data: { type: ADVANCED_OKS_TYPE, code: request.code, keys: [key0, key1] },
  };
}

/**
 *
 * 设置指定 OKS 高级按键
 *
 * 流程：
 *  1. 验证 type===7，keys[0]（funcKey0，同时作为绑定键）/keys[1]（funcKey1）均存在
 *  2. 0x04/0x05 读取板载（config）与层（layer）
 *  3. 0x08 全 4 层扫描 0x95，找索引 = code 的已有绑定 → 修改模式
 *     a. 读 0x07 旧槽位默认值 → 0x09 恢复旧槽位
 *  4. 0x07 按 keys[0].code 找新 keySlot，按 keys[1].code 找 key2SlotIdx
 *  5. 0x09 将 keySlot 写为 [0x95, code, key2SlotIdx]
 *  6. 0xa5 以 code × 6 写入 keys[0]+keys[1] 功能数据
 *
 */
export async function* setOKS(
  request: SetOKSParams,
): DeviceSession<SetOKSResult> {
  if (request.type !== ADVANCED_OKS_TYPE) {
    return { name: "setOKS", code: 3, message: "type must be 7 (OKS)" };
  }
  const funcKey0 = request.keys[0];
  const funcKey1 = request.keys[1];
  if (!funcKey0 || !Number.isInteger(funcKey0.code)) {
    return { name: "setOKS", code: 3, message: "keys[0] (funcKey0 / bind key) is required" };
  }
  if (!funcKey1 || !Number.isInteger(funcKey1.code)) {
    return { name: "setOKS", code: 3, message: "keys[1] (funcKey1) is required" };
  }

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize     = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：查找已绑定 code 的旧槽位（0x95 类型）──────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  let oldKeySlot  = -1;
  let oldLayerIdx = -1;
  outer: for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b = lb + i * KEY_ITEM_SIZE;
      if ((rawAllLayersData[b] ?? 0) === 0x95 && (rawAllLayersData[b + 1] ?? 0) === request.code) {
        oldKeySlot  = i;
        oldLayerIdx = li;
        break outer;
      }
    }
  }

  // ── 修改模式：读 0x07 旧槽位默认值 → 0x09 恢复旧槽位 ──────────────────────
  if (oldKeySlot >= 0) {
    const oldLayerOffset = oldLayerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawOldDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, oldLayerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const odb    = oldKeySlot * KEY_ITEM_SIZE;
    const odType = rawOldDefault[odb]     ?? 0x10;
    const odExt  = rawOldDefault[odb + 1] ?? 0x00;
    const odCode = rawOldDefault[odb + 2] ?? 0x00;
    const rOff   = allLayersOffset + oldLayerIdx * KEY_LAYER_LENGTH + oldKeySlot * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + odType + odExt + odCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      odType, odExt, odCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "setOKS", code: wRestoreCode, message: "restore old bind key failed" };
  }

  // ── 0x07 当前层：按 keys[0].code 找新 keySlot，按 keys[1].code 找 key2SlotIdx ─
  const layerOffset    = layer * KEY_LAYER_LENGTH + config * profileSize;
  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let newKeySlot  = -1;
  let key2SlotIdx = 0;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0, rawDefaultData[base + 1] ?? 0, rawDefaultData[base + 2] ?? 0,
    );
    if (hid === funcKey0.code && newKeySlot  < 0) newKeySlot  = i;
    if (hid === funcKey1.code)                    key2SlotIdx = i;
  }
  if (newKeySlot < 0) {
    return { name: "setOKS", code: 3, message: "bind key not found in default matrix" };
  }

  // ── 0x09：新 keySlot 写 [0x95, code, key2SlotIdx] ────────────────────────
  const keyWriteOff = layerOffset + newKeySlot * KEY_ITEM_SIZE;
  const [kLo, kHi]  = shiftFrom16Bit(keyWriteOff);
  const kChk = (kLo + kHi + KEY_ITEM_SIZE + 0x95 + request.code + key2SlotIdx) & 0xff;
  const wKeyIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
    kLo, kHi, 0x00,
    0x95, request.code, key2SlotIdx,
  ]);
  const wKeyCode = parseWriteResponseCode(wKeyIn);
  if (wKeyCode !== 0) return { name: "setOKS", code: wKeyCode, message: "write key OKS definition failed" };

  // ── 0xa5：code × 6 写入 keys[0]+keys[1] OKS 功能数据 ─────────────────────
  const entryData     = [...encodeOKSKeyToTriplet(funcKey0), ...encodeOKSKeyToTriplet(funcKey1)];
  const advAreaOffset = config * MT_AREA_SIZE;
  const writeOff      = advAreaOffset + request.code * MT_ENTRY_SIZE;
  const [wLo, wHi]    = shiftFrom16Bit(writeOff);
  const wChk = (wLo + wHi + MT_ENTRY_SIZE + entryData.reduce((s, v) => s + v, 0)) & 0xff;
  const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
    SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
    wLo, wHi, 0x00,
    ...entryData,
  ]);
  const wAdvCode = parseWriteResponseCode(wAdvIn);
  if (wAdvCode !== 0) return { name: "setOKS", code: wAdvCode, message: "write OKS entry failed" };

  return { name: "setOKS", code: 0 };
}

/**
 *
 * 删除指定 OKS 高级按键
 *
 * 流程：
 *  1. 0x04 读取板载号（config）
 *  2. 0x08 全 4 层扫描所有共享类型（0x92-0x95）条目；找类型=0x95 且 entryIdx=code 的目标
 *  3. 0x09 逐一读取目标槽位的 0x07 默认值并恢复
 *  4. 0x09 将 entryIdx > code 的所有共享类型条目索引各减 1（保留原类型字节和 byte[2]）
 *  5. 0xa4 平移：code+1 ~ totalShared-1 → code ~ totalShared-2
 *  6. 0xa5 清零末尾条目
 *
 */
export async function* delOKS(
  request: DelOKSParams,
): DeviceSession<DelOKSResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config      = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;
  const allLayersOffset = config * profileSize;

  // ── 0x08 全 4 层：收集所有共享类型条目 ──────────────────────────────────
  const rawAllLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, allLayersOffset, profileSize, DATA_LENGTH,
  );

  type SharedEntry = { layerIdx: number; keyI: number; entryIdx: number; keyType: number };
  const sharedEntries: SharedEntry[] = [];
  for (let li = 0; li < 4; li++) {
    const lb = li * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const b  = lb + i * KEY_ITEM_SIZE;
      const bt = rawAllLayersData[b] ?? 0;
      if (SHARED_ADV_AREA_TYPES.has(bt)) {
        sharedEntries.push({ layerIdx: li, keyI: i, entryIdx: rawAllLayersData[b + 1] ?? 0, keyType: bt });
      }
    }
  }

  const targets = sharedEntries.filter((e) => e.keyType === 0x95 && e.entryIdx === request.code);
  if (targets.length === 0) {
    return { name: "delOKS", code: 3, message: `OKS index ${request.code} not found in key matrix` };
  }
  const totalShared = sharedEntries.length > 0
    ? Math.max(...sharedEntries.map((e) => e.entryIdx)) + 1
    : 0;

  // ── 0x09 恢复所有绑定该 code 的 OKS 按键为 0x07 默认值 ──────────────────
  for (const entry of targets) {
    const lOff = entry.layerIdx * KEY_LAYER_LENGTH + config * profileSize;
    const rawDefault: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_KEY_DEFAULT_COMMAND, lOff, KEY_LAYER_LENGTH, DATA_LENGTH,
    );
    const db    = entry.keyI * KEY_ITEM_SIZE;
    const dType = rawDefault[db]     ?? 0x10;
    const dExt  = rawDefault[db + 1] ?? 0x00;
    const dCode = rawDefault[db + 2] ?? 0x00;
    const rOff  = allLayersOffset + entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const [rLo, rHi] = shiftFrom16Bit(rOff);
    const rChk = (rLo + rHi + KEY_ITEM_SIZE + dType + dExt + dCode) & 0xff;
    const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, rChk, KEY_ITEM_SIZE,
      rLo, rHi, 0x00,
      dType, dExt, dCode,
    ]);
    const wRestoreCode = parseWriteResponseCode(wRestoreIn);
    if (wRestoreCode !== 0) return { name: "delOKS", code: wRestoreCode, message: "restore key def failed" };
  }

  // ── 0x09 将 entryIdx > code 的所有共享类型按键索引各减 1 ──────────────────
  for (const entry of sharedEntries) {
    if (entry.entryIdx <= request.code) continue;
    const newIdx  = entry.entryIdx - 1;
    const rawOff  = entry.layerIdx * KEY_LAYER_LENGTH + entry.keyI * KEY_ITEM_SIZE;
    const sOff    = allLayersOffset + rawOff;
    const [sLo, sHi] = shiftFrom16Bit(sOff);
    const origByte2  = rawAllLayersData[rawOff + 2] ?? 0;
    const sChk = (sLo + sHi + KEY_ITEM_SIZE + entry.keyType + newIdx + origByte2) & 0xff;
    const wShiftIn: InPacket = yield buildOutPacket(FLAG, [
      SET_KEY_CURRENT_COMMAND, 0x00, sChk, KEY_ITEM_SIZE,
      sLo, sHi, 0x00,
      entry.keyType, newIdx, origByte2,
    ]);
    const wShiftCode = parseWriteResponseCode(wShiftIn);
    if (wShiftCode !== 0) return { name: "delOKS", code: wShiftCode, message: "shift key index failed" };
  }

  // ── 0xa4 平移：code+1 ~ totalShared-1 → code ~ totalShared-2 ─────────────
  const advAreaOffset = config * MT_AREA_SIZE;
  const moveCount     = totalShared - 1 - request.code;

  if (moveCount > 0) {
    const partialData: number[] = yield* readChunkedDataByCommandGen(
      FLAG, GET_MT_COMMAND,
      advAreaOffset + (request.code + 1) * MT_ENTRY_SIZE,
      moveCount * MT_ENTRY_SIZE,
      DATA_LENGTH,
    );
    for (let i = 0; i < moveCount; i++) {
      const eData  = partialData.slice(i * MT_ENTRY_SIZE, (i + 1) * MT_ENTRY_SIZE);
      const wOff   = advAreaOffset + (request.code + i) * MT_ENTRY_SIZE;
      const [wLo, wHi] = shiftFrom16Bit(wOff);
      const wChk = (wLo + wHi + MT_ENTRY_SIZE + eData.reduce((s, v) => s + v, 0)) & 0xff;
      const wAdvIn: InPacket = yield buildOutPacket(FLAG, [
        SET_MT_COMMAND, 0x00, wChk, MT_ENTRY_SIZE,
        wLo, wHi, 0x00,
        ...eData,
      ]);
      const wAdvCode = parseWriteResponseCode(wAdvIn);
      if (wAdvCode !== 0) return { name: "delOKS", code: wAdvCode, message: `shift shared entry ${i} failed` };
    }
  }

  // ── 0xa5 清零末尾条目（totalShared-1）────────────────────────────────────
  const clearOff  = advAreaOffset + (totalShared - 1) * MT_ENTRY_SIZE;
  const [cLo, cHi] = shiftFrom16Bit(clearOff);
  const clearData  = new Array<number>(MT_ENTRY_SIZE).fill(0);
  const cChk = (cLo + cHi + MT_ENTRY_SIZE) & 0xff;
  const wClearIn: InPacket = yield buildOutPacket(FLAG, [
    SET_MT_COMMAND, 0x00, cChk, MT_ENTRY_SIZE,
    cLo, cHi, 0x00,
    ...clearData,
  ]);
  const wClearCode = parseWriteResponseCode(wClearIn);
  if (wClearCode !== 0) return { name: "delOKS", code: wClearCode, message: "clear last shared entry failed" };

  return { name: "delOKS", code: 0 };
}

/**
 *
 * 读取所有组合键列表
 *
 * 流程：
 *  1. 0x04 读取当前板载（config）
 *  2. 0x08 读取当前板载全部 4 层数据
 *  3. 扫描：byte[0]=0x10 且 byte[1]>0 且 byte[2]>0 的槽位即为组合键，按 keySlot 去重
 *  4. 0x07 读取默认矩阵（第 0 层），查找每个槽位对应的 HID code
 *  5. 返回 {type:3, code:hidCode} 列表
 *
 */
export async function* getShortcuts(
  _request?: GetShortcutsParams,
): DeviceSession<GetShortcutsResult> {
  const baseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = baseIn[8] ?? 0;
  const profileSize = KEY_LAYER_LENGTH * 4;

  const allLayersData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, config * profileSize, profileSize, DATA_LENGTH,
  );

  // 按 keySlot 去重，跨 4 层扫描
  const seenSlots = new Set<number>();
  for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
    const layerBase = layerIdx * KEY_LAYER_LENGTH;
    for (let i = 0; i < KEY_COUNT; i++) {
      const base = layerBase + i * KEY_ITEM_SIZE;
      if ((allLayersData[base] ?? 0) !== SHORTCUT_RAW_TYPE) continue;
      if ((allLayersData[base + 1] ?? 0) === 0) continue;
      if ((allLayersData[base + 2] ?? 0) === 0) continue;
      seenSlots.add(i);
    }
  }

  if (seenSlots.size === 0) {
    return { name: "getShortcuts", code: 0, data: { shortcuts: [] } };
  }

  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, config * profileSize, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  const shortcuts: ShortcutEntry[] = [];
  for (const keySlot of [...seenSlots].sort((a, b) => a - b)) {
    const defBase = keySlot * KEY_ITEM_SIZE;
    const hidCode = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[defBase] ?? 0,
      rawDefaultData[defBase + 1] ?? 0,
      rawDefaultData[defBase + 2] ?? 0,
    );
    shortcuts.push({ type: ADVANCED_SHORTCUT_TYPE, code: hidCode });
  }

  return { name: "getShortcuts", code: 0, data: { shortcuts } };
}

/**
 *
 * 读取指定组合键详情
 *
 * 流程：
 *  1. 验证 type === 3
 *  2. 0x04/0x05 读取板载（config）与层（layer）
 *  3. 0x07 读取当前层默认矩阵，按 HID code 找 keySlot
 *  4. 0x08 读取当前层该槽位 3 字节，确认 byte[0]=0x10
 *  5. 解析 byte[1]（修饰字节）：bit0-7 → {type:3, code:0xe0+i}，每个置位 bit 生成一项
 *  6. 解析 byte[2]（主键码）：直接作为 code，附加到 keys 末尾
 *
 */
export async function* getShortcut(
  request: GetShortcutParams,
): DeviceSession<GetShortcutResult> {
  const emptyData = (code: number): ShortcutDetail => ({
    type: ADVANCED_SHORTCUT_TYPE, code, keys: [],
  });

  if (request.type !== ADVANCED_SHORTCUT_TYPE) {
    return { name: "getShortcut", code: 3, data: emptyData(request.code), message: "type must be 3 (Shortcut)" };
  }

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let keySlot = -1;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0,
      rawDefaultData[base + 1] ?? 0,
      rawDefaultData[base + 2] ?? 0,
    );
    if (hid === request.code) { keySlot = i; break; }
  }
  if (keySlot < 0) {
    return { name: "getShortcut", code: 3, data: emptyData(request.code), message: "key not found in default matrix" };
  }

  const rawCurLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  const keyBase  = keySlot * KEY_ITEM_SIZE;
  const rawType  = rawCurLayerData[keyBase] ?? 0;
  const modByte  = rawCurLayerData[keyBase + 1] ?? 0;
  const codeByte = rawCurLayerData[keyBase + 2] ?? 0;

  if (rawType !== SHORTCUT_RAW_TYPE) {
    return {
      name: "getShortcut",
      code: 3,
      data: emptyData(request.code),
      message: `key at slot ${keySlot} is not a Shortcut (type=0x${rawType.toString(16)})`,
    };
  }

  const hidCode = resolveHidCodeFromDefaultKeyTriplet(
    rawDefaultData[keyBase] ?? 0,
    rawDefaultData[keyBase + 1] ?? 0,
    rawDefaultData[keyBase + 2] ?? 0,
  );

  // 解析 modByte（byte[1]）：bit0-7 → 修饰键 code 0xe0-0xe7
  const keys: ShortcutKeyItem[] = parseShortcutModifierByte(modByte);
  // 解析 codeByte（byte[2]）：直接作为主键 code
  if (codeByte > 0) {
    keys.push({ type: ADVANCED_SHORTCUT_TYPE, code: codeByte });
  }

  return {
    name: "getShortcut",
    code: 0,
    data: { type: ADVANCED_SHORTCUT_TYPE, code: hidCode, keys },
  };
}

/**
 *
 * 添加/更新组合键
 *
 * 流程：
 *  1. 验证 type===3，keys 数组非空
 *  2. 将 keys 编码为 [modifierByte, mainCodeByte]：
 *     - code >= 0xe0 → 将 (code-0xe0) 对应 bit 置入 modifierByte
 *     - code <  0xe0 → mainCodeByte（最后一个为准）
 *  3. 0x04/0x05 读取板载（config）与层（layer）
 *  4. 0x07 当前局部层默认矩阵，按 HID code 找 keySlot
 *  5. 0x09 将 keySlot 写为 [0x10, modifierByte, mainCodeByte]
 *
 */
export async function* addShortcut(
  request: AddShortcutParams,
): DeviceSession<AddShortcutResult> {
  if (request.type !== ADVANCED_SHORTCUT_TYPE) {
    return { name: "addShortcut", code: 3, message: "type must be 3 (Shortcut)" };
  }
  if (!Array.isArray(request.keys) || request.keys.length === 0) {
    return { name: "addShortcut", code: 3, message: "keys must be a non-empty array" };
  }

  const [modifierByte, mainCodeByte] = encodeShortcutKeys(request.keys);
  if (modifierByte === 0 && mainCodeByte === 0) {
    return { name: "addShortcut", code: 3, message: "keys encode to all-zero bytes; at least one modifier or main key is required" };
  }

  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let keySlot = -1;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0,
      rawDefaultData[base + 1] ?? 0,
      rawDefaultData[base + 2] ?? 0,
    );
    if (hid === request.code) { keySlot = i; break; }
  }
  if (keySlot < 0) {
    return { name: "addShortcut", code: 3, message: "key not found in default matrix" };
  }

  const keyWriteOff    = layerOffset + keySlot * KEY_ITEM_SIZE;
  const [kLo, kHi]    = shiftFrom16Bit(keyWriteOff);
  const kChk = (kLo + kHi + KEY_ITEM_SIZE + SHORTCUT_RAW_TYPE + modifierByte + mainCodeByte) & 0xff;
  const wKeyIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
    kLo, kHi, 0x00,
    SHORTCUT_RAW_TYPE, modifierByte, mainCodeByte,
  ]);
  const wKeyCode = parseWriteResponseCode(wKeyIn);
  if (wKeyCode !== 0) return { name: "addShortcut", code: wKeyCode, message: "write shortcut definition failed" };

  return { name: "addShortcut", code: 0 };
}

/**
 *
 * 删除组合键（恢复为默认定义）
 *
 * 流程：
 *  1. 0x04/0x05 读取板载（config）与层（layer）
 *  2. 0x07 当前局部层默认矩阵，按 HID code 找 keySlot
 *  3. 0x08 当前层确认 keySlot 类型为 0x10
 *  4. 0x09 将 keySlot 恢复为 0x07 同局部层默认定义
 *
 */
export async function* delShortcut(
  request: DelShortcutParams,
): DeviceSession<DelShortcutResult> {
  const { config, layer } = yield* resolveConfigLayerGen(request.layer);
  const profileSize = KEY_LAYER_LENGTH * 4;
  const layerOffset = layer * KEY_LAYER_LENGTH + config * profileSize;

  const rawDefaultData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_DEFAULT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  let keySlot = -1;
  for (let i = 0; i < KEY_COUNT; i++) {
    const base = i * KEY_ITEM_SIZE;
    const hid  = resolveHidCodeFromDefaultKeyTriplet(
      rawDefaultData[base] ?? 0,
      rawDefaultData[base + 1] ?? 0,
      rawDefaultData[base + 2] ?? 0,
    );
    if (hid === request.code) { keySlot = i; break; }
  }
  if (keySlot < 0) {
    return { name: "delShortcut", code: 3, message: "key not found in default matrix" };
  }

  const rawCurLayerData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_KEY_CURRENT_COMMAND, layerOffset, KEY_LAYER_LENGTH, DATA_LENGTH,
  );

  const keyBase = keySlot * KEY_ITEM_SIZE;
  const rawType = rawCurLayerData[keyBase] ?? 0;
  if (rawType !== SHORTCUT_RAW_TYPE) {
    return {
      name: "delShortcut",
      code: 3,
      message: `key at slot ${keySlot} is not a Shortcut (type=0x${rawType.toString(16)})`,
    };
  }

  const defBase = keySlot * KEY_ITEM_SIZE;
  const defType = rawDefaultData[defBase]     ?? 0x00;
  const defExt  = rawDefaultData[defBase + 1] ?? 0x00;
  const defCode = rawDefaultData[defBase + 2] ?? 0x00;

  const keyWriteOff    = layerOffset + keySlot * KEY_ITEM_SIZE;
  const [kLo, kHi]    = shiftFrom16Bit(keyWriteOff);
  const kChk = (kLo + kHi + KEY_ITEM_SIZE + defType + defExt + defCode) & 0xff;
  const wRestoreIn: InPacket = yield buildOutPacket(FLAG, [
    SET_KEY_CURRENT_COMMAND, 0x00, kChk, KEY_ITEM_SIZE,
    kLo, kHi, 0x00,
    defType, defExt, defCode,
  ]);
  const wRestoreCode = parseWriteResponseCode(wRestoreIn);
  if (wRestoreCode !== 0) return { name: "delShortcut", code: wRestoreCode, message: "restore key definition failed" };

  return { name: "delShortcut", code: 0 };
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

  const rBaseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = rBaseIn[8] ?? 0;
  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, config * 64, 64, DATA_LENGTH,
  );

  const oldByte = funcData[CALIBRATION_CFG_OFFSET] ?? 0;
  const newByte = (oldByte & ~(1 << 2)) | ((sw & 0x01) << 2);

  const [lo, hi]  = shiftFrom16Bit(config * 64 + CALIBRATION_CFG_OFFSET);
  const size      = 1;
  const checksum  = (lo + hi + size + newByte) & 0xff;
  const wIn: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, checksum, size,
    lo, hi, 0x00,
    newByte,
  ]);
  const wCode = parseWriteResponseCode(wIn);
  if (wCode !== 0) return { name: "setBiCalibration", code: wCode, message: "write calibration failed" };

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

  const rBaseIn: InPacket = yield buildOutPacket(FLAG, [...GET_Base]);
  const config = rBaseIn[8] ?? 0;
  const funcData: number[] = yield* readChunkedDataByCommandGen(
    FLAG, GET_Func_COMMAND, config * 64, 64, DATA_LENGTH,
  );

  const oldByte = funcData[CALIBRATION_CFG_OFFSET] ?? 0;
  const newByte = (oldByte & ~(1 << 3)) | ((sw & 0x01) << 3);

  const [lo, hi]  = shiftFrom16Bit(config * 64 + CALIBRATION_CFG_OFFSET);
  const size      = 1;
  const checksum  = (lo + hi + size + newByte) & 0xff;
  const wIn: InPacket = yield buildOutPacket(FLAG, [
    SET_Func_COMMAND, 0x00, checksum, size,
    lo, hi, 0x00,
    newByte,
  ]);
  const wCode = parseWriteResponseCode(wIn);
  if (wCode !== 0) return { name: "setCalibration", code: wCode, message: "write calibration failed" };

  return { name: "setCalibration", code: 0 };
}

/**
 *
 * 恢复出厂设置
 *
 * 流程：发送 [0x55, 0xee, 0x00 × 62]，等待设备回包
 *
 */
export async function* resetKeyboard(): DeviceSession<ResetKeyboardResult> {
  const inPacket: InPacket = yield buildOutPacket(0x55, [0xee]);
  const resCode = parseWriteResponseCode(inPacket);
  return { name: "resetKeyboard", code: resCode };
}

/**
 *
 * 解析设备主动上报的校准事件（仅响应，无请求）
 *
 * 识别条件：buffer[0] === 0xa1
 * 按键定义：buffer[1..3] 为三字节 [type, ext, code]，与 0x07 默认按键矩阵一致
 *
 * @returns 校准事件 JSON；非校准包返回 null
 *
 */
export function parseOnCalibration(buffer: InPacket | number[]): OnCalibrationResult | null {
  if (!buffer || buffer.length < 4) return null;
  if ((buffer[0] ?? 0) !== ON_CALIBRATION_REPORT) return null;

  const rawType  = buffer[1] ?? 0;
  const extByte  = buffer[2] ?? 0;
  const codeByte = buffer[3] ?? 0;

  const hidCode = resolveHidCodeFromDefaultKeyTriplet(rawType, extByte, codeByte);
  if (!isKnownEventKeyCode(hidCode)) {
    return {
      name: "onCalibration",
      code: 3,
      data: [{ key: "" }],
      message: "unknown key definition",
    };
  }

  const key = resolveKeyNameByCode(hidCode, "");
  return {
    name: "onCalibration",
    code: 0,
    data: [{ key }],
  };
}

// ─── 统一分发入口 ─────────────────────────────────────────────────────────────

/**
 * 按名称分发 Session。
 * 传入 `{ name, data }` 即可，无需关心具体函数签名。
 *
 * @example
 * const session = createSession({ name: "getBasicKey", data: { layer:0, pageNo:1, pageSize:25 } });
 * let step = await session.next();
 * while (!step.done) {
 *   step = await session.next(await sendToDevice(step.value));
 * }
 * console.log(step.value);
 */
export type SessionRequest =
  | { name: "getBasicConfig"; data?: null }
  | { name: "setConfigLayerIndex"; data: SetBasicConfigParams }
  | { name: "getBasicKey";    data: GetBasicKeyParams }
  | { name: "getKeyInfo";     data: GetKeyInfoParams }
  | { name: "setKeyInfo";     data: SetKeyInfoParams }
  | { name: "getPerf";        data: GetPerfParams }
  | { name: "setPerf";        data: SetPerfParams }
  | { name: "getRate";        data?: null }
  | { name: "setRate";        data: SetRateParams }
  | { name: "resetRT";        data: ResetRTParams }
  | { name: "resetKeyInfo";   data: ResetKeyInfoParams }
  | { name: "getDeviceInfo";  data?: null }
  | { name: "getCalibration"; data?: null }
  | { name: "getLight";       data?: null }
  | { name: "setLight";       data: SetLightParams }
  | { name: "getDKSList";     data?: null }
  | { name: "getTGLList";     data: GetTGLListParams }
  | { name: "getTGL";         data: GetTGLParams }
  | { name: "setTGL";         data: SetTGLParams }
  | { name: "getDKS";         data: GetDKSParams }
  | { name: "setDKS";         data: SetDKSParams }
  | { name: "delDKS";         data: DelDKSParams }
  | { name: "delTGL";         data: DelTGLParams }
  | { name: "getMTList";      data: GetMTListParams }
  | { name: "getMT";          data: GetMTParams }
  | { name: "setMT";          data: SetMTParams }
  | { name: "delMT";          data: DelMTParams }
  | { name: "getRSList";      data: GetRSListParams }
  | { name: "getRS";          data: GetRSParams }
  | { name: "setRS";          data: SetRSParams }
  | { name: "delRS";          data: DelRSParams }
  | { name: "getSOCDList";    data?: GetSOCDListParams }
  | { name: "getSOCD";        data: GetSOCDParams }
  | { name: "setSOCD";        data: SetSOCDParams }
  | { name: "delSOCD";        data: DelSOCDParams }
  | { name: "getOKSList";     data: GetOKSListParams }
  | { name: "getOKS";         data: GetOKSParams }
  | { name: "setOKS";         data: SetOKSParams }
  | { name: "delOKS";         data: DelOKSParams }
  | { name: "getShortcuts";   data?: GetShortcutsParams }
  | { name: "getShortcut";    data: GetShortcutParams }
  | { name: "addShortcut";    data: AddShortcutParams }
  | { name: "delShortcut";    data: DelShortcutParams }
  | { name: "setBiCalibration"; data: SetBiCalibrationParams }
  | { name: "setCalibration";  data: SetCalibrationParams }
  | { name: "resetKeyboard";   data?: null }
  | { name: "getLockShortcuts"; data?: GetLockShortcutsParams }
  | { name: "setLockShortcuts"; data: SetLockShortcutsParams }
  | { name: "getMacros";        data?: GetMacrosParams }
  | { name: "getMacro";         data: GetMacroParams }
  | { name: "setMacro";         data: SetMacroParams }
  | { name: "delMacro";         data: DelMacroParams };

// ========== 推导核心 ========== start
export function createSession<T extends SessionRequest>(
  request: T,
): DeviceSession<SessionResultMap[T["name"]]>;
// ========== 推导核心 ========== end

export function createSession(request: SessionRequest): DeviceSession<unknown> {
  switch (request.name) {
    case "getBasicConfig":     return getBasicConfig();
    case "setConfigLayerIndex": return setConfigLayerIndex(request.data.config_index, request.data.layer_index);
    case "getBasicKey":        return getBasicKey(request.data);
    case "getKeyInfo":         return getKeyInfo(request.data);
    case "setKeyInfo":         return setKeyInfo(request.data);
    case "getPerf":            return getPerf(request.data);
    case "setPerf":            return setPerf(request.data);
    case "getRate":            return getRate();
    case "setRate":            return setRate(request.data);
    case "resetRT":            return resetRT(request.data);
    case "resetKeyInfo":       return resetKeyInfo(request.data);
    case "getDeviceInfo":      return getDeviceInfo();
    case "getCalibration":     return getCalibration();
    case "getLight":           return getLight();
    case "setLight":           return setLight(request.data);
    case "getDKSList":         return getDKSList();
    case "getTGLList":         return getTGLList(request.data);
    case "getTGL":             return getTGL(request.data);
    case "setTGL":             return setTGL(request.data);
    case "getDKS":             return getDKS(request.data);
    case "setDKS":             return setDKS(request.data);
    case "delDKS":             return delDKS(request.data);
    case "delTGL":             return delTGL(request.data);
    case "getMTList":          return getMTList(request.data);
    case "getMT":              return getMT(request.data);
    case "setMT":              return setMT(request.data);
    case "delMT":              return delMT(request.data);
    case "getRSList":          return getRSList(request.data);
    case "getRS":              return getRS(request.data);
    case "setRS":              return setRS(request.data);
    case "delRS":              return delRS(request.data);
    case "getSOCDList":        return getSOCDList(request.data ?? {});
    case "getSOCD":            return getSOCD(request.data);
    case "setSOCD":            return setSOCD(request.data);
    case "delSOCD":            return delSOCD(request.data);
    case "getOKSList":         return getOKSList(request.data);
    case "getOKS":             return getOKS(request.data);
    case "setOKS":             return setOKS(request.data);
    case "delOKS":             return delOKS(request.data);
    case "getShortcuts":       return getShortcuts(request.data ?? {});
    case "getShortcut":        return getShortcut(request.data);
    case "addShortcut":        return addShortcut(request.data);
    case "delShortcut":        return delShortcut(request.data);
    case "setBiCalibration":   return setBiCalibration(request.data);
    case "setCalibration":     return setCalibration(request.data);
    case "resetKeyboard":      return resetKeyboard();
    case "getLockShortcuts":   return getLockShortcuts(request.data ?? {});
    case "setLockShortcuts":   return setLockShortcuts(request.data);
    case "getMacros":          return getMacros(request.data ?? {});
    case "getMacro":           return getMacro(request.data);
    case "setMacro":           return setMacro(request.data);
    case "delMacro":           return delMacro(request.data);
  }
}

// ─── 推送事件分发入口 ─────────────────────────────────────────────────────────

/**
 * 推包处理器：
 *  - reportCode  设备主动上报包的第 0 字节标识
 *  - parse       收到原始 buffer 后返回解析结果；非目标包返回 null
 */
export type PushHandler<T> = {
  reportCode: number;
  parse: (buffer: number[]) => { code: number; data: T; message?: string } | null;
};

export type PushResultMap = {
  onCalibration: { key: string }[];
};

export type PushName = keyof PushResultMap;

function createOnCalibration(): PushHandler<PushResultMap["onCalibration"]> {
  return { reportCode: ON_CALIBRATION_REPORT, parse: parseOnCalibration };
}

/**
 * 按名称获取对应的推包处理器。
 *
 * @example
 * const handler = getPushHandler("onCalibration");
 * // 在 HID inputreport 回调中：
 * const result = handler.parse([...buffer]);
 * if (result) console.log(result);
 */
export function getPushHandler<T extends PushName>(name: T): PushHandler<PushResultMap[T]> {
  switch (name) {
    case "onCalibration": return createOnCalibration() as PushHandler<PushResultMap[T]>;
  }
}
export { buildOutPacket, getFuncPacketBytes, getCommandPacketBytes }
