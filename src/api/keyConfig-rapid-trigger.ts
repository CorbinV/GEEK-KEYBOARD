import requestClient from './config';
import type { Calibration, Rate, SetKeyPerf } from './modules/keyboard-rapid-trigger';

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

export function getRate() {
  return requestClient.send<Rate>({
    name: 'getRate'
  });
}
