import requestClient from './config';
import type { ConfigAndLayer, KeyInfo, LayerKeysConfig } from './modules/keyboard';
import { createSession } from '@sa/keyboard-protocol';

/**
 * @param data.layer keyboard layer
 * @param data.config keyboard's config(onboard configuration or custom)
 */
export  function getKeysCfgByLayer(data: { config: number; layer: number; pageNo: number; pageSize: number }) {
  return requestClient.executeSession(
    createSession({
      name: 'getBasicKey',
      data
    })
  )
}
/**
 * @param {{ key: string }} data
 * @param {string} data.key keyId
 */
export function getKeyInfo(data: { key: string }) {
  return requestClient.executeSession(
    createSession({
      name: 'getKeyInfo',
      data
    })
  );
}

export function restoreKeyConfig(data: { key: string }) {
  return requestClient.executeSession(
    createSession({
      name: 'resetKeyInfo',
      data
    })
  );
}
export function setKeyInfo(data: {
  keys: (Partial<KeyInfo> & {
    key: string;
  })[];
}) {
  return requestClient.send<null>({
    name: 'setKeyInfo',
    data
  });
}
export function getDeviceConfigAndLayer(): Promise<ConfigAndLayer> {
  return new Promise((resolve, reject) => {
    return requestClient.executeSession(
      createSession({
        name: 'getBasicConfig'
      })
    )
      .then(res => {
        resolve({
          configCount: res.config_count,
          configIndex: res.config_index,
          layerCount: res.layer_count,
          layerIndex: res.layer_index
        });
      })
      .catch(reject);
  });
}
export function updateDeviceCfgAndLayer(data: { layerIdx: number; cfgIdx: number }) {
  const sendData = {
    config_index: data.cfgIdx,
    layer_index: data.layerIdx
  };
  return requestClient.send<null>({
    name: 'setConfigLayerIndex',
    data: sendData
  });
}
