<script setup lang="ts">
import { ref, watchEffect } from 'vue';

import { useThemeStore } from '@/store/modules/theme';
type Emits = {
  (e: 'update:layer', layer: number): void;
};
const emit = defineEmits<Emits>();

const themeStore = useThemeStore();
const { themeColor } = themeStore;
const props = defineProps<{
  layer: number;
  layerList: {
    layer: number;
    label: string;
  }[];
}>();
const localLayer = ref(0);
watchEffect(() => {
  localLayer.value = props.layer;
});
function handleClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-layer]');
  if (targetElement && targetElement instanceof HTMLElement) {
    localLayer.value = Number(targetElement.dataset.layer);
    emit('update:layer', localLayer.value);
  }
}
</script>

<template>
  <div class="w-30 flex flex-col gap-y-2 text-base" @click="handleClick">
    <div
      v-for="layerInfo in layerList"
      :key="`l-${layerInfo.layer}`"
      :data-layer="layerInfo.layer"
      class="layer-control--item w-full inline-flex rounded-md bg-#232327 py-2 text-c-second hover:cursor-pointer"
      :class="[{ 'layer-control--item__active text-#3c8df4': layerInfo.layer === localLayer }]"
    >
      <span class="w-full text-center">{{ layerInfo.label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layer-control--item {
  &__active {
    &::after {
      background-color: v-bind(themeColor) !important;
    }
  }
  &::after {
    content: '';
    width: 3px;
    border-radius: 1rem;
    margin-left: auto;
    background-color: transparent;
  }
}
</style>
