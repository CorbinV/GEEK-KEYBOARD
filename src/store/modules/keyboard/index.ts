import { effectScope, onScopeDispose, reactive, watchEffect } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { useBoolean } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { kbStg, keyboardforage } from '@/utils/storage';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { KeyTypeEnum } from '@/enum/keyType';
import type { BaseKey, BaseKeyView } from '@/api/modules/combo';
import { getDeviceConfigAndLayer, getKeysCfgByLayer } from '@/api/keyConfig';
import keyMapJson from '@/assets/files/key-map.json';
import { formatLableSub3 } from '@/hooks/common/format';
import type { LayerKeysConfig } from '@/api/modules/keyboard';
import { logger } from '@/utils/log';
import { useDeviceStore } from '../device';
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
      layoutMap: Map<string, any>; // for keyboard layout
      offsetList: number[]; // keyboard row offset
      keyMap: any;
      superKeyMap: { [key: string]: CacheSuperKey };
      layerIdx: number;
      layerKeys: any;
      layerList: any[];
    }>({
      layoutMap: new Map(),
      offsetList: [],
      keyMap: {},
      superKeyMap: {},
      layerIdx: 0,
      layerList: [],
      layerKeys: {}
    });
    const { bool: hasConfig } = useBoolean(kbStg.get('hasConfig') === 'Y');
    // const boardConfigList = reactive<any[]>(Array.from({ length: 4 }));
    const getConfigFormCache = async () => {
      const allData: { [key: string]: any } = {};
      await keyboardforage.iterate((v, k) => {
        allData[k] = v;
      });
      return allData;
    };

    const initKeyboardData = async (): Promise<any> => {
      if (kbCfg.layoutMap.size > 0) {
        return kbCfg.layoutMap;
      }
      // get all config data from file
      if (!hasConfig.value) {
        // optimize: dynammic import keyboard config(by keyboard name)
        // const data = await import(`@/assets/files/${kbName}.json`);
        const data = await import('@/assets/files/rk-s75.json');
        // const keyMap: { [key: string]: any } = {};
        data.layout.keys.forEach(item => {
          keyboardforage.setItem(item.id, item);
          kbCfg.layoutMap.set(item.id, item);
        });
        keyboardforage.setItem('base', data.layout.base);
        // keyMap.base = data.layout.base;
        kbCfg.layoutMap.set('base', data.layout.base);
        // update hasConfig value
        // setHasConfig(true);
        // kbStg.set('hasConfig', 'Y');
        // kbCfg.data = keyMap;
        return kbCfg.layoutMap;
      }

      // get all config from forage(local cache)
      const data = await getConfigFormCache();
      // kbCfg.data = data;
      data.forEach(() => {
        // feat: todo
      });
      return data;
    };

    const getKeyDetail = ({ code, type }: Omit<BaseKey, 'key'>) => {
      if (![KeyTypeEnum.None, KeyTypeEnum.Media, KeyTypeEnum.Normal, KeyTypeEnum.System].includes(type)) {
        const detail = {
          icon: '',
          type: 'str',
          label: ''
        };
        const localCode = code + 1;
        switch (type) {
          case KeyTypeEnum.Combo:
            detail.label = `C${localCode}`;
            break;
          case KeyTypeEnum.DKS:
            detail.label = `D${localCode}`;
            break;
          case KeyTypeEnum.Marco:
            detail.label = `M${localCode}`;
            break;
          case KeyTypeEnum.OKS:
            detail.label = `O${localCode}`;
            break;
          case KeyTypeEnum.RS:
            detail.label = `R${localCode}`;
            break;
          case KeyTypeEnum.SOCD:
            detail.label = `S${localCode}`;
            break;
          case KeyTypeEnum.TGL:
            detail.label = `T${localCode}`;
            break;
          default:
            break;
        }
        return detail;
      }
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
    const generateSuperKey = () => {
      return {
        sp: [] as KeyTypeEnum[],
        mt: undefined,
        dks: false,
        combo: false
      };
    };
    const updateSuperKey = (keyId: string, { moduleType, mtCfg }: { moduleType: KeyTypeEnum; mtCfg?: any }) => {
      let superKey = kbCfg.superKeyMap[keyId];
      if (!superKey) {
        // init super key if not exist
        superKey = generateSuperKey();
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
        kbCfg.superKeyMap[keyId] = generateSuperKey();
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
    const updateLayerKeys = async ({ config, layer }: { config: number; layer: number }) => {
      logger('updateLayerKeys------', config, layer);
      if (kbCfg.layerList[layer]) {
        kbCfg.superKeyMap = kbCfg.layerList[layer].superKeyMap;
        kbCfg.layerKeys = kbCfg.layerList[layer].keys;
        return kbCfg.layerKeys;
      }

      let pageNo = 1;
      const pageSize = 25;
      let data: LayerKeysConfig = {
        len: 0,
        config: 0,
        layer: 0,
        name: '',
        def: { tary: [] },
        keys: {},
        smart: {},
        disable: []
      };
      const fetchData = async () => {
        logger('fetchData pageNo', pageNo);
        const result = await getKeysCfgByLayer({
          config,
          layer,
          pageNo,
          pageSize
        });
        logger('fetchData result', JSON.stringify(result));
        if (pageNo === 1) {
          data = { ...result };
        } else {
          data.keys = { ...data.keys, ...result.keys };
          data.smart = { ...data.smart, ...result.smart };
          data.disable = [...data.disable, ...result.disable];
        }
        if (pageNo * pageSize >= data.len) {
          logger('fetch data end');
          return;
        }
        pageNo += 1;
        await fetchData();
      };
      await fetchData();
      logger('fetchData', JSON.stringify(data));
      const superKeyMap: any = {};
      Object.keys(data.smart).forEach((key: any) => {
        const superKey = generateSuperKey();
        const { mt, super: superTuple } = data.smart[key];
        if (mt?.length > 0) {
          const detail = getKeyDetail({
            code: mt[0],
            type: mt[1]
          });
          superKey.mt = formatLableSub3(detail);
        }
        if (superTuple?.length > 0) {
          superKey.sp.push(superTuple[0]);
        }
        superKeyMap[key] = superKey;
      });
      kbCfg.layerList[layer] = {
        keys: data.keys,
        superKeyMap,
        xxx: data
      };
      return kbCfg.layerKeys;
    };
    const updateKeyBaseWhenKeyChange = async ({ keyId, type, code, layer }: any) => {
      const old = kbCfg.layerList[layer].keys;
      kbCfg.layerList[layer].keys[keyId] = { ...old[keyId], type, code };
    };
    initKeyMap();
    return {
      initKeyboardData,
      kbCfg,
      getKeyDetail,
      updateSuperKey,
      removeSuperKey,
      updateLayerKeys,
      updateKeyBaseWhenKeyChange
    };
  }
  const {
    initKeyboardData,
    kbCfg,
    getKeyDetail,
    updateSuperKey,
    removeSuperKey,
    updateLayerKeys,
    updateKeyBaseWhenKeyChange
  } = useConfigData();
  function useDeviceInfo() {
    const deviceStore = useDeviceStore();
    const { isConnected } = storeToRefs(deviceStore);
    const kbInfo = reactive({
      configCount: 0,
      configIndex: 0,
      layerIndex: 0,
      layerCount: 0,
      isLoad: false,
      mounted: false
    });
    const updateAllLayerKeys = async (
      { fetchIdx = 0, configIdx = 0, maxFetch = 0 },
      { finish = false, finishCb }: { skipIdx?: number; finish?: boolean; finishCb?: any }
    ) => {
      if (finish) {
        if (finishCb instanceof Function) {
          finishCb();
        }
        return;
      }
      await updateLayerKeys({
        config: configIdx,
        layer: fetchIdx
      });
      window.requestAnimationFrame(() =>
        updateAllLayerKeys(
          { fetchIdx: fetchIdx + 1, configIdx, maxFetch },
          {
            finish: fetchIdx === maxFetch,
            finishCb
          }
        )
      );
    };
    const doInit = () => {
      watchEffect(async () => {
        if (isConnected.value) {
          kbInfo.isLoad = true;
          const { configCount, configIndex, layerIndex, layerCount } = await getDeviceConfigAndLayer();
          kbInfo.configCount = configCount;
          kbInfo.configIndex = configIndex;
          kbInfo.layerIndex = layerIndex;
          kbInfo.layerCount = layerCount;

          await new Promise(resolve => {
            updateAllLayerKeys({ configIdx: configIndex, maxFetch: layerCount }, { finishCb: resolve });
          });

          updateLayerKeys({
            config: configIndex,
            layer: configIndex
          });
          kbInfo.isLoad = false;
          kbInfo.mounted = true;
        } else {
          kbInfo.mounted = false;
          logger('device is disconnected');
        }
      });
    };
    return {
      kbInfo,
      initConfigAndLayer: doInit,
      updateAllLayerKeys
    };
  }
  const { kbInfo, initConfigAndLayer } = useDeviceInfo();
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
  scope.run(() => {
    initConfigAndLayer();
  });

  // cache mixSiderFixed
  useEventListener(window, 'beforeunload', () => {});

  /** On scope dispose */
  onScopeDispose(() => {
    scope.stop();
  });

  init();

  return {
    kbCfg,
    kbInfo,
    initKeyboardData,
    resetSelectedKeys,
    currentSuperKeyType,
    resetCurrentSuperKeyType,
    getKeyDetail,
    updateSuperKey,
    updateLayerKeys,
    removeSuperKey,
    updateKeyBaseWhenKeyChange,
    ...restRelatedSelectedData
  };
});
