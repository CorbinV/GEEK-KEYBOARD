import type { KeyTypeEnum } from '@/enum/keyType';
import type { BaseKey } from './combo';

export type Page = {
  pageNo: number;
  pageSize: number;
};

export type ReName = {
  code: number;
  name: string;
};
export type OksItem = BaseKey & {
  keys: BaseKey[];
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
export type RSBase = Omit<RSItem, 'type'>;
export type RSList = {
  len: number;
  rs: RSItem[];
};

// mt
export type MTItem = BaseKey & {
  time: number;
  keys: BaseKey[];
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
export type TGLBase = Omit<TGLItem, 'type'>;
export type TGLList = {
  len: number;
  tgl: TGLItem[];
};

// dks
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
