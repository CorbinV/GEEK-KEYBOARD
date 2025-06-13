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
  c: string;
  e: number;
  d: T;
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
      // feat: use device to send data
      return this.getCommunicator().send(ops);
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }
  async send<T = any>(opstions: SendOps, cfg: SendCfg = { waitResponse: true }): Promise<T> {
    try {
      // optimize: transform options and config to request
      const sendOps = JSON.parse(JSON.stringify(opstions));
      const { code, data } = await this.request<T>(sendOps, cfg);
      if (code !== 0) {
        throw new Error('error');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  requestBinary<T = any>(data: Uint8Array, cfg?: SendCfg): Promise<BinaryType> {
    try {
      if (useMock) {
        // return new Promise(resolve => {
        //   const data = mockData[ops.name];
        //   resolve(data);
        // });
      }
      return this.getCommunicator().sendBinary(data, cfg);
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async sendBinary(data: Uint8Array, cfg: SendCfg = { waitResponse: true }) {
    try {
      const binary = await this.requestBinary<string>(data, cfg);
      return binary;
    } catch (error) {
      throw error;
    }
  }
  listen() { }
}
const requestClient = new UsbTransfor();
export { requestClient };
export default requestClient;
