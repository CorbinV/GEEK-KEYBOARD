import requestClient from './config';
import type { DeviceInfo, DeviceIpt, Rate } from './modules/setting';

export function getDeviceInfo() {
  return requestClient.send<DeviceInfo>({
    name: 'gDevInfo'
  });
}
export function getRate() {
  return requestClient.send<Rate>({
    name: 'gRate'
  });
}
export function getInputType() {
  return requestClient.send<DeviceIpt>({
    name: 'gIptTp'
  });
}
export function setInputType(data: DeviceIpt) {
  return requestClient.send<DeviceIpt>({
    name: 'sIptTp',
    data
  });
}
export function setResetDevice() {
  return requestClient.send<never>({
    name: 'sRstDev'
  });
}
