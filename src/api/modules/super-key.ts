import type { KeyTypeEnum } from '@/enum/keyType';
import type { BaseKey } from './combo';

export type Page = {
  pageNo: number;
  pageSize: number;
};

export type OksItem = BaseKey & {
  name: string;
  keys: BaseKey[];
};
export type ResetOksName = {
  code: number;
  name: string;
};
export type OksBase = Omit<OksItem, 'type'>;
export type OksList = {
  oks: OksItem[];
};

// socd
export type SOCDItem = BaseKey & {
  name: string;
  keys: BaseKey[];
};
export type ResetSOCDName = {
  code: number;
  name: string;
};
export type SOCDBase = Omit<SOCDItem, 'type'> & {
  trigger: number;
};
export type SOCDList = {
  socd: SOCDItem[];
};

// rs
export type RSItem = BaseKey & {
  keys: BaseKey[];
};
export type ResetRSName = {
  code: number;
  name: string;
};
export type RSBase = Omit<RSItem, 'type'>;
export type RSList = {
  rs: RSItem[];
};

// mt
export type MTItem = BaseKey & {
  time: number;
  keys: BaseKey[];
};
export type ResetMTName = {
  code: number;
  name: string;
};
export type MTBase = Omit<MTItem, 'type'> & {
  time: number;
};
export type MTList = {
  len: number;
  mt: MTItem[];
};

// tgl
export type TGLItem = BaseKey & {
  keys: BaseKey[];
};
export type ResetTGLName = {
  code: number;
  name: string;
};
export type TGLBase = Omit<TGLItem, 'type'>;
export type TGLList = {
  len: number;
  tgl: TGLItem[];
};

// dks
export type ResetDksName = {
  code: number;
  name: string;
};
export type DksKey = {
  code: number;
  key: string;
  range: number[]; // length = 3*2
};
export type DksItem = {
  name?: string;
  type: KeyTypeEnum;
  code: number;
  simulation: 0 | 1 | 2; // close| random | fixed  time
  simulationRange: number[];
  range: number[]; // length = 4
  keys: DksKey[];
};
export type DksList = {
  shortcuts: DksItem[];
};
