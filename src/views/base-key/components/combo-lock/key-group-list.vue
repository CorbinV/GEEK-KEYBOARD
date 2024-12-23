<script setup lang="ts">
import KeyGroup from './key-group.vue';
defineProps<{
  groups: any[];
  selectedKeyIndex: any;
  disableChangeKey?: boolean;
}>();
const emit = defineEmits<{
  (e: 'select-key-change', preload: { groupIndex: number; keyIndex: number }): void;
  (e: 'enable-change', enble: CommonType.NumberBoolean, groupIndex: number): void;
}>();
function handleEnableChange(enble: CommonType.NumberBoolean, groupIndex: number) {
  emit('enable-change', enble, groupIndex);
}
</script>

<template>
  <div class="grid grid-cols-2 gap-y-8">
    <KeyGroup
      v-for="(group, idx) in groups"
      :key="idx"
      :keys="group.keys"
      :enable="group.enable"
      :selected-key-index="selectedKeyIndex"
      :group-index="idx"
      :disable="disableChangeKey"
      @select-key="keyIndex => $emit('select-key-change', { groupIndex: idx, keyIndex })"
      @update:enable-change="handleEnableChange"
    ></KeyGroup>
  </div>
</template>
