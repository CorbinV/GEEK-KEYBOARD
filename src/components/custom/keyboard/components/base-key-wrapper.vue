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
}>();

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
    />
    <template v-if="allowClear && hasValue">
      <i
        class="iconfont icon-add absolute rotate-45 text-lg color-red-700 -right-3.5 -top-3.5 hover:cursor-pointer"
        @click.stop="handleRemoveClick"
      ></i>
    </template>
  </div>
</template>
