<script setup lang="ts">
import { onUnmounted, toRef } from 'vue';
import { KeyboardContainer } from '@/components/custom/keyboard/index';
import { useKeyboardStore } from '@/store/modules/keyboard';
import Oks from './modules/oks.vue';
import Socd from './modules/socd.vue';
import Rs from './modules/rs.vue';
const keyboardStore = useKeyboardStore();
const allowMutipleSelect = toRef(keyboardStore, 'allowMutipleSelect');
allowMutipleSelect.value = false;
onUnmounted(() => keyboardStore.resetCurrentSuperKeyType());
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #keyboardBottom></template>
      <template #default="{ handleKeyEmit }">
        <!-- <div>点击测试按键</div> -->

        <NTabs
          default-value="oks"
          size="large"
          justify-content="space-evenly"
          placement="bottom"
          class="h-full"
          pane-class="h-full"
        >
          <NTabPane name="oks" tab="OKS单键急停">
            <Oks @key-clicked="handleKeyEmit" />
          </NTabPane>
          <NTabPane name="socd" tab="SOCD">
            <Socd @key-clicked="handleKeyEmit" />
          </NTabPane>
          <NTabPane name="rs" tab="RS">
            <Rs @key-clicked="handleKeyEmit" />
          </NTabPane>
        </NTabs>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
