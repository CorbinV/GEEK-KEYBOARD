import requestClient from './config';
import type { KeyboardSetting, ResetKeyboard, SetKeyboardSetting } from './modules/keyboard-setting';

export function getKeyboardSetting() {
  return requestClient.send<{ [key: string]: KeyboardSetting }>({
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
  return requestClient.send<{ [key: string]: ResetKeyboard }>({
    name: 'resetKeyboard'
  });
}
