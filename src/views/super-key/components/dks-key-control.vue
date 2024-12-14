<script setup lang="ts">
import { computed, onUnmounted, readonly, ref } from 'vue';
import type { BaseKey as BaseKeyType } from '@/api/modules/combo';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
import BaseKeyWrapper from '@/components/custom/keyboard/components/base-key-wrapper.vue';
import CapsuleGroup from './capsule-group.vue';
const emit = defineEmits(['removeKey']);
const props = defineProps<{
  seletedIdx: number;
  keyIdx: number;
  selectedKey?: {
    base: BaseKeyType;
    detail: any;
  };
}>();

const MAX_PHASE = 4;
type Phase = {
  used: boolean;
  to: number; // max: 4
  width: 0;
};
const [phaseList, resetPhaseList] = useResttableReactiveFn<Phase[]>(() => {
  return Array.from({ length: MAX_PHASE }).map(() => {
    return {
      used: false,
      to: 0,
      width: 0
    };
  });
});
defineExpose({
  phaseList: readonly(phaseList),
  resetPhaseList
});
const removeCnt = ref(0);
function handleKeyRemove() {
  removeCnt.value += 1;
  emit('removeKey', props.keyIdx);
}
onUnmounted(() => {
  resetPhaseList();
});
const groupKey = computed(() => {
  return `${removeCnt.value}-dks-key`;
});
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <BaseKeyWrapper
      :base="selectedKey?.base"
      :detail="selectedKey?.detail"
      :selected="seletedIdx === keyIdx"
      :data-idx="keyIdx"
      :allow-clear="true"
      @remove="handleKeyRemove"
    />
    <CapsuleGroup
      :key="groupKey"
      :disable="!selectedKey?.base?.key"
      :initial-height="24"
      :width="24"
      :gap="32"
      :group-idx="keyIdx"
    />
  </div>
</template>
