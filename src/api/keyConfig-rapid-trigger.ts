import requestClient from './config';
import { createSession, type SessionRequestData } from '@sa/keyboard-protocol';

export function getPerf(data?: SessionRequestData<'getPerf'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getPerf',
      data
    })
  );
}

export function setPerf(data: SessionRequestData<'setPerf'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setPerf',
      data
    })
  );
}

export function getCalibration() {
  return requestClient.executeSession(
    createSession({
      name: 'getCalibration'
    })
  );
}
export function setCalibration(data: SessionRequestData<'setCalibration'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setCalibration',
      data
    })
  );
}

export function getRate() {
  return requestClient.executeSession(
    createSession({
      name: 'getRate'
    })
  );
}
export function setRate(data: SessionRequestData<'setRate'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setRate',
      data
    })
  );
}
export function resetRt(data: SessionRequestData<'resetRT'>) {
  return requestClient.executeSession(
    createSession({
      name: 'resetRT',
      data
    })
  );
}
export function onCalibrationListener(cb: (data: { key: string }) => void) {
  requestClient.subscribe("onCalibration", cb);
}
export function removeCalibrationListener(cb: (data: { key: string }) => void) {
  requestClient.unsubscribe("onCalibration", cb);
}
