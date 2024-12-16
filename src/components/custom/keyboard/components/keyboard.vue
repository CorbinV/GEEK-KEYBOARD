<script setup lang="ts">
import { computed, inject, provide, reactive, readonly, ref, toRaw, toRef, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import type { LayerKeysConfig } from '@/api/modules/keyboard';
import type { KeyTypeEnum } from '@/enum/keyType';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import KeyboardKey from './keyboard-key.vue';
type KeyboardProps = {
  module?: string; // device module
  layer?: number;
  config?: number;
  as?: 'component' | 'template';
};

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

const layerData = reactive<any>({});
function updateLayerData(data: LayerKeysConfig) {
  layerData[props.layer] = data;
}
watch(
  () => props.layer,
  () => {
    const data = kbCfg.value.layerList[props.layer];
    updateLayerData(data.xxx);
  },
  {
    immediate: true
  }
);
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
  const allowMutipleSelect = toRef(keyboardStore, 'allowMutipleSelect');
  // optimize: wait single/multiple selected
  // if (props.as === 'template') {
  //   selected = toRef(keyboardStore, 'selectedKeys');
  // } else {
  //   selected = toRef(keyboardStore, 'selectedKeysTemp');
  // }
  return {
    storeSelectedKeys: selected,
    storeMutipleModule: allowMutipleSelect
  };
}
function useKeySelectAndNotify() {
  const { storeSelectedKeys, storeMutipleModule } = useStoreData();
  const selectedDetail = ref<null | {
    label: string;
    icon: string;
    type: number;
    keyId: string;
  }>(null);

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
      detail.keyId = clickedKey.value.keyId;
      keyboardStore.updateKeyBaseWhenKeyChange({ keyId: detail.keyId, type, code, layer: props.layer });
      selectedDetail.value = detail;
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
        }
        return false;
      });
    }
    return layoutList.value.map((_, idx) => {
      return props.as !== 'component' && clickedKey.value.idx === idx;
    });
  });
  watchEffect(() => {
    if (!storeMutipleModule.value) {
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
    selectedList
  };
}
const { clickedKey, resetClickedKey, storeSelectedKeys, storeMutipleModule, selectedIdxObj, selectedList } =
  useKeySelectAndNotify();

function xxx(keyId: string, idx: number) {
  const keyCfgInfo = toRaw(layerData[props.layer]?.keys[keyId!]);
  const baseKey = {
    code: keyCfgInfo.code,
    type: keyCfgInfo.type,
    key: keyId
  };
  const keyDetail = keyboardStore.getKeyDetail(baseKey);
  emit('update:keyId', { keyId, idx, ...keyCfgInfo });

  const cacheData = {
    base: baseKey,
    detail: keyDetail,
    config: keyCfgInfo
  };
  if (storeMutipleModule.value) {
    storeSelectedKeys.value[keyId] = cacheData;

    // exist ? remove : add
    const target = selectedIdxObj.value[idx];
    if (target) {
      selectedIdxObj.value[idx] = '';
    } else {
      selectedIdxObj.value[idx] = keyId;
    }
  } else {
    // perf: high coupling!
    storeSelectedKeys.value = {
      [keyId]: cacheData
    };
    // end
    clickedKey.value = {
      idx,
      keyId
    };
  }
}
function handleKeyClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-id]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const keyId = targetElement.dataset.id;
    const disabled = targetElement.dataset.disabled === 'true';
    const idx = Number.parseInt(targetElement.dataset.idx || '-1', 10);

    if (keyId !== undefined && !disabled) {
      xxx(keyId, idx);
    }

  }
}
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
  <div class="relative h-360px w-941px rounded-md low-layer-bg" @click="handleKeyClick">
    <KeyboardKey
      v-for="(key, idx) in layoutList"
      :key="key"
      :key-id="key"
      :idx="idx"
      :kb-length="layoutList.length"
      :selected="selectedList[idx]"
      :key-detail="layerData[layer]?.keys[key]"
      :disabled="layerData[layer]?.disable.includes(key)"
      :smart="layerData[layer]?.smart[key]"
      :sp="kbCfg.superKeyMap[key]?.sp"
      :mt="kbCfg.superKeyMap[key]?.mt"
      :dks="kbCfg.superKeyMap[key]?.dks"
      @last-key-mounted="handleLastKeyMounted"
    />
  </div>
</template>
