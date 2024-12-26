<script setup lang="ts">
import { ref } from 'vue';
export type Keys = {
  id: number;
  key: string;
  timeInterval: number;
  opacity: number;
};
const keys = ref<Keys[]>([]);
const lastKeyTime = ref(0); // 用于计算时间间隔

// 添加一个按键输出的函数
const addKey = (event: KeyboardEvent) => {
  const currentTime = Date.now();
  const timeInterval = lastKeyTime.value ? currentTime - lastKeyTime.value : 0;
  lastKeyTime.value = currentTime;
  // 生成一个新的按键对象
  const newKey = {
    id: currentTime, // 使用时间戳作为唯一ID
    key: event.key.toUpperCase(),
    timeInterval,
    opacity: 1 // 初始时透明度为 1（完全可见）
  };

  // 添加到键数组中（最多保留 10 个键）
  if (keys.value.length >= 10) {
    keys.value.shift(); // 移除最早的键
  }
  keys.value.push(newKey);
  console.log(keys.value);
  // 每个按键显示 3 秒后消失
  setTimeout(() => {
    newKey.opacity = 0; // 设置透明度为 0，触发淡出效果
  }, 3000);

  // 3 秒后移除已消失的按键
  setTimeout(() => {
    const index = keys.value.findIndex(item => item.id === newKey.id);
    if (index !== -1) {
      keys.value.splice(index, 1);
    }
  }, 3500);
};
document.addEventListener('keydown', addKey);
</script>

<template>
  <div class="h-8 w-full flex items-center justify-center rounded-md bg-#1e1e22 text-c-hl xl:h-10">
    <div tabindex="0" class="key-display-container">
      <div
        v-for="(keyData, index) in keys"
        :key="index"
        class="key-item ml-10px text-16px text-#3C8DF4"
        :style="{ opacity: keyData.opacity }"
      >
        <span>{{ keyData.key }}</span>
        <span v-if="keyData.timeInterval > 0">-{{ keyData.timeInterval }}ms</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  font-family: Arial, sans-serif;
}
</style>
