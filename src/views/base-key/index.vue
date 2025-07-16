<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import SOCD from './module/socd.vue';
import Control from './module/control.vue';
import BtnList from './module/btn-list.vue';
const btnName = ref('');
function injBtnItemClick(k: string) {
  btnName.value = k;
}

const keyboardStore = useKeyboardStore();
const { keyLayerInfo } = toRefs(keyboardStore);
const showSocd = computed(() => {
  return !(keyLayerInfo.value.layerIndex === 0);
});
</script>

<template>
  <div class="flex flex-col p-6 pt-17">
    <div class="grid grid-cols-5">
      <div class="col-span-1">
        <SOCD v-show="showSocd"></SOCD>
      </div>
      <div class="col-span-3">
        <Control :update-btn="btnName"></Control>
      </div>
      <div class="col-span-1 w-46 text-#999999">control</div>
    </div>
    <BtnList class="mx-auto mt-76 w-90%" @list-item-click="injBtnItemClick"></BtnList>
  </div>
</template>

<style scoped>
.custom-segment-tabs {
  :deep(.n-tabs-tab) {
    margin: 3px 12px;
  }
}
</style>
