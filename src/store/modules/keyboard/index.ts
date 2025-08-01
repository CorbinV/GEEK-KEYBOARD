import { computed, effectScope, onScopeDispose, reactive, toRefs, watch, watchEffect } from 'vue';
import { defineStore } from 'pinia';
import { useEventListener } from '@vueuse/core';
import { useBoolean } from '@sa/hooks';
import logger from '@sa/log';
import { SetupStoreId } from '@/enum';
import { kbStg, keyboardforage } from '@/utils/storage';
import { useResttableReactiveFn, useResttableRefFn } from '@/hooks/common/basicFnc';
import type { DeviceInputTypeEnum, DeviceLinkEnum, KeyTypeEnum } from '@/enum/keyType';
import { deviceInputEnumProxy } from '@/enum/keyType';
import type { DeviceInfo } from '@/api/modules/setting';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import { getDeviceInfo, getInputType, getRate } from '@/api/setting';
import { $t } from '@/locales';
import { getConfigCnt, getKeysCfgByLayer, resetLayerKeys, setKeyInfo } from '@/api/key';
import type { KeyRes } from '@/api/modules/keyModify';
import { number2Version } from '@/utils/tools';
import type { SOCDMode } from '@/api/modules/socd';
import { useDeviceStore } from '../device';
let inBoot = false;
export function isInBoot() {
  return inBoot;
}
export function setInBoot(v: boolean) {
  inBoot = v;
}
export const useKeyboardStore = defineStore(SetupStoreId.Keyboard, () => {
  const scope = effectScope();
  const kbLogger = logger.getLogger('kbStore');

  function useConfigData() {
    const kbCfg = reactive<{
      layoutMap: Map<string, any>; // for layout
    }>({
      layoutMap: new Map()
    });

    const { bool: hasConfig } = useBoolean(kbStg.get('hasConfig') === 'Y');
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
        const data = await import('@/assets/files/hitpad.json');
        // const keyMap: { [key: string]: any } = {};
        Object.keys(data.layout.keys).forEach(key => {
          const viewItem = (data.layout.keys as Record<string, any>)[key];
          // const viewItem = Object.assign(item, { left: -1, top: -1 });
          keyboardforage.setItem(key, viewItem);
          kbCfg.layoutMap.set(key, viewItem);
        });
        // keyboardforage.setItem('base', Object.assign(data.layout.base, { left: -1, top: -1 }));
        // keyMap.base = data.layout.base;
        // kbCfg.layoutMap.set('base', data.layout.base);
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
    return {
      initKeyboardData,
      kbCfg
    };
  }
  const { initKeyboardData, kbCfg, ...configDataFnc } = useConfigData();
  // handle layer and config origin data
  const useKeyLayerCfg = () => {
    type CacheLayerKeysSpConfig = {
      keys: any;
      xxx: any;
    };
    type CacheLayerKeysConfig = {
      keys: {
        [key: string]: any;
      };
    };
    const dataManager = new Map<string, CacheLayerKeysConfig & { xxx: any }>(); // `${config}-${layer}`
    const [activeKeyLayer, resetActiveKeyLayer] = useResttableReactiveFn<CacheLayerKeysSpConfig>(
      () =>
        ({
          keys: {},
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
    const handleFetchLayerKeys = async (
      { cfg = keyLayerInfo.configIndex, layer = keyLayerInfo.layerIndex },
      accumulated: any = {}
    ) => {
      const cfgData = await getKeysCfgByLayer({
        cfg,
        layer
      });
      // const combined = accumulated.concat(cfgData.ks);
      const combined = { ...accumulated, ...cfgData.ks };

      if (cfgData.rest) {
        return getKeysCfgByLayer({
          cfg,
          layer
        });
      }
      return combined;
    };
    const fetchLayerKeys = async (params: { configIdx: number; layerIdx: number }): Promise<CacheLayerKeysConfig> => {
      const { configIdx, layerIdx } = params;
      // let result: LayerKeysConfig;
      const keys = await handleFetchLayerKeys({
        cfg: configIdx,
        layer: layerIdx
      });
      return {
        keys
      };
    };

    const updateLayerKeys = async (
      { config = keyLayerInfo.configIndex, layer = keyLayerInfo.layerIndex },
      ops?: {
        forced?: boolean;
      }
    ) => {
      const managerId = `${config}-${layer}`;
      const layerInfo = dataManager.get(managerId);
      const { forced } = ops || {};
      // target cfgIdx-layerIdx exist -> get cache
      if (!forced && layerInfo) {
        activeKeyLayer.keys = layerInfo.keys;
        activeKeyLayer.xxx = layerInfo.xxx;
        return Promise.resolve(activeKeyLayer);
      }
      // let cfgData;

      const cfgData = await fetchLayerKeys({
        configIdx: config,
        layerIdx: layer
      });
      kbLogger.debug(`Fetch Layer data by layer: ${layer} & config: ${config} 🟩`, cfgData);
      const cache = {
        keys: cfgData.keys,
        xxx: JSON.parse(JSON.stringify(cfgData))
      };
      dataManager.set(managerId, cache);
      if (forced) {
        activeKeyLayer.keys = cache.keys;
        activeKeyLayer.xxx = cache.xxx;
      }
      return cache;
    };
    const updateModeKeys = async (maxLayer: number, modeIndex: number) => {
      const iterate = Array.from({ length: maxLayer }).map((_, i) => i);
      for await (const idx of iterate) {
        await updateLayerKeys({
          config: modeIndex,
          layer: idx
        });
      }
    };
    const updateAllLayerKeys = async () => {
      const maxLayer = keyLayerInfo.layerCount;
      const maxConfig = keyLayerInfo.configCount;
      const iterate = Array.from({ length: maxConfig }).map((_, i) => i);
      try {
        for await (const idx of iterate) {
          await updateModeKeys(maxLayer, idx);
        }
      } catch (error) {
        kbLogger.error('catch error when update config and layer', error);
        throw error;
      }
    };
    const updateDeviceCfgAndLayers = async (): Promise<void> => {
      const { configCount, configIndex, layerIndex, layerCount } = await getConfigCnt();
      keyLayerInfo.configCount = configCount;
      keyLayerInfo.configIndex = configIndex;
      keyLayerInfo.layerIndex = layerIndex;
      keyLayerInfo.layerCount = layerCount;
    };
    const updateKey = async (
      key: string,
      data: any,
      layer: number = keyLayerInfo.layerIndex,
      config: number = keyLayerInfo.configIndex
    ) => {
      const tkSend = {
        cfg: config,
        layer,
        k: key,
        v: data.v
      };
      await setKeyInfo(tkSend);

      const managerId = `${config}-${layer}`;
      const oldKeys = dataManager.get(managerId)!.keys;
      dataManager.get(managerId)!.keys[key] = { ...(oldKeys[key] || {}), ...data };
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
      generateSuperKey,
      updateKey,
      resetKeyLayerCfgCtrl
    };
  };
  const {
    keyLayerInfo,
    updateAllLayerKeys,
    updateDeviceCfgAndLayers,
    updateLayerKeys,
    resetKeyLayerCfgCtrl,
    ...keyLayerCfgFnc
  } = useKeyLayerCfg();
  function useDeviceInfo() {
    const deviceStore = useDeviceStore();
    const { isConnected } = toRefs(deviceStore);
    const kbInfo = reactive<
      {
        hd: DeviceInfo & {
          model: string;
          version: string;
          rate: number;
          inputType: DeviceInputTypeEnum;
          connect?: DeviceLinkEnum;
        };
      } & {
        isLoad: boolean;
        mounted: boolean;
        connect: DeviceLinkEnum;
        socd: SOCDMode | undefined;
      }
    >({
      isLoad: false,
      mounted: Boolean(localStorage.getItem('device-mounted') || ''),
      hd: {}
    } as any);
    const handleDevDisConn = async () => {
      kbInfo.mounted = false;
      kbInfo.isLoad = false;
      kbInfo.socd = undefined;
      kbLogger.warn('Device is disconnected');
    };
    const handleDevConn = async () => {
      try {
        kbInfo.isLoad = true;
        await updateDeviceCfgAndLayers();
        await updateAllLayerKeys();
        // // set layer to  device current cfg
        await updateLayerKeys({
          config: keyLayerInfo.configIndex,
          layer: keyLayerInfo.layerIndex
        });
        kbInfo.isLoad = false;
        // });
      } catch (error) {
        kbLogger.error('catch error when update config and layer', error);
        throw error;
      }
    };

    const updateDeviceInfo = async () => {
      try {
        const baseInfo = await getDeviceInfo();
        // wait inferface
        const rateInfo = await getRate();
        // const rateInfo = {
        //   rate: 1000
        // };
        const inputInfo = await getInputType();
        const inputType = deviceInputEnumProxy.getKey(inputInfo.iptTp || 0);
        // const rateInfo = {};
        // const inputType = 'PC';
        // baseInfo.connect = deviceLinkEnumProxy.getKey(baseInfo.connect || 0); // get connect type
        let model: string = '';
        const generateModelName = (firmware: DeviceInfo['devVer'][number]) => {
          if (firmware.id === 0) {
            return firmware.mode;
          }
          return firmware.mode.split('*').shift()!;
        };
        const versionList = number2Version(baseInfo.devVer[0].ver || 0, 3);
        baseInfo.devVer.forEach(firmware => {
          if (!model) {
            model = generateModelName(firmware);
          }
        });
        kbInfo.hd = { ...baseInfo, ...rateInfo, inputType, model, version: versionList.join('.') };
      } catch (error) {
        kbLogger.error('catch error when update device info', error);
      }
    };
    watchEffect(() => {
      if (!isConnected.value) {
        kbInfo.mounted = false;
        kbInfo.socd = undefined as any;
      }
    });
    watch(
      () => kbInfo.mounted,
      v => {
        localStorage.setItem('device-mounted', v ? '1' : '');
      }
    );
    watch(
      () => kbInfo.hd.inputType,
      val => {
        // add global loading
        // add info content to notice
      }
    );
    const watchDevConnStatus = (ops?: { connCb?: () => boolean; disconnCb?: () => void }) => {
      const { connCb, disconnCb } = ops || {};
      watchEffect(async () => {
        if (!isConnected.value) {
          await handleDevDisConn();
          if (disconnCb instanceof Function) {
            await disconnCb();
          }
          return;
        }
        if (deviceStore.isOtaMode) {
          return;
        }
        if (!kbInfo.mounted) {
          try {
            if (isInBoot()) {
              kbInfo.mounted = true;
              return;
            }
            await handleDevConn();
            let cbRes = true;
            if (connCb instanceof Function) {
              cbRes = await connCb();
            }
            if (cbRes) {
              kbInfo.mounted = true;
            }
          } catch (error) {
            handleDevDisConn();
            await deviceStore.disconnect();
            kbLogger.error(error);
            window?.$message!.warning($t('businessCommon.devErr'));
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
  function useKeyHistory() {
    type ChangeKeyType = {
      oldVal: KeyRes;
      newVal: KeyRes;
    };
    const MAX_SIZE = 5;
    const [current, resetCurrent] = useResttableRefFn<ChangeKeyType | ChangeKeyType[] | null>(() => null);
    const [historyCtrl, resetHistoryCtrl] = useResttableRefFn<any>(() => {
      return [];
    });
    const [futureCtrl, resetFutureCtrl] = useResttableRefFn<any>(() => {
      return [];
    });
    // push data
    const pushState = (data: ChangeKeyType | ChangeKeyType[]) => {
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
      return Boolean(historyCtrl.value.length);
    });
    const allowRedo = computed(() => {
      return futureCtrl.value.length;
    });
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
    watchDevConnStatus({
      connCb: async () => {
        kbLogger.debug('connect ....');
        let r = true;
        try {
          await updateDeviceInfo();
        } catch (error) {
          kbLogger.error(error);
          r = false;
        }
        return r;
      },
      disconnCb: () => {
        resetKeyLayerCfgCtrl();
        resetKeyHistory();
        kbLogger.debug('device disattch, data reset success');
      }
    });
    let isWatching = false;
    let stopWatchCb: any;
    const cfgWatchCb = ([cfgIdx, layerIdx]: number[]) => {
      // resetSelectedKeys();
      resetKeyHistory();
      updateLayerKeys({
        config: cfgIdx,
        layer: layerIdx
      }).then(() => {
        emitter.emit(EventNameEnum.layerOrConfigChange, null);
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
    await AfterDevConn();
    await updateDeviceInfo();
  };
  const resetTargetLayerCfg = async () => {
    const cfg = keyLayerInfo.configIndex;
    const layer = keyLayerInfo.layerIndex;
    // send reset cmd
    await resetLayerKeys({
      cfg,
      layer
    });
    // update target layer config
    await updateLayerKeys(
      {
        config: cfg,
        layer
      },
      {
        forced: true
      }
    );
    emitter.emit(EventNameEnum.layerOrConfigChange, null);
    // reset history list
    resetKeyHistory();
    //
  };
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
    updateLayerKeys,
    ...keyLayerCfgFnc,
    ...configDataFnc,
    ...keyHistoryFnc,
    afterDeviceReset,
    resetKeyHistory,
    resetTargetLayerCfg
  };
});
