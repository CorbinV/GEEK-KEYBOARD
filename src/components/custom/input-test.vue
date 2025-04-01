<script setup lang="ts">
import { useKeyboardStore } from '@/store/modules/keyboard';
import { nextTick, onMounted, onUnmounted, ref, toRef } from 'vue';

const keyboardStore = useKeyboardStore();

const kbCfg = toRef(keyboardStore, 'kbCfg');
export type KeyItem = {
  id: number;
  key: string;
  timeInterval: number;
  opacity: number;
};
const MAX_KEYS = 10;
const lastKeyTime = ref(0); // 用于计算时间间隔
const hasFocus = ref(false); // 用于计算时间间隔
// 添加一个按键输出的函数
const addKey = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.repeat) {
    return
  }

  const currentTime = Date.now();
  const timeInterval = lastKeyTime.value ? currentTime - lastKeyTime.value : 0;
  lastKeyTime.value = currentTime;
  const newKey = {
    id: Date.now(),
    key: kbCfg.value.standardKeyMap[event.keyCode]?.label ?? 'Err',
    timeInterval,
    opacity: 1 // 初始时透明度为 1（完全可见）
  }
  if (keys.value.length > MAX_KEYS - 1) {
    keys.value.shift()
  }
  keys.value.push(newKey);

  setTimeout(() => {
    newKey.opacity = 0
    const index = keys.value.findIndex(item => item.id === newKey.id);
    if (index !== -1) {
      keys.value.splice(index, 1);
    }
  }, 3000);
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
  keys.value = []
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
      点击测试按键
    </p>
    <div v-show="hasFocus" tabindex="-1" class="key-display-container  border border-#007bff relative"
      @blur="handleBlur" ref="keyContainerRef">
      <div class="flex flex-row-reverse justify-end gap-x-8">
        <template v-for="(_, index) in MAX_KEYS" :key="`${index}-${keys[index]?.key}`">

          <div v-if="keys[index]" class="key-item text-16px text-#3C8DF4  " :style="{ opacity: keys[index].opacity }">
            <span>{{ keys[index].key + ' ' }}</span>
            <span v-if="keys[index].timeInterval > 0">{{ (keys[index].timeInterval / 1000).toFixed(2) }}</span>
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
