import { BIT_CONDITION, OTA_TYPE, createOTA } from '@sa/ota';
import { requestClient } from '@/utils/requset/deviceClient';
export function useDeviceOta() {
  const otaInstance = createOTA(OTA_TYPE.WCH, {
    outMtu: 64,
    sendFnc: requestClient.sendBinary as any
  });
  return { otaInstance, BIT_CONDITION };
}
