<script setup lang="ts">
import { toRef, watch } from 'vue';
import type { BaseKey } from '@/api/modules/combo';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { $t } from '@/locales';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import KeyControl from './components/key-control.vue';
import LayerControl from './components/layer-control.vue';
import Keyboard from './components/keyboard.vue';
import RedoUndo from './components/redo-undo.vue';
const emit = defineEmits(['change:key-id']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail } = keyboardStore;
const layerList = [
  {
    layer: 0,
    label: $t('baseKey.keyboard.admin1')
  },
  {
    layer: 1,
    label: 'FN1'
  },
  {
    layer: 2,
    label: 'FN2(mac)'
  },
  {
    layer: 3,
    label: 'FN3'
  }
];

const keyLayerInfo = toRef(keyboardStore, 'keyLayerInfo');
const [selectedKey, resetSelectdKey] = useResttableRefFn(() => ({
  keyId: '',
  label: ''
}));
watch(
  () => keyLayerInfo.value.layerIndex,
  () => {
    resetSelectdKey();
  }
);
function handleSelectKey(data: Omit<BaseKey, 'key'> & { idx: number; keyId: string }) {
  const { keyId, type, code } = data;
  selectedKey.value.keyId = keyId;
  if (keyId === '' || keyId === undefined) {
    selectedKey.value.label = '';
    return;
  }
  const { label } = getKeyDetail({ type, code });
  selectedKey.value.label = label;
  emit('change:key-id', keyId);
}
</script>

<template>
  <div class="flex flex-row select-none items-end justify-center gap-x-4">
    <div class="h-full flex flex-col justify-between">
      <RedoUndo class="mt-1/3 md:mt-12" />
      <LayerControl v-model:layer="keyLayerInfo.layerIndex" :layer-list="layerList"></LayerControl>
    </div>
    <Keyboard :layer="keyLayerInfo.layerIndex" class="kb-control" @update:key-id="handleSelectKey" />
      <p>{{ $t('businessCommon.tooSmallToDislay') }}</p>
    <KeyControl :key-id="selectedKey.keyId" :key-label="selectedKey.label" />
  </div>
</template>

<style lang="scss" scoped>

</style>
