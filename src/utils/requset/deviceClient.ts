export type SendOps = {
  name: string;
  data?: any;
};
export type SendCfg = {
  waitResponse?: boolean;
  msgId?: string;
};
// export type MessageConfig = SendOps &
//   SendCfg & {
//     // optimize: other params
//   };

// change to V5.0
export type RespOps<T = any> = {
  name: string;
  code: number;
  data: T;
};
const useMock: boolean = import.meta.env?.VITE_USE_MOCK === 'Y';
/** @notice: just handle export mock data */
function getAllMock() {
  const modules = import.meta.glob('@/service/data/**/*.ts', { eager: true });
  const res: any = {};
  Object.entries(modules).forEach(([_, module]) => {
    Object.assign(res, module);
  });
  return res;
}
const mockData = useMock ? getAllMock() : {};

import type { DeviceSession } from '@sa/keyboard-protocol';

export class UsbTransfor {
  /**
   * @description: Transport dependencies.
   *               In a production environment, an exception is thrown
   *               if the device calls the data transfer function without instantiation.
   */
  private communicator: any;
  private listenerMap: WeakMap<(data: any) => void, (data: any) => void> = new WeakMap();
  private sessionLock: Promise<any> | null = null;
  constructor() {
    this.communicator = undefined;
  }
  getCommunicator() {
    if (!this.communicator) {
      throw new Error('Please initialize the device first');
    }
    return this.communicator;
  }
  setCommunicator(communicator: any) {
    this.communicator = communicator;
  }
  request<T = any>(ops: SendOps, _cfg?: SendCfg): Promise<RespOps<T>> {
    try {
      if (useMock) {
        return new Promise(resolve => {
          const data = mockData[ops.name];
          resolve(data);
        });
      }
      const { name, data} = ops;
      const sendOps: { name: string; data?: any } = { name };
      if (data) {
        sendOps.data = data;
      }
      return this.getCommunicator().send(sendOps);
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }
  async send<T = any>(opstions: SendOps, cfg: SendCfg = { waitResponse: true }): Promise<T> {
    // optimize: transform options and config to request
    const sendOps = JSON.parse(JSON.stringify(opstions));
    const { code, data } = await this.request<T>(sendOps, cfg);
    if (code !== 0) {
      throw new Error('error');
    }
    return data;
  }

  requestBinary<_T = any>(data: Uint8Array, cfg?: { waitResponse?: boolean; msgId?: string }): Promise<BinaryType> {
    try {
      if (useMock) {
        return Promise.resolve(new Uint8Array() as unknown as BinaryType);
      }
      const { msgId } = cfg || {};
      return this.getCommunicator().sendBinary(data, { withoutResponse: cfg?.waitResponse === false, msgId });
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async sendBinary(data: Uint8Array, cfg: SendCfg = { waitResponse: true }) {
    return await this.requestBinary<string>(data, cfg);
  }

  async executeSession<T>(session: DeviceSession<{ code: number; data: T }>): Promise<T> {
    // Keyboard protocol: strict one-at-a-time — serial lock
    while (this.sessionLock) {
      await this.sessionLock;
    }
    let resolveLock!: () => void;
    this.sessionLock = new Promise<void>(r => { resolveLock = r; });

    try {
      let step = await session.next();
      while (!step.done) {
        const outPacket = step.value;
        const inPacket = await this.requestBinary<number[]>(
          new Uint8Array(outPacket),
          { msgId: `${outPacket[1]}` }
        );
        const arr = inPacket instanceof Uint8Array
          ? Array.from(inPacket)
          : (inPacket as unknown as number[]);
        step = await session.next(arr);
      }
      const result = step.value;
      if (result.code !== 0) {
        throw new Error(`session error: code=${result.code}`);
      }
      return result.data;
    } finally {
      resolveLock();
      this.sessionLock = null;
    }
  }

  listen<T>(name: string, cb: (data: T) => void): void {
    const wrap = (data: RespOps<T>) => cb(data.data);
    if (this.listenerMap.has(cb)) {
      throw new Error('Listener already exists');
    }
    if (useMock) {
      return
    }
    this.listenerMap.set(cb, wrap);
    return this.getCommunicator().on(name, wrap);
  }
  removeListener<T>(name: string, cb: (data: T) => void): void {
    const wrap = this.listenerMap.get(cb);
    if (!wrap) {
      throw new Error('Listener not found');
    }
    if (useMock) {
      return
    }
    this.getCommunicator().off(name, wrap);
    this.listenerMap.delete(cb);
  }
}
const requestClient = new UsbTransfor();
export { requestClient };
export default requestClient;
