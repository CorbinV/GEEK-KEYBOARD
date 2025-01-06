<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';

const keyboardStore = useKeyboardStore();
const keyLayerInfo = toRef(keyboardStore, 'keyLayerInfo');

const options = computed(() => {
  const cnt = keyLayerInfo.value.configCount;
  return Array.from({ length: cnt }).map((_, idx) => {
    return {
      label: `配置 ${idx + 1}`,
      value: idx
    };
  });
});
</script>

<template>
  <NSelect v-model:value="keyLayerInfo.configIndex" :options="options" class="w-24" />
</template>
