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
  index: number;
  code: number[];
  time: number;
};

export type MacroCfg = {
  attr: MacroAttr;
  keys: MacroKey[];
};
