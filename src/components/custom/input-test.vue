<script setup lang="ts">
import { useKeyboardStore } from '@/store/modules/keyboard';
import { nextTick, onMounted, onUnmounted, ref, toRef } from 'vue';

const keyboardStore = useKeyboardStore();

const kbCfg = toRef(keyboardStore, 'kbCfg');
export type Keys = {
  id: number;
  key: string;
  timeInterval: number;
  opacity: number;
};
const keys = ref<Keys[]>([]);
const lastKeyTime = ref(0); // 用于计算时间间隔
const hasFocus = ref(false); // 用于计算时间间隔

// 添加一个按键输出的函数
const addKey = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const currentTime = Date.now();
  const timeInterval = lastKeyTime.value ? currentTime - lastKeyTime.value : 0;

  lastKeyTime.value = currentTime;
  // 生成一个新的按键对象
  const newKey = {
    id: currentTime, // 使用时间戳作为唯一ID
    key: kbCfg.value.standardKeyMap[event.keyCode]?.label ?? 'Err',
    timeInterval,
    opacity: 1 // 初始时透明度为 1（完全可见）
  };
  // 添加到键数组中（最多保留 10 个键）
  if (keys.value.length >= 10) {
    keys.value.shift(); // 移除最早的键
  }
  keys.value.push(newKey);
  setTimeout(() => {
    newKey.opacity = 0; // 设置透明度为 0，触发淡出效果

    const index = keys.value.findIndex(item => item.id === newKey.id);
    if (index !== -1) {
      keys.value.splice(index, 1);
    }

    // if (index === 0) {
    //   lastKeyTime.value = 0;
    // }
  }, 3000);

  // 3 秒后移除已消失的按键
  // setTimeout(() => {}, 3500);
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
  if(!eventHandler){
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
    <div v-show="hasFocus" tabindex="-1" class="key-display-container gap-x-4 border border-#007bff relative" @blur="handleBlur"
      ref="keyContainerRef">
      <div v-for="(keyData, index) in keys" :key="index" class="key-item ml-10px text-16px text-#3C8DF4"
        :style="{ opacity: keyData.opacity }">
        <span>{{ keyData.key + ' ' }}</span>
        <span v-if="keyData.timeInterval > 0">{{ (keyData.timeInterval / 1000).toFixed(2) }}</span>
      </div>
      <i @click.stop="handleClear" class="iconfont icon-hollow-close absolute right-4  text-xl text-#666666 hover:text-[#3C8DF4] cursor-pointer"></i>
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
