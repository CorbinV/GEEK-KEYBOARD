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
import { deleteMTByCode, deleteSpByCode } from '@/api/super-key';

function useKeyInfo() {
  const keyboardStore = useKeyboardStore();
  const { setKeyDisabled, updateKeyBase, removeSuperKey, updateKeyTag, pushState } = keyboardStore;
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
  async function setTargetKeyInfoById(
    key: string,
    data: Partial<KeyInfo>,
    ops?: { toDevice?: boolean; isxx?: boolean }
  ) {
    const { toDevice = true, isxx } = ops || {};
    // get current key config and cache it
    if (isxx) {
      const oldVal = JSON.parse(JSON.stringify(activeKeyLayer.value.keys[key] || {}));
      const newVal = JSON.parse(JSON.stringify({ ...oldVal, ...data }));
      pushState({
        oldVal,
        newVal
      });
    }
    // record inject data(change)
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
      fetchTargetKeyInfo(key);
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
    // let exeKeys: string[];
    // if (!keys?.length) {
    //   exeKeys = Object.keys(keyConfigMap.value.keys);
    // } else {
    //   exeKeys = keys;
    // }
    // let idx = 0;
    // const chunkSize = 10;
    // const handle = () => {
    //   const end = Math.min(idx + chunkSize, exeKeys.length);
    //   for (let i = idx; i < end; i++) {
    //     const key = exeKeys[i];
    //     const data = keyConfigMap.value[key].tary;
    //     const [triggerPoint, enableRt, rtTrigger, rtReset] = data;
    //     const cache = {
    //       trigPt: triggerPoint ? triggerToPage(triggerPoint) : '',
    //       enableRt,
    //       rtTrig: rtTrigger ? sensitivityToPage(rtTrigger) : '',
    //       rtReset: rtReset ? sensitivityToPage(rtReset) : ''
    //     };
    //     activeKeyLayer.value.rtLabelMap.set(key, {
    //       ...cache
    //     });
    //     console.log('rtLabelMap info update----------------------------', key, cache);
    //   }
    //   idx = end;
    //   if (idx < exeKeys.length) {
    //     requestAnimationFrame(handle);
    //   }
    // };
    // requestAnimationFrame(handle);
    return new Promise((resolve, reject) => {
      try {
        if (!keyConfigMap?.value) {
          throw new Error('keyConfigMap is not initialized');
        }

        const exeKeys = !keys?.length
          ? Object.keys(keyConfigMap.value.keys)
          : keys;

        let idx = 0;
        const chunkSize = 10;

        const processChunk = (i: number, end: number) => {
          for (let i = idx; i < end; i++) {
            const key = exeKeys[i]; // 修复：使用正确的索引
            const data = keyConfigMap.value[key]?.tary;

            if (!Array.isArray(data) || data.length < 4) {
              console.warn(`Invalid tary data for key: ${key}`);
              continue;
            }

            const [triggerPoint, enableRt, rtTrigger, rtReset] = data;
            const cache = {
              trigPt: triggerPoint ? triggerToPage(triggerPoint) : '',
              enableRt,
              rtTrig: rtTrigger ? sensitivityToPage(rtTrigger) : '',
              rtReset: rtReset ? sensitivityToPage(rtReset) : ''
            };

            activeKeyLayer.value.rtLabelMap.set(key, cache);
          }
        };

        const handle = () => {
          try {
            const end = Math.min(idx + chunkSize, exeKeys.length);
            processChunk(idx, end);
            idx = end;

            if (idx < exeKeys.length) {
              requestAnimationFrame(handle);
            } else {
              resolve(void 0);
            }
          } catch (error) {
            reject(error);
          }
        };

        requestAnimationFrame(handle);
      } catch (error) {
        reject(error);
      }
    });

  }
  async function removeKeySpsById(keyId: string) {
    const keyInfo = activeKeyLayer.value.keys[keyId];
    if (!keyInfo) {
      return;
    }
    const { super: superx, mt } = keyInfo;
    const promiseArr = [];
    if (mt?.length) {
      const [_, mtCode] = mt
      promiseArr.push(
        deleteMTByCode({ code: mtCode })
      )
    }
    if (superx?.length) {
      const [spType, spCode] = superx;
      promiseArr.push(
        deleteSpByCode({ type: spType, code: spCode })
      )
    }
    await Promise.all(promiseArr);
    keyInfo.super = [];
    keyInfo.mt = [];
  }
  function forceUpdateSpOriginById(keyId: string, spInfo: { superx?: number[]; mt?: number }) {
    const keyInfo = activeKeyLayer.value.keys[keyId];
    if (!keyInfo) {
      return;
    }
    const { superx, mt } = spInfo;
    superx && (activeKeyLayer.value.keys[keyId].super = superx);
    mt && (activeKeyLayer.value.keys[keyId].mt = mt);
  }
  return {
    keyConfigMap,
    activeKeyLayer,
    fetchTargetKeyInfo,
    getTargetKeyInfo,
    restoreTargetKeyInfoById,
    setTargetKeyInfoById,
    setKeyInfoByList,
    updateComboKeyTag,
    updateDksKeyTag,
    updateAllKeyTary,
    updateTaryDataCache,
    removeKeySpsById,
    forceUpdateSpOriginById
  };
}
export const useCommonStore = defineStore(SetupStoreId.Common, () => {
  const scope = effectScope();
  const { keyConfigMap, ...restFnc } = useKeyInfo();
  async function init() { }

  // watch store
  scope.run(() => { });

  // cache mixSiderFixed
  useEventListener(window, 'beforeunload', () => { });

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
