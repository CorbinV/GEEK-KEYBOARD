<script setup lang="ts">
import { ref } from 'vue';
const mtValue = ref(-40);
const sliderValue = ref(0);
const onInput = (event: Event) => {
  // const target = event.target as HTMLInputElement;
  //  mtValue.value += target.value;
  const target = event.target as HTMLInputElement;
  if (target) {
    const value = Number.parseFloat(target.value); // 转为 number 类型
    mtValue.value = -value * 10;
    console.log('当前值:', mtValue.value);
  }
};

// function rateSelect(key: number) {
//   curRate.value = rateOption.value.find((item: Opetion) => item.key === key);
// }
</script>
<!-- <div class="background-layer" style="z-index: 3"> -->

<template>
  <div class="flex flex-row">
    <!-- <div class="slider-container"></div> -->
    <!-- <input v-model="sliderValue" type="range" :min="minSlider" :max="maxSlider" /> -->

    <div class="ml-115px flex flex-col items-center justify-center bg-#0e1eb4">
      <!-- 滑杆条 -->
      <!-- 显示当前值 -->
      <div class="value-display">{{ sliderValue }}mm</div>
      <input
        v-model="sliderValue"
        type="range"
        min="0.1"
        max="3.5"
        step="0.1"
        class="vertical-slider"
        @input="onInput"
      />
    </div>
    <div class="relative h-190px w-145px overflow-hidden">
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
  width: 8px;
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
