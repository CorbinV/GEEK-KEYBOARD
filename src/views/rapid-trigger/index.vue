<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRef } from 'vue';
import { KeyboardContainer } from '@/components/custom/keyboard/index';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { useCommonStore } from '@/store/modules/common';
import AdjustView from './components/adjust-view.vue';
import PropertyView from './components/property-view.vue';
import ButtonGroup from './components/button-group.vue';
const tabNameEnum = {
  property: 0,
  adjust: 1
};
const tabName = ref(0);
function handleKeyEventTabs(value: string | number) {
  tabName.value = Number(value);
}
const keyboardStore = useKeyboardStore();
function useMutipleKeysControl() {
  const allowMutipleSelect = toRef(keyboardStore, 'allowMutipleSelect');
  allowMutipleSelect.value = true;
  onUnmounted(() => {
    allowMutipleSelect.value = false;
  });
}
useMutipleKeysControl();
const isPropertyView = computed(() => {
  return tabName.value === tabNameEnum.property;
});
onMounted(async () => {
  const commonStore = useCommonStore();
  nextTick(async () => {
    await commonStore.updateAllKeyTary();
    commonStore.updateTaryDataCache();
  })
});
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #keyboardBottom>
        <ButtonGroup />
      </template>
      <template #default>
        <div class="h-full flex flex-col items-center">
          <div class="w-full flex-1">
            <AdjustView v-show="tabName"></AdjustView>
            <PropertyView v-show="!tabName"></PropertyView>
          </div>
          <NTabs v-model:value="tabName" type="segment" class="custom-segment-tabs" animated style="width: 476px"
            @update:value="handleKeyEventTabs">
            <NTab :name="tabNameEnum.property">
              <span :class="`${isPropertyView ? 'text-#3C8DF4' : 'text-#999999'} text-xl`">{{ $t('repidTrigger.property') }}</span>
            </NTab>
            <NTab :name="tabNameEnum.adjust">
              <span :class="`${!isPropertyView ? 'text-#3C8DF4' : 'text-#999999'} text-xl`">{{ $t('repidTrigger.adjust') }}</span>
            </NTab>
          </NTabs>
        </div>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped>
.custom-segment-tabs {
  :deep(.n-tabs-tab) {
    margin: 3px 12px
  }
}
</style>
