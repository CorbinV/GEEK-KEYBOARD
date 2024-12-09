<script setup lang="ts">
import { ref } from 'vue';
import { KeyboardContainer } from '@/components/custom/keyboard/index';
import AdjustView from './components/adjust-view.vue';
import PropertyView from './components/property-view.vue';
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

const tabName = ref(0);
function handleKeyEventTabs(value: string | number) {
  tabName.value = Number(value);
}
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #default>
        <div class="h-full flex flex-col items-center">
          <div class="w-full flex-1">
            <PropertyView v-if="tabName === 0"></PropertyView>
            <AdjustView v-if="tabName === 1"></AdjustView>
          </div>
          <NTabs
            v-model:value="tabName"
            type="segment"
            animated
            style="width: 476px"
            @update:value="handleKeyEventTabs"
          >
            <NTab name="0" :tab="$t('repidTrigger.property')" />
            <NTab name="1" :tab="$t('repidTrigger.adjust')" />
          </NTabs>
        </div>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 让应用占满整个视口高度 */
}

VerticalLayout {
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
