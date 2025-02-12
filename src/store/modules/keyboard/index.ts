import { effectScope, onScopeDispose, reactive, watch, watchEffect } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { useBoolean } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { kbStg, keyboardforage } from '@/utils/storage';
import { useResttableReactiveFn, useResttableRefFn } from '@/hooks/common/basicFnc';
import { KeyTypeEnum, keyTypeEnumProxy } from '@/enum/keyType';
import type { BaseKey, BaseKeyView } from '@/api/modules/combo';
import { getDeviceConfigAndLayer, getKeysCfgByLayer, updateDeviceCfgAndLayer } from '@/api/keyConfig';
import keyMapJson from '@/assets/files/key-map.json';
import { formatLableSub3 } from '@/hooks/common/format';
import type { KeyInfo, LayerKeysConfig } from '@/api/modules/keyboard';
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
    type StandardKbItem = { code: number; alt: string; key: string; coords: number[] };

    const kbCfg = reactive<{
      layoutMap: Map<string, any>; // for keyboard layout
      offsetList: number[]; // keyboard row offset
      keyMap: any;
      standerList: any[];
      standerMap: Map<string, Pick<StandardKbItem, 'alt' | 'code'>>;
    }>({
      layoutMap: new Map(),
      offsetList: [],
      keyMap: {},
      standerList: [],
      standerMap: new Map()
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
    const initStandKeyBoardData = async () => {
      const chunkSize = 10;
      let repeat = 0;
      const updateMap = (list: StandardKbItem[]) => {
        const start = repeat * chunkSize;
        const end = start + chunkSize;
        for (let index = start; index < end; index++) {
          const { key, code, alt } = list[index] || {};
          if (key !== undefined) {
            kbCfg.standerMap.set(key, {
              code,
              alt
            });
          }
        }
        repeat += 1;
        if (end <= list.length) {
          return requestAnimationFrame(() => updateMap(list));
        }
        return '';
      };
      import('@/assets/files/standard-keyboard.json').then(res => {
        kbCfg.standerList = res.default;
        updateMap(res.default);
      });
    };
    const initKeyMap = () => {
      kbCfg.keyMap = keyMapJson;
      // optimize: dynammic import keyboard map
      // import('@/assets/files/key-map.json').then(res => {
      //   kbCfg.keyMap = res.default;
      // });
    };
    initKeyMap();
    initStandKeyBoardData();
    return {
      initKeyboardData,
      kbCfg
    };
  }
  const { initKeyboardData, kbCfg, ...configDataFnc } = useConfigData();
  // handle layer and config origin data
  const useKeyLayerCfg = () => {
    type CacheLayerKeysSpConfig = {
      superKeyMap: { [key: string]: CacheSuperKey };
      dksKeyMap: Map<string, string>;
      comboKeyMap: Map<string, string>;
      rtLabelMap: Map<string, RtLabelMapType>;
      keys: any;
      xxx: any;
    };
    type CacheLayerKeysConfig = Pick<LayerKeysConfig, 'keys' | 'disable' | 'smart'>;
    const dataManager = new Map<string, CacheLayerKeysSpConfig>(); // `${config}-${layer}`
    const [activeKeyLayer, resetActiveKeyLayer] = useResttableReactiveFn<CacheLayerKeysSpConfig>(
      () =>
        ({
          keys: {},
          superKeyMap: {},
          dksKeyMap: new Map(),
          comboKeyMap: new Map(),
          rtLabelMap: new Map(),
          xxx: {}
        }) as CacheLayerKeysSpConfig
    );
    const [keyLayerInfo, resetKeyLayerInfo] = useResttableReactiveFn(() => ({
      configCount: 0,
      configIndex: 0,
      layerIndex: 0,
      layerCount: 0
    }));
    const generateSuperKey = () => {
      return {
        sp: [] as KeyTypeEnum[],
        mt: undefined,
        dks: false,
        combo: false
      };
    };
    const getKeyDetail = ({ code, type }: Omit<BaseKey, 'key'>) => {
      if (
        ![KeyTypeEnum.None, KeyTypeEnum.Normal, KeyTypeEnum.System, KeyTypeEnum.Media, KeyTypeEnum.Special].includes(
          type
        )
      ) {
        const detail = {
          icon: '',
          type: 'str',
          label: ''
        };
        const localCode = code + 1;
        const keyStr = keyTypeEnumProxy.getKey(type)?.substring(0, 1);
        detail.label = `${keyStr}${localCode}`;
        return detail;
      }
      const codeMap = kbCfg.keyMap[type]?.code;
      if (!codeMap) {
        // throw new Error('get key detail info failed, beause no code map');
        console.warn('get key detail info failed, beause no code map');
        return {
          icon: '',
          type: 'str',
          label: 'Error'
        };
      }
      const codeDetail = codeMap[code];
      if (!codeDetail) {
        console.warn('get key detail info failed, beause no code detail');
        return {
          icon: '',
          type: 'str',
          label: 'Error'
        };
        // throw new Error('get key detail info failed, beause no code detail');
      }
      return codeDetail;
    };
    const fetchLayerKeys = async (
      params: {
        configIdx: number;
        layerIdx: number;
        prevData?: CacheLayerKeysConfig;
        pageSize?: number;
        pageNo?: number;
      },
      onProgress?: (current: number, total: number) => void
    ): Promise<CacheLayerKeysConfig> => {
      const { configIdx, layerIdx, pageSize = 25, prevData, pageNo = 1 } = params;
      const result = await getKeysCfgByLayer({
        config: configIdx,
        layer: layerIdx,
        pageNo,
        pageSize
      });
      const currentData = prevData
        ? {
            keys: { ...prevData.keys, ...result.keys },
            smart: { ...prevData.smart, ...result.smart },
            disable: [...prevData.disable, ...result.disable],
            len: result.len
          }
        : result;
      onProgress?.(pageNo * pageSize, result.len);
      if (pageNo * pageSize >= result.len) {
        return currentData;
      }
      return fetchLayerKeys(
        {
          configIdx,
          layerIdx,
          pageSize,
          pageNo: pageNo + 1,
          prevData: currentData
        },
        onProgress
      );
    };
    const updateLayerKeys = async ({ config = keyLayerInfo.configIndex, layer = keyLayerInfo.layerIndex }) => {
      const managerId = `${config}-${layer}`;
      const layerInfo = dataManager.get(managerId);

      logger('updateLayerKeys------', config, layer);

      if (layerInfo) {
        activeKeyLayer.superKeyMap = layerInfo.superKeyMap;
        activeKeyLayer.dksKeyMap = layerInfo.dksKeyMap;
        activeKeyLayer.comboKeyMap = layerInfo.comboKeyMap;
        activeKeyLayer.rtLabelMap = layerInfo.rtLabelMap;
        activeKeyLayer.keys = layerInfo.keys;
        activeKeyLayer.xxx = layerInfo.xxx;
        return activeKeyLayer;
      }

      const cfgData = await fetchLayerKeys({
        configIdx: config,
        layerIdx: layer
      });
      logger('fetchData 🟩', cfgData);
      const superKeyMap: any = {};
      Object.keys(cfgData.smart).forEach((key: any) => {
        const superKey = generateSuperKey();
        const { mt, super: superTuple } = cfgData.smart[key];
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
      const cache = {
        keys: cfgData.keys,
        superKeyMap,
        dksKeyMap: new Map(),
        comboKeyMap: new Map(),
        rtLabelMap: new Map(),
        xxx: cfgData
      };
      dataManager.set(managerId, cache);
      return cache;
    };
    const updateAllLayerKeys = async (
      { fetchIdx = 0, configIdx = 0, maxFetch = 0 },
      { finish = false, finishCb }: { skipIdx?: number; finish?: boolean; finishCb?: any }
    ) => {
      try {
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
      } catch (error) {
        throw error;
      }
    };
    const updateDeviceCfgAndLayers = async (): Promise<void> => {
      const { configCount, configIndex, layerIndex, layerCount } = await getDeviceConfigAndLayer();
      keyLayerInfo.configCount = configCount;
      keyLayerInfo.configIndex = configIndex;
      keyLayerInfo.layerIndex = layerIndex;
      keyLayerInfo.layerCount = layerCount;
    };
    const updateSuperKey = (keyId: string, { moduleType, mtCfg }: { moduleType: KeyTypeEnum; mtCfg?: any }) => {
      let superKey = activeKeyLayer.superKeyMap[keyId];
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
      activeKeyLayer.superKeyMap[keyId] = superKey;
    };
    const removeSuperKey = (
      keyId: string,
      { moduleType, removeAll }: { moduleType: KeyTypeEnum; removeAll?: boolean }
    ) => {
      const superKey = activeKeyLayer.superKeyMap[keyId];
      if (!superKey) {
        return;
      }
      if (removeAll) {
        activeKeyLayer.superKeyMap[keyId] = generateSuperKey();
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
      activeKeyLayer.superKeyMap[keyId] = superKey;
    };
    const setKeyDisabled = (
      { keyId, layer = keyLayerInfo.layerIndex }: { keyId: string; layer?: number },
      disabled: boolean
    ) => {
      const managerId = `${keyLayerInfo.configIndex}-${layer || keyLayerInfo.layerIndex}`;
      const layerInfo = layer ? activeKeyLayer.keys : dataManager.get(managerId);
      const idx = layerInfo?.xxx.disable.indexOf(keyId);
      if (disabled) {
        if (idx === -1) {
          dataManager.get(managerId)!.xxx.disable.push(keyId);
        }
      } else if (idx > -1) {
        dataManager.get(managerId)!.xxx.disable.splice(idx, 1);
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
      let mapValue = activeKeyLayer[paramName].get(dataStr!);
      if (type === 'add') {
        activeKeyLayer[paramName].set(dataStr!, key);
        mapValue = key;
      } else {
        activeKeyLayer[paramName].delete(dataStr!);
      }
      return mapValue;
    };
    const updateKeyBaseWhenKeyChange = ({ keyId, type, code, layer }: any) => {
      let oldKeys;
      const managerId = `${keyLayerInfo.configIndex}-${layer || keyLayerInfo.layerIndex}`;
      if (layer !== undefined) {
        oldKeys = activeKeyLayer.keys;
        activeKeyLayer.keys[keyId] = { ...oldKeys[keyId], type, code };
      } else {
        oldKeys = dataManager.get(managerId)!.keys;
        dataManager.get(managerId)!.keys[keyId] = { ...oldKeys[keyId], type, code };
      }
    };
    const updateKeyBase = (keyId: string, data: any, layer: number = keyLayerInfo.layerIndex) => {
      let oldKeys;
      const managerId = `${keyLayerInfo.configIndex}-${layer || keyLayerInfo.layerIndex}`;
      if (layer !== undefined) {
        oldKeys = activeKeyLayer.keys;
        activeKeyLayer.keys[keyId] = { ...(oldKeys[keyId] || {}), ...data };
      } else {
        oldKeys = dataManager.get(managerId)!.keys;
        dataManager.get(managerId)!.keys[keyId] = { ...(oldKeys[keyId] || {}), ...data };
      }
    };
    const resetKeyLayerCfgCtrl = () => {
      resetActiveKeyLayer();
      resetKeyLayerInfo();
      dataManager.clear();
    };

    return {
      keyLayerInfo,
      activeKeyLayer,
      updateLayerKeys,
      updateAllLayerKeys,
      updateDeviceCfgAndLayers,
      getKeyDetail,
      generateSuperKey,
      setKeyDisabled,
      updateKeyTag,
      removeSuperKey,
      updateSuperKey,
      updateKeyBaseWhenKeyChange,
      updateKeyBase,
      resetKeyLayerCfgCtrl
    };
  };
  const {
    keyLayerInfo,
    updateAllLayerKeys,
    updateDeviceCfgAndLayers,
    getKeyDetail,
    updateLayerKeys,
    resetKeyLayerCfgCtrl,
    ...keyLayerCfgFnc
  } = useKeyLayerCfg();
  function useDeviceInfo() {
    const deviceStore = useDeviceStore();
    const { isConnected } = storeToRefs(deviceStore);
    const kbInfo = reactive({
      isLoad: false,
      mounted: Boolean(localStorage.getItem('device-mounted') || '')
    });
    const handleDevConn = async () => {
      try {
        kbInfo.isLoad = true;
        await updateDeviceCfgAndLayers();
        await new Promise(async(resolve, reject) => {
          try {
           await updateAllLayerKeys(
              { configIdx: keyLayerInfo.configIndex, maxFetch: keyLayerInfo.layerCount },
              { finishCb: resolve }
            );
          } catch (e) {
            console.log('catch error when update config and layer', e);
            reject(e);
          }
        });
        // set layer to  device current cfg
        updateLayerKeys({
          config: keyLayerInfo.configIndex,
          layer: keyLayerInfo.layerIndex
        });
        kbInfo.isLoad = false;
        kbInfo.mounted = true;
      } catch (error) {
        console.log('catch error when update config and layer', error);
        kbInfo.isLoad = false;
        kbInfo.mounted = false;
      }
    };

    const handleDevDisConn = async () => {
      kbInfo.mounted = false;
      kbInfo.isLoad = false;
      logger('device is disconnected');
    };
    watchEffect(() => {
      if (!isConnected.value) {
        kbInfo.mounted = false;
      }
    });
    watch(
      () => kbInfo.mounted,
      v => {
        localStorage.setItem('device-mounted', v ? '1' : '');
      }
    );

    const watchDevConnStatus = (ops?: { connCb?: () => void; disconnCb?: () => void }) => {
      const { connCb, disconnCb } = ops || {};
      watchEffect(async () => {
        if (!isConnected.value) {
          await handleDevDisConn();
          if (disconnCb instanceof Function) {
            await disconnCb();
          }
          return;
        }
        if (!kbInfo.mounted) {
          await handleDevConn();
          if (connCb instanceof Function) {
            await connCb();
          }
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
    const resetRelatedSelectedKeysCtrl = () => {
      resetSelectedKeys();
      resetSelectedKeysMap();
      resetSelectedKeysTemp();
    };
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
      showKeyParams,
      resetRelatedSelectedKeysCtrl
    };
  }
  const { resetSelectedKeys, resetRelatedSelectedKeysCtrl, ...restRelatedSelectedData } = useRelatedSelectedKeys();
  const [currentSuperKeyType, resetCurrentSuperKeyType] = useResttableRefFn<CurrentSuperKeyType>(
    () => KeyTypeEnum.None
  );
  function useKeyHistory() {
    type ChangeKeyType = {
      oldVal: KeyInfo;
      newVal: KeyInfo;
    };
    const MAX_SIZE = 5;
    const [current, resetCurrent] = useResttableRefFn<any>(() => ({}));
    const [historyCtrl, resetHistoryCtrl] = useResttableRefFn<any>(() => {
      return [];
    });
    const [futureCtrl, resetFutureCtrl] = useResttableRefFn<any>(() => {
      return [];
    });
    // push data
    const pushState = (data: ChangeKeyType) => {
      historyCtrl.value.push(data);
      if (MAX_SIZE < historyCtrl.value.length) {
        historyCtrl.value.shift();
      }
      current.value = data;
      resetFutureCtrl();
    };
    // undo
    const undo = () => {
      if (!historyCtrl.value.length) {
        return null;
      }
      futureCtrl.value.push(current.value);
      current.value = historyCtrl.value.pop()!;
      return current.value;
    };
    // redo
    const redo = () => {
      if (!futureCtrl.value.length) {
        return null;
      }
      historyCtrl.value.push(current.value);
      current.value = futureCtrl.value.pop()!;

      return current.value;
    };
    const resetKeyHistory = () => {
      resetFutureCtrl();
      resetHistoryCtrl();
    };
    return {
      pushState,
      undo,
      redo,
      historyCtrl,
      futureCtrl,
      resetKeyHistory,
      resetCurrent
    };
  }
  const { resetKeyHistory, ...keyHistoryFnc } = useKeyHistory();
  async function init() {
    await initKeyboardData();
    watchEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      currentSuperKeyType.value;
      resetSelectedKeys();
    });
    watchDevConnStatus({
      connCb: () => {
        console.log('connect ....');
      },
      disconnCb: () => {
        resetKeyLayerCfgCtrl();
        resetRelatedSelectedKeysCtrl();
        resetKeyHistory();
        console.log('device disattch, data reset success');
      }
    });
    let isWatching = false;
    let stopWatchCb: any;
    const cfgWatchCb = ([cfgIdx, layerIdx]: number[]) => {
      resetSelectedKeys();
      resetKeyHistory();
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
    }
    watch(
      () => kbInfo.mounted,
      monuted => {
        if (monuted) {
          if (!isWatching) {
            stopWatchCb = watch([() => keyLayerInfo.configIndex, () => keyLayerInfo.layerIndex], cfgWatchCb);
            isWatching = true;
          }
        } else if (stopWatchCb) {
          stopWatchCb();
        }
      }
    );
  }

  // watch store
  // scope.run(() => {
  // });

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
    keyLayerInfo,
    initKeyboardData,
    resetSelectedKeys,
    currentSuperKeyType,
    resetCurrentSuperKeyType,
    getKeyDetail,
    updateLayerKeys,
    ...keyLayerCfgFnc,
    ...configDataFnc,
    ...restRelatedSelectedData,
    ...keyHistoryFnc
  };
});
