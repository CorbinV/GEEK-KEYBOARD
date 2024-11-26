import { effectScope, onScopeDispose, reactive, watchEffect } from 'vue';
import { defineStore } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { useBoolean } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { kbStg, keyboardforage } from '@/utils/storage';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { KeyTypeEnum } from '@/enum/keyType';
import type { BaseKey } from '@/api/modules/combo';
import keyMapJson from '@/assets/files/key-map.json';
type CurrentSuperKeyType = Omit<
  KeyTypeEnum,
  KeyTypeEnum.Normal | KeyTypeEnum.System | KeyTypeEnum.Media | KeyTypeEnum.Combo | KeyTypeEnum.Special
>;
export const useKeyboardStore = defineStore(SetupStoreId.Keyboard, () => {
  const scope = effectScope();

  function useConfigData() {
    // optimize: dynammic import keyboard config(eg)
    // const kbCfg = reactive<any>({
    //   'rs-s75': { data: {}, offsetList: [] }
    // });
    const kbCfg = reactive<{
      data: {
        [key: string]: any;
      };
      offsetList: number[];
      keyMap: any;
    }>({ data: {}, offsetList: [], keyMap: {} });
    const { bool: hasConfig } = useBoolean(kbStg.get('hasConfig') === 'Y');

    const getAllConfig = async () => {
      const allData: { [key: string]: any } = {};
      await keyboardforage.iterate((v, k) => {
        allData[k] = v;
      });
      return allData;
    };

    const initKeyboardData = async (): Promise<any> => {
      if (Object.keys(kbCfg.data).length > 0) {
        return kbCfg.data;
      }
      if (!hasConfig.value) {
        // optimize: dynammic import keyboard config(by keyboard name)
        // const data = await import(`@/assets/files/${kbName}.json`);
        const data = await import('@/assets/files/rk-s75.json');
        const keyMap: { [key: string]: any } = {};
        data.layout.keys.forEach(item => {
          keyboardforage.setItem(item.id, item);
          keyMap[item.id] = item;
        });
        keyboardforage.setItem('base', data.layout.base);
        keyMap.base = data.layout.base;
        // update hasConfig value
        // setHasConfig(true);
        // kbStg.set('hasConfig', 'Y');
        kbCfg.data = keyMap;
        return keyMap;
      }
      const data = await getAllConfig();
      kbCfg.data = data;

      return data;
    };

    const getKeyDetail = ({ code, type }: BaseKey) => {
      const codeMap = kbCfg.keyMap[type]?.code;
      if (!codeMap) {
        throw new Error('get key detail info failed, beause no code map');
      }
      const codeDetail = codeMap[code];
      if (!codeDetail) {
        throw new Error('get key detail info failed, beause no code detail');
      }
      return codeDetail;
    };
    const initKeyMap = () => {
      kbCfg.keyMap = keyMapJson;
      // optimize: dynammic import keyboard map
      // import('@/assets/files/key-map.json').then(res => {
      //   kbCfg.keyMap = res.default;
      // });
    };
    initKeyMap();
    return { initKeyboardData, kbCfg, getKeyDetail };
  }
  const { initKeyboardData, kbCfg, getKeyDetail } = useConfigData();

  function useRelatedSelectedKeys() {
    const [selectedKeys, resetSelectedKeys] = useResttableRefFn<{
      [key: string]: {
        base: { code: number; type: number };
        detail: any;
        config: any;
      };
    }>(() => ({}));
    const [selectedKeysTemp, resetSelectedKeysTemp] = useResttableRefFn<{
      [key: string]: {
        base: { code: number; type: number };
        detail: any;
        config: any;
      };
    }>(() => ({}));
    const [allowMutipleSelect, resetAllowMutipleSelect] = useResttableRefFn(() => false);
    function emitResetSelectedKeys(_: any) {
      resetSelectedKeys();
    }
    watchEffect(() => {
      // feat: when allow mutiple select value change, the selected keys should be reset
      emitResetSelectedKeys(allowMutipleSelect.value);
    });
    return {
      selectedKeys,
      resetSelectedKeys,
      allowMutipleSelect,
      resetAllowMutipleSelect,
      selectedKeysTemp,
      resetSelectedKeysTemp
    };
  }
  const { resetSelectedKeys, ...restRelatedSelectedData } = useRelatedSelectedKeys();
  const [currentSuperKeyType, resetCurrentSuperKeyType] = useResttableRefFn<CurrentSuperKeyType>(
    () => KeyTypeEnum.None
  );
  watchEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    currentSuperKeyType.value;
    resetSelectedKeys();
  });
  async function init() {
    await initKeyboardData();
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
    kbCfg,
    initKeyboardData,
    resetSelectedKeys,
    currentSuperKeyType,
    resetCurrentSuperKeyType,
    getKeyDetail,
    ...restRelatedSelectedData
  };
});
