/**
 * 编解码桥接层
 *
 * 从 vendor/KeyboardAPI.ts 重新导出纯编解码函数，供传输层和适配层使用。
 * 新增判断/提取函数，使 device-transfer 能识别 0x55/0xAA 包头。
 */

// 从 vendor 重新导出编解码纯函数
export { buildOutPacket, getFuncPacketBytes, getCommandPacketBytes } from '../vendor/KeyboardAPI';

/** 判断是否为键盘出包（首字节 0x55） */
export function isKeyboardOutPacket(data: number[] | Uint8Array): boolean {
  const head = data instanceof Uint8Array ? data[0] : data[0];
  return head === 0x55;
}

/** 判断是否为键盘回包（首字节 0xAA） */
export function isKeyboardInPacket(data: number[] | Uint8Array): boolean {
  const head = data instanceof Uint8Array ? data[0] : data[0];
  return head === 0xAA;
}

/** 从回包提取载荷：inPacket.slice(8, 8+size) */
export function extractPayload(inPacket: number[], size: number): number[] {
  return inPacket.slice(8, 8 + size);
}
