<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { hslToRgb } from '@/utils/tools';

const selectedColor = ref('#000000'); // 选中的颜色，使用 ref 来声明
const rgbHex = ref(''); // 选中的颜色，使用 ref 来声明
const zc = ref(false); // 选中的颜色，使用 ref 来声明
const canvas = ref<HTMLCanvasElement | null>(null); // canvas 引用

// 绘制色轮
const drawColorWheel = () => {
  if (!canvas.value) return; // 检查 canvas 是否存在
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return; // 确保获取到绘图上下文

  const radius = canvas.value.width / 2;

  // 使用 createConicGradient 来创建圆形渐变
  const gradient = ctx.createConicGradient(0, radius, radius);

  // 设置从色相角度0到360的颜色渐变
  for (let i = 0; i < 360; i += 1) {
    gradient.addColorStop(i / 360, `hsl(${360 - i}, 100%, 45%)`);
  }

  // 绘制一个完整的色轮
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
};

// 处理鼠标移动事件，计算选中的颜色
const handleMouseMove = (event: MouseEvent) => {
  if (!canvas.value) return; // 确保 canvas 存在
  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left - canvas.value.width / 2;
  const y = event.clientY - rect.top - canvas.value.height / 2;
  const distance = Math.sqrt(x * x + y * y);

  if (distance < canvas.value.width / 2) {
    // 计算角度，调整为顺时针
    const angle = Math.atan2(y, x);

    const hue = (angle * 180) / Math.PI + 180; // 调整角度范围
    //    const hue = angle * (180 / Math.PI);
    console.log(hue);

    // if (hue < 0) {
    //   hue += 360; // 保证 hue 始终是正数
    // }(360 - oldAngle) % 360;
    // selectedColor.value = `hsl(${hue - 180}, 100%, 50%)`;
    selectedColor.value = `hsl(${(180 - hue) % 360}, 100%, 50%)`;
    const rgb = hslToRgb(hue, 100, 50);
    console.log(`SSSSS------------${rgb}`);

    const bHex = rgb[0].toString(16).padStart(2, '0'); // 转换为十六进制
    const gHex = rgb[1].toString(16).padStart(2, '0'); // 转换为十六进制
    const rHex = rgb[2].toString(16).padStart(2, '0'); // 转换为十六进制
    rgbHex.value = `${rHex}${gHex}${bHex}`;
  }
};

// 处理点击事件，选中颜色
const selectColor = (event: MouseEvent) => {
  if (!canvas.value) return; // 确保 canvas 存在
  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left - canvas.value.width / 2;
  const y = event.clientY - rect.top - canvas.value.height / 2;
  const distance = Math.sqrt(x * x + y * y);

  if (distance < canvas.value.width / 2) {
    // 计算角度，调整为顺时针
    const angle = Math.atan2(y, x);
    let hue = (angle * 180) / Math.PI + 180; // 调整角度范围
    if (hue < 0) {
      hue += 360; // 保证 hue 始终是正数
    }
    selectedColor.value = `hsl(${hue}, 100%, 50%)`;
  }
};

// 初始化色轮

onMounted(() => {
  drawColorWheel();
});
</script>

<template>
  <div class="h-100% w-100% flex-col items-center">
    <div class="flex-raw w-100% flex items-center justify-between gap-10px">
      <div class="flex-raw flex gap-10px">
        <p class="vertical-bar"></p>
        <p class="... text-lg">颜色</p>
        <p class="h-24px w-24px rounded-[4px]" :style="{ backgroundColor: selectedColor }"></p>
        <p class="h-36px place-content-center rd-sm rounded-[6px] bg-[#222227] pl-10px pr-10px">{{ rgbHex }}</p>
      </div>
      <div class="flex-raw flex gap-10px">
        <input type="radio" name="option" :checked="zc" @click="zc = !zc" />
        <p class="... text-lg text-[#999999]">全彩</p>
      </div>
    </div>
    <div class="mt-30px">
      <canvas ref="canvas" width="200px" height="200px" @mousemove="handleMouseMove" @click="selectColor"></canvas>
    </div>
    <div class="flex-raw mt-30px w-100% flex justify-center gap-20px">
      <p class="... text-lg text-[#999999]">R</p>
      <p class="h-36px place-content-center rd-sm rounded-[6px] bg-[#222227] pl-10px pr-10px">{{ rgbHex }}</p>

      <p class="... text-lg text-[#999999]">G</p>
      <p class="h-36px place-content-center rd-sm rounded-[6px] bg-[#222227] pl-10px pr-10px">{{ rgbHex }}</p>

      <p class="... text-lg text-[#999999]">B</p>
      <p class="h-36px place-content-center rd-sm rounded-[6px] bg-[#222227] pl-10px pr-10px">{{ rgbHex }}</p>
    </div>
  </div>
</template>

<style scoped>
.color-picker {
  position: relative;
  display: inline-block;
}
.vertical-bar {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  background-color: #3c8df4; /* 按钮文字颜色 */
}

.selected-color {
  margin-top: 10px;
  width: 50px;
  height: 50px;
  border: 1px solid #ccc;
  border-radius: 50%;
}
</style>
