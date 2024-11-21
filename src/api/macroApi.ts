import requestClient from '@/utils/requset/deviceClient';
import type { MacroCfg, Macros } from './modules/macro';

export function getMacros() {
  return requestClient.send<Macros>({
    name: 'getMacros'
  });
}

export function getMacroCfg(data: { type: number; code: number }) {
  return requestClient.send<MacroCfg>({
    name: 'getMacro',
    data
  });
}
