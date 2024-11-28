import type { BaseKey } from './combo';

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
  name: string;
  keys: BaseKey[];
};
export type ResetRSName = {
  code: number;
  trigger: number;
  name: string;
};
export type RSBase = Omit<RSItem, 'type'>;
export type RSList = {
  rs: RSItem[];
};
