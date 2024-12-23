import requestClient from './config';
import type { ComboGoup, ComboList, ComboLockData } from './modules/combo';
export function getComboList() {
  return requestClient.send<ComboList>({
    name: 'getShortcuts'
  });
}
export function getComboGroup(data: { type: number; code: number }) {
  return requestClient.send<ComboGoup>({
    name: 'getShortcut',
    data
  });
}
export function createComboGroup(data: ComboGoup) {
  return requestClient.send<null>({
    name: 'addShortcut',
    data
  });
}
export function deleteComboGroup(data: { code: number }) {
  return requestClient.send<null>({
    name: 'delShortcut',
    data
  });
}

export function getComboLock() {
  return requestClient.send<ComboLockData>({
    name: 'getLockShortcuts'
  });
}
export function setComboLock(data: ComboLockData) {
  return requestClient.send<null>({
    name: 'setLockShortcuts',
    data
  });
}
