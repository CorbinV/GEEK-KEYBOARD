<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import KeyboardKey from './keyboard-key.vue';

const keyboardStore = useKeyboardStore();
const { kbCfg } = toRefs(keyboardStore);

const layoutList = computed(() => {
  return Object.keys(kbCfg.value.data).filter((k: string) => k !== 'base');
});

function handleKeyClick(e) {
  const targetElement = e.target.closest('[data-id]');
  if (targetElement) {
    // do something
    // console.log(targetElement.dataset.id);
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
