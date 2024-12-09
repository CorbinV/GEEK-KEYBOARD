import { HIDProtocolController } from '@sa/device-transfer';
import { UsbTransfor } from './deviceClient';
export class ConnectionManager {
  private static instance: ConnectionManager;
  private deviceClient: UsbTransfor;
  private hidController: HIDProtocolController;

  constructor() {
    this.deviceClient = new UsbTransfor();
    this.hidController = new HIDProtocolController();
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new ConnectionManager();
    }
    return this.instance;
  }
  async connectDevice(deviceConfig: any) {
    await this.hidController.connect(deviceConfig);
    this.deviceClient.setCommunicator(this.hidController);
  }
  getDeviceClient() {
    return this.deviceClient;
  }
  onDeviceDisconnect(cb: any) {
    return this.hidController.addEventListener('disconnected', cb);
  }
}
