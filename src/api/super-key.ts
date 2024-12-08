import requestClient from './config';
import type {
  DksItem,
  DksList,
  MTItem,
  MTList,
  OksBase,
  OksList,
  Page,
  RSBase,
  RSList,
  ResetDksName,
  ResetMTName,
  ResetOksName,
  ResetRSName,
  ResetSOCDName,
  ResetTGLName,
  SOCDBase,
  SOCDList,
  TGLItem,
  TGLList
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

// mt
export function getMTList(data: Page) {
  return requestClient.send<MTList>({
    name: 'getMTList',
    data
  });
}
export function resetMTName(data: ResetMTName) {
  return requestClient.send<never>({
    name: 'setMTName',
    data
  });
}
export function deleteMTByCode(data: { code: number }) {
  return requestClient.send<never>({
    name: 'delMT',
    data
  });
}
export function getTargetMT(data: BaseKey) {
  return requestClient.send<MTItem>({
    name: 'getMT',
    data
  });
}
export function addMT(data: MTItem) {
  return requestClient.send<never>({
    name: 'setMT',
    data
  });
}

// tgl
export function getTGLList(data: Page) {
  return requestClient.send<TGLList>({
    name: 'getTGLList',
    data
  });
}
export function resetTGLName(data: ResetTGLName) {
  return requestClient.send<never>({
    name: 'setTGLName',
    data
  });
}
export function deleteTGLByCode(data: { code: number }) {
  return requestClient.send<never>({
    name: 'delTGL',
    data
  });
}
export function getTargetTGL(data: BaseKey) {
  return requestClient.send<never>({
    name: 'getTGL',
    data
  });
}
export function addTGL(data: TGLItem) {
  return requestClient.send<never>({
    name: 'setTGL',
    data
  });
}

// DKS
export function getDksList() {
  return requestClient.send<DksList>({
    name: 'getDKSList'
  });
}
export function resetDksName(data: ResetDksName) {
  return requestClient.send<never>({
    name: 'setDKSName',
    data
  });
}
export function deleteDksByCode(data: { code: number }) {
  return requestClient.send<never>({
    name: 'delDKS',
    data
  });
}
export function getTargetDks(data: BaseKey) {
  return requestClient.send<DksItem>({
    name: 'getDKS',
    data
  });
}
export function addDks(data: DksItem) {
  return requestClient.send<never>({
    name: 'setDKS',
    data
  });
}
