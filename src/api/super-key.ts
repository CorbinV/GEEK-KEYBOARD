import requestClient from '@/utils/requset/deviceClient';
import type { OksBase, OksList, ResetOksName } from './modules/super-key';
import type { BaseKey } from './modules/combo';
export function getOksList() {
  return requestClient.send<OksList>({
    name: 'getOKSList'
  });
}
export function resetOksName(data: ResetOksName) {
  return requestClient.send<never>({
    name: 'setOKSName',
    data
  });
}
export function deleteOksByCode(data: { code: number }) {
  return requestClient.send<never>({
    name: 'delOKS',
    data
  });
}
export function getTargetOks(data: BaseKey) {
  return requestClient.send<never>({
    name: 'getOKS',
    data
  });
}
export function addOks(data: OksBase) {
  return requestClient.send<never>({
    name: 'setOKS',
    data
  });
}
