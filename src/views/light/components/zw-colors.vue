<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watchEffect } from 'vue';
import { NInputNumber } from 'naive-ui';
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
const colorVal = reactive({
  r: props.colorR,
  g: props.colorG,
  b: props.colorB,
  rs: '',
  gs: '',
  bs: ''
});
const rgbHex = computed(() => {
  return `${colorVal.rs}${colorVal.gs}${colorVal.bs}`;
});
const mouseIsMove = ref(false);
const isRGB = ref(props.isRgb);
const colorCanvas = ref<HTMLCanvasElement | null>(null); // canvas 引用
const colorCanvasInfo = {
  width: 0,
  height: 0,
  radius: 0,
  gap: 0
}
const dotCanvas = ref<HTMLCanvasElement | null>(null); // canvas 引用

watchEffect(() => {
  colorVal.rs = colorVal.r.toString(16).padStart(2, '0').toUpperCase();
});
watchEffect(() => {
  colorVal.gs = colorVal.g.toString(16).padStart(2, '0').toUpperCase();
});
watchEffect(() => {
  colorVal.bs = colorVal.b.toString(16).padStart(2, '0').toUpperCase();
});
function initValue() { }
// 绘制色轮
const drawColorWheel = () => {
  if (!colorCanvas.value) return; // 检查 canvas 是否存在
  const ctx = colorCanvas.value.getContext('2d');
  if (!ctx) return; // 确保获取到绘图上下文
  colorCanvasInfo.width = colorCanvas.value.width - colorCanvasInfo.gap;
  colorCanvasInfo.height = colorCanvas.value.height - colorCanvasInfo.gap;
  const radius = colorCanvasInfo.width / 2;

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
  const rsl = rgbToHsl(colorVal.r, colorVal.g, colorVal.b);
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

const handleMouseUp = () => {
  if (!mouseIsMove.value) {
    return;
  }
  mouseIsMove.value = false;
  emit('stopSliding', colorVal.r, colorVal.g, colorVal.b); // 触发更新外部值
};
const handleMouseDown = (_event: MouseEvent) => {
  mouseIsMove.value = true;
};
const handleMouseMove = (event: MouseEvent) => {
  requestAnimationFrame(() => {
    if (!dotCanvas.value) return; // 确保 canvas 存在
    if (!mouseIsMove.value) return;
    const ctx = dotCanvas.value.getContext('2d');
    if (!ctx) return; // 确保获取到绘图上下文

    const rect = dotCanvas.value.getBoundingClientRect();

    const x = (event.clientX - rect.left) * (dotCanvas.value.width / rect.width) - dotCanvas.value.width / 2;
    const y = (event.clientY - rect.top) * (dotCanvas.value.height / rect.height) - dotCanvas.value.width / 2;

    const insideSize = 8; // 控制圆的半径
    const insideSizeRadius = insideSize / 2; // 控制圆的半径
    const dotX = x + dotCanvas.value.width / 2; // 控制圆的半径
    const dotY = y + dotCanvas.value.height / 2; // 控制圆的半径

    const dotYdistance = Math.sqrt(x * x + y * y) + insideSizeRadius;
    // 计算大圆的半径
    const maxRadius = dotCanvas.value.width / 2 - insideSizeRadius;
    if (maxRadius >= dotYdistance) {
      // 计算角度，调整为顺时针
      const angle = Math.atan2(y, x);

      const hue = (angle * 180) / Math.PI + 180; // 调整角度范围
      ctx.clearRect(0, 0, dotCanvas.value.width, dotCanvas.value.height);
      const rgb = hslToRgb(hue, 100, 50);

      colorVal.r = rgb[0]; // 转换为十六进制
      colorVal.g = rgb[1]; // 转换为十六进制
      colorVal.b = rgb[2]; // 转换为十六进制
      initValue();

      ctx.beginPath();
      ctx.arc(dotX, dotY, insideSize, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.stroke(); // 描边
      ctx.strokeStyle = 'white';
      ctx.lineWidth = insideSizeRadius;
      ctx.fillStyle = `hsl(${hue}, 100%, 45%)`;
      ctx.fill();
    }
  })
};

// 处理点击事件，选中颜色
const selectColor = (event: MouseEvent) => {
  if (!colorCanvas.value) return; // 确保 canvas 存在
  const rect = colorCanvas.value.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (colorCanvas.value.width / rect.width);
  const y = (event.clientY - rect.top) * (colorCanvas.value.height / rect.height);
  // const x = event.clientX - rect.left - colorCanvasInfo.width / 2;
  // const y = event.clientY - rect.top - colorCanvasInfo.height / 2;
  const distance = Math.sqrt(x * x + y * y);

  if (distance < colorCanvasInfo.width / 2) {
    // 计算角度，调整为顺时针
    const angle = Math.atan2(y, x);
    let hue = (angle * 180) / Math.PI + 180; // 调整角度范围
    if (hue < 0) {
      hue += 360; // 保证 hue 始终是正数
    }
    // selectedColor.value = `hsl(${hue}, 100%, 50%)`;
  }
};
const handleInput = (e: any, key: 'r' | 'g' | 'b') => {
  let { data } = e;
  data -= 0;
  // 去除空格并转换为大写
  if (!Number.isFinite(data)) {
    colorVal[key] = 0;
  } else if (data > 255) {
    colorVal[key] = 255;
  } else if (data < 0) {
    colorVal[key] = 0;
  } else {
    colorVal[key] = data;
  }
  // const formattedValue = `${value}`.trim().toUpperCase();

  // 验证是否为有效的16进制数
  // if (/^[0-9A-F]{0,2}$/.test(formattedValue)) {
  //   colorVal[key] = formattedValue;
  // } else {
  //   // 如果不合法，只保留合法的部分
  //   colorVal[key] = `${colorVal[key]}`.slice(0, 2);
  // }
  // console.log('2222222', colorVal[key]);
};
// 初始化色轮

onMounted(() => {
  drawColorWheel();
  document.addEventListener('mouseup', handleMouseUp)
});
onUnmounted(() => {
  document.removeEventListener('mouseup', handleMouseUp)
})
const isRgbSwitch = (value: boolean) => {
  emit('isRgbSwitch', value);
};

initValue();
</script>

<template>
  <div divclass="h-100% w-100% flex-col items-center">
    <div class="flex-raw w-100% flex items-center justify-between gap-10px">
      <div class="flex-raw flex items-center gap-10px">
        <p class="vertical-bar"></p>
        <p class="text-lg">{{ $t('light.color') }}</p>
        <p class="h-24px w-24px rounded-[4px]" :style="{ backgroundColor: '#' + rgbHex }"></p>
        <p class="h-36px place-content-center rd-sm rounded-[6px] bg-[#222227] pl-10px pr-10px">
          {{ rgbHex }}
        </p>
      </div>
      <div class="flex-raw flex gap-10px">
        <!-- <input type="radio" name="option" :checked="isRGB" @onchange="isRgbSwitch" /> -->
        <NCheckbox v-model:checked="isRGB" @update-checked="isRgbSwitch">{{ $t('light.allColor') }}</NCheckbox>
      </div>
    </div>
    <div class="flex-raw mb-30px mt-30px w-100% flex justify-center">
      <div class="position-relative h-200px w-200px">
        <canvas ref="colorCanvas" width="200px" height="200px" class="absolute" @click="selectColor"></canvas>
        <canvas ref="dotCanvas" width="200px" height="200px" class="absolute z-40 h-200px w-200px"
          @mousemove="handleMouseMove" @mousedown="handleMouseDown" @mouseup="handleMouseUp"></canvas>
      </div>
    </div>
    <div class="flex flex-row items-center justify-center gap-20px">
      <p class="justify-center text-lg text-[#fff]">R</p>
      <p class="h-36px w-44px flex items-center justify-center rounded-[6px] bg-[#222227] text-[#999999]">
        <NInputNumber v-model:value="colorVal.r" :show-button="false" maxlength="3" max="255" min="0" placeholder=""
          @update-value="handleInput($event, 'r')"></NInputNumber>
      </p>

      <p class="text-lg text-[#fff]">G</p>
      <p class="h-36px w-44px flex items-center justify-center rounded-[6px] bg-[#222227] text-[#999999]">
        <NInputNumber v-model:value="colorVal.g" :show-button="false" maxlength="3" max="255" min="0" placeholder=""
          @update-value="handleInput($event, 'g')"></NInputNumber>
      </p>

      <p class="text-lg text-[#fff]">B</p>
      <p class="h-36px w-44px flex items-center justify-center rounded-[6px] bg-[#222227] text-[#999999] !text-base">
        <NInputNumber v-model:value="colorVal.b" :show-button="false" maxlength="3" max="255" min="0" placeholder=""
          @update-value="handleInput($event, 'b')"></NInputNumber>
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
  background-color: #3c8df4;
  /* 按钮文字颜色 */
}

.selected-color {
  margin-top: 10px;
  width: 50px;
  height: 50px;
  border: 1px solid #ccc;
  border-radius: 50%;
}
</style>
