import { effectScope, onScopeDispose, reactive, watchEffect } from 'vue';
import { defineStore } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { useBoolean } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { kbStg, keyboardforage } from '@/utils/storage';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { KeyTypeEnum } from '@/enum/keyType';
import type { BaseKey, BaseKeyView } from '@/api/modules/combo';
import keyMapJson from '@/assets/files/key-map.json';
type CurrentSuperKeyType = Omit<
  KeyTypeEnum,
  KeyTypeEnum.Normal | KeyTypeEnum.System | KeyTypeEnum.Media | KeyTypeEnum.Combo | KeyTypeEnum.Special
>;
type CacheSuperKey = {
  sp: KeyTypeEnum[];
  mt?: BaseKeyView;
  dks: boolean;
  combo: boolean;
};
export const useKeyboardStore = defineStore(SetupStoreId.Keyboard, () => {
  const scope = effectScope();

  function useConfigData() {
    // optimize: dynammic import keyboard config(eg)
    // const kbCfg = reactive<any>({
    //   'rs-s75': { data: {}, offsetList: [] }
    // });
    const kbCfg = reactive<{
      data: Map<string, any>; // for keyboard layout
      offsetList: number[]; // keyboard row offset
      keyMap: any;
      superKeyMap: { [key: string]: CacheSuperKey };
    }>({ data: new Map(), offsetList: [], keyMap: {}, superKeyMap: {} });
    const { bool: hasConfig } = useBoolean(kbStg.get('hasConfig') === 'Y');

    const getAllConfig = async () => {
      const allData: { [key: string]: any } = {};
      await keyboardforage.iterate((v, k) => {
        allData[k] = v;
      });
      return allData;
    };

    const initKeyboardData = async (): Promise<any> => {
      if (kbCfg.data.size > 0) {
        return kbCfg.data;
      }
      if (!hasConfig.value) {
        // optimize: dynammic import keyboard config(by keyboard name)
        // const data = await import(`@/assets/files/${kbName}.json`);
        const data = await import('@/assets/files/rk-s75.json');
        data.layout.keys.forEach(item => {
          keyboardforage.setItem(item.id, item);
          kbCfg.data.set(item.id, item);
        });
        keyboardforage.setItem('base', data.layout.base);
        kbCfg.data.set('base', data.layout.base);
        // update hasConfig value
        // setHasConfig(true);
        // kbStg.set('hasConfig', 'Y');
        return kbCfg.data;
      }

      const data = await getAllConfig();
      data.forEach(() => {
        // feat: todo
      });
      return data;
    };

    const getKeyDetail = ({ code, type }: Omit<BaseKey, 'key'>) => {
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
    const updateSuperKey = (keyId: string, { moduleType, mtCfg }: { moduleType: KeyTypeEnum; mtCfg?: any }) => {
      let superKey = kbCfg.superKeyMap[keyId];
      if (!superKey) {
        // init super key if not exist
        superKey = {
          sp: [],
          mt: undefined,
          dks: false,
          combo: false
        };
      }
      // update logic
      const codition = [KeyTypeEnum.OKS, KeyTypeEnum.SOCD, KeyTypeEnum.TGL, KeyTypeEnum.RS];
      if (codition.includes(moduleType)) {
        if (!superKey.sp.includes(moduleType)) {
          superKey.sp.push(moduleType);
        }
      } else if (KeyTypeEnum.MT === moduleType) {
        superKey.mt = mtCfg;
      } else if (KeyTypeEnum.DKS === moduleType) {
        // feat: wait to other handle
        superKey.dks = true;
      } else if (KeyTypeEnum.Combo === moduleType) {
        superKey.combo = true;
      }
      kbCfg.superKeyMap[keyId] = superKey;
    };
    const removeSuperKey = (
      keyId: string,
      { moduleType, removeAll }: { moduleType: KeyTypeEnum; removeAll?: boolean }
    ) => {
      const superKey = kbCfg.superKeyMap[keyId];
      if (!superKey) {
        return;
      }
      if (removeAll) {
        kbCfg.superKeyMap[keyId] = {
          sp: [],
          mt: undefined,
          dks: false,
          combo: false
        };
        return;
      }
      const codition = [KeyTypeEnum.OKS, KeyTypeEnum.SOCD, KeyTypeEnum.TGL, KeyTypeEnum.RS];
      if (codition.includes(moduleType)) {
        const idx = superKey.sp.indexOf(moduleType);
        if (idx > -1) {
          superKey.sp.splice(idx, 1);
        }
      } else if (KeyTypeEnum.MT === moduleType) {
        superKey.mt = undefined;
      } else if (KeyTypeEnum.DKS === moduleType) {
        // feat: wait to other handle
        superKey.dks = false;
      } else if (KeyTypeEnum.Combo === moduleType) {
        superKey.combo = false;
      }
      kbCfg.superKeyMap[keyId] = superKey;
    };
    initKeyMap();
    return { initKeyboardData, kbCfg, getKeyDetail, updateSuperKey, removeSuperKey };
  }
  const { initKeyboardData, kbCfg, getKeyDetail, updateSuperKey, removeSuperKey } = useConfigData();

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
    updateSuperKey,
    removeSuperKey,
    ...restRelatedSelectedData
  };
});
