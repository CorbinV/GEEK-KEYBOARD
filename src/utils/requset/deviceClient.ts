export type SendOps = {
  name: string;
  data?: any;
};
export type SendCfg = {
  waitResponse?: boolean;
};
export type MessageConfig = SendOps &
  SendCfg & {
    // optimize: other params
  };
export type RespOps<T = any> = {
  name: string;
  code: number;
  data: T;
};
const useMock: boolean = import.meta.env?.VITE_USE_MOCK === 'Y';

export class UsbTransfor {
  request<T = any>(config: MessageConfig): Promise<RespOps<T>> {
    if (useMock) {
      return new Promise(resolve => {
        import('@/service/data/key-cfg').then((res: any) => {
          const data = res[config.name];
          resolve(data);
        });
      });
    }
    // feat: use device to send data
    return new Promise(res => {
      res({
        name: config.name,
        code: 0,
        data: {} as T
      });
    });
  }
  async send<T = any>(opstions: SendOps, cfg: SendCfg = { waitResponse: true }): Promise<T | undefined> {
    // optimize: transform options and config to request
    const sendOps = JSON.parse(JSON.stringify(opstions));
    const { code, data } = await this.request<T>({
      ...sendOps,
      ...cfg
    });
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
