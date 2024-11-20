export type ComboBase = {
  type: number;
  code: number;
};

export type ComboGoup = {
  type: number;
  code: number;
  keys: ComboBase[];
};
export type ComboList = {
  shortcuts: ComboBase[];
};
