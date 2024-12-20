<script setup lang="ts">
import { defineEmits, onMounted, ref } from 'vue';
import { hslToRgb, rgbToHsl } from '@/utils/tools';

// 定义 props 和 emits
const props = defineProps<{
  isRgb: boolean; // 外部传入的 sliderValue
  colorR: number;
  colorG: number;
  colorB: number;
}>();
const emit = defineEmits<{
  (e: 'stopSliding', r: number, g: number, b: number): void; // 更新外部值
  (e: 'isRgbSwitch', value: boolean): void; // 更新外部值
}>();

// 内部的 sliderValue 绑定到外部的 modelValue
// const sliderValue = props.modelValue;
const R = ref(props.colorR);
const G = ref(props.colorG);
const B = ref(props.colorB);
const mouseIsMove = ref(false);
const isRGB = ref(props.isRgb);
const rgbHex = ref<string>(''); // 选中的颜色，使用 ref 来声明
const colorCanvas = ref<HTMLCanvasElement | null>(null); // canvas 引用
const dotCanvas = ref<HTMLCanvasElement | null>(null); // canvas 引用

function initValue() {
  rgbHex.value = `${R.value.toString(16).padStart(2, '0')}${G.value.toString(16).padStart(2, '0')}${B.value.toString(16).padStart(2, '0')}`;
}
// 绘制色轮
const drawColorWheel = () => {
  if (!colorCanvas.value) return; // 检查 canvas 是否存在
  const ctx = colorCanvas.value.getContext('2d');
  if (!ctx) return; // 确保获取到绘图上下文

  const radius = colorCanvas.value.width / 2;

  // 使用 createConicGradient 来创建圆形渐变
  const gradient = ctx.createConicGradient(0, radius, radius);

  // 设置从色相角度0到360的颜色渐变
  for (let i = 0; i < 360; i += 1) {
    gradient.addColorStop(i / 360, `hsl(${i - 180}, 100%, 45%)`);
  }

  // 绘制一个完整的色轮
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // // 绘制控制圆 (一个小的圆形控件)
  const rsl = rgbToHsl(R.value, G.value, B.value);
  console.log(rsl);
  // const controlRadius = 10; // 控制圆的半径
  // const angle = Math.PI / 4; // 控制圆的初始角度（比如在45度位置）
  // const controlX = radius + radius * Math.cos(angle);
  // const controlY = radius + radius * Math.sin(angle);

  // console.log('55555555555555', rgbToHsl(R.value, G.value, B.value));
  // console.log('55555555555555', rsl.H);

  // // 绘制小圆
  // ctx.beginPath();
  // ctx.arc(controlX, controlY, controlRadius, 0, 2 * Math.PI);
  // ctx.closePath();
  // ctx.fillStyle = `hsl(${rsl.H}, 100%, 45%)`;
  // ctx.fill();
};

const handleMouseUp = (event: MouseEvent) => {
  console.log(event);
  mouseIsMove.value = false;
};
const handleMouseDown = (event: MouseEvent) => {
  console.log(event);
  mouseIsMove.value = true;
};
const handleMouseMove = (event: MouseEvent) => {
  if (!dotCanvas.value) return; // 确保 canvas 存在
  if (!mouseIsMove.value) return;

  const ctx = dotCanvas.value.getContext('2d');
  if (!ctx) return; // 确保获取到绘图上下文

  const rect = dotCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left - dotCanvas.value.width / 2;
  const y = event.clientY - rect.top - dotCanvas.value.height / 2;
  const distance = Math.sqrt(x * x + y * y);

  if (distance < dotCanvas.value.width / 2) {
    // 计算角度，调整为顺时针
    const angle = Math.atan2(y, x);

    const hue = (angle * 180) / Math.PI + 180; // 调整角度范围
    //    const hue = angle * (180 / Math.PI);
    console.log(hue);

    // if (hue < 0) {
    //   hue += 360; // 保证 hue 始终是正数
    // }(360 - oldAngle) % 360;
    // selectedColor.value = `hsl(${hue - 180}, 100%, 50%)`;
    // selectedColor.value = `hsl(${(180 - hue) % 360}, 100%, 50%)`;
    ctx.clearRect(0, 0, dotCanvas.value.width, dotCanvas.value.height);

    const rgb = hslToRgb(hue, 100, 50);

    R.value = rgb[0]; // 转换为十六进制
    G.value = rgb[1]; // 转换为十六进制
    B.value = rgb[2]; // 转换为十六进制
    initValue();
    // rgbHex.value = `${rHex}${gHex}${bHex}`;

    const dotSize = 5; // 控制圆的半径
    const strokeSize = dotSize / 2; // 控制圆的半径

    // 绘制小圆
    ctx.beginPath();
    ctx.arc(
      x + dotCanvas.value.width / 2 + dotSize / 2,
      y + dotCanvas.value.height / 2 + dotSize / 2,
      dotSize,
      0,
      2 * Math.PI
    );

    ctx.closePath();
    ctx.stroke(); // 描边
    ctx.strokeStyle = 'white';
    ctx.lineWidth = strokeSize;
    ctx.fillStyle = `hsl(${hue}, 100%, 45%)`;
    ctx.fill();
  }
};

// 处理点击事件，选中颜色
const selectColor = (event: MouseEvent) => {
  if (!colorCanvas.value) return; // 确保 canvas 存在
  const rect = colorCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left - colorCanvas.value.width / 2;
  const y = event.clientY - rect.top - colorCanvas.value.height / 2;
  const distance = Math.sqrt(x * x + y * y);

  if (distance < colorCanvas.value.width / 2) {
    // 计算角度，调整为顺时针
    const angle = Math.atan2(y, x);
    let hue = (angle * 180) / Math.PI + 180; // 调整角度范围
    if (hue < 0) {
      hue += 360; // 保证 hue 始终是正数
    }
    // selectedColor.value = `hsl(${hue}, 100%, 50%)`;
  }
};

// 初始化色轮

onMounted(() => {
  drawColorWheel();
});

// 滑动结束触发
const stopSliding = () => {
  emit('stopSliding', R.value, G.value, B.value); // 触发更新外部值
};

const isRgbSwitch = (value: boolean) => {
  emit('isRgbSwitch', value);
};
onMounted(() => {
  window.addEventListener('mouseup', stopSliding);
});
initValue();
</script>

<template>
  <div divclass="h-100% w-100% flex-col items-center">
    <div class="flex-raw w-100% flex items-center justify-between gap-10px">
      <div class="flex-raw flex gap-10px">
        <p class="vertical-bar"></p>
        <p class="... text-lg">{{ $t('light.color') }}</p>
        <p class="h-24px w-24px rounded-[4px]" :style="{ backgroundColor: '#' + rgbHex }"></p>
        <p class="h-36px place-content-center rd-sm rounded-[6px] bg-[#222227] pl-10px pr-10px">
          {{ rgbHex }}
        </p>
      </div>
      <div class="flex-raw flex gap-10px">
        <!-- <input type="radio" name="option" :checked="isRGB" @onchange="isRgbSwitch" /> -->
        <NCheckbox v-model:checked="isRGB" @update-checked="isRgbSwitch">{{ $t('light.allColor') }}</NCheckbox>
        <!-- <p class="... text-lg text-[#999999]">{{ $t('light.allColor') }}</p> -->
      </div>
    </div>
    <div class="flex-raw mb-30px mt-30px w-100% flex justify-center">
      <div class="position-relative h-200px w-200px">
        <canvas ref="colorCanvas" width="200px" height="200px" class="absolute" @click="selectColor"></canvas>

        <canvas
          ref="dotCanvas"
          width="200px"
          height="200px"
          class="absolute h-200px w-200px"
          @mousemove="handleMouseMove"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
        ></canvas>
      </div>
    </div>
    <div class="flex-raw w-100% flex justify-center gap-20px">
      <p class="justify-center text-lg text-[#fff]">R</p>
      <p class="h-36px w-42px flex items-center justify-center rounded-[6px] bg-[#222227] text-[#999999]">
        {{ R.toString(16).padStart(2, '0') }}
      </p>

      <p class="text-lg text-[#fff]">G</p>
      <p class="h-36px w-42px flex items-center justify-center rounded-[6px] bg-[#222227] text-[#999999]">
        {{ G.toString(16).padStart(2, '0') }}
      </p>

      <p class="text-lg text-[#fff]">B</p>
      <p class="h-36px w-42px flex items-center justify-center rounded-[6px] bg-[#222227] text-[#999999]">
        {{ B.toString(16).padStart(2, '0') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 300px;
  height: 300px;
  background-color: lightgray;
}

.box1 {
  width: 100px;
  height: 100px;
  background-color: lightblue;
}

.box2 {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 100px;
  height: 100px;
  background-color: lightcoral;
}
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
