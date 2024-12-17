<script setup lang="ts">
import { onUnmounted } from 'vue';
import type { MittEvents } from '@/utils/eventBus';
import emitter, { EventNameEnum } from '@/utils/eventBus';
async function handleSeleteAll() {
  emitter.emit(EventNameEnum.selecteAll, null);
}
async function handleReverseSelete() {
  emitter.emit(EventNameEnum.reverseSelect, null);
}
async function handleSeleteClear() {
  emitter.emit(EventNameEnum.selecteClear, null);
}
async function handleSeleteFncReset() {
  emitter.emit(EventNameEnum.rtFncReset, null);
}
onUnmounted(() => {
  const evts = Object.values(EventNameEnum) as unknown as [keyof MittEvents];
  evts.forEach(evt => {
    emitter.off(evt);
  });
});
</script>

<template>
  <div class="my-2 flex flex-row justify-center gap-x-8">
    <NButton type="primary" ghost class="px-8" @click="handleSeleteAll">全选</NButton>
    <NButton type="primary" ghost class="px-8" @click="handleReverseSelete">反选</NButton>
    <NButton type="primary" ghost class="px-8" @click="handleSeleteClear">清空</NButton>
    <NButton type="primary" ghost class="px-8" @click="handleSeleteFncReset">重置</NButton>
  </div>
</template>
