<script setup lang="ts">
import VerticalLayout from '@/views/rapid-trigger/components/VerticalLayout.vue';
</script>

<template>
  <div class="flex flex-col">
    <div class="content flex-1">
      <h1>这是上面内容区域</h1>
      <p>这里可以放一些内容</p>
    </div>

    <!-- 使用 VerticalLayout 组件并放置在最下方 -->
    <VerticalLayout class="flex-1" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 让应用占满整个视口高度 */
}

.content {
  flex: 1; /* 让上半部分内容占据剩余空间 */
  padding: 20px;
}

VerticalLayout {
  margin-top: auto; /* 将 VerticalLayout 移到父容器的底部 */
}
</style>
