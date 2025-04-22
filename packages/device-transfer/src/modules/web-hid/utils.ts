import { arrayToJson, depacketize, objToArray, packetize } from '@sa/packetize';

// 消息编解码器
export class HIDMessageCodec {
  encodeMessage(_: string, data: any): Uint8Array[] {
    const sendBuf = objToArray(data);
    const packageList = packetize(sendBuf as Uint8Array, 64);
    return packageList;
  }
  encodeBinaryMessage(_: string, data: any): Uint8Array[] {
    const packageList = new Uint8Array(64);
    packageList.set(data);

    return [packageList];
  }
  decodeMessage(data: DataView): any {
    const contentBuf = depacketize(new Uint8Array(data.buffer));
    const jsonStr = arrayToJson(contentBuf || new Uint8Array());
    try {
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
