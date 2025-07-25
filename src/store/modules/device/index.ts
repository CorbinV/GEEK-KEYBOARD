import { defineStore } from 'pinia';
import { computed, effectScope, onScopeDispose, readonly, ref } from 'vue';
import { ConnectionManager } from '@/utils/requset/connectMannager';
import { DeviceIptEnum } from '@/api/modules/setting';

export const useDeviceStore = defineStore('device', () => {
  const scope = effectScope();
  const isTrueDevice: boolean = import.meta.env?.VITE_USE_CONNECT_DEVICE === 'Y';
  const connectionManager = ConnectionManager.getInstance();
  // base status
  const isConnected = ref(false);
  const isOtaMode = ref(false);
  const connectionError = ref<Error | null>(null);
  const connectionStatus = computed(() => {
    if (connectionError.value) return 'error';
    return isConnected.value ? 'connected' : 'disconnected';
  });
  let isOtadevice = false;
  const iptDevType = ref<DeviceIptEnum>(DeviceIptEnum.PC);
  // Actions
  async function connect(devices: HIDDevice[], config: any, otaDevice?: boolean) {
    try {
      connectionError.value = null;
      if (isTrueDevice) {
        await connectionManager.connectDevice(devices, config);
      }
      if (isOtaMode.value && otaDevice !== undefined) {
        isOtadevice = otaDevice;
        return;
      }
      isConnected.value = true;
    } catch (error) {
      connectionError.value = error as Error;
      isConnected.value = false;
    }
  }
  function scanPairedDevices(filters: any) {
    return connectionManager.scanPairedDevices(filters);
  }
  function scanDevices(filters: any) {
    if (isTrueDevice) {
      return navigator.hid.requestDevice({ filters });
    }
    return [{}] as unknown as Promise<HIDDevice[]>; // Return an empty promise if not using a true device
  }
  async function disconnect() {
    await connectionManager.deviceDisconnect();
    isConnected.value = false;
  }
  function getDeviceClient() {
    return connectionManager.getDeviceClient();
  }
  function updateOtaMode(v: boolean) {
    isOtaMode.value = v;
    // effect
    if (!isOtaMode.value) {
      isOtadevice = false;
    }
  }
  connectionManager.onDeviceDisconnect(() => {
    if (isOtaMode.value) {
      if (isOtadevice) {
        isConnected.value = false;
      }
      return;
    }
    isConnected.value = false;
  });
  scope.run(() => {});
  // optimize: add other fnc

  /** On scope dispose */
  onScopeDispose(() => {
    scope.stop();
  });
  return {
    isConnected,
    connectionError,
    connectionStatus,
    connect,
    disconnect,
    getDeviceClient,
    isTrueDevice,
    scanPairedDevices,
    scanDevices,
    isOtaMode: readonly(isOtaMode),
    updateOtaMode,
    iptDevType
  };
});
