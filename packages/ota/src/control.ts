import { SendFncType } from "./types";
import mitt from 'mitt';
export abstract class OTAProtocolController {
  protected sendFnc: (SendFncType | null) | null = null;
  protected fileContent: Uint8Array | null = null; // bytesStream
  protected outMtu: number = 0;
  protected emitter = mitt<{
    [key: string]: any
  }>()
  setSendFnc(fnc: (data: any, { withoutResponse }?: { withoutResponse?: boolean }) => Promise<any> | null) {
    this.sendFnc = fnc;
  }
  setFileContent(fileContent: Uint8Array) {
    this.fileContent = fileContent;
  }
  setOutMtu(mtu: number) {
    if (mtu <= 0) {
      throw new Error('output MTU is invalid');
    }
    this.outMtu = mtu;
  }
  abstract enableOtaMode(ops: {
    v: number,
    s1: number,
    s2: number,
    l1: number,
    l2: number,
  }): Promise<number>
  abstract transferContentData(ops?: { onProgress?: (progress: number) => void }): Promise<boolean>
  abstract checkOtaStatus(): Promise<boolean>

  on(event: string, handler: (...args: any[]) => void) {
    this.emitter.on(event, handler);
  }
  off(event: string, handler: (...args: any[]) => void) {
    this.emitter.off(event, handler);
  }

}
