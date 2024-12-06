<script setup lang="ts">
import { onUnmounted, readonly } from 'vue';
import type { BaseKey as BaseKeyType } from '@/api/modules/combo';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
import CapsuleGroup from './capsule-group.vue';
defineProps<{
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
onUnmounted(() => {
  resetPhaseList();
});
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <BaseKey
      :base="selectedKey?.base"
      :detail="selectedKey?.detail"
      :selected="seletedIdx === keyIdx"
      :data-idx="keyIdx"
    />
    <CapsuleGroup :disable="!selectedKey?.base?.key" :initial-height="24" :width="24" :gap="32" :group-idx="keyIdx" />
  </div>
</template>
