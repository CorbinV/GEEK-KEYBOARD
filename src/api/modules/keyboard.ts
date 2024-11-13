export type KeyCfg = {
  type: number;
  code: number;
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
export type LeyerKeysConfig = {
  config: number;
  level: number;
  name: string;
  def: {
    tary: number[];
  };
  keys: KeyCfgMap;
  smart: KeySmartCfg[];
  disable: string[];
};
