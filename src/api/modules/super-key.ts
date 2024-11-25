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
