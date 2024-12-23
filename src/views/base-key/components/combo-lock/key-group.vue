<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseKeyWrapper from '@/components/custom/keyboard/components/base-key-wrapper.vue';
import type { KeyItem, SelectedKeyIndex } from './hooks';

const props = withDefaults(
  defineProps<{
    selectedKeyIndex: SelectedKeyIndex;
    groupIndex: number;
    enable: number;
    disable?: boolean;
    keys?: KeyItem[];
  }>(),
  {
    keys: () => [],
    disable: false
  }
);
const emit = defineEmits<{
  (e: 'select-key', value: number): void;
  (e: 'update:enable-change', enable: CommonType.NumberBoolean, groupIndex: number): void;
}>();
const localEnabled = ref(props.enable);
const selectIndex = ref(-1);

const isSelectedList = computed(() => {
  return props.keys.map((_, idx) => {
    if (props.selectedKeyIndex.groupIndex !== props.groupIndex) {
      return false;
    } else if (props.selectedKeyIndex.keyIndex !== selectIndex.value) {
      return false;
    } else if (props.selectedKeyIndex.keyIndex !== idx) {
      return false;
    }
    return true;
  });
});
const handleKeySelect = (keyIdx: number) => {
  if (props.disable) {
    return;
  }
  selectIndex.value = keyIdx;
  emit('select-key', keyIdx);
};
function handleEnableChange(v: CommonType.NumberBoolean) {
  emit('update:enable-change', v, props.groupIndex);
}
</script>

<template>
  <div class="flex flex-row justify-self-center gap-x-8 2xl:gap-x-14 md:gap-x-4 xl:gap-x-10">
    <div
      v-for="(key, idx) in keys"
      :key="idx"
      class="flex flex-row items-center gap-x-8 2xl:gap-x-14 md:gap-x-4 xl:gap-x-10"
    >
      <BaseKeyWrapper
        :class="`${disable ? 'hover:cursor-not-allowed' : 'hover:cursor-pointer'}`"
        :selected="isSelectedList[idx]"
        :base="key?.base"
        :detail="key.detail"
        :width="70"
        :font-size="18"
        @click.stop="handleKeySelect(idx)"
      />
      <SvgIcon v-if="idx < keys.length - 1" class="text-4xl" icon="fluent:add-32-regular" />
    </div>
    <div class="inline-flex items-center">
      <NSwitch
        v-model:value="localEnabled"
        size="large"
        :checked-value="1"
        :unchecked-value="0"
        @update-value="handleEnableChange"
      />
    </div>
  </div>
</template>
