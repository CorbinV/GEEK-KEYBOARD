<script setup lang="ts">
import { computed, ref } from 'vue';

// defineOptions({
//   name: 'AppSlider',
//   components: {},
//   data() {
//     return {};
//   },

//   methods: {}
// });
// 定义滑块的数值
const sliderValue = ref(10);

// 计算滑块的百分比位置，用于定位百分比值的显示
const sliderPosition = computed(() => sliderValue.value);

// 动态计算背景色，已滑动部分为蓝色，未滑动部分为灰色
const sliderBackground = computed(() => {
  return `linear-gradient(to right, #007bff ${sliderValue.value}%, #ddd ${sliderValue.value}%)`;
});

// 更新数值
const updateValue = () => {
  sliderValue.value = Math.min(Math.max(sliderValue.value, 0), 100);
};
</script>

<template>
  <div class="slider-container">
    <input
      v-model="sliderValue"
      type="range"
      min="0"
      max="100"
      :style="{ background: sliderBackground }"
      @input="updateValue"
    />
    <span :style="{ left: sliderPosition + '%' }">{{ sliderValue }}%</span>
  </div>
</template>

<style scoped>
.slider-container {
  position: relative;
  width: 300px;
  margin: 20px;
}

input[type='range'] {
  -webkit-appearance: none;
  width: 300px;
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
  background: #007bff;
  cursor: pointer;
  border-radius: 50%;
}

span {
  position: absolute;
  bottom: -25px;
  transform: translateX(-50%);
  color: #fff;
}
</style>
