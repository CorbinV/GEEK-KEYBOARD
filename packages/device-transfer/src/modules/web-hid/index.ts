/// <reference types="@types/w3c-web-hid" />
import logger from '@sa/log';
import { HIDMessageListener, HIDMessageQueue } from './message-queue';
import type { FilterType, HIDProtocolOptions, HIDResponse } from './types';
import { HIDMessageCodec } from './utils';
const webHidLogger = logger.getLogger('web-hid');
export class HIDProtocolController extends EventTarget {
  private device: HIDDevice | null = null;
  private messageQueue: HIDMessageQueue;
  private listenerMap: HIDMessageListener;
  private codec: HIDMessageCodec;
  private messageCounter: number = 0;
  private connected: boolean = false;
  private options: HIDProtocolOptions;
  private filterConditions: FilterType | null = null;

  constructor(options: HIDProtocolOptions = {}) {
    super();
    this.options = {
      timeout: 5000,
      retryAttempts: 1,
      retryDelay: 1000,
      ...options
    };
    this.messageQueue = new HIDMessageQueue();
    this.codec = new HIDMessageCodec();
    this.listenerMap = new HIDMessageListener();
  }
  public getInstance() {
    return this.device;
  }
  async connect(filters: FilterType) {
    const { usagePage, ...rest } = filters;
    try {
      this.filterConditions = filters;
      let device: HIDDevice | undefined;
      const pairedDevice = await this.pairedDeviceByFilter(filters);
      if (pairedDevice) {
        device = pairedDevice;
      } else {
        const devices = await navigator.hid.requestDevice({
          filters: [rest]
        });
        if (devices.length === 0) {
          throw new Error('No device selected');
        }
        device = usagePage
          ? devices.find(dev => dev.collections.some(coll => coll.usagePage === usagePage))
          : undefined;
        device ||= devices[0];
      }
      this.device = device;
      await this.device.open();
      this.connected = true;

      this.device.addEventListener('inputreport', this.handleInput.bind(this));
      navigator.hid.addEventListener('disconnect', e => {
        const disconnectDevice = e.device;
        if (!disconnectDevice || !this.device) {
          return;
        }
        if (disconnectDevice?.productId !== this.filterConditions?.productId) {
          return;
        }
        if (disconnectDevice?.vendorId !== this.filterConditions?.vendorId) {
          return;
        }
        const isTargetDevice = disconnectDevice.collections.some(
          coll => coll.usagePage === this.filterConditions?.usagePage
        );
        if (isTargetDevice) {
          this.filterConditions = null;
          this.handleDisconnect();
        }
      });

      this.dispatchEvent(new CustomEvent('connected'));
    } catch (error) {
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
      throw error;
    }
  }
  async disconnect(device?: HIDDevice) {
    if (!this.connected) {
      return
    }
    if(device) {
      await device?.close();
    }else{
      await this.device?.close();
    }
    this.handleDisconnect();
  }
  async pairedDeviceByFilter(filters: FilterType) {
    const deviceList = await navigator.hid.getDevices();
    const device = deviceList.find(dev => {
      const baseCondition = [dev.productId === filters.productId, dev.vendorId === filters.vendorId];
      if (baseCondition.includes(false)) {
        return false;
      }
      return dev.collections.some(coll => coll.usagePage === filters.usagePage);
    });
    return device;
  }
  async send(data: any): Promise<HIDResponse> {
    if (!this.connected || !this.device) {
      throw new Error('Device not connected');
    }

    const messageId = `${Date.now()}-${this.messageCounter++}`;
    // const name = data.name;
    return await this.sendWithRetry(messageId, data, {
      attemptsLeft: this.options.retryAttempts || 1
    });
  }

  private async sendWithRetry(
    messageId: string,
    data: any,
    ops: {
      attemptsLeft?: number;
      withoutResponse?: boolean;
      isBinary?: boolean;
    }
  ): Promise<HIDResponse> {
    const { attemptsLeft = 1, withoutResponse = false, isBinary = false } = ops;
    try {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.messageQueue.remove(messageId);
          if (attemptsLeft > 1) {
            webHidLogger.debug('Requset retry 🟢', messageId, data);
            resolve(this.sendWithRetry(messageId, data, { attemptsLeft: attemptsLeft - 1, withoutResponse, isBinary }));
          } else {
            reject(new Error('Request timeout'));
          }
        }, this.options.timeout);
        webHidLogger.debug('Requset 🟢', isBinary ? 'binary data' : data);
        if (!withoutResponse) {
          this.messageQueue.add(messageId, {
            name: data.name,
            callback: (response: HIDResponse) => {
              clearTimeout(timeoutId);
              resolve(response);
            }
          });
        }

        const outputReports = this.codec[isBinary ? 'encodeBinaryMessage' : 'encodeMessage'](messageId, data);
        (async () => {
          for await (const outputReport of outputReports) {
            await this.device!.sendReport(0, outputReport);
          }

          this.dispatchEvent(
            new CustomEvent('messageSent', {
              detail: { messageId, data }
            })
          );
        })().catch(reject);
      });
    } catch (error) {
      this.messageQueue.remove(messageId);
      throw error;
    }
  }
  async on(name: string, callback: (data?: any) => void) {
    this.listenerMap.dispathOn(name, callback);
  }
  async off(name: string, callback: (data?: any) => void) {
    this.listenerMap.dispathOff(name, callback);
  }
  private async handleInput(event: HIDInputReportEvent) {
    try {
      const message = this.codec.decodeMessage(event.data);
      if (!message) {
        return;
      }
      const { name } = message;
      if (!name) {
        return;
      }
      const listeners = this.listenerMap.get(name);
      if (listeners) {
        const promiseArr = listeners.map(cb => cb(message));
        await Promise.all(promiseArr);
        return;
      }
      const matchingRequests = Array.from(this.messageQueue.entries()).find(([_, request]) => {
        return request.name === name;
      });
      const [messageId, requestInfo] = matchingRequests || [];
      const callback = requestInfo?.callback;
      if (!callback) {
        return;
      }
      webHidLogger.debug(`Received ${name} 🟩`, message);
      callback(message);
      this.messageQueue.remove(messageId!);

      this.dispatchEvent(
        new CustomEvent('messageReceived', {
          detail: message
        })
      );
    } catch (error) {
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    }
  }

  private handleDisconnect() {
    this.connected = false;
    this.messageQueue.clear();
    this.dispatchEvent(new CustomEvent('disconnected'));
  }
  // handle binary case
  async sendBinary(data: Uint8Array, { withoutResponse }: { withoutResponse?: boolean }): Promise<void> {
    if (!this.connected || !this.device) {
      throw new Error('Device not connected');
    }
    const messageId = `${Date.now()}-${this.messageCounter}`;
    this.messageCounter += 1;
    await this.sendWithRetry(messageId, data, {
      attemptsLeft: this.options.retryAttempts || 1,
      withoutResponse,
      isBinary: true
    });
  }
}
