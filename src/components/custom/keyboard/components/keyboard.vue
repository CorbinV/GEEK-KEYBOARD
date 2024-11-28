<script setup lang="ts">
import { computed, inject, provide, reactive, readonly, ref, toRaw, toRef, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { getKeysCfgByLayer } from '@/api/keyConfig';
import type { LayerKeysConfig } from '@/api/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
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
watchEffect(async () => {
  const data = await getKeysCfgByLayer({
    config: props.config,
    layer: props.layer
  });
  updateLayerData(data);
});

function useKeySelectAndNotify() {
  const selectedDetail = ref<null | {
    label: string;
    icon: string;
    type: number;
    keyId: string;
  }>(null);
  const [clickedKey, resetClickedKey] = useResttableRefFn(() => ({
    idx: -1,
    keyId: ''
  }));
  provide('selectedDetail', readonly(selectedDetail));
  function updateSelectrdInfo(data: any) {
    if (clickedKey.value.idx !== -1 && data.type !== -1) {
      // find keyDetail about label/icon/type
      const type = injSelectedInfo.value.type as KeyTypeEnum;
      const code = injSelectedInfo.value.code as number;
      let detail: any = {};
      if ([KeyTypeEnum.Combo, KeyTypeEnum.DKS, KeyTypeEnum.Marco].includes(type)) {
        switch (type) {
          case KeyTypeEnum.Combo:
            detail = { label: `C${code}`, icon: '', type: 'str' };
            break;
          case KeyTypeEnum.DKS:
            detail = { label: `D${code}`, icon: '', type: 'str' };
            break;
          case KeyTypeEnum.Marco:
            detail = { label: `M${code + 1}`, icon: '', type: 'str' };
            break;
          default:
            break;
        }
      } else {
        const info = kbCfg.value.keyMap[type]?.code?.[code];
        detail = {
          label: info?.label,
          icon: info?.icon,
          type: info?.type
        };
      }
      detail.keyId = clickedKey.value.keyId;
      selectedDetail.value = detail;
    }
    if (injSelectedInfo.value?.type >= 0) {
      setTimeout(injResetSelectedInfo);
    }
  }
  watchEffect(() => {
    updateSelectrdInfo(injSelectedInfo.value);
  });
  return {
    clickedKey,
    resetClickedKey,
    selectedDetail
  };
}
const { clickedKey, resetClickedKey } = useKeySelectAndNotify();
const layoutList = computed(() => {
  return Object.keys(kbCfg.value.data).filter((k: string) => k !== 'base');
});
const { storeSelectedKeys } = useStoreData();
function handleKeyClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-id]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const keyId = targetElement.dataset.id;
    const disabled = targetElement.dataset.disabled === 'true';
    const idx = Number.parseInt(targetElement.dataset.idx || '-1', 10);

    if (keyId !== undefined && !disabled) {
      const keyCfgInfo = toRaw(layerData[props.layer]?.keys[keyId!]);
      const baseKey = {
        code: keyCfgInfo.code,
        type: keyCfgInfo.type,
        key: keyId
      };
      const keyDetail = keyboardStore.getKeyDetail(baseKey);
      emit('update:keyId', { keyId, idx, ...keyCfgInfo });
      // perf: high coupling!
      storeSelectedKeys.value = {
        [keyId]: {
          base: baseKey,
          detail: keyDetail,
          config: keyCfgInfo
        }
      };
      // end
      clickedKey.value = {
        idx,
        keyId
      };
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
function useStoreData() {
  const selected = toRef(keyboardStore, 'selectedKeys');
  // optimize: wait single/multiple selected
  // if (props.as === 'template') {
  //   selected = toRef(keyboardStore, 'selectedKeys');
  // } else {
  //   selected = toRef(keyboardStore, 'selectedKeysTemp');
  // }
  return {
    storeSelectedKeys: selected
  };
}
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
      :selected="as !== 'component' && clickedKey.idx === idx"
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
