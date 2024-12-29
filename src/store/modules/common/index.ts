import { computed, effectScope, nextTick, onScopeDispose, toRef } from 'vue';
import { defineStore } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { SetupStoreId } from '@/enum';
import type { KeyInfo } from '@/api/modules/keyboard';
import { getKeyInfo, restoreKeyConfig, setKeyInfo } from '@/api/keyConfig';
import { KeyTypeEnum } from '@/enum/keyType';
import { getPerf } from '@/api/keyConfig-rapid-trigger';
import useConver from '@/utils/conver';
import { useKeyboardStore } from '../keyboard/index';

function useKeyInfo() {
  const keyboardStore = useKeyboardStore();
  const { setKeyDisabled, updateKeyBase, removeSuperKey, updateKeyTag } = keyboardStore;
  // key cache
  const activeKeyLayer = toRef(keyboardStore, 'activeKeyLayer');
  const keyConfigMap = computed(() => activeKeyLayer.value.keys);

  const { triggerToPage, sensitivityToPage } = useConver();

  async function fetchTargetKeyInfo(key: string) {
    const keyInfo = await getKeyInfo({ key });
    keyConfigMap.value[key] = keyInfo;
    updateTaryDataCache([key]);
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
    if (!keyConfigMap.value[key]?.mt) {
      return await fetchTargetKeyInfo(key);
    }
    return keyConfigMap.value[key];
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
    keyConfigMap.value[key].mt = [] as any;
    nextTick(() => getTargetKeyInfo(key, true));
    return keyConfigMap.value[key];
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
      keyConfigMap.value[key] = { ...(keyConfigMap.value[key] || {}), ...rest } as any;
    });
  }
  async function restoreTargetKeyInfoById(key: string) {
    const data = await restoreKeyConfig({ key });
    keyConfigMap.value[key] = data;
    updateKeyBase(key, data);
    removeSuperKey(key, { moduleType: KeyTypeEnum.None, removeAll: true });
    setKeyDisabled({ keyId: key }, false);
    return keyConfigMap.value[key];
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
    keyConfigMap.value[keyId] = keyInfo;
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
  async function updateAllKeyTary() {
    let lenCnt = 0;
    return new Promise((res, rej) => {
      const fetchTary = async () => {
        try {
          const { len, keys: taryObj } = await getPerf();
          lenCnt += Object.keys(taryObj).length;
          Object.keys(taryObj).forEach(key => {
            if (!activeKeyLayer.value.keys[key]) {
              activeKeyLayer.value.keys[key] = {};
            }
            activeKeyLayer.value.keys[key].tary = taryObj[key];
          });
          if (len > lenCnt) {
            requestAnimationFrame(fetchTary);
          } else {
            res('');
          }
        } catch (error) {
          console.log(error);
          rej(error);
        }
      };
      requestAnimationFrame(fetchTary);
    });
  }
  async function updateTaryDataCache(keys?: string[]) {
    let exeKeys: string[];
    if (!keys?.length) {
      exeKeys = Object.keys(keyConfigMap.value.keys);
    } else {
      exeKeys = keys;
    }
    let idx = 0;
    const chunkSize = 10;
    const handle = () => {
      const end = Math.min(idx + chunkSize, exeKeys.length);
      for (let i = idx; i < end; i++) {
        const key = exeKeys[idx];
        const data = keyConfigMap.value[key].tary;
        const [triggerPoint, enableRt, rtTrigger, rtReset] = data;
        const cache = {
          trigPt: triggerPoint ? triggerToPage(triggerPoint) : '',
          enableRt,
          rtTrig: rtTrigger ? sensitivityToPage(rtTrigger) : '',
          rtReset: rtReset ? sensitivityToPage(rtReset) : ''
        };
        activeKeyLayer.value.rtLabelMap.set(key, {
          ...cache
        });
      }
      idx = end;
      if (idx < exeKeys.length) {
        requestAnimationFrame(handle);
      }
    };
    requestAnimationFrame(handle);
  }
  return {
    keyConfigMap,
    fetchTargetKeyInfo,
    getTargetKeyInfo,
    restoreTargetKeyInfoById,
    setTargetKeyInfoById,
    setKeyInfoByList,
    updateComboKeyTag,
    updateDksKeyTag,
    updateAllKeyTary,
    updateTaryDataCache
  };
}
export const useCommonStore = defineStore(SetupStoreId.Common, () => {
  const scope = effectScope();
  const { keyConfigMap, ...restFnc } = useKeyInfo();
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
    keyConfigMap
  };
});
