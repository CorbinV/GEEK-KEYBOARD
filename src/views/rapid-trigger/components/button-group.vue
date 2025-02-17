<script setup lang="ts">
import { computed, onUnmounted, toRef } from 'vue';
import type { MittEvents } from '@/utils/eventBus';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { useDialog, useMessage } from 'naive-ui'
import { $t } from '@/locales';
const keyboardStore = useKeyboardStore();
const selectedKeysMap = toRef(keyboardStore, 'selectedKeysMap');
const enableResetBtn = computed(() => {
  return selectedKeysMap.value.size > 0;
})
const dialog = useDialog()
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
  dialog.warning({
    title: $t('common.warning'),
    content: $t('businessCommon.confirmToReset'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      emitter.emit(EventNameEnum.rtFncReset, null);
    }
  })
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
    <NButton type="primary" ghost class="px-8" :disabled="!enableResetBtn" @click="handleSeleteFncReset">重置</NButton>
  </div>
</template>
