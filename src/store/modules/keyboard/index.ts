import { effectScope, onScopeDispose, reactive, watch, watchEffect } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { useBoolean } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { kbStg, keyboardforage } from '@/utils/storage';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { KeyTypeEnum } from '@/enum/keyType';
import type { BaseKey, BaseKeyView } from '@/api/modules/combo';
import { getDeviceConfigAndLayer, getKeysCfgByLayer, updateDeviceCfgAndLayer } from '@/api/keyConfig';
import keyMapJson from '@/assets/files/key-map.json';
import { formatLableSub3 } from '@/hooks/common/format';
import type { LayerKeysConfig } from '@/api/modules/keyboard';
import { logger } from '@/utils/log';
import { useDeviceStore } from '../device';

type CurrentSuperKeyType = Omit<
  KeyTypeEnum,
  KeyTypeEnum.Normal | KeyTypeEnum.System | KeyTypeEnum.Media | KeyTypeEnum.Combo | KeyTypeEnum.Special
>;
type RtLabelMapType = { trigPt: string; rtTrig: string; rtReset: string; enableRt: number };
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
    }>({
      layoutMap: new Map(),
      offsetList: [],
      keyMap: {}
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

    const initKeyMap = () => {
      kbCfg.keyMap = keyMapJson;
      // optimize: dynammic import keyboard map
      // import('@/assets/files/key-map.json').then(res => {
      //   kbCfg.keyMap = res.default;
      // });
    };
    initKeyMap();
    return {
      initKeyboardData,
      kbCfg
    };
  }
  const { initKeyboardData, kbCfg, ...configDataFnc } = useConfigData();
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
    };
      };
    };
    const updateSuperKey = (keyId: string, { moduleType, mtCfg }: { moduleType: KeyTypeEnum; mtCfg?: any }) => {
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
    };
    const removeSuperKey = (
      keyId: string,
      { moduleType, removeAll }: { moduleType: KeyTypeEnum; removeAll?: boolean }
    ) => {
      if (!superKey) {
        return;
      }
      if (removeAll) {
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
    };
    const setKeyDisabled = (
      disabled: boolean
    ) => {
      if (disabled) {
        if (idx === -1) {
        }
      } else if (idx > -1) {
      }
    };
    const updateKeyTag = (
      origin: {
        key: string;
        data: { type: KeyTypeEnum; code: number };
      },
      ops: {
        type?: 'add' | 'remove';
        tag?: 'combo' | 'dks';
      }
    ) => {
      const { key, data } = origin;
      const { type = 'add', tag = 'combo' } = ops || {};
      const dataStr = JSON.stringify(data);
      const paramName = (() => {
        if (tag === 'combo') {
          return 'comboKeyMap';
        }
        return 'dksKeyMap';
      })();
      if (type === 'add') {
        mapValue = key;
      } else {
      }
      return mapValue;
    };
      updateDeviceCfgAndLayer({
        layerIdx,
        cfgIdx
      })
        .then(() => {
          updateLayerKeys({
            config: cfgIdx,
            layer: layerIdx
          });
        })
        .catch(e => {
          window.$message?.error('设备响应异常');
          console.log(e);
        });
    });
    return {
      updateLayerKeys,
      setKeyDisabled,
      updateKeyTag,
      updateKeyBase
    };
  function useDeviceInfo() {
    const deviceStore = useDeviceStore();
    const { isConnected } = storeToRefs(deviceStore);
    const kbInfo = reactive({
      isLoad: false,
      mounted: false
    });

    const handleDevConn = async () => {
      kbInfo.isLoad = true;
      await updateDeviceCfgAndLayers();
      await new Promise(resolve => {
        updateAllLayerKeys(
          { configIdx: keyLayerInfo.configIndex, maxFetch: keyLayerInfo.layerCount },
          { finishCb: resolve }
        );
      });
      // set layer to  device current cfg
      updateLayerKeys({
        config: keyLayerInfo.configIndex,
        layer: keyLayerInfo.configIndex
      });
      kbInfo.isLoad = false;
      kbInfo.mounted = true;
    };
    const handleDevDisConn = async () => {
      kbInfo.mounted = false;
      logger('device is disconnected');
    };
    const watchDevConnStatus = () => {
      // optimize: use watch to replace watcheffect
      watchEffect(async () => {
        if (isConnected.value && !kbInfo.mounted) {
          await handleDevConn();
        } else {
          await handleDevDisConn();
        }
      });
    };
    return {
      kbInfo,
      updateAllLayerKeys,
      watchDevConnStatus
    };
  }
  const { kbInfo, watchDevConnStatus } = useDeviceInfo();
  function useRelatedSelectedKeys() {
    const [selectedKeys, resetSelectedKeys] = useResttableRefFn<{
      [key: string]: {
        base: { code: number; type: number };
        detail: any;
        config: any;
      };
    }>(() => ({}));
    const [selectedKeysMap, resetSelectedKeysMap] = useResttableRefFn<
      Map<
        string,
        {
          base: { code: number; type: number };
          detail: any;
          config: any;
        }
      >
    >(() => {
      return new Map();
    });
    const [selectedKeysTemp, resetSelectedKeysTemp] = useResttableRefFn<{
      [key: string]: {
        base: { code: number; type: number };
        detail: any;
        config: any;
      };
    }>(() => ({}));
    const [allowMutipleSelect, resetAllowMutipleSelect] = useResttableRefFn(() => false);
    const [showKeyParams] = useResttableRefFn(() => false);

    function emitResetSelectedKeys(_?: any) {
      resetSelectedKeys();
      selectedKeysMap.value.clear();
    }
    watchEffect(() => {
      // feat: when allow mutiple select value change, the selected keys should be reset
      emitResetSelectedKeys(allowMutipleSelect.value);
    });
    watchEffect(() => {
      if (!allowMutipleSelect.value) {
        showKeyParams.value = false;
      }
    });
    return {
      selectedKeys,
      resetSelectedKeys,
      allowMutipleSelect,
      resetAllowMutipleSelect,
      selectedKeysTemp,
      resetSelectedKeysTemp,
      selectedKeysMap,
      resetSelectedKeysMap,
      emitResetSelectedKeys,
      showKeyParams
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
    watchDevConnStatus();
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
    updateLayerKeys,
    ...configDataFnc,
    ...restRelatedSelectedData
  };
});
