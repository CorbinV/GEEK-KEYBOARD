import requestClient from './config';
import type { FctKeyRes } from './modules/test';
export function enableFct(data: { enable: number }) {
  return requestClient.send<never>({
    name: 'sFat',
    data
  });
}

export function setFctLight(data: { r: number; g: number; b: number }) {
  return requestClient.send<never>({
    name: 'gTstKs',
    data
  });
}
export function onFctKeyListener(cb: (data: FctKeyRes) => void) {
  return requestClient.listen<FctKeyRes>('gFctKs', cb);
}
export function offFctKeyListener(cb: (data: FctKeyRes) => void) {
  return requestClient.removeListener<FctKeyRes>('gFctKs', cb);
}
