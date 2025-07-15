import requestClient from './config';
import type { SocdBase } from './modules/socd';

export function setSocdMode(data: SocdBase) {
  return requestClient.send<SocdBase>({
    name: 'sActSOCD',
    data
  });
}
export function getSocdMode() {
  return requestClient.send<SocdBase>({
    name: 'gActSOCD'
  });
}
