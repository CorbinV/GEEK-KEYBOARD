/**
 * 基本按键规则映射
 * 用于实现按键规则映射
 */
export type BasicKeyType =
  | "normal"
  | "smart"
  | "mt"
  | "super"
  | "disable"
  | "unknown";

export type BasicKeyRule = {
  /** HID code（十进制），例如 41 */
  code: number;
  /** 展示名称，例如 ESC / F1 / A */
  name: string;
};

export const EVENT_TO_CODE_MAP: Record<string, number> = {
  // 键盘按键
  ESC: 0x29, F1: 0x3a, F2: 0x3b, F3: 0x3c, F4: 0x3d, F5: 0x3e, F6: 0x3f, F7: 0x40, F8: 0x41, F9: 0x42, F10: 0x43, F11: 0x44, F12: 0x45, SYSRQ: 0x46, SCROLLLOCK: 0x47, PAUSE: 0x48, FN1: 245, FN2: 246, FN3: 247,
  GRAVE: 0x35, 1: 0x1e, 2: 0x1f, 3: 0x20, 4: 0x21, 5: 0x22, 6: 0x23, 7: 0x24, 8: 0x25, 9: 0x26, 0: 0x27, MIUNS: 0x2d, EQUAL: 0x2e, BACKSPACE: 0x2a, INSERT: 0x49, HOME: 0x4a, PAGEUP: 0x4b, NUMLOCK: 0x53, NUM_SLASH: 0x54, NUM_ASTERISK: 0x55, NUM_MINUS: 0x56,
  TAB: 0x2b, Q: 0x14, W: 0x1a, E: 0x08, R: 0x15, T: 0x17, Y: 0x1c, U: 0x18, I: 0x0c, O: 0x12, P: 0x13, LEFTBRACE: 0x2f, RIGHTBRACE: 0x30, BACKSLASH: 0x31, DELETE: 0x4c, END: 0x4d, PAGEDOWN: 0x4e, NUM_7: 0x5f, NUM_8: 0x60, NUM_9: 0x61, NUM_PLUS: 0x57,
  CAPSLOCK: 0x39, A: 0x04, S: 0x16, D: 0x07, F: 0x09, G: 0x0a, H: 0x0b, J: 0x0d, K: 0x0e, L: 0x0f, SEMICOLON: 0x33, APOSTROPHE: 0x34, ENTER: 0x28, NUM_4: 0x5c, NUM_5: 0x5d, NUM_6: 0x5e,
  LEFTSHIFT: 0xe1, Z: 0x1d, X: 0x1b, C: 0x06, V: 0x19, B: 0x05, N: 0x11, M: 0x10, COMMA: 0x36, DOT: 0x37, SLASH: 0x38, RIGHTSHIFT: 0xe5, UP: 0x52, NUM_1: 0x59, NUM_2: 0x5a, NUM_3: 0x5b, NUM_ENTER: 0x58,
  LEFTCTRL: 0xe0, LEFTWIN: 0xe3, LEFTALT: 0xe2, SPACE: 0x2c, RIGHTALT: 0xe6, RIGHTWIN: 0xe7, MENU: 0x76, RIGHTCTRL: 0xe4,LEFT: 0x50, DOWN: 0x51, RIGHT: 0x4f, NUM_0: 0x62, NUM_DOT: 0x63,

  // 鼠标按键
  MOUSE_SIDDOWN: 0xF4,  MOUSE_SIDUP: 0xF3, MOUSE_MID: 0xF2, MOUSE_RIGHT: 0xF1, MOUSE_LEFT: 0xF0,
};

/**
 * code(十进制) -> 名称
 * 例如：41(0x29) => Esc
 */
export const KEY_NAME_BY_CODE: Record<number, string> = (() => {
  const out: Record<number, string> = {};
  for (const [event, code] of Object.entries(EVENT_TO_CODE_MAP)) {
    if (out[code] === undefined) {
      out[code] = event;
    }
  }
  return out;
})();

/**
 * keys 返回顺序（按你维护的映射顺序）
 */
export const KEY_RETURN_ORDER: string[] = [
  "ESC", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "SYSRQ", "SCROLLLOCK", "PAUSE", "FN1", "FN2", "FN3",
  "GRAVE", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "MIUNS", "EQUAL", "BACKSPACE", "INSERT", "HOME", "PAGEUP", "NUMLOCK", "NUM_SLASH", "NUM_ASTERISK", "NUM_MINUS",
  "TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "LEFTBRACE", "RIGHTBRACE","BACKSLASH", "DELETE", "END", "PAGEDOWN", "NUM_7", "NUM_8", "NUM_9", "NUM_PLUS",
  "CAPSLOCK", "A", "S", "D", "F", "G", "H", "J", "K", "L", "SEMICOLON", "APOSTROPHE", "ENTER", "NUM_4", "NUM_5", "NUM_6",
  "LEFTSHIFT", "Z", "X", "C", "V", "B", "N", "M", "COMMA", "DOT", "SLASH", "RIGHTSHIFT","UP", "NUM_1", "NUM_2", "NUM_3", "NUM_ENTER",
  "LEFTCTRL", "LEFTWIN", "LEFTALT", "SPACE", "RIGHTALT", "RIGHTWIN", "MENU", "RIGHTCTRL","LEFT", "DOWN", "RIGHT", "NUM_0", "NUM_DOT",
  "MOUSE_SIDDOWN", "MOUSE_SIDUP", "MOUSE_MID", "MOUSE_RIGHT", "MOUSE_LEFT",
];

/**
 * 功能按键键值表
 * 格式: [type, ext, code]
 */
export const KEY_FUNCTION_MAP: Record<number, string> = {
  // 媒体区
  0x308301: "Player",
  0x30E900: "Vol +",
  0x30EA00: "Vol -",
  0x30E200: "Mute",
  0x30CD00: "Play",
  0x30B700: "Stop",
  0x30B600: "Previous Song",
  0x30B500: "Next Song",
  0x306f00: "Screen Bright +",
  0x307000: "Screen Bright -",
  0x302302: "Web Home",
  0x302702: "Web Refresh",
  0x302602: "Web Stop",
  0x302402: "Web Backward",
  0x302502: "Web Forward",
  0x302A02: "Web Favorite",
  0x302102: "Web Search",
  0x309401: "PC",
  0x309201: "Calc",
  0x308A01: "Email",
  0x309F02: "Mission Control",
  0x30CF00: "Siri",
  0x30A002: "Launchpad",

  // 主背光灯区
  0xF10101: "Light Mode -",
  0xF10201: "Light Mode +",
  0xF10301: "Light Mode",
  0xF10401: "Light Bright +",
  0xF10501: "Light Bright -",
  0xF10601: "Light Bright",
  0xF10701: "Light Speed +",
  0xF10801: "Light Speed -",
  0xF10901: "Light Speed",
  0xF10A01: "Light Color -",
  0xF10B01: "Light Color +",
  0xF10C01: "Light Color",
  0xF10D01: "Light Direction -",
  0xF10E01: "Light Direction +",
  0xF10F01: "Light Direction",
  0xF11001: "Light Bright off",
  0xF11101: "Light Test",
  0xF11201: "Light Custom",
  0xF11301: "One Click White Light",

  // 侧灯区
  0xF10102: "Side Light Mode -",
  0xF10202: "Side Light Mode +",
  0xF10302: "Side Light Mode",
  0xF10402: "Side Light Bright +",
  0xF10502: "Side Light Bright -",
  0xF10602: "Side Light Bright",
  0xF10702: "Side Light Speed +",
  0xF10802: "Side Light Speed -",
  0xF10902: "Side Light Speed",
  0xF10A02: "Side Light Color -",
  0xF10B02: "Side Light Color +",
  0xF10C02: "Side Light Color",
  0xF10D02: "Side Light Direction -",
  0xF10E02: "Side Light Direction +",
  0xF10F02: "Side Light Direction",
  0xF11002: "Side Light Bright off",

  // Win系统键
  0xF10104: "Win Lock",
  0xF10204: "Open Resource Management ",
  0xF10304: "Open Task Manager",
  0xF10404: "Return to Desktop",
  0xF10504: "Screenshot of Win Region",
  0xF10604: "Screenshot of Win",
  0xF10704: "Screen Keyboard",
  // Mac系统键
  0xF10105: "Scrennshot of Mac Region",
  0xF10205: "Screenshot of Mac",
  0xF10305: "Mac Search",

  // 特殊功能
  0xF10106: "Onboard Switching",
  0xF10206: "Previous onboard",
  0xF10306: "Next onboard",
  0xF10406: "Onboard 0",
  0xF10506: "Onboard 1",
  0xF10606: "Onboard 2",
  0xF10706: "Onboard 3",
  0xF10806: "Win/Mac Switch",
  0xF10906: "WIn Switch",
  0xF10A06: "Long Press Win Switch",
  0xF10B06: "Mac Switch",
  0xF10C06: "Long Press Mac Switch",
  0xF10D06: "Reset",
  0xF10E06: "Recalibrate",
  0xF10F06: "Open Web",
  0xF11006: "Boot",
  0xF11106: "Light Recording",
  0xF11206: "Keyboard Lock",
  0xF11306: "Sleep Switch",

  // 三模区
  0xF10107: "2.4G Link",
  0xF10207: "USB Link",
  0xF10307: "Bluetooth Link",
  0xF10407: "Bluetooth 1",
  0xF10507: "Bluetooth 2",
  0xF10607: "Bluetooth 3",
  0xF10707: "Check Battery Level",
};

/**
 * 用原始三字节 [type, ext, code] 解析功能键名称。
 */
export const resolveKeyFunctionByRawTriplet = (
  rawType: number,
  extByte: number,
  codeByte: number
): string | undefined => {
  const t = rawType & 0xff;
  const e = extByte & 0xff;
  const c = codeByte & 0xff;
  const composite = (t << 16) | (e << 8) | c;
  return KEY_FUNCTION_MAP[composite];
};
/**
 * 扩展转换：某些场景会拿到 100100 / 100200 这类值，
 * 在这里把"原始值"映射成标准 HID code（十进制）。
 */
export const RAW_VALUE_TO_CODE_MAP: Record<number, number> = {
  // 100100: 41, // => Esc (0x29)
  100100: 0xe0,  // L-Ctrl
  100200: 0xe1,  // L-Shift
  100400: 0xe2,  // L-Alt
  100800: 0xe3,  // L-Gui
  101000: 0xe4,  // R-Ctrl
  102000: 0xe5,  // R-Shift
  104000: 0xe6,  // R-Alt
  108000: 0xe7,  // R-Gui
  0xF00001: 245,  // FN1
  0xF00002: 246,  // FN2
  0xF00003: 247,  // FN3
};

export const normalizeToHidCode = (value: number): number => {
  if (Number.isInteger(value) && value in RAW_VALUE_TO_CODE_MAP) {
    return RAW_VALUE_TO_CODE_MAP[value]!;
  }
  return value;
};

/**
 * 固件 type 原始值 -> 语义类型
 * TODO: 你来补充完整规则
 */
export const KEY_TYPE_MAP: Record<number, BasicKeyType> = {
  // 0: "normal",
  // 1: "smart",
  // 2: "disable",
};

/**
 * 仅看固件首字节 type（与 0x10→0 同类）：键 = 首字节，值 = 对外 type。
 */
export const KEY_TYPE_OUTPUT_BY_FIRST_BYTE: Record<number, number> = {
  0x10: 0,
  0x30: 2,
  0x90: 5,
  0x70: 6,
  0x95: 7,
  0x94: 8,
  0x92: 9,
  0x91: 10,
  0x93: 11,
  0xf0: 4,
};

/**
 * 仅当首字节为 0xF1 时：键 = (0xF1<<8)|第三字节 code2，值 = 对外 type。
 */
export const KEY_TYPE_OUTPUT_F1_COMPOSITE_MAP: Record<number, number> = {
  0xf101: 4,
  0xf102: 4,
  0xf103: 4,
  0xf104: 1,
  0xf105: 1,
  0xf106: 4,
  0xf107: 4,
};

/**
 * 仅用于对外展示：把固件读到的首字节（及 0xF1 时加上第三字节 code2）映射成前端要的 type。
 * 按键解析、HID、tary 等**所有处理**须始终用设备原始 [type, ext, code]，禁止用本函数返回值参与解析。
 * - 首字节为 **0xF1**：用 `(0xF1<<8)|code2` 查 {@link KEY_TYPE_OUTPUT_F1_COMPOSITE_MAP}，无条目则返回原始首字节。
 * - 否则：只按首字节查 {@link KEY_TYPE_OUTPUT_BY_FIRST_BYTE}（与 0x10 相同只看第一字节），无条目则返回原始首字节。
 */
export const convertKeyTypeForOutput = (
  rawType: number,
  codeByte: number
): number => {
  const t = rawType & 0xff;
  const c = codeByte & 0xff;
  if (t === 0xf1) {
    const composite = (t << 8) | c;
    if (composite in KEY_TYPE_OUTPUT_F1_COMPOSITE_MAP) {
      return KEY_TYPE_OUTPUT_F1_COMPOSITE_MAP[composite]!;
    }
    return t;
  }
  if (t in KEY_TYPE_OUTPUT_BY_FIRST_BYTE) {
    return KEY_TYPE_OUTPUT_BY_FIRST_BYTE[t]!;
  }
  return t;
};

export const resolveKeyNameByCode = (
  code: number,
  fallback = `KeyCode_${code}`
): string => {
  const normalized = normalizeToHidCode(code);
  return KEY_NAME_BY_CODE[normalized] ?? fallback;
};

/** 语义类型查询须传固件读取的原始 type，勿传 convertKeyTypeForOutput 的结果 */
export const resolveKeyType = (rawType: number): BasicKeyType =>
  KEY_TYPE_MAP[rawType] ?? "unknown";
