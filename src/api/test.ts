import requestClient from './config';
import type { TestBase, TestKeyRes } from './modules/test';
export function setTestMode(data: TestBase) {
  return requestClient.send<null>({
    name: 'sKTst',
    data
  });
}
export function onKeyPressListener(cb: (data: TestKeyRes) => void) {
  return requestClient.listen<TestKeyRes>('gTstKs', cb);
}
export function offKeyPressListener(cb: (data: TestKeyRes) => void) {
  return requestClient.removeListener<TestKeyRes>('gTstKs', cb);
}
