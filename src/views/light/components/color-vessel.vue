<script setup lang="ts">
import { ref } from 'vue';
import ZWColors from '@/views/light/components/zw-colors.vue';
import Slider from '@/components/custom/zw-slider2.vue';
import { $t } from '@/locales';
import { getLight, setLight } from '@/api/light';
import type { Light } from '@/api/modules/light';

// 假设你有 15 个项目来填充三行五列的网格
const items = ref([
  $t('light.q0'),
  $t('light.q1'),
  $t('light.q2'),
  $t('light.q3'),
  $t('light.q4'),
  $t('light.q5'),
  $t('light.q6'),
  $t('light.q7')
]);
// 选中的项，默认没有选中
// const selectedItem = ref<number | null>(null);
const light = ref<Light>({
  isRGB: 0,
  pattern: 0,
  brightness: 0,
  speed: 0,
  sleep: 0,
  R: 0,
  G: 0,
  B: 0
});

const sleepTimeitems = ref([
  $t('light.never', { total: 0 }),

  $t('light.minute', { total: 5 }),
  $t('light.minute', { total: 10 }),
  $t('light.minute', { total: 15 }),
  $t('light.minute', { total: 30 }),
  $t('light.interaction', { total: 1 })
]);
// const selectedSleepTime = ref<number | null>(null);
// const lightLevel = ref(10);
// const vLevel = ref(10);
// 定义滑块的数值
// const sliderValue = ref(10);
// // 计算滑块的百分比位置，用于定位百分比值的显示
// const sliderPosition = computed(() => sliderValue.value);

// // 动态计算背景色，已滑动部分为蓝色，未滑动部分为灰色
// const sliderBackground = computed(() => {
//   return `linear-gradient(to right, #3C8DF4 ${sliderValue.value}%, #ddd ${sliderValue.value}%)`;
// });

// // 更新数值
// const updateValue = () => {
//   sliderValue.value = Math.min(Math.max(sliderValue.value, 0), 100);
// };
// 选中项的处理函数
function selectItem(index: number) {
  light.value.pattern = index;
  setLight(light.value);
}

// 选中项的处理函数
function selectSleepTimeItem(index: number) {
  light.value.sleep = index;
  setLight(light.value);
}
async function brightness(value: number) {
  light.value.brightness = value;
  setLight(light.value);
}
async function lightSpeed(value: number) {
  light.value.speed = value;
  setLight(light.value);
}
async function isRgbSwitch(value: boolean) {
  light.value.isRGB = value ? 1 : 0;
  setLight(light.value);
}
async function rgbColorCallback(r: number, g: number, b: number) {
  light.value.R = r;
  light.value.G = g;
  light.value.B = b;
  setLight(light.value);
}

async function getDevLight() {
  light.value = await getLight();
  console.log('11111111111', light.value);
  //  await addOks({ code, keys, name });
}

getDevLight();
// setDevLight();
</script>

<template>
  <div class="flex-raw flex gap-30px bg-[#171619] p-30px">
    <div class="flex flex-col flex-1">
      <div class="flex-raw flex items-center">
        <p class="vertical-bar"></p>
        <p class="... text-lg">{{ $t('light.modeSelect') }}</p>
      </div>
      <div class="grid-container grid mb-20px mt-20px gap-x-55px gap-y-30px">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="grid-item text-[#999999]"
          :class="{ selected: light.pattern === index }"
          @click="selectItem(index)"
        >
          {{ item }}
        </div>
      </div>
    </div>
    <div class="border-l-1px border-[#232327]"></div>
    <div class="flex flex-col flex-1 bg-[#171619]">
      <div class="flex-raw mt-20px flex items-center">
        <p class="vertical-bar"></p>
        <p class="... text-lg">{{ $t('light.luminance') }}</p>
      </div>
      <Slider v-model="light.brightness" @stop-sliding="brightness"></Slider>
      <div class="flex-raw mt-20px flex items-center">
        <p class="vertical-bar"></p>
        <p class="... text-lg">{{ $t('light.speend') }}</p>
      </div>
      <Slider v-model="light.speed" @stop-sliding="lightSpeed"></Slider>
      <div class="flex-raw mt-20px flex items-center">
        <p class="vertical-bar"></p>
        <p class="... text-lg">{{ $t('light.lightSleep') }}</p>
      </div>

      <div class="grid-container grid mt-20px gap-x-55px gap-y-30px">
        <div
          v-for="(item, index) in sleepTimeitems"
          :key="index"
          class="grid-item text-[#999999]"
          :class="{ selected: light.sleep === index }"
          @click="selectSleepTimeItem(index)"
        >
          <!-- 在这里渲染每个网格项的内容 -->
          {{ item }}
        </div>
      </div>
    </div>
    <div class="border-l-1px border-[#232327]"></div>
    <div class="flex-1">
      <ZWColors
        class="w-200p h-100"
        :color-r="0"
        :color-b="255"
        :color-g="255"
        :is-rgb="true"
        @is-rgb-switch="isRgbSwitch"
        @stop-sliding="rgbColorCallback"
      ></ZWColors>
    </div>
  </div>
</template>

<style scoped>
.vertical-bar {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  background-color: #3c8df4; /* 按钮文字颜色 */
}
.grid-container {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(5, 40px);

  overflow-y: auto; /* 当内容超出时允许滚动 */
}
.grid-item {
  height: 100%; /* 每个项目的高度占满所在的单元格 */
  background-color: #222227;
  /* border: 1px solid #ddd; */
  display: flex;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.grid-item.selected {
  background-color: #3c8df4; /* 选中项的背景颜色 */
  color: white; /* 选中项的文字颜色 */
}
.hollow-btn {
  background-color: transparent;
  color: #3c8df4; /* 按钮文字颜色 */
  border: 1px solid #3c8df4; /* 边框颜色 */
  border-radius: 8px; /* 圆角边框 */
  padding: 10px 20px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.hollow-btn:hover {
  background-color: #3c8df4; /* 悬停时的背景颜色 */
  color: white; /* 悬停时文字颜色 */
}

.slider-container {
  position: relative;
  width: 300px;
  margin: 20px;
}

input[type='range'] {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  background: #ddd;
  border-radius: 5px;
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #fff;
  cursor: pointer;
  border-radius: 50%;
}

span {
  position: absolute;
  top: 25px;
  transform: translateX(-50%);
  color: #666666;
}
</style>
