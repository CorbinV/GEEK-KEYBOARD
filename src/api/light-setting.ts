import requestClient from './config';
import { createSession, type SessionRequestData } from '@sa/keyboard-protocol';

export function setLight(data: SessionRequestData<'setLight'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setLight',
      data
    })
  );
}
