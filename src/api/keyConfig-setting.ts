import requestClient from './config';
import type { KeyboardSetting, SetKeyboardSetting, DeviceInfo } from './modules/keyboard-setting';

export function getKeyboardSetting() {
  return requestClient.send<KeyboardSetting>({
    name: 'getKeyboardSetting'
  });
}

export function setKeyboardSetting(data: SetKeyboardSetting) {
  return requestClient.send<never>({
    name: 'setKeyboardSetting',
    data
  });
}

export function resetKeyboard() {
  return requestClient.send<never>({
    name: 'resetKeyboard'
  });
}

export function getDeviceInfo() {
  return requestClient.send<DeviceInfo>({
    name: 'getDeviceInfo'
  });
}
