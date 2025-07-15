import { BIT_CONDITION, OTA_TYPE, createOTA } from '@sa/ota';
import { useDeviceStore } from '@/store/modules/device';
const store = useDeviceStore();
const requestClient = store.getDeviceClient();
export function useDeviceOta() {
  const otaInstance = createOTA(OTA_TYPE.WCH_585, {
    outMtu: 64,
    sendFnc: requestClient.sendBinary.bind(requestClient) as any
  });
  return { otaInstance, BIT_CONDITION };
}
