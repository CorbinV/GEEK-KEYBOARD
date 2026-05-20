export type Macro = {
  name: string;
  type: number;
  code: number;
};

export type Macros = {
  macro: Macro[];
};

export type MacroAttr = {
  type: number;
  code: number;
  name: string;
  trigger: number;
  triggerDelay: number;
  loop: number;
  delay: number[];
  stopType: number;
};

export type MacroKey = {
  inx: number;
  kt: number;
  iT: number;
  dT: number;
  ks: number[];
};

export type MacroCfg = {
  attr: MacroAttr;
  keys: MacroKey[];
};
