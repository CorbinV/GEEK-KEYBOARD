import requestClient from './config';
import type { KeyInfo, LayerKeysConfig } from './modules/keyboard';
/**
 * @param data.layer keyboard layer
 * @param data.config keyboard's config(onboard configuration or custom)
 */
export function getKeysCfgByLayer(data: { config: number; layer: number }) {
  return requestClient.send<LayerKeysConfig>({
    name: 'getBasicKey',
    data
  });
}
/**
 * @param {{ key: string }} data
 * @param {string} data.key keyId
 */
export function getKeyInfo(data: { key: string }) {
  return requestClient.send<KeyInfo>({
    name: 'getKeyInfo',
    data
  });
}

export function restoreKeyConfig(data: { key: string }) {
  return requestClient.send<KeyInfo>({
    name: 'resetKeyInfo',
    data
  });
}
export function setKeyInfo(
  data: Partial<KeyInfo> & {
    key: string;
  }
) {
  return requestClient.send<null>({
    name: 'setKeyInfo',
    data
  });
}
