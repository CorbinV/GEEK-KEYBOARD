import { computed, effectScope, onScopeDispose, reactive, watch, watchEffect } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { useBoolean } from '@sa/hooks';
import logger from '@sa/log';
import { SetupStoreId } from '@/enum';
import { kbStg, keyboardforage } from '@/utils/storage';
import { useResttableReactiveFn, useResttableRefFn } from '@/hooks/common/basicFnc';
import { DeviceLinkEnum, deviceLinkEnumProxy, KeyTypeEnum, keyTypeEnumProxy } from '@/enum/keyType';
import type { BaseKey, BaseKeyView } from '@/api/modules/combo';
import type { DeviceInfo } from '@/api/modules/keyboard-setting';
import { getDeviceConfigAndLayer, getKeysCfgByLayer, updateDeviceCfgAndLayer } from '@/api/keyConfig';
import keyMapJson from '@/assets/files/key-map.json';
import StandardKeyJsom from '@/assets/files/standard-key.json'
import { formatLableSub3 } from '@/hooks/common/format';
import type { KeyInfo, LayerKeysConfig } from '@/api/modules/keyboard';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import { useDeviceStore } from '../device';
import { getDeviceInfo } from '@/api/keyConfig-setting';
import { $t } from '@/locales';

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
  const kbLogger = logger.getLogger('kbStore');
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
      standardKeyMap: any; // standard key label
    }>({
      layoutMap: new Map(),
      offsetList: [],
      keyMap: {},
      standerList: [],
      standerMap: new Map(),
      standardKeyMap: {}
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
          const viewItem = Object.assign(item, { left: -1, top: -1 });
          keyboardforage.setItem(item.id, viewItem);
          kbCfg.layoutMap.set(item.id, viewItem);
        });
        keyboardforage.setItem('base', Object.assign(data.layout.base, { left: -1, top: -1 }));
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
    const initStandarKey = () => {
      kbCfg.standardKeyMap = StandardKeyJsom;

    }
    initKeyMap();
    initStandarKey();
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
    type CacheLayerKeysConfig = Pick<LayerKeysConfig, 'keys' | 'disable' | 'smart' | 'def'>;
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
    const getKeyDetail = ({ code, type }: Omit<BaseKey, 'key'>): BaseKeyView => {
      const condition = [
        KeyTypeEnum.Combo,
        KeyTypeEnum.DKS,
        KeyTypeEnum.Marco,
        KeyTypeEnum.OKS,
        KeyTypeEnum.SOCD,
        KeyTypeEnum.MT,
        KeyTypeEnum.TGL,
        KeyTypeEnum.RS
      ];
      if (condition.includes(type)) {
        const detail: BaseKeyView = {
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
        kbLogger.warn('get key detail info failed, beause no code map');
        return {
          icon: '',
          type: 'str',
          label: 'Lost'
        };
      }
      const codeDetail = codeMap[code];
      if (!codeDetail) {
        kbLogger.warn('get key detail info failed, beause no code detail', `code: ${code}, type: ${type}`);
        return {
          icon: '',
          type: 'str',
          label: 'No Found'
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
      let result: LayerKeysConfig;
      try {
        result = await getKeysCfgByLayer({
          config: configIdx,
          layer: layerIdx,
          pageNo,
          pageSize
        });
      } catch (error) {
        throw error;
      }
      const currentData = prevData
        ? {
          keys: { ...prevData.keys, ...result.keys },
          smart: { ...prevData.smart, ...result.smart },
          disable: [...prevData.disable, ...result.disable],
          len: result.len,
          def: { ...prevData.def, ...result.def }
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

      if (layerInfo) {
        activeKeyLayer.superKeyMap = layerInfo.superKeyMap;
        activeKeyLayer.dksKeyMap = layerInfo.dksKeyMap;
        activeKeyLayer.comboKeyMap = layerInfo.comboKeyMap;
        activeKeyLayer.rtLabelMap = layerInfo.rtLabelMap;
        activeKeyLayer.keys = layerInfo.keys;
        activeKeyLayer.xxx = layerInfo.xxx;
        return Promise.resolve(activeKeyLayer);
      }
      let cfgData
      try {
        cfgData = await fetchLayerKeys({
          configIdx: config,
          layerIdx: layer
        });
      } catch (error) {
        throw error;
      }
      kbLogger.debug(`Fetch Layer data by layer: ${layer} & config: ${config} 🟩`, cfgData);
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
      { finish = false, finishCb, errCb }: { skipIdx?: number; finish?: boolean; finishCb?: any; errCb?: any }
    ) => {
      if (finish) {
        if (finishCb instanceof Function) {
          finishCb();
        }
        return;
      }
      try {
        await updateLayerKeys({
          config: configIdx,
          layer: fetchIdx
        });
      } catch (error) {
        if (errCb instanceof Function) {
          return errCb(error);
        }
        return Promise.reject(error);
      }
      setTimeout(() => {
        updateAllLayerKeys(
          { fetchIdx: fetchIdx + 1, configIdx, maxFetch },
          {
            finish: fetchIdx === maxFetch,
            finishCb,
            errCb
          }
        )
      })
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
      const layerInfo = layer ? activeKeyLayer : dataManager.get(managerId);
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
    const kbInfo = reactive<{
      hd: DeviceInfo & { model: string, version: string }
    } & {
      isLoad: boolean,
      mounted: boolean
      connect: DeviceLinkEnum
    }>({
      isLoad: false,
      mounted: Boolean(localStorage.getItem('device-mounted') || ''),
      hd: {}
    } as any);
    const handleDevConn = async () => {
      try {
        kbInfo.isLoad = true;
        await updateDeviceCfgAndLayers();
        await new Promise((resolve, reject) => {
          updateAllLayerKeys(
            { configIdx: keyLayerInfo.configIndex, maxFetch: keyLayerInfo.layerCount },
            { finishCb: resolve, errCb: reject }
          )
            .catch(e => {
              kbLogger.error('catch error when update config and layer', e);
              reject(e);
            });
        })
        await updateLayerKeys({
          config: keyLayerInfo.configIndex,
          layer: keyLayerInfo.layerIndex
        });
        kbInfo.isLoad = false;
        kbInfo.mounted = true;
        // });
      } catch (error) {
        kbLogger.error('catch error when update config and layer', error);
        handleDevDisConn()
        await deviceStore.disconnect()
        window?.$message!.warning($t('businessCommon.devErr'));
      }
    };

    const handleDevDisConn = async () => {
      kbInfo.mounted = false;
      kbInfo.isLoad = false;
      kbLogger.warn('Device is disconnected');
    };

    const updateDeviceInfo = async () => {
      try {
        const data = await getDeviceInfo();
        data.connect = deviceLinkEnumProxy.getKey(data.connect || 0)
        let model: string = '';
        const generateModelName = (firmware: DeviceInfo['firmwares'][number]) => {
          if (firmware.id === 0) {
            return firmware.model
          }
          return firmware.model.split('*').shift()!
        }
        const versionList = Array.from({ length: 3 }).fill('0') as string[]
        data.firmwares.forEach((firmware) => {
          if (!model) {
            model = generateModelName(firmware)
          }
          if (versionList[firmware.id] !== undefined) {
            versionList[firmware.id] = (firmware.version || 0).toString(16)
          } else {
            versionList.splice(firmware.id, 0, (firmware.version || 0).toString(16))
          }
        })
        kbInfo.hd = { ...data, model, version: versionList.join('.') };
      } catch (error) {
        kbLogger.error('catch error when update device info', error);
      }
    }
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
      watchDevConnStatus,
      updateDeviceInfo,
      AfterDevConn: handleDevConn
    };
  }
  const { kbInfo, watchDevConnStatus, AfterDevConn, updateDeviceInfo } = useDeviceInfo();
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
    const [allowMutipleSelect, resetAllowMutipleSelect] = useResttableRefFn(() => false);
    const [showKeyParams] = useResttableRefFn(() => false);

    function emitResetSelectedKeys(_?: any) {
      resetSelectedKeys();
      selectedKeysMap.value.clear();
    }
    const resetRelatedSelectedKeysCtrl = () => {
      resetSelectedKeys();
      resetSelectedKeysMap();
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
      historyCtrl.value.unshift(data);
      if (MAX_SIZE < historyCtrl.value.length) {
        historyCtrl.value.pop();
      }
      current.value = data;
      resetFutureCtrl();
    };
    // undo // 后退
    const undo = () => {
      if (!historyCtrl.value.length) {
        return null;
      }
      current.value = historyCtrl.value.shift()!;
      futureCtrl.value.unshift(current.value);
      return current.value;
    };
    // redo
    const redo = () => {
      if (!futureCtrl.value.length) {
        return null;
      }
      current.value = futureCtrl.value.shift()!;
      historyCtrl.value.unshift(current.value);

      return current.value;
    };
    const resetKeyHistory = () => {
      resetFutureCtrl();
      resetHistoryCtrl();
    };
    const allowUndo = computed(() => {
      return historyCtrl.value.length
    })
    const allowRedo = computed(() => {
      return futureCtrl.value.length
    })
    return {
      pushState,
      undo,
      redo,
      allowUndo,
      allowRedo,
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
        kbLogger.debug('connect ....');
        updateDeviceInfo()
      },
      disconnCb: () => {
        resetKeyLayerCfgCtrl();
        resetRelatedSelectedKeysCtrl();
        resetKeyHistory();
        kbLogger.debug('device disattch, data reset success');
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
          }).then(() => {
            emitter.emit(EventNameEnum.layerOrConfigChange, null);
          });
        })
        .catch(e => {
          window.$message?.error('设备响应异常');
          kbLogger.debug(e);
        });
    };
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
  const afterDeviceReset = async () => {
    await AfterDevConn()
    await updateDeviceInfo()
  }
  // watch store
  // scope.run(() => {
  // });

  // cache mixSiderFixed
  useEventListener(window, 'beforeunload', () => { });

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
    ...keyHistoryFnc,
    afterDeviceReset
  };
});
