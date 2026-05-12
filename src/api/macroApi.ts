import requestClient from './config';
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

export function setMacroName(data: { type: number; code: number; name: string }) {
  return requestClient.send({
    name: 'setMacroName',
    data
  });
}

export function delMacro(data: { code: number }) {
  return requestClient.send({
    name: 'delMacro',
    data
  });
}

export function setMacro(data: MacroCfg) {
  return requestClient.send({
    name: 'setMacro',
    data
  });
}

export function macroStart() {
  return requestClient.send({
    name: 'macroStart'
  });
}

export function macroStop() {
  return requestClient.send({
    name: 'macroStop'
  });
}
// eg
// export function onXxListener(cb: (data: RequestType ) => void) {
//   return requestClient.listen<ResponseType>('eventName', cb);
// }
