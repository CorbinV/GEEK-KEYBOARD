<script setup lang="ts">
import { computed, reactive, ref, toRefs, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { getKeysCfgByLayer } from '@/api/keyConfig';
import type { LayerKeysConfig } from '@/api/modules/keyboard';
import KeyboardKey from './keyboard-key.vue';

type KeyboardProps = {
  module?: string; // device module
  layer?: number;
  config?: number;
};
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
const layoutList = computed(() => {
  return Object.keys(kbCfg.value.data).filter((k: string) => k !== 'base');
});
const selectedIdx = ref(-1);
function handleKeyClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-id]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const keyId = targetElement.dataset.id;
    const idx = Number.parseInt(targetElement.dataset.idx || '-1', 10);
    if (keyId !== undefined) {
      emit('update:keyId', { keyId, idx });
      selectedIdx.value = idx;
    }
  }
}
</script>

<template>
  <div class="low-layer-bg relative h-360px w-941px rounded-md" @click="handleKeyClick">
    <KeyboardKey
      v-for="(key, idx) in layoutList"
      :key="key"
      :key-id="key"
      :idx="idx"
      :selected="selectedIdx === idx"
      :key-detail="layerData[layer]?.[key]"
    />
  </div>
</template>
