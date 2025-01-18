import { type OTAProtocolController } from "./control";
import { OTA_TYPE } from "./enums";
import { SendFncType } from "./types";
import { WCH_OTA } from "./wch";

export function createOTA(type: OTA_TYPE, initCfg: {
  sendFnc: SendFncType,
  outMtu: number,
}): OTAProtocolController {
  let ota
  switch (type) {
    case OTA_TYPE.WCH:
      ota = new WCH_OTA();
      break;
    default:
      throw new Error('not support ota type');
  }
  ota.setSendFnc(initCfg.sendFnc);
  ota.setOutMtu(initCfg.outMtu);
  return ota;
}

