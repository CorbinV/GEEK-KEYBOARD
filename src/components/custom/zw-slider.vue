<script setup lang="ts">
import { computed, defineEmits, defineProps, onMounted, onUnmounted, ref, watch } from 'vue';

// 定义 props 和 emits
const props = defineProps<{
  modelValue: number; // 外部传入的 sliderValue
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void; // 更新外部值
  (e: 'stopSliding', value: number): void; // 更新外部值
}>();

// 内部的 sliderValue 绑定到外部的 modelValue
const sliderValue = ref(props.modelValue);

// 监听外部 modelValue 变化，更新内部值
// 监听外部 modelValue 变化，更新内部值
watch(
  () => props.modelValue,
  (newValue: number) => {
    sliderValue.value = newValue;
  }
);

// 是否正在滑动
const isSliding = ref(false);

// 计算滑块的百分比位置，用于定位百分比值的显示
const sliderPosition = computed(() => `${((sliderValue.value * 100) / 300) * 100}%`);

// 动态计算背景色，已滑动部分为蓝色，未滑动部分为灰色
const sliderBackground = computed(() => {
  return `linear-gradient(to right, #007bff ${((sliderValue.value * 100) / 300) * 100}%, #ddd ${sliderValue.value}mm)`;
});

// 滑动前触发
const startSliding = () => {
  isSliding.value = true;
  console.log('Sliding started');
};

const valueAdd = () => {
  sliderValue.value = (sliderValue.value * 100 + 1) / 100;

  emit('stopSliding', sliderValue.value); // 触发更新外部值
};
const valueRemove = () => {
  sliderValue.value -= 0.01;
  sliderValue.value = (sliderValue.value * 100 - 1) / 100;

  emit('stopSliding', sliderValue.value); // 触发更新外部值
};
// 滑动中触发
// const sliding = () => {
//   if (isSliding.value) {
//     emit('update:modelValue', sliderValue.value); // 触发更新外部值
//   }
// };

// 滑动结束触发
const stopSliding = () => {
  if (isSliding.value) {
    isSliding.value = false;
    emit('stopSliding', sliderValue.value); // 触发更新外部值
  }
};

// 更新数值，确保值在 0 到 100 之间
const updateValue = () => {
  sliderValue.value = Math.min(Math.max(sliderValue.value, 0), 100);
  if (isSliding.value) {
    emit('update:modelValue', sliderValue.value); // 触发更新外部值
  }
};

// 添加事件监听器到全局（鼠标松开时）
onMounted(() => {
  // window.addEventListener('mousemove', sliding);
  window.addEventListener('mouseup', stopSliding);
});

onUnmounted(() => {
  // window.removeEventListener('mousemove', sliding);
  window.removeEventListener('mouseup', stopSliding);
});
</script>

<!-- <i class="iconfont icon-hollow-remove text-center text-30px text-[#3C8DF4]"></i> -->

<template>
  <!-- <div class="rlex-row w-100% flex"> -->
  <div class="outer-container">
    <i
      class="iconfont icon-hollow-remove inline-block p-0 text-center text-30px text-[#3C8DF4]"
      @click="valueRemove"
    ></i>

    <div class="slider-container">
      <input
        v-model="sliderValue"
        class="slider"
        type="range"
        min="0.01"
        max="3"
        step="0.01"
        :style="{ background: sliderBackground }"
        @input="updateValue"
        @mousedown="startSliding"
      />
      <span class="slider-value" :style="{ left: sliderPosition }">{{ sliderValue }}mm</span>
      <!-- 显示滑块值，位置动态绑定 -->
    </div>
    <i class="iconfont icon-hollow-add text-center text-30px text-[#3C8DF4]" @click="valueAdd"></i>
  </div>
  <!-- </div> -->
</template>

<style scoped>
/* 父父布局 */
.outer-container {
  width: 100%;
  /* padding: 20px; */
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
}

/* 滑块容器 */
.slider-container {
  position: relative;
  width: 80%;
}

/* 滑块样式 */
input[type='range'] {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  background: #ddd;
  border-radius: 5px;
  outline: none;
  transition: background 0.3s;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #fff;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 显示滑块值 */
.slider-value {
  position: absolute;
  bottom: -8px;
  transform: translateX(-50%);
  /* background: #007bff; */
  color: #666;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: none;
  transition: left 0.1s;
}
</style>
