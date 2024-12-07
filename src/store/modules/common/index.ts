import { effectScope, onScopeDispose, reactive } from 'vue';
import { defineStore } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { SetupStoreId } from '@/enum';
import type { KeyInfo } from '@/api/modules/keyboard';
import { getKeyInfo, restoreKeyConfig, setKeyInfo } from '@/api/keyConfig';
function useKeyInfo() {
  // key cache
  const KeyConfigMap = reactive<{ [key: string]: KeyInfo | null }>({});

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
      keys: [
        {
          key,
          ...data
        }
      ]
    });
    KeyConfigMap[key] = null;
    return KeyConfigMap[key];
  }
  async function setKeyInfoByList(
    data: Partial<KeyInfo> &
      {
        key: string;
      }[]
  ) {
    await setKeyInfo({
      keys: data
    });
    data.forEach(item => {
      const { key, ...rest } = item;
      KeyConfigMap[key] = { ...(KeyConfigMap[key] || {}), ...rest } as any;
    });
  }
  async function restoreTargetKeyInfoById(key: string) {
    const data = await restoreKeyConfig({ key });
    KeyConfigMap[key] = data;
    return KeyConfigMap[key];
  }
  return {
    KeyConfigMap,
    fetchTargetKeyInfo,
    getTargetKeyInfo,
    restoreTargetKeyInfoById,
    setTargetKeyInfoById,
    setKeyInfoByList
  };
}
export const useCommonStore = defineStore(SetupStoreId.Common, () => {
  const scope = effectScope();
  const { KeyConfigMap, ...restFnc } = useKeyInfo();
  async function init() {}

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
    ...restFnc,
    KeyConfigMap
  };
});
