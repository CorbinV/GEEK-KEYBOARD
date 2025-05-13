<script setup lang="ts">
import { useCommonStore } from '@/store/modules/common';
import { useKeyboardStore } from '@/store/modules/keyboard';

const keyboardStore = useKeyboardStore();
const commonStore = useCommonStore();
const { undo, redo, allowRedo, allowUndo } = keyboardStore;
const { setTargetKeyInfoById } = commonStore;
async function handleUndoClick() {
  const data = undo();
  if (!data) {
    return;
  }
  const { key, code, type, enable } = data.oldVal;
  await setTargetKeyInfoById(key, { code, type, enable });
}
async function handleRedoClick() {
  const data = redo();
  if (!data) {
    return;
  }
  const { key, code, type, enable } = data.newVal;
  await setTargetKeyInfoById(key, { code, type, enable });
}
</script>

<template>
  <div class="w-full flex justify-between text-2xl text-#474c4d">
    <span
      class="h-8 w-8 inline-flex cursor-pointer items-center justify-center rounded bg-#222226 "
      :class="`${allowRedo? '!hover:text-#3c8df4': 'hover:cursor-not-allowed'}`"
      @click="handleUndoClick"
    >
      <SvgIcon local-icon="undo"></SvgIcon>
    </span>
    <span
      class="h-8 w-8 inline-flex cursor-pointer items-center justify-center rounded bg-#222226"
      :class="`${allowRedo? '!hover:text-#3c8df4': 'hover:cursor-not-allowed'}`"
      @click="handleRedoClick"
    >
      <SvgIcon local-icon="undo" class="-scale-x-100"></SvgIcon>
    </span>
  </div>
</template>
