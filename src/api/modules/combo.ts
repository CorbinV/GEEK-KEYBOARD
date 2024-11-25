import type { KeyTypeEnum } from '@/enum/keyType';
export type ComboBase = {
  type: number;
  code: number;
};

export type BaseKey = {
  code: number;
  type: KeyTypeEnum;
};

export type ComboGoup = {
  type: number;
  code: number;
  keys: ComboBase[];
};
export type ComboList = {
  shortcuts: ComboBase[];
};
