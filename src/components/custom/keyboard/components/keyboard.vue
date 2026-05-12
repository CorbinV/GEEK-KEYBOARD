<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, provide, readonly, ref, toRaw, toRef, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import type { KeyTypeEnum } from '@/enum/keyType';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { useCommonStore } from '@/store/modules/common';
import emitter, { EventNameEnum } from '@/utils/eventBus';

import { resetRt } from '@/api/keyConfig-rapid-trigger';
import { $t } from '@/locales';
import type { BaseKeyView } from '@/api/modules/combo';
import KeyboardKey from './keyboard-key.vue';
type KeyboardProps = {
  module?: string; // device module
  layer?: number;
  config?: number;
  as?: 'component' | 'template';
};
const commonStore = useCommonStore();
const injSelectedInfo = inject('selectedInfo') as any;
const injResetSelectedInfo = inject('resetSelectedInfo') as any;
const emit = defineEmits<{
  (e: 'update:keyId', preload: { keyId: string; idx: number; code: number; type: KeyTypeEnum }): void;
}>();
const props = withDefaults(defineProps<KeyboardProps>(), {
  module: 'rk-s75',
  config: 0,
  layer: 0,
  as: 'template'
});
const keyboardStore = useKeyboardStore();
const kbCfg = toRef(keyboardStore, 'kbCfg');
const activeKeyLayer = toRef(keyboardStore, 'activeKeyLayer');
const layerOriginData = ref<any>({});

function updateOriginData() {
  const data = activeKeyLayer.value;
  if (!Object.keys(data?.xxx).length) {
    return;
  }
  layerOriginData.value = data.xxx;
}
const layoutList = computed(() => {
  const keys = kbCfg.value.layoutMap.keys();
  const arr = [];
  for (const key of keys) {
    if (key !== 'base') {
      arr.push(key);
    }
  }
  return arr;
});
function useStoreData() {
  const selected = toRef(keyboardStore, 'selectedKeys');
  const selectedMap = toRef(keyboardStore, 'selectedKeysMap');
  const allowMutipleSelect = toRef(keyboardStore, 'allowMutipleSelect');
  // optimize: wait single/multiple selected
  // if (props.as === 'template') {
  //   selected = toRef(keyboardStore, 'selectedKeys');
  // } else {
  //   selected = toRef(keyboardStore, 'selectedKeysTemp');
  // }
  return {
    storeSelectedKeys: selected,
    storeSelectedKeyMap: selectedMap,
    storeMutipleModule: allowMutipleSelect
  };
}
function useKeySelectAndNotify() {
  const { storeSelectedKeys, storeMutipleModule, storeSelectedKeyMap } = useStoreData();
  const selectedDetail = ref<
    | null
    | (BaseKeyView & {
      keyId: string;
    })
  >(null);

  /** @param selectedIdxObj only use when storeMutipleModule = true */
  const [selectedIdxObj, resetSelectedIdxObj] = useResttableRefFn<{
    [key: string]: string;
  }>(() => ({}));
  /** @param clickedKey storeMutipleModule = false */
  const [clickedKey, resetClickedKey] = useResttableRefFn(() => ({
    idx: -1,
    keyId: ''
  }));
  provide('selectedDetail', readonly(selectedDetail));
  function updateSelectrdInfo(data: any) {
    if (clickedKey.value.idx !== -1 && data.type !== -1) {
      const type = injSelectedInfo.value.type as KeyTypeEnum;
      const code = injSelectedInfo.value.code as number;
      const detail = keyboardStore.getKeyDetail({ code, type });
      keyboardStore.updateKeyBaseWhenKeyChange({ keyId: clickedKey.value.keyId, type, code, layer: props.layer });
      selectedDetail.value = {
        ...detail,
        keyId: clickedKey.value.keyId
      };
    }
    if (injSelectedInfo.value?.type >= 0) {
      setTimeout(injResetSelectedInfo);
    }
  }
  const selectedList = computed(() => {
    if (storeMutipleModule.value) {
      return layoutList.value.map((_, idx) => {
        if (props.as === 'component') {
          return false;
        } else if (selectedIdxObj.value[idx]) {
          return true;
        } else if (clickedKey.value.idx === idx) {
          return true;
        }
        return false;
      });
    }
    return layoutList.value.map((_, idx) => {
      return props.as !== 'component' && clickedKey.value.idx === idx;
    });
  });
  watchEffect(() => {
    if (storeMutipleModule.value) {
      resetSelectedIdxObj();
      return;
    }
    updateSelectrdInfo(injSelectedInfo.value);
  });
  return {
    clickedKey,
    resetClickedKey,
    selectedDetail,
    storeSelectedKeys,
    storeMutipleModule,
    selectedIdxObj,
    resetSelectedIdxObj,
    storeSelectedKeyMap,
    selectedList
  };
}
const {
  clickedKey,
  resetClickedKey,
  storeSelectedKeys,
  storeSelectedKeyMap,
  storeMutipleModule,
  selectedIdxObj,
  resetSelectedIdxObj,
  selectedList
} = useKeySelectAndNotify();

function xxx(keyId: string, idx: number) {
  const keyCfgInfo = toRaw(activeKeyLayer.value?.keys[keyId!]);
  const baseKey = {
    code: keyCfgInfo.code,
    type: keyCfgInfo.type,
    key: keyId
  };
  const keyDetail = keyboardStore.getKeyDetail(baseKey);

  const cacheData = {
    base: baseKey,
    detail: keyDetail,
    config: keyCfgInfo
  };
  if (storeMutipleModule.value) {
    // exist ? remove : add
    const target = selectedIdxObj.value[idx];
    if (target) {
      selectedIdxObj.value[idx] = '';
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete storeSelectedKeys.value[keyId];
      storeSelectedKeyMap.value.delete(keyId);
      // find currentMap first
      const [firstKey] = storeSelectedKeyMap.value.keys();
      if (firstKey) {
        const cfgInfo = toRaw(activeKeyLayer.value?.keys[firstKey!]);
        emit('update:keyId', { keyId: firstKey, idx, ...cfgInfo });
      } else {
        emit('update:keyId', { keyId: '', idx, ...keyCfgInfo });
      }
    } else {
      selectedIdxObj.value[idx] = keyId;
      storeSelectedKeys.value[keyId] = cacheData;
      storeSelectedKeyMap.value.set(keyId, cacheData);
      emit('update:keyId', { keyId, idx, ...keyCfgInfo });
    }
  } else {
    // feat: use storeSelectedKeyMap replace storeSelectedKeys
    // perf: high coupling!
    storeSelectedKeys.value = {
      [keyId]: cacheData
    };
    // end
    clickedKey.value = {
      idx,
      keyId
    };
    emit('update:keyId', { keyId, idx, ...keyCfgInfo });
  }
}
async function handleKeyClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-id]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const keyId = targetElement.dataset.id;
    const disabled = targetElement.dataset.disabled === 'true';
    const idx = Number.parseInt(targetElement.dataset.idx || '-1', 10);
    if (props.as === 'component' && disabled) {
      window.$message?.info($t(`businessCommon.buttonDisableInfo`));
      return;
    }
    if (keyId !== undefined) {
      await commonStore.getTargetKeyInfo(keyId);
      xxx(keyId, idx);
    }

    // how about use api to select keys？
    // -> it's a event -> told component to selecte keys
    // -> provide keyId list/single
    // -> repeat current function logic
  }
}
async function handleApiSelectAll() {
  // ---------------- notic: use only in mutiple mode
  let [firstKey] = storeSelectedKeyMap.value.keys();
  if (!firstKey) {
    firstKey = layoutList.value[0];
  }
  const firstSelectInfo = storeSelectedKeyMap.value.get(firstKey);
  // notice: if not key has selected in after -> get layoutList first key config(device)

  let emitData;
  if (!firstSelectInfo?.config?.tary) {
    emitData = await commonStore.getTargetKeyInfo(firstKey);
  }

  // storeSelectedKeys.value;
  // get layoutList key -> set all keys to storeSelectedKeys
  const keyCfgInfo = toRaw(activeKeyLayer.value?.keys[firstKey!]);
  const base = {
    code: keyCfgInfo.code,
    type: keyCfgInfo.type,
    key: firstKey
  };
  layoutList.value.forEach((key, idx) => {
    selectedIdxObj.value[idx] = key;
    if (storeSelectedKeyMap.value.has(key)) {
      return;
    }
    storeSelectedKeyMap.value.set(key, {} as any);
  });
  const keyDetail = await keyboardStore.getKeyDetail({ code: keyCfgInfo.code, type: keyCfgInfo.type });
  const firstMap = storeSelectedKeyMap.value.get(firstKey)!;
  firstMap.config = emitData;
  firstMap.detail = keyDetail;
  firstMap.base = base;
  const index = layoutList.value.findIndex(k => k === firstKey);
  emit('update:keyId', { keyId: firstKey, idx: index, ...keyCfgInfo });
}
async function handleApiSelectClear() {
  keyboardStore.emitResetSelectedKeys();
  resetSelectedIdxObj();
  emit('update:keyId', { keyId: '', idx: -1 } as any);
}
async function handleApiReverseSelete() {
  layoutList.value.forEach((key, idx) => {
    if (selectedIdxObj.value[idx]) {
      storeSelectedKeyMap.value.delete(key);
      selectedIdxObj.value[idx] = '';
      return;
    }
    selectedIdxObj.value[idx] = key;
    storeSelectedKeyMap.value.set(key, {} as any);
  });
  const [firstKey] = storeSelectedKeyMap.value.keys();
  if (!firstKey) {
    emit('update:keyId', { keyId: '', idx: -1 } as any);
    return;
  }
  const keyCfgInfo = toRaw(activeKeyLayer.value?.keys[firstKey!]);
  const base = {
    code: keyCfgInfo.code,
    type: keyCfgInfo.type,
    key: firstKey
  };
  const keyDetail = await keyboardStore.getKeyDetail({ code: keyCfgInfo.code, type: keyCfgInfo.type });
  const firstSelectInfo = storeSelectedKeyMap.value.get(firstKey)!;
  // notice: if not key has selected in after -> get layoutList first key config(device)

  let emitData;
  if (!firstSelectInfo?.config?.tary) {
    emitData = await commonStore.getTargetKeyInfo(firstKey);
  }
  const index = layoutList.value.findIndex(k => k === firstKey);
  emit('update:keyId', { keyId: firstKey, idx: index, ...keyCfgInfo });

  firstSelectInfo.base = base;
  firstSelectInfo.detail = keyDetail;
  firstSelectInfo.config = emitData;
}
async function handleApiResetRtFnc(selectKeyList: string[]) {
  try {
    await resetRt(selectKeyList);
    window.$message?.success($t('businessCommon.executeSuccess'));
  } catch (error) {
    console.error(error);
    window.$message?.error($t('businessCommon.executeFail'));
  }
}
async function handleApiSetHighlight(keyId: string) {
  // find key idx in layoutList
  const idx = layoutList.value.findIndex(k => k === keyId);
  if (idx === -1) {
    return;
  }
  clickedKey.value = { idx, keyId };


}
onMounted(() => {
  emitter.on(EventNameEnum.layerOrConfigChange, updateOriginData);
  if (!storeMutipleModule.value) {
    return;
  }
  emitter.on(EventNameEnum.selecteAll, () => {
    handleApiSelectAll();
  });
  emitter.on(EventNameEnum.selecteClear, () => {
    handleApiSelectClear();
  });
  emitter.on(EventNameEnum.reverseSelect, () => {
    handleApiReverseSelete();
  });
  emitter.on(EventNameEnum.rtFncReset, async () => {
    const selectKeyList = Array.from(storeSelectedKeyMap.value.keys());

    await handleApiResetRtFnc(selectKeyList);
    const tary = activeKeyLayer.value.xxx?.def?.tary || []
    selectKeyList.forEach(key => {
      activeKeyLayer.value.xxx.keys[key].tary = tary
    })
    await commonStore.updateTaryDataCache(selectKeyList)
    emitter.emit(EventNameEnum.updateKeyCtrl, selectKeyList)
  });

});

updateOriginData();
onUnmounted(() => {
  emitter.off(EventNameEnum.layerOrConfigChange, updateOriginData);
});

watch(
  () => storeSelectedKeys.value,
  nVal => {
    if (!Object.keys(nVal).length) {
      resetClickedKey();
    }
  }
);
function handleLastKeyMounted() {
  kbCfg.value.offsetList = [];
}
</script>

<template>
  <div class="relative h-360px w-941px select-none rounded-md low-layer-bg" @click="handleKeyClick"
    :key="`${layer}${config}`">
    <KeyboardKey v-for="(key, idx) in layoutList" :key="`${key}${layer}${config}`" :key-id="key" :idx="idx"
      :kb-length="layoutList.length" :selected="selectedList[idx]" :key-detail="layerOriginData?.keys?.[key]"
      :disabled="layerOriginData?.disable?.includes(key)" :smart="layerOriginData?.smart?.[key]"
      :sp="activeKeyLayer.superKeyMap[key]?.sp" :mt="activeKeyLayer.superKeyMap[key]?.mt"
      :dks="activeKeyLayer.superKeyMap[key]?.dks" @last-key-mounted="handleLastKeyMounted" />
    <div class="w-50px h-50px absolute top-2 right-2 rounded-full bg-#222227" @click.stop></div>
  </div>
</template>
