import requestClient from '@/utils/requset/deviceClient';
import type { KeyboardSetting, ResetKeyboard } from './modules/keyboard-setting';

export function getKeyboardSetting() {
  return requestClient.send<{ [key: string]: KeyboardSetting }>({
    name: 'getKeyboardSetting'
  });
}

export function resetKeyboard() {
  return requestClient.send<{ [key: string]: ResetKeyboard }>({
    name: 'resetKeyboard'
  });
}
