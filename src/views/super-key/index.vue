<script setup lang="ts">
import { onUnmounted, toRef } from 'vue';
import { KeyboardContainer } from '@/components/custom/keyboard/index';
import { useKeyboardStore } from '@/store/modules/keyboard';
import Oks from './modules/oks.vue';
import Socd from './modules/socd.vue';
import MT from './modules/mt.vue';
import TGL from './modules/tgl.vue';
import Rs from './modules/rs.vue';
const keyboardStore = useKeyboardStore();
const allowMutipleSelect = toRef(keyboardStore, 'allowMutipleSelect');
allowMutipleSelect.value = false;
onUnmounted(() => keyboardStore.resetCurrentSuperKeyType());
const paneList = [
  {
    name: 'oks',
    label: 'OKS单键急停',
    component: Oks
  },
  {
    name: 'socd',
    label: 'SOCD',
    component: Socd
  },
  {
    name: 'mt',
    label: 'MT单击/按住',
    component: MT
  },
  {
    name: 'tgl',
    label: 'TGL切换开关',
    component: TGL
  },
  {
    name: 'rs',
    label: 'RS',
    component: Rs
  }
];
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #keyboardBottom></template>
      <template #default="{ handleKeyEmit }">
        <!-- <div>点击测试按键</div> -->

        <NTabs size="large" justify-content="space-evenly" placement="bottom" class="h-full" pane-class="h-full">
          <NTabPane v-for="pane in paneList" :key="pane.name" :name="pane.name" :tab="pane.label">
            <component :is="pane.component" @key-clicked="handleKeyEmit" />
          </NTabPane>
        </NTabs>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
