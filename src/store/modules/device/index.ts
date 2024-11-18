import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ConnectionManager } from '@/utils/requset/connectMannager';

export const useDeviceStore = defineStore('device', () => {
  const connectionManager = ConnectionManager.getInstance();
  // base status
  const isConnected = ref(false);
  const connectionError = ref<Error | null>(null);
  const deviceInfo = ref<any>(null);

  const connectionStatus = computed(() => {
    if (connectionError.value) return 'error';
    return isConnected.value ? 'connected' : 'disconnected';
  });

  // Actions
  async function connect(config: any) {
    try {
      connectionError.value = null;
      await connectionManager.connectDevice(config);
      isConnected.value = true;
    } catch (error) {
      connectionError.value = error as Error;
      isConnected.value = false;
    }
  }

  function getDeviceClient() {
    return connectionManager.getDeviceClient();
  }

  // optimize: add other fnc

  return {
    isConnected,
    connectionError,
    deviceInfo,
    connectionStatus,
    connect,
    getDeviceClient
  };
});
