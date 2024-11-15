<script setup lang="ts">
import { computed, inject, provide, reactive, readonly, ref, toRefs, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { getKeysCfgByLayer } from '@/api/keyConfig';
import type { LayerKeysConfig } from '@/api/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import KeyboardKey from './keyboard-key.vue';

type KeyboardProps = {
  module?: string; // device module
  layer?: number;
  config?: number;
};

const injSelectedInfo = inject('selectedInfo') as any;
const injResetSelectedInfo = inject('resetSelectedInfo') as any;

const emit = defineEmits<{
  (e: 'update:keyId', preload: { keyId: string; idx: number }): void;
}>();
const props = withDefaults(defineProps<KeyboardProps>(), {
  module: 'rk-s75',
  config: 0,
  layer: 0
});
const keyboardStore = useKeyboardStore();
const { kbCfg } = toRefs(keyboardStore);

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
  const clickedKey = ref({
    idx: -1,
    keyId: ''
  });
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
            detail = { label: `M${code}`, icon: '', type: 'str' };
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
    selectedDetail
  };
}
const { clickedKey } = useKeySelectAndNotify();
const layoutList = computed(() => {
  return Object.keys(kbCfg.value.data).filter((k: string) => k !== 'base');
});
function handleKeyClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-id]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const keyId = targetElement.dataset.id;
    const disabled = targetElement.dataset.disabled === 'true';
    const idx = Number.parseInt(targetElement.dataset.idx || '-1', 10);
    if (keyId !== undefined && !disabled) {
      emit('update:keyId', { keyId, idx });
      clickedKey.value = {
        idx,
        keyId
      };
    }
  }
}
</script>

<template>
  <div class="relative h-360px w-941px rounded-md low-layer-bg" @click="handleKeyClick">
    <KeyboardKey
      v-for="(key, idx) in layoutList"
      :key="key"
      :key-id="key"
      :idx="idx"
      :selected="clickedKey.idx === idx"
      :key-detail="layerData[layer]?.keys[key]"
      :disabled="layerData[layer]?.disable.includes(key)"
      :smart="layerData[layer]?.smart[key]"
    />
  </div>
</template>
