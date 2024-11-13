<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import KeyboardKey from './keyboard-key.vue';

const emit = defineEmits<{
  (e: 'update:keyId', keyId: number): void;
}>();
const keyboardStore = useKeyboardStore();
const { kbCfg } = toRefs(keyboardStore);

const layoutList = computed(() => {
  return Object.keys(kbCfg.value.data).filter((k: string) => k !== 'base');
});

function handleKeyClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-id]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const key = targetElement.dataset.id;
    if (key !== undefined) {
      emit('update:keyId', Number(key));
    }
  }
}
// feat: support keyboard change
// type KeyboardProps = {
//   color?: string;
//   module?: string;
// };
// withDefaults(defineProps<KeyboardProps>(), {
//   module: 'rk-s75'
// });
</script>

<template>
  <div class="relative bg-#16161d" @click="handleKeyClick">
    <KeyboardKey v-for="key in layoutList" :key="key" :key-id="key" />
  </div>
</template>
