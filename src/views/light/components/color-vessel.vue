<script setup lang="ts">
import { ref } from 'vue';
import Slider from '@/components/custom/zw-slider.vue';

// 假设你有 15 个项目来填充三行五列的网格
const items = ref([
  '流光溢彩',
  '静态',
  '七彩呼吸',
  '繁星点点',
  '流沙',
  '幻彩瀑布',
  '幻彩瀑布',
  '幻彩瀑布',
  '幻彩瀑布',
  '幻彩瀑布',
  '幻彩瀑布',
  '幻彩瀑布',
  '幻彩瀑布'
]);
// 选中的项，默认没有选中
const selectedItem = ref<number | null>(null);

const sleepTimeitems = ref(['5分钟', '10分钟', '15分钟', '20分钟', '30分钟', '永不']);

const selectedSleepTime = ref<number | null>(null);
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
  if (selectedItem.value === index) {
    selectedItem.value = null; // 如果点击的是已选中的项，取消选择
  } else {
    selectedItem.value = index; // 否则选择当前项
  }
}

// 选中项的处理函数
function selectSleepTimeItem(index: number) {
  if (selectedSleepTime.value === index) {
    selectedSleepTime.value = null; // 如果点击的是已选中的项，取消选择
  } else {
    selectedSleepTime.value = index; // 否则选择当前项
  }
}
</script>

<template>
  <div class="flex-raw flex gap-30px bg-[#171619] p-30px">
    <div class="flex flex-col flex-1 bg-[#171619]">
      <div class="flex-raw flex items-center">
        <p class="vertical-bar"></p>
        <p class="... text-lg">模式选择</p>
      </div>
      <div class="grid-container mb-1 mb-20px mt-20px">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="grid-item text-[#999999]"
          :class="{ selected: selectedItem === index }"
          @click="selectItem(index)"
        >
          <!-- 在这里渲染每个网格项的内容 -->
          {{ item }}
        </div>
      </div>
      <div class="flex-raw mt-30px flex items-center">
        <p class="vertical-bar"></p>
        <p class="... text-lg">亮度</p>
      </div>
      <Slider></Slider>
      <div class="flex-raw mt-30px flex items-center">
        <p class="vertical-bar"></p>
        <p class="... text-lg">速度</p>
      </div>

      <Slider></Slider>
    </div>
    <div class="border-l-1px border-[#232327]"></div>
    <div class="flex flex-col flex-1 bg-[#171619]">
      <div class="flex-raw flex items-center">
        <p class="vertical-bar"></p>
        <p class="... text-lg">灯光休眠</p>
      </div>
      <div class="grid-container mb-1 mb-20px mt-20px">
        <div
          v-for="(item, index) in sleepTimeitems"
          :key="index"
          class="grid-item text-[#999999]"
          :class="{ selected: selectedSleepTime === index }"
          @click="selectSleepTimeItem(index)"
        >
          <!-- 在这里渲染每个网格项的内容 -->
          {{ item }}
        </div>
      </div>
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
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 5列 */
  grid-template-rows: repeat(3, 40px); /* 3行，每行最大高度230px */
  gap: 30px; /* 每个项目之间的间距 */
  max-height: 180px; /* 总高度为三行的最大高度 */
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
