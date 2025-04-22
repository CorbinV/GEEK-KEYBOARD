import { BIT_CONDITION, VERSION } from "./constants";
import { CMD_ENUM } from "./enums";
import { OTAProtocolController } from "./control";


export class WCH_OTA extends OTAProtocolController {
  constructor() {
    super();
  }
  async transferContentData(ops?: { onProgress?: (progress: number) => void }) {
    const { onProgress } = ops || {};
    let result = false;
    try {
      if (!this.sendFnc || !this.fileContent) {
        throw new Error('sendFnc or fileContent is null');
      }
      let offset = 0;
      let sendFlag = 0;
      let sum = 0;
      const cLen = this.fileContent.length;
      const outMut = this.outMtu;
      const fixedNum = CMD_ENUM.H + this.outMtu + CMD_ENUM.T_D

      const buffer = new ArrayBuffer(outMut);
      const u8a = new Uint8Array(buffer);
      const onePercent = cLen / 100;
      let progress = 1;
      u8a[0] = CMD_ENUM.H;
      u8a[1] = outMut;
      u8a[2] = CMD_ENUM.T_D;
      const sendCmd = async (cs: number, len: number = outMut, ops?: { withoutResponse: boolean }) => {
        try {
          u8a[1] = len;
          u8a[len - 1] = cs;

          const res = await this.sendFnc!(u8a, ops);
          sum = 0;
          sendFlag = 0;
          return res;
        } catch (error: any) {
          throw new Error(error?.message || error);
        }
      }
      for await (const val of this.fileContent) {
        u8a[sendFlag + 3] = val; // data
        sum += val;
        sendFlag++;
        offset++;
        if (offset < cLen) {
          if (sendFlag === outMut - 4) {
            await sendCmd(sum + fixedNum, outMut, { withoutResponse: true })
            if (onProgress && (offset >= onePercent * progress)) {
              progress++;
              onProgress?.(progress);
            }
            u8a.fill(0x00, 3)
          }
        } else {
          if (sendFlag > 0) {
            // send last upgrade cmd
            await sendCmd(sum + u8a[1] + CMD_ENUM.H + CMD_ENUM.T_D, sendFlag + 4, { withoutResponse: true })
            let sendCmdStr = "";
            u8a.forEach(v => (sendCmdStr += `${v.toString(16)} `));
            console.log(`last package cmd: ${sendCmdStr}, offset: ${offset}, sendFlag: ${sendFlag}, checksum: ${u8a[outMut - 1].toString(16)}`);
            onProgress?.(100)
          }
        }
      }
      result = true;
    } catch (error) {
      console.log(error);
      result = false;
    }
    return result;
  }
  async enableOtaMode(data: any) {
    const { v, s1, s2, l1, l2 } = data;

    const cs = CMD_ENUM.H + CMD_ENUM.L_U + CMD_ENUM.T_U + v + s1 + s2 + l1 + l2;
    const u8 = new Uint8Array([CMD_ENUM.H, CMD_ENUM.L_U, CMD_ENUM.T_U, v, s1, s2, l1, l2, cs]);
    let result = 0;
    try {
      if (!this.sendFnc) {
        throw new Error('sendFnc is null');
      }
      const res = await this.sendFnc(u8, { withoutResponse: true });
      const ret = res?.getUint8(3);
      result = Number(!ret);

    } catch (error) {
      console.log(error);
      result = 0;
    }
    return result;
  }
  async checkOtaStatus() {
    let result = true;
    const buffer = new ArrayBuffer(this.outMtu);
    const u8a = new Uint8Array(buffer);
    u8a.set([CMD_ENUM.H, 4, CMD_ENUM.T_D, CMD_ENUM.H + CMD_ENUM.T_D + 4]);
    const res = await this.sendFnc!(u8a);
    const ret = res?.getUint8(3);
    if (ret !== 0) {
      result = false
      console.warn(`upgrade failed, response ret value = ${ret}`);
    }
    return result;
  }
  async quickUpgrade(ops: {
    fileContentSum: number,
    fileByteSize: number,
    fileContent: Uint8Array,
    outMtu: number
    fnc: (data: any, { withoutResponse }?: { withoutResponse?: boolean }) => Promise<any> | null
  }) {
    const {
      fnc,
      fileContent,
      fileContentSum,
      fileByteSize,
      outMtu,
    } = ops
    try {

      this.setSendFnc(fnc);
      this.setFileContent(fileContent);
      this.setOutMtu(outMtu);
      if (!this.sendFnc || !this.fileContent) {
        throw new Error('sendFnc or fileContent is null');
      }
      const s1 = fileContentSum & (0xffff >> 8);
      const l1 = fileByteSize > BIT_CONDITION ? fileByteSize & (0xff00 >> 8) : fileByteSize >> 8;
      await this.enableOtaMode({
        v: VERSION,
        s1: fileContentSum & (0xffff >> 8),
        s2: fileContentSum,
        l1: fileByteSize > BIT_CONDITION ? fileByteSize & (0xff00 >> 8) : fileByteSize >> 8,
        l2: fileByteSize,
      });
      console.log('enable ota mode success');
      await this.transferContentData();
      console.log('transfer content data success');
      await this.checkOtaStatus();
      console.log('check ota status success');
    } catch (error) {
      console.error('exception error in Function: quickUpgrande', error);
    }
  }
}
