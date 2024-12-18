<script setup lang="ts">
import { ref } from 'vue';
import type { BaseKey } from '@/api/modules/combo';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { $t } from '@/locales';
import KeyControl from './components/key-control.vue';
import LayerControl from './components/layer-control.vue';
import Keyboard from './components/keyboard.vue';
const emit = defineEmits(['change:key-id']);
const { getKeyDetail } = useKeyboardStore();
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
const currentLayer = ref(0);
const selectedKey = ref({
  keyId: '',
  label: ''
});
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
  <div class="flex flex-row items-end justify-center gap-x-4">
    <LayerControl v-model:layer="currentLayer" :layer-list="layerList"></LayerControl>
    <Keyboard :layer="currentLayer" class="kb-control" @update:key-id="handleSelectKey" />
    <div class="second-view flex flex-1 items-center justify-center text-2xl font-bold">
      <p>The screen is too small to display.</p>
    </div>
    <KeyControl :key-id="selectedKey.keyId" :key-label="selectedKey.label" />
  </div>
</template>

<style lang="scss" scoped>
@media screen and (max-width: 1268px) {
  .kb-control {
    display: none;
  }
}

@media screen and (min-width: 1268px) {
  .second-view {
    display: none;
  }
}
</style>
