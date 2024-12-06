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
  len: number;
  config: number;
  layer: number;
  name: string;
  def: KeyDefaultCfg;
  keys: KeyCfgMap;
  smart: { [key: string]: KeySmartCfg };
  disable: string[];
};
export type ConfigAndLayer = {
  configCount: number;
  configIndex: number;
  layerCount: number;
  layerIndex: number;
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
