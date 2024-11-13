import requestClient from '@/utils/requset/deviceClient';
import type { LeyerKeysConfig } from './modules/keyboard';

export function getKeysCfgByLayer(data: { config: number; level: number }) {
  return requestClient.send<LeyerKeysConfig>({
    name: 'getBasicKey',
    data
  });
}
