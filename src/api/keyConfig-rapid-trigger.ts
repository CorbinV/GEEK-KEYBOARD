import requestClient from './config';
import type {
  Calibration,
  GetKeyPerf,
  Rate,
  RateIndex,
  SetKeyPerf,
  SetKeyPerfCallback
} from './modules/keyboard-rapid-trigger';

export function getPerf(data: { key: string }) {
  return requestClient.send<GetKeyPerf>({
    name: 'getPerf',
    data
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
export function setCalibration(data: Calibration) {
  return requestClient.send<Calibration>({
    name: 'setCalibration',
    data
  });
}

export function getRate() {
  return requestClient.send<Rate>({
    name: 'getRate'
  });
}
export function setRate(data: RateIndex) {
  return requestClient.send<RateIndex>({
    name: 'setRate',
    data
  });
}
