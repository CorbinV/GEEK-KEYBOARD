export type KeyCfg = {
  type: number;
  code: number;
  tary: number[];
};
export type KeyDefaultCfg = {
  tary: number[];
};
export type KeyCfgMap = {
  [key: string]: KeyCfg;
};
export type KeySmartCfg = {
  name: string;
  super: number[];
  mt: number[];
};
export type LayerKeysConfig = {
  config: number;
  layer: number;
  name: string;
  def: KeyDefaultCfg;
  keys: KeyCfgMap;
  smart: KeySmartCfg[];
  disable: string[];
};
export type KeyInfo = {
  id: string;
  type: number;
  code: number;
  enable: number; // 0 | 1
  tary: number[];
  super: number[];
  mt: number[];
};
