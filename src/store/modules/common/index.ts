import { effectScope, onScopeDispose, reactive } from 'vue';
import { defineStore } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { SetupStoreId } from '@/enum';
import type { KeyInfo } from '@/api/modules/keyboard';
import { getKeyInfo, restoreKeyConfig, setKeyInfo } from '@/api/keyConfig';
import { KeyTypeEnum } from '@/enum/keyType';
import { useKeyboardStore } from '../keyboard/index';
function useKeyInfo() {
  const { setKeyDisabled, updateKeyBase, removeSuperKey, updateKeyTag } = useKeyboardStore();
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
  async function setTargetKeyInfoById(key: string, data: Partial<KeyInfo>, toDevice: boolean = true) {
    if (toDevice) {
      await setKeyInfo({
        keys: [
          {
            key,
            ...data
          }
        ]
      });
    }
    if (data.code !== undefined) {
      if (data.type === KeyTypeEnum.Combo) {
        updateComboKeyTag(key, { code: data.code, type: data.type }, { type: 'add', updateOrigin: false });
      } else if (data.type === KeyTypeEnum.DKS) {
        updateDksKeyTag(key, { code: data.code, type: data.type }, { type: 'add', updateOrigin: false });
      }
    }
    if (data.enable !== undefined) {
      setKeyDisabled({ keyId: key }, !data.enable);
    }
    KeyConfigMap[key] = null;
    return KeyConfigMap[key];
  }
  async function setKeyInfoByList(
    data: (Partial<KeyInfo> & {
      key: string;
    })[]
  ) {
    await setKeyInfo({
      keys: data.map(item => item)
    });
    data.forEach(item => {
      const { key, ...rest } = item;
      KeyConfigMap[key] = { ...(KeyConfigMap[key] || {}), ...rest } as any;
    });
  }
  async function restoreTargetKeyInfoById(key: string) {
    const data = await restoreKeyConfig({ key });
    KeyConfigMap[key] = data;
    updateKeyBase(key, data);
    removeSuperKey(key, { moduleType: KeyTypeEnum.None, removeAll: true });
    setKeyDisabled({ keyId: key }, false);
    return KeyConfigMap[key];
  }
  async function updateKeyTagCommon(
    tag: 'combo' | 'dks',
    origin: {
      key: string;
      data: { code: number; type: KeyTypeEnum };
    },
    ops?: { type: 'add' | 'remove'; updateOrigin: boolean }
  ) {
    const { key, data } = origin;
    const { updateOrigin = true, type: typeFnc = 'add' } = ops || {};
    const keyId = updateKeyTag({ key, data }, { tag, type: typeFnc });
    if (!updateOrigin || !keyId) {
      return keyId;
    }
    const keyInfo = await getKeyInfo({ key: keyId });
    KeyConfigMap[keyId] = keyInfo;
    updateKeyBase(keyId, { code: keyInfo.code, type: keyInfo.type });
    return keyId;
  }
  async function updateComboKeyTag(
    key: string,
    data: { code: number; type: KeyTypeEnum },
    ops?: { type: 'add' | 'remove'; updateOrigin: boolean }
  ) {
    return await updateKeyTagCommon('combo', { key, data }, ops);
  }
  async function updateDksKeyTag(
    key: string,
    data: { code: number; type: KeyTypeEnum },
    ops?: { type: 'add' | 'remove'; updateOrigin: boolean }
  ) {
    return await updateKeyTagCommon('combo', { key, data }, ops);
  }
  return {
    KeyConfigMap,
    fetchTargetKeyInfo,
    getTargetKeyInfo,
    restoreTargetKeyInfoById,
    setTargetKeyInfoById,
    setKeyInfoByList,
    updateComboKeyTag,
    updateDksKeyTag
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
