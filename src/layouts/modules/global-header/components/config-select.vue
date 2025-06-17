<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { $t } from '@/locales';
import {  type SelectProps } from 'naive-ui'

const keyboardStore = useKeyboardStore();
const keyLayerInfo = toRef(keyboardStore, 'keyLayerInfo');

type SelectPropsThemeOverrides = NonNullable<SelectProps['themeOverrides']>;
const selectTheme: SelectPropsThemeOverrides = {

}
const modeOps = computed(() => {
  const cnt = keyLayerInfo.value.layerCount;
  return Array.from({ length: cnt }).map((_, idx) => {
    let label
    if (!idx) {
      label = `${$t('businessCommon.competitionMode')}`
    } else {
      label = `${$t('businessCommon.casualMode')} ${idx}`
    }
    return {
      label,
      value: idx
    };
  });
});
const iptType = ['PC', 'PS', 'Switch']

const TypeOps = computed(() => {
  const cnt = keyLayerInfo.value.configCount;
  return Array.from({ length: cnt }).map((_, idx) => {

    return {
      label: `${iptType[idx]}${$t('common.mode')}`,
      value: idx
    };
  });
});
// const modeInfo = computed(() => {
//   return {
//     icon: keyLayerInfo.value.layerIndex ? 'hp-casual-mode' : 'hp-competition-mode',
//     label: keyLayerInfo.value.layerIndex ? $t('businessCommon.casualMode') : $t('businessCommon.competitionMode')
//   }
// })
</script>

<template>
  <div class="flex flex-row w-80 items-center gap-x-4">
    <NSelect class="x-select" v-model:value="keyLayerInfo.layerIndex"
    to="#popover-portal" :options="modeOps" />
    <NSelect class="x-select" v-model:value="keyLayerInfo.configIndex"
      to="#popover-portal" :options="TypeOps" />
  </div>
</template>
<style lang="scss" scoped>
.x-select {

  & :deep(.n-base-selection) {
    border-radius: 2rem !important;
    background: black !important;
    color: white !important;
    transition: all 0.3s;
  }

  &:deep(.n-base-selection:hover) {
    background: #111 !important;
  }

  & :deep(.n-base-select-menu) {
    background: black;
    color: white;
    border-radius: 1rem;
    margin-top: 0.5rem;
  }

  & :deep(.n-base-select-option) {
    color: #eee;
  }

  & :deep(.n-base-select-option--hover) {
    background: #333 !important;
  }

  & :deep(.n-base-clear) {
    color: #ccc !important;
  }

  & :deep(.n-base-suffix) {
    color: #aaa;
  }
}
</style>
