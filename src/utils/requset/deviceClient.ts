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
    if (useMock) {
      return new Promise(resolve => {
        const data = mockData[ops.name];
        resolve(data);
      });
    }
    // feat: use device to send data
    return this.getCommunicator().send(ops);
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
  listen() {}
}
const requestClient = new UsbTransfor();
export { requestClient };
export default requestClient;
