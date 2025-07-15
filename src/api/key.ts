import requestClient from './config';
import type { CfgCntBase, KeyBase, KeyRes, LayerKeysConfig } from './modules/keyModify';

export function getKeyInfo(data: KeyBase) {
  return requestClient.send<KeyRes>({
    name: 'gBasicK',
    data
  });
}

export function setKeyInfo(data: KeyRes) {
  return requestClient.send<KeyRes>({
    name: 'sBasicK',
    data
  });
}

export function getConfigCnt() {
  return new Promise((resolve, reject) => {
    requestClient
      .send<any>({
        name: 'gCfgs'
      })
      .then(res => {
        resolve({
          configCount: res.cfgCnt,
          configIndex: res.cfgIdx,
          layerCount: res.layerCnt,
          layerIndex: res.layerIdx
        });
      })
      .catch(reject);
  });
}

export function getKeysCfgByLayer(data: { cfg: number; layer: number }): Promise<LayerKeysConfig> {
  return requestClient.send<any>({
    name: 'gBasicKs',
    data
  });
}

export function resetLayerKeys(data: CfgCntBase) {
  return requestClient.send<null>({
    name: 'gBasicK',
    data
  });
}
