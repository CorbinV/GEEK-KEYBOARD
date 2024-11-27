import requestClient from '@/utils/requset/deviceClient';
import type {
  OksBase,
  OksList,
  RSBase,
  RSList,
  ResetOksName,
  ResetRSName,
  ResetSOCDName,
  SOCDBase,
  SOCDList
} from './modules/super-key';
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

// socd
export function getSOCDList() {
  return requestClient.send<SOCDList>({
    name: 'getSOCDList'
  });
}
export function resetSOCDName(data: ResetSOCDName) {
  return requestClient.send<never>({
    name: 'setSOCDName',
    data
  });
}
export function deleteSOCDByCode(data: { code: number }) {
  return requestClient.send<never>({
    name: 'delSOCD',
    data
  });
}
export function getTargetSOCD(data: BaseKey) {
  return requestClient.send<never>({
    name: 'getSOCD',
    data
  });
}
export function addSOCD(data: SOCDBase) {
  return requestClient.send<never>({
    name: 'setSOCD',
    data
  });
}

// rs
export function getRSList() {
  return requestClient.send<RSList>({
    name: 'getRSList'
  });
}
export function resetRSName(data: ResetRSName) {
  return requestClient.send<never>({
    name: 'setRSName',
    data
  });
}
export function deleteRSByCode(data: { code: number }) {
  return requestClient.send<never>({
    name: 'delRS',
    data
  });
}
export function getTargetRS(data: BaseKey) {
  return requestClient.send<never>({
    name: 'getRS',
    data
  });
}
export function addRS(data: RSBase) {
  return requestClient.send<never>({
    name: 'setRS',
    data
  });
}
