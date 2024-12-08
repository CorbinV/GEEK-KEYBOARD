import requestClient from './config';
import type { Calibration, GetKeyPerf, Rate, SetKeyPerf, SetKeyPerfCallback } from './modules/keyboard-rapid-trigger';

export function getPerf() {
  return requestClient.send<GetKeyPerf>({
    name: 'getPerf'
  });
}

export function setPerf(data: SetKeyPerf) {
  return requestClient.send<SetKeyPerfCallback>({
    name: 'setPerf',
    data
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
