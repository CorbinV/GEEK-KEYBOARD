import { effectScope, onScopeDispose, reactive } from 'vue';
import { defineStore } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { SetupStoreId } from '@/enum';
import type { KeyInfo } from '@/api/modules/keyboard';
import { getKeyInfo, restoreKeyConfig, setKeyInfo } from '@/api/keyConfig';

export const useCommonStore = defineStore(SetupStoreId.Common, () => {
  const scope = effectScope();
  const KeyConfigMap = reactive<{ [key: string]: KeyInfo | null }>({});

  async function init() {}
  async function fetchTargetKeyInfo(key: string) {
    const keyInfo = await getKeyInfo({ key });
    KeyConfigMap[key] = keyInfo;
    return keyInfo;
  }
  /**
   * @param key key id
   * @param refresh force refresh key info
   */
  async function getTargetKeyInfo(key: string, refresh = false) {
    if (refresh) {
      return await fetchTargetKeyInfo(key);
    }
    if (!KeyConfigMap[key]) {
      return await fetchTargetKeyInfo(key);
    }
    return KeyConfigMap[key];
  }
  async function setTargetKeyInfoById(key: string, data: Partial<KeyInfo>) {
    await setKeyInfo({
      key,
      ...data
    });
    KeyConfigMap[key] = null;
    return KeyConfigMap[key];
  }

  async function restoreTargetKeyInfoById(key: string) {
    const data = await restoreKeyConfig({ key });
    KeyConfigMap[key] = data;
    return KeyConfigMap[key];
  }
  // watch store
  scope.run(() => {});

  // cache mixSiderFixed
  useEventListener(window, 'beforeunload', () => {});

  /** On scope dispose */
  onScopeDispose(() => {
    scope.stop();
  });

  init();

  return {
    fetchTargetKeyInfo,
    getTargetKeyInfo,
    restoreTargetKeyInfoById,
    setTargetKeyInfoById,
    KeyConfigMap
  };
});
