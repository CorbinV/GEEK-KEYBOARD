<script setup lang="ts">
import { onMounted, ref } from 'vue';
const size = ref<number>(300);
const value = ref<number>(145);
// const secondaryValue = ref<number>(1.99);
const maxValue = ref<number>(255);
// const circumference = ref<number>(2 * Math.PI * 40);
// const offset = ref<number>(circumference.value * (1 - value.value / maxValue.value));
const startColor = ref<string>('#ffffff');
const endColor = ref<string>('#4A90E2');
const canvas = ref<HTMLCanvasElement | null>(null); // canvas 引用

// 处理点击事件，选中颜色
const drawGauge = () => {
  if (!canvas.value) return; // 检查 canvas 是否存在
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return; // 确保获取到绘图上下文
  ctx.lineWidth = 25; // 前景圆环的宽度

  const centerX = size.value / 2;
  const centerY = size.value / 2;
  const radius = centerX - ctx.lineWidth;
  const startAngle = Math.PI; // 从左边开始
  const endAngle = 2 * Math.PI; // 到右边结束

  // 清空画布
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // 背景圆环
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
  ctx.strokeStyle = '#2e2e2e'; // 背景颜色

  ctx.stroke();

  // 前景圆环
  const progressAngle = startAngle + (endAngle - startAngle) * (value.value / maxValue.value);

  const gradient = ctx.createLinearGradient(0, 0, size.value, 0);
  gradient.addColorStop(0, startColor.value);
  gradient.addColorStop(1, endColor.value);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, progressAngle, false);
  ctx.strokeStyle = gradient; // 渐变颜色
  ctx.lineCap = 'round';
  ctx.stroke();

  // 数值文本
  ctx.font = '36px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`~ ${value.value}`, centerX, centerY - 10);

  // 次级单位文本
  // const secondaryValue = ((value.value / maxValue.value) * 2).toFixed(2);
  ctx.font = '14px Arial';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`${0}`, ctx.lineWidth, centerY);
  ctx.fillText(`${maxValue.value}`, size.value - ctx.lineWidth, centerY);
};

onMounted(() => {
  drawGauge();
});
</script>

<template>
  <div class="canvas-gauge">
    <canvas ref="canvas" :width="size" :height="size / 2"></canvas>
    <!-- 数值输入框 -->

    <!--
 <input v-model="value" type="range" :min="0" :max="maxValue" @input="drawGauge" />
    <p>当前值: {{ value }}</p>
-->
  </div>
</template>

<style scoped>
.canvas-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  color: white;
}
canvas {
  margin-bottom: 10px;
}
input[type='range'] {
  width: 80%;
}
</style>
