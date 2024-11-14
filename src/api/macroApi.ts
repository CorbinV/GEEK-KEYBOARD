import requestClient from '@/utils/requset/deviceClient';
import type { Macros } from './modules/macro';

export function getMacros() {
  return requestClient.send<Macros>({
    name: 'getMacros'
  });
}
