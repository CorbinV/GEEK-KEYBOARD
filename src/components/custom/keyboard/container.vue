<script setup lang="ts">
import { provide, readonly } from 'vue';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import Dynamic from './dynamic.vue';
type SelectedInfo = {
  type: number;
  code: number;
  keyId: string;
};
const [selectedInfo, resetSelectedInfo] = useResttableRefFn<SelectedInfo>(() => ({
  type: -1,
  code: 0,
  keyId: ''
}));
function handleKeyEmit(data: { keyId: string; code: number; type: number }) {
  selectedInfo.value = {
    type: data.type || 0,
    code: data.code,
    keyId: data.keyId
  };
}
provide('selectedInfo', readonly(selectedInfo));
provide('resetSelectedInfo', resetSelectedInfo);
</script>

<template>
  <div class="mx-auto my-0 max-w-1600px flex items-center">
    <div class="flex flex-col flex-1">
      <Dynamic />
      <div v-if="$slots.keyboardBottom" class="card-header">
        <slot name="keyboardBottom"></slot>
      </div>
      <div v-else class="mt-2 text-center text-c-second">选中键盘上按键后，再选中下方需要替换的键</div>
      <NDivider class="!my-2" />
      <div class="flex-1 overflow-clip">
        <slot :handle-key-emit="handleKeyEmit"></slot>
      </div>
    </div>
  </div>
</template>
