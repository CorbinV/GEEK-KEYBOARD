import { OTAProtocolController } from '../control';
import {
  genActiveCommand,
  genEndCommand,
  genEraseCommand,
  genTransferCommand,
  genTransferEndCommand,
  genVerifyCommand,
  validateStatus
} from './utils';
const DEFAULT_START_ADDRESS = 0x00004000;
export async function delay(delayMs: number) {
  return new Promise(res => {
    setTimeout(() => res(''), delayMs);
  });
}

export class WCH_585_OTA extends OTAProtocolController {
  private progress = 0;
  private onProgress?: (progress: number) => void;
  private startAddress: number;
  constructor(ops?: { startAddress?: number }) {
    super();
    const { startAddress = DEFAULT_START_ADDRESS } = ops || {};
    this.startAddress = startAddress;
  }
  // @ts-ignore
  async enableOtaMode(needActive?: boolean): Promise<boolean> {
    if (needActive) {
      await this.activeDevice();
    }
    const [success, message] = await this.eraseFlash();
    if (!success) {
      throw new Error(`Failed to enable OTA mode: ${message}`);
    }
    return success; // Return a number as expected by the base class
  }
  async transferContentData(ops?: { onProgress?: (progress: number) => void }) {
    try {
      if (!this.fileContent) {
        return false;
      }
      if (ops?.onProgress) {
        this.progress = 0;
        this.onProgress = ops.onProgress;
      }
      console.log('传输Flash...');
      await this.TransferFlash(this.fileContent);
      console.log('校验Flash...');
      await this.verifyFlash(this.startAddress, this.fileContent);
      console.log('结束IAP会话...');
      await this.endIAPSession();
      this.onProgress = undefined;
      return true;
    } catch (error) {
      this.onProgress = undefined;
      console.error(error);
      return false;
    }
  }
  async checkOtaStatus() {
    return true;
  }
  private async activeDevice() {
    if (!this.sendFnc) {
      return [false, 'device is not init'];
    }
    const commond = genActiveCommand();
    await this.sendFnc(commond, { withoutResponse: true, msgId: `${commond[0]}-${commond[1]}` });
    return [true, ''];
  }
  private async eraseFlash(startAddr: number = this.startAddress) {
    try {
      const cmd = await genEraseCommand(startAddr);
      if (!this.sendFnc) {
        return [false, 'device is not init'];
      }
      const res = await this.sendFnc(cmd, { msgId: `${cmd[0]}` });
      if (res && validateStatus(res)) {
        return [true, '']; // 成功返回
      }
      return [false, res?.join(', ')];
    } catch (error) {
      return [false, error];
    }
  }
  private async TransferFlash(firmwareData: Uint8Array, blockSize: number = 62, maxRetries: number = 3): Promise<void> {
    let offset = 0;
    let chunkCount = 0;
    const yieldInterval = 50; // 每发送多少块让出主线程
    try {
      const sendChunk = async (): Promise<void> => {
        if (offset >= firmwareData.length) return;

        const chunkSize = Math.min(blockSize, firmwareData.length - offset);
        const chunk = firmwareData.slice(offset, offset + chunkSize);
        const command = genTransferCommand(chunk);

        if (!this.sendFnc) return;

        let success = false;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await this.sendFnc(command, { withoutResponse: true, msgId: `${command[0]}` });
            success = true;
            break;
          } catch (error) {
            if (attempt === maxRetries) throw error;
            // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
            await new Promise(resolve => setTimeout(resolve, 20)); // 重试前延迟
          }
        }

        if (!success) throw new Error(`块编程失败 @ 0x${offset.toString(16)}`);

        offset += chunkSize;
        chunkCount++;

        // 进度更新（使用raf确保UI流畅）
        if (chunkCount % 10 === 0) {
          await new Promise<void>(resolve =>
            // eslint-disable-next-line no-promise-executor-return
            requestAnimationFrame(() => {
              if (this.onProgress) {
                const progress = Math.round((offset / firmwareData.length) * 50);
                // console.log(`编程进度: ${progress}%`);
                this.progress = progress;
                this.onProgress(this.progress);
              }
              resolve();
            })
          );
        }

        // 定期让出主线程
        if (chunkCount % yieldInterval === 0) {
          // eslint-disable-next-line no-promise-executor-return
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      };

      // 分块异步处理
      while (offset < firmwareData.length) {
        // eslint-disable-next-line no-await-in-loop
        await sendChunk();
        // eslint-disable-next-line no-await-in-loop
        await delay(5); // focus on the device
      }

      // 发送结束包
      const finishCommand = genTransferEndCommand();
      await this.sendFnc!(finishCommand, {
        withoutResponse: true,
        msgId: `${finishCommand[0]}`
      });
      await delay(2000); // wait for device to process
    } catch (error) {
      throw new Error(`编程Flash失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async verifyFlash(
    startAddr: number,
    firmwareData: Uint8Array,
    yieldInterval: number = 50 // 每发送多少块让出主线程
  ): Promise<void> {
    const blockSize: number = 56;
    const maxRetries: number = 3;
    let offset = 0;
    let chunkCount = 0;

    // 分块校验
    while (offset < firmwareData.length) {
      const chunkSize = Math.min(blockSize, firmwareData.length - offset);
      const chunk = firmwareData.slice(offset, offset + chunkSize);
      const currentAddr = startAddr + offset;
      const command = genVerifyCommand(currentAddr, chunk);

      let success = false;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // eslint-disable-next-line no-await-in-loop
        const status = await this.sendFnc!(command, { msgId: `${command[0]}` });

        if (status && validateStatus(status)) {
          success = true;
          break;
        }

        if (attempt === maxRetries) {
          throw new Error(`校验失败 @0x${currentAddr.toString(16)}(状态: ${status?.join(', ')})`);
        }

        console.warn(`块 ${currentAddr} 校验失败，重试 ${attempt + 1}/${maxRetries}`);
        // eslint-disable-next-line no-await-in-loop
        await delay(20);
      }

      if (!success) {
        throw new Error('校验操作中止');
      }

      offset += chunkSize;
      chunkCount++;

      // 进度更新（使用raf确保UI流畅）
      if (chunkCount % 10 === 0) {
        // eslint-disable-next-line no-await-in-loop, no-loop-func
        await new Promise<void>(resolve =>
          // eslint-disable-next-line no-promise-executor-return
          requestAnimationFrame(() => {
            if (this.onProgress) {
              const progress = Math.round((offset / firmwareData.length) * 50);
              // console.log(`编程进度: ${progress}%`);
              this.progress = progress / 2 + 50;
              this.onProgress(this.progress);
            }
            resolve();
          })
        );
      }

      // 定期让出主线程
      if (chunkCount % yieldInterval === 0) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await delay(0); // 让出主线程
      }
    }
  }
  private async endIAPSession() {
    try {
      if (!this.sendFnc) {
        return [false, 'device not init'];
      }
      const command = genEndCommand();
      await this.sendFnc(genEndCommand(), { withoutResponse: true, msgId: `${command[0]} ` });
      return [true, ''];
    } catch (error) {
      return [false, error];
    }
  }
}
