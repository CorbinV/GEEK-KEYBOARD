<script setup lang="ts">
import { useKeyboardStore } from '@/store/modules/keyboard';
import { nextTick, onMounted, onUnmounted, ref, toRef } from 'vue';

const MAX_KEYS = 10;
const MAX_WAIT_TIME = 10000;
const keyboardStore = useKeyboardStore();

const kbCfg = toRef(keyboardStore, 'kbCfg');
export type KeyItem = {
  id: number;
  key: string;
  timeInterval: number;
  opacity: number;
};

function useKeyQueue<T extends { id: string | number }>(maxLen: number = MAX_KEYS, timeoutMs = 3000) {
  const queue = ref<T[]>([]);
  let lastTimer: number | null = null;
  const removeOutKey = (id: T['id']) => {
    lastTimer = window.setTimeout(() => {
      const index = queue.value.findIndex(item => item.id === id);
      if (index !== -1) {
        queue.value.splice(index, 1);
      }
    }, timeoutMs)
  }
  const enqueue = (item: T) => {
    queue.value.unshift(item as any);
    if (queue.value.length > maxLen) {
      queue.value.pop();
    }
  }
  const clearQueue = () => {
    queue.value = [];
  }

  return {
    queue,
    enqueue,
    clearQueue
  };
}


const lastKeyTime = ref(0); // 用于计算时间间隔
const hasFocus = ref(false); // 用于计算时间间隔
const generateKey = (key: string, timeInterval: number) => {
  return {
    id: Date.now(),
    key,
    timeInterval,
    opacity: 1 // 初始时透明度为 1（完全可见）
  }
}
const { queue, enqueue, clearQueue } = useKeyQueue<KeyItem>(MAX_KEYS, 3000);
let keyTimer: number | null = null;
function addKey(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (event.repeat) {
    return
  }

  const currentTime = Date.now();
  const timeInterval = lastKeyTime.value ? currentTime - lastKeyTime.value : 0;
  lastKeyTime.value = currentTime;
  const newKey = generateKey(kbCfg.value.standardKeyMap[event.keyCode]?.label ?? 'Err', timeInterval);
  enqueue(newKey);
  if (keyTimer) {
    clearTimeout(keyTimer);
  }

  keyTimer = window.setTimeout(() => {
    clearQueue();
    keyTimer = null;
    lastKeyTime.value = 0;
  }, MAX_WAIT_TIME);
};
let eventHandler: Function | undefined
const keyContainerRef = ref<HTMLDivElement | null>(null);
function testmoClick() {
  hasFocus.value = !hasFocus.value;
  nextTick(() => {
    keyContainerRef.value?.focus();
  })
}
function handleBlur() {
  hasFocus.value = false;
  keyContainerRef.value?.blur();
  handleClear()
}
function handleClear() {
  clearQueue();
  lastKeyTime.value = 0;
}
function handleKeyDown(event: KeyboardEvent) {
  if (!hasFocus.value) {
    eventHandler = undefined;
    return
  }
  if (!eventHandler) {
    eventHandler = addKey;
  }
  eventHandler(event)
}
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  nextTick(() => {
    keyContainerRef.value?.focus();
  })
});
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="h-8 w-full flex items-center justify-center rounded-md bg-#1e1e22 xl:h-10">
    <p v-show="!hasFocus"
      class="h-full w-full flex select-none items-center justify-center border-transparent text-[16px] text-#666666"
      :class="`${!hasFocus ? '' : '-z-1'}`" @click="testmoClick">
      {{ $t('baseKey.keyboard.beginKeyTest') }}
    </p>
    <div v-show="hasFocus" tabindex="-1" class="key-display-container  border border-#007bff relative"
      @blur="handleBlur" ref="keyContainerRef">
      <div class="flex  justify-end gap-x-8">
        <template v-for="(_, index) in MAX_KEYS" :key="`${index}-${queue[index]?.key}`">

          <div v-if="queue[index]?.key" :class="`key-item text-16px  ${index === 0 ? 'text-#3C8DF4': 'text-#999999'} `"
            :style="{ opacity: queue[index].opacity }">
            <span>{{ queue[index].key + ' ' }}</span>
            <span v-if="queue[index].timeInterval > 0">{{ (queue[index].timeInterval / 1000).toFixed(2) }}</span>
          </div>
          <div v-else class="w-48px text-16px"></div>
        </template>
      </div>
      <i @click.stop="handleClear"
        class="iconfont icon-hollow-close absolute right-4  text-xl text-#666666 hover:text-[#3C8DF4] cursor-pointer"></i>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.key-item {
  transition: opacity 1s ease;
}

.key-display-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  font-family: Arial, sans-serif;

  &:focus-visible {
    outline: 1px solid #007bff;
    user-select: none;
  }
}
</style>
