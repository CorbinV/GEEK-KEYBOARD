import { defineStore } from 'pinia';
import { computed, effectScope, onScopeDispose, ref } from 'vue';
import { ConnectionManager } from '@/utils/requset/connectMannager';

export const useDeviceStore = defineStore('device', () => {
  const scope = effectScope();
  const isTrueDevice: boolean = import.meta.env?.VITE_USE_CONNECT_DEVICE === 'Y';
  const connectionManager = ConnectionManager.getInstance();
  // base status
  const isConnected = ref(false);
  const connectionError = ref<Error | null>(null);
  const connectionStatus = computed(() => {
    if (connectionError.value) return 'error';
    return isConnected.value ? 'connected' : 'disconnected';
  });

  // Actions
  async function connect(config: any) {
    try {
      connectionError.value = null;
      if (isTrueDevice) {
        await connectionManager.connectDevice(config);
      }
      isConnected.value = true;
    } catch (error) {
      connectionError.value = error as Error;
      isConnected.value = false;
    }
  }
  async function disconnect(){
    await connectionManager.deviceDisconnect();
    isConnected.value = false;
  }
  function getDeviceClient() {
    return connectionManager.getDeviceClient();
  }
  connectionManager.onDeviceDisconnect(() => {
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
    isTrueDevice
  };
});
