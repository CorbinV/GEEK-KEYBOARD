<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import type { KeyTypeEnum } from '@/enum/keyType';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import KeyboardKey from './keyboard-key.vue';

type KeyboardProps = {
  module?: string;
  layer?: number;
  config?: number;
  passedKeys?: Set<string>;
};
const emit = defineEmits<{
  (e: 'update:keyId', preload: { keyId: string; idx: number; code: number; type: KeyTypeEnum }): void;
}>();
const props = withDefaults(defineProps<KeyboardProps>(), {
  module: 'rk-s75',
  config: 0,
  layer: 0,
});
const keyboardStore = useKeyboardStore();
const kbCfg = toRef(keyboardStore, 'kbCfg');
const activeKeyLayer = toRef(keyboardStore, 'activeKeyLayer');
const layerOriginData = ref<any>({});

const baseConfig = computed(() => kbCfg.value.layoutMap.get('base'));
const layoutList = computed(() => {
  const keys = kbCfg.value.layoutMap.keys();
  const arr: string[] = [];
  for (const key of keys) {
    if (key !== 'base') {
      arr.push(key);
    }
  }
  return arr;
});

const containerStyle = computed(() => {
  const base = baseConfig.value;
  if (!base) return {};
  const maxRow = layoutList.value.reduce((max, keyId) => {
    const keyData = kbCfg.value.layoutMap.get(keyId);
    return Math.max(max, keyData?.pos?.[0] ?? 0);
  }, 0);
  const rowCount = maxRow + 1;
  const height = rowCount * base.height + (rowCount + 1) * base.gap;
  return { height: `${height}px`, width: '941px' };
});

function updateOriginData() {
  const data = activeKeyLayer.value;
  if (!Object.keys(data?.xxx).length) {
    return;
  }
  layerOriginData.value = data.xxx;
}

onMounted(() => {
  emitter.on(EventNameEnum.layerOrConfigChange, updateOriginData);
});
function handleLastKeyMounted() {
  kbCfg.value.offsetList = [];
}

updateOriginData();
onUnmounted(() => {
  emitter.off(EventNameEnum.layerOrConfigChange, updateOriginData);
})
</script>

<template>
  <div
    class="relative select-none rounded-md low-layer-bg"
    :style="containerStyle"
    :key="`${layer}${config}`"
  >
      <KeyboardKey
        v-for="(keyId, idx) in layoutList"
        :key="`${keyId}${layer}${config}`"
        :key-id="keyId"
        :idx="idx"
        :kb-length="layoutList.length"
        :key-detail="layerOriginData?.keys?.[keyId]"
        :key-class-name="[
          passedKeys?.has(keyId) ? 'key-passed' : ''
        ]"
        @last-key-mounted="handleLastKeyMounted"
      />
    <div v-if="baseConfig?.hasDecorator" class="w-50px h-50px absolute top-2 right-2 rounded-full bg-#222227" @click.stop></div>
  </div>
</template>
