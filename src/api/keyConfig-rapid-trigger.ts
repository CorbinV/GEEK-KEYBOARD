import requestClient from '@/utils/requset/deviceClient';
import type { Calibration, SetKeyPerf } from './modules/keyboard-rapid-trigger';

export function getPerf() {
  return requestClient.send<SetKeyPerf>({
    name: 'getPerf'
  });
}
export function getCalibration() {
  return requestClient.send<Calibration>({
    name: 'getCalibration'
  });
}
