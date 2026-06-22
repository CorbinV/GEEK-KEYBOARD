import requestClient from './config';
import { createSession, type SessionRequestData } from '@sa/keyboard-protocol';

export function getShortcuts() {
  return requestClient.executeSession(
    createSession({
      name: 'getShortcuts',
    })
  );
}

export function getShortcut(data: SessionRequestData<'getShortcut'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getShortcut',
      data
    })
  );
}

export function addShortcut(data: SessionRequestData<'addShortcut'>) {
  console.log('添加组合键参数：', data);
  return requestClient.executeSession(
    createSession({
      name: 'addShortcut',
      data
    })
  );
}

export function delShortcut(data: SessionRequestData<'delShortcut'>) {
  return requestClient.executeSession(
    createSession({
      name: 'delShortcut',
      data
    })
  );
}

export function getLockShortcuts() {
  return requestClient.executeSession(
    createSession({
      name: 'getLockShortcuts',
    })
  );
}

export function setLockShortcuts(data: SessionRequestData<'setLockShortcuts'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setLockShortcuts',
      data
    })
  );
}
