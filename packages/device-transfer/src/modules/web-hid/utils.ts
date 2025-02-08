import { arrayToJson, depacketize, objToArray, packetize } from '@sa/packetize';

// 消息编解码器
export class HIDMessageCodec {
  encodeMessage(_: string, data: any): Uint8Array[] {
    const sendBuf = objToArray(data);
    const packageList = packetize(sendBuf as Uint8Array, 64);
    return packageList;
  }
  encodeBinaryMessage(data: any): Uint8Array[] {
    const packageList = packetize(data as Uint8Array, 64);
    return packageList;
  }
  decodeMessage(data: DataView): any {
    try {
      const contentBuf = depacketize(new Uint8Array(data.buffer));
      const jsonStr = arrayToJson(contentBuf || new Uint8Array());
      if (contentBuf && jsonStr) {
        return JSON.parse(jsonStr);
      }
      return {};
    } catch (error) {
      console.log(error);
      throw new Error('decodeMessage fail: Invalid message format');
    }
  }
}
