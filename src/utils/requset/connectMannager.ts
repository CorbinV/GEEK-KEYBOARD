import { HIDProtocolController } from '@sa/device-transfer';
import { UsbTransfor } from './deviceClient';
export class ConnectionManager {
  private static instance: ConnectionManager;
  private deviceClient: UsbTransfor;
  private hidController: HIDProtocolController;
  // private msgAlisas = {
  //   name: 'c',
  //   code: 'e',
  //   data: 'd'
  // };
  constructor() {
    this.deviceClient = new UsbTransfor();
    this.hidController = new HIDProtocolController();
    // this.hidController.setMsgAlisas(this.msgAlisas);
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new ConnectionManager();
    }
    return this.instance;
  }
  scanPairedDevices(filters: any) {
    return HIDProtocolController.pairedDeviceByFilter(filters);
  }
  async connectDevice(devs: HIDDevice) {
    !devs?.opened && await devs.open()
    await this.hidController.bindDevice("", devs);
    this.deviceClient.setCommunicator(this.hidController);
  }
  getDeviceClient() {
    return this.deviceClient;
  }
  onDeviceDisconnect(cb: any) {
    return this.hidController.addEventListener('disconnected', cb);
  }
  deviceDisconnect() {
    this.hidController.disconnect();
  }
}
