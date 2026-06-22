import requestClient from './config';
import { createSession, type SessionRequestData } from '@sa/keyboard-protocol';

export function getLight() {
  return requestClient.executeSession(
    createSession({
      name: 'getLight',
    })
  );
}
