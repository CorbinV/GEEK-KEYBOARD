export type SendOps = {
  name: string;
  data?: any;
};
export type SendCfg = {
  waitResponse?: boolean;
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

export class UsbTransfor {
  /**
   * @description: Transport dependencies.
   *               In a production environment, an exception is thrown
   *               if the device calls the data transfer function without instantiation.
   */
  private communicator: any;
  private listenerMap: WeakMap<(data: any) => void, (data: any) => void> = new WeakMap();
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

  requestBinary<_T = any>(data: Uint8Array, cfg?: SendCfg): Promise<BinaryType> {
    try {
      if (useMock) {
        // return new Promise(resolve => {
        //   const data = mockData[ops.name];
        //   resolve(data);
        // });
        return Promise.resolve(new Uint8Array() as unknown as BinaryType);
      }
      return this.getCommunicator().sendBinary(data, cfg);
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async sendBinary(data: Uint8Array, cfg: SendCfg = { waitResponse: true }) {
    return await this.requestBinary<string>(data, cfg);
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
