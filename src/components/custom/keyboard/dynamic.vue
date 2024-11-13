<script setup lang="ts">
import { ref } from 'vue';
import KeyControl from './components/key-control.vue';
import LayerControl from './components/layer-control.vue';
import Keyboard from './components/keyboard.vue';
const layerList = [
  {
    layer: 0,
    label: '默认（0）'
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
const selectedKey = ref('');
function handleSelectKey(data: { keyId: string; idx: number }) {
  const { keyId } = data;
  selectedKey.value = keyId;
}
</script>

<template>
  <div class="flex flex-row items-end justify-center gap-x-4">
    <LayerControl v-model:layer="currentLayer" :layer-list="layerList"></LayerControl>
    <div class="h-360px h-full w-941px flex">
      <Keyboard :layer="currentLayer" class="kb-control" @update:key-id="handleSelectKey" />
      <div class="second-view flex flex-1 items-center justify-center text-2xl font-bold">
        <p>The screen is too small to display.</p>
      </div>
    </div>
    <KeyControl :key-id="selectedKey" />
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
