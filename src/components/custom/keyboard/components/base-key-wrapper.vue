<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import BaseKey from './base-key.vue';
const attrs = useAttrs();
const emit = defineEmits(['remove']);
const props = defineProps<{
  base?: {
    code: number;
    type: number;
  };
  selected?: boolean;
  allowClear?: boolean;
  idx?: number;
  width?: number;
  height?: number;
  fontSize?: number; // feat: support 'base' | 'large';
}>();
const customStyle = computed(() => {
  const elStyle = {} as any;
  if (props.width) {
    elStyle.width = `${props.width}px`;
    elStyle.height = `${props.width}px`;
  }
  if (props.height) {
    elStyle.height = `${props.height}px`;
  }
  if (props.fontSize) {
    elStyle.fontSize = `${props.fontSize}px`;
  }
  return elStyle;
});
const hasValue = computed(() => {
  return props.base?.type !== undefined;
});
function handleRemoveClick() {
  emit('remove', props.idx);
}
</script>

<template>
  <div class="relative inline-flex">
    <BaseKey
      v-bind="attrs"
      :base="base"
      :has-value="hasValue"
      :class="[
        {
          '!border-[#3C8DF4]': selected,
          'text-[#3C8DF4]': selected
        }
      ]"
      :style="customStyle"
    />
    <template v-if="allowClear && hasValue">
      <i
        class="iconfont icon-add absolute rotate-45 text-lg color-red-700 -right-1.5 -top-2.5 hover:cursor-pointer"
        @click.stop="handleRemoveClick"
      ></i>
    </template>
  </div>
</template>
