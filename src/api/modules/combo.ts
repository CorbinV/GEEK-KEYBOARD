import type { KeyTypeEnum } from '@/enum/keyType';
export type ComboBase = {
  type: number;
  code: number;
};
export type BaseKeyView = {
  type: 'str' | 'icon' | 'mix';
  icon: string;
  label: string;
};

export type BaseKey = {
  code: number;
  type: KeyTypeEnum;
  key?: string;
};

export type ComboGoup = BaseKey & {
  keys: ComboBase[];
};

export type ComboItem = Omit<BaseKey, 'key'>;

export type ComboList = {
  shortcuts: ComboItem[];
};
