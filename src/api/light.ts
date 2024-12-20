import requestClient from './config';
import type { Light } from './modules/light';

export function getLight() {
  return requestClient.send<Light>({
    name: 'getLight'
  });
}

export function setLight(data: Light) {
  return requestClient.send<string>({
    name: 'setLight',
    data
  });
}
