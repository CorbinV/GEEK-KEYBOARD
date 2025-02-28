import requestClient from './config';
import type {
  DksItem,
  DksList,
  MTItem,
  MTList,
  OksItem,
  OksList,
  Page,
  RSItem,
  RSList,
  ReName,
  SOCDBase,
  SOCDList,
  TGLItem,
  TGLList
} from './modules/super-key';
import type { BaseKey } from './modules/combo';
import { KeyTypeEnum } from '@/enum/keyType';
export function getOksList() {
  return requestClient.send<OksList>({
    name: 'getOKSList'
  });
}
export function resetOksName(data: ReName) {
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
export function addOks(data: OksItem) {
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
export function resetSOCDName(data: ReName) {
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
export function getRSList(data: Page) {
  return requestClient.send<RSList>({
    name: 'getRSList',
    data
  });
}
export function resetRSName(data: ReName) {
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
export function addRS(data: RSItem) {
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
export function resetMTName(data: ReName) {
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
export function resetTGLName(data: ReName) {
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
export function resetDksName(data: ReName) {
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
export function deleteSpByCode(data: { type: KeyTypeEnum; code: number }) {
  let name = '';
  switch (data.type) {
    case KeyTypeEnum.Combo:
      name = 'delOKS';
      break;
    case KeyTypeEnum.DKS:
      name = 'delDKS';
      break;
    case KeyTypeEnum.MT:
      name = 'delMT';
      break;
    case KeyTypeEnum.RS:
      name = 'delRS';
      break;
    case KeyTypeEnum.TGL:
      name = 'delTGL';
      break;
    case KeyTypeEnum.SOCD:
      name = 'delSOCD';
      break;
    case KeyTypeEnum.Combo:
      name = 'delShortcut';
      break;
    default:
      break;
  }
  if(!name){
    return Promise.reject('ILINVALID_PARAM');
  }
  return requestClient.send<never>({
    name,
    data: {
      code: data.code
    }
  });
}
