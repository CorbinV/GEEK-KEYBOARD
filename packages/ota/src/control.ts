import { SendFncType } from "./types";

export abstract class OTAProtocolController {
  protected sendFnc: (SendFncType | null) | null = null;
  protected fileContent: Uint8Array | null = null; // bytesStream
  protected outMtu: number = 0;

  setSendFnc(fnc: (data: any, withoutResponse?: boolean) => Promise<any> | null) {
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
  abstract transferContentData(): Promise<boolean>
  abstract checkOtaStatus(): Promise<boolean>
}
