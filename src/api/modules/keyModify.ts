export type KeyBase = {
  cfg: number;
  layer: number;
  k: string;
};
export type KeyRes = KeyBase & {
  v: string;
};
export type CfgCntBase = {
  cfgIdx: number;
  layerIdx: number;
};
export type CfgCntRes = {
  cfgIdx: number;
  layerIdx: number;
  layerCnt: number;
  cfgCnt: number;
};
export type KeysConfig = {
  cfg: number;
  layer: number;
  ks: {
    [key: string]: {
      v: string;
    };
  };
};
export type KeyInfo = {
  [key: string]: {
    v: string;
  };
};
export type LayerKeysConfig = {
  cfg: number;
  layer: number;
  ks: KeyInfo[];
};
