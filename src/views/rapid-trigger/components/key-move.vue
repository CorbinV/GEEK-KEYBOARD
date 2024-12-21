<script setup lang="ts">
import { defineEmits, defineProps, onMounted, onUnmounted, ref, watch } from 'vue';

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
watch(
  () => props.modelValue,
  (newValue: number) => {
    sliderValue.value = newValue;
    calTop(sliderValue.value);
  }
);

const mtValue = ref(-40);
// 是否正在滑动
const isSliding = ref(false);

// const onInput = (event: Event) => {
//   // const target = event.target as HTMLInputElement;
//   //  mtValue.value += target.value;
//   const target = event.target as HTMLInputElement;
//   if (target) {
//     const value = Number.parseFloat(target.value); // 转为 number 类型
//     calTop(value);
//   }
// };

// 更新数值，确保值在 0 到 100 之间
const onInput = () => {
  sliderValue.value = Math.min(Math.max(sliderValue.value, 0), 100);
  if (isSliding.value) {
    calTop(sliderValue.value);
    emit('update:modelValue', sliderValue.value); // 触发更新外部值
  }
};

function calTop(value: number) {
  // 0.1;   -15
  // 3.5; ~ -35
  const xMin = 0.1;
  const xMax = 3.5;
  // 定义输出值的最小值和最大值
  const yMin = -36;
  const yMax = -15;
  mtValue.value = yMin + ((value - xMin) * (yMax - yMin)) / (xMax - xMin);
}
// 滑动前触发
const startSliding = () => {
  isSliding.value = true;
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

// 添加事件监听器到全局（鼠标松开时）
onMounted(() => {
  // window.addEventListener('mousemove', sliding);
  window.addEventListener('mouseup', stopSliding);
});

onUnmounted(() => {
  // window.removeEventListener('mousemove', sliding);
  window.removeEventListener('mouseup', stopSliding);
});

// function rateSelect(key: number) {
//   curRate.value = rateOption.value.find((item: Opetion) => item.key === key);
// }
</script>
<!-- <div class="background-layer" style="z-index: 3"> -->

<template>
  <div class="flex flex-row">
    <!-- <div class="slider-container"></div> -->
    <!-- <input v-model="sliderValue" type="range" :min="minSlider" :max="maxSlider" /> -->

    <div class="ml-80px flex flex-col items-center justify-center">
      <!-- 滑杆条 -->
      <!-- 显示当前值 -->
      <div class="value-display">{{ sliderValue }}mm</div>

      <!-- 滑块 -->

      <input
        v-model="sliderValue"
        type="range"
        min="0.1"
        max="3.5"
        step="0.1"
        class="vertical-slider"
        @input="onInput"
        @mousedown="startSliding"
      />
    </div>
    <div class="relative h-190px w-145px overflow-hidden pt-30px">
      <!-- 背景层 -->

      <div class="background-layer absolute">
        <img src="@/assets/img/keyBg.png" class="block h-full w-full object-scale-down" draggable="false" />
      </div>

      <div class=":style= moving-layer absolute" :style="{ marginTop: `${mtValue}px` }">
        <img src="@/assets/img/keyMove.png" alt="" class="block h-full w-full object-scale-down" draggable="false" />
      </div>

      <div class="surface-layer absolute">
        <img src="@/assets/img/keySurface.png" alt="" class="block h-full w-full object-scale-down" draggable="false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vertical-slider {
  writing-mode: bt-lr; /* 使滑杆垂直 */
  -webkit-appearance: slider-vertical; /* Webkit浏览器支持 */
  transform: rotate(180deg); /* 翻转，使得最大值在下方 */
  width: 100px;
  height: 150px;
  margin: 10px 0;
}

.value-display {
  margin-top: 10px;
  font-size: 16px;
}
/* 父容器 */
.container {
  position: relative;

  overflow: hidden;
  border: 1px solid #ccc;
  background: #000;
}

/* 各图层基础样式 */
.layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

/* 背景层样式 */
.background-layer {
  z-index: 0;
}

/* 移动层样式 */
.moving-layer {
  /* mix-blend-mode: multiply; */
  z-index: 1;
}

/* 表面层样式 */
.surface-layer {
  /* pointer-events: none;  */
  z-index: 2;
}
</style>
