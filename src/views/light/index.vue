<script setup lang="ts">
import VerticalLayout from '@/views/light/components/color-vessel.vue';

// const allSelct = () => {
//   console.log('2.4g接收器配对按钮被点击');
//   // 这里可以加入接收器配对的逻辑
// };

// const invertSelect = () => {
//   console.log('invertSelect');
//   // 这里可以加入恢复出厂设置的逻辑
// };
// const clean = () => {
//   console.log('clean');
//   // 这里可以加入恢复出厂设置的逻辑
// };
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <div class="h-420/1000 w-full border-b-2px border-[#232327] bg-green-400"></div>

    <!--
 <div class="flex-raw flex- place-content-center gap-50px border-b-1px border-[#232327] rounded-md pb-20px pt-20px">
      <button class="hollow-btn" @click="allSelct">全选</button>
      <button class="hollow-btn" @click="invertSelect">反选</button>
      <button class="hollow-btn" @click="clean">清空</button>
    </div>
-->
    <VerticalLayout class="mt-20px h-580/1000 w-full bg-red-400" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 让应用占满整个视口高度 */
}

.vertical-layout {
  margin-top: auto; /* 将 VerticalLayout 移到父容器的底部 */
}
.hollow-btn {
  background-color: transparent;
  color: #3c8df4;
  border: 1px solid #3c8df4;
  border-radius: 6px;
  width: 120px;
  height: 40px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.hollow-btn:hover {
  background-color: #3c8df4; /* 悬停时的背景颜色 */
  color: white; /* 悬停时文字颜色 */
}
</style>
