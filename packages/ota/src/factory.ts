import { OTA_TYPE } from './enums';
import type { SendFncType } from './types';
import { WCH_OTA } from './wch';
import { WCH_585_OTA } from './wch_585';

export function createOTA(
  type: OTA_TYPE,
  initCfg: {
    sendFnc: SendFncType;
    outMtu: number;
  }
) {
  let ota;
  switch (type) {
    case OTA_TYPE.WCH:
      ota = new WCH_OTA();
      break;
    case OTA_TYPE.WCH_585:
      ota = new WCH_585_OTA();
      break;
    default:
      throw new Error('not support ota type');
  }
  ota.setSendFnc(initCfg.sendFnc);
  ota.setOutMtu(initCfg.outMtu);
  return ota;
}
