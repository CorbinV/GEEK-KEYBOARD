/**
 * @sa/keyboard-protocol — 键盘协议层 + 会话层
 *
 * 零 I/O 依赖的纯逻辑包，可在 Node.js 下做单元测试。
 */

// 适配层统一导出
export {
  createSession,
  type SessionRequest,
  type SessionRequestData,
  type DeviceSession,
  type SessionResultMap,
  buildOutPacket,
  getFuncPacketBytes,
  getCommandPacketBytes,
  isKeyboardOutPacket,
  isKeyboardInPacket,
  extractPayload,
} from './adapter';

// vendor 类型导出（供业务层使用）
export type {
  InPacket,
  OutPacket,
  BasicConfig,
  SetBasicConfigParams,
  GetBasicKeyParams,
  GetKeyInfoParams,
} from './vendor/KeyboardAPI';

// vendor 推送事件导出
export {
  type PushHandler,
  type PushResultMap,
  type PushName,
  getPushHandler,
} from './vendor/KeyboardAPI';

// 二进制匹配规则（HID 路由基础设施）
export type BinaryMatchPattern = {
  position: number;
  value: number;
};

// vendor 按键映射导出
export {
  EVENT_TO_CODE_MAP,
  KEY_NAME_BY_CODE,
  KEY_RETURN_ORDER,
  KEY_FUNCTION_MAP,
  normalizeToHidCode,
  resolveKeyNameByCode,
  resolveKeyFunctionByRawTriplet,
  convertKeyTypeForOutput,
  resolveKeyType,
} from './vendor/KeyCodeName';
