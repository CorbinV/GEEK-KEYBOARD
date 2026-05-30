<script setup lang="ts">
import { NInputNumber } from 'naive-ui';

const MIN_DELAY_MS = 1;
const MAX_DELAY_MS = 2000;

const modelValue = defineModel<number>({ required: true });
</script>

<template>
  <div class="flex items-center justify-center">
    <NInputNumber v-model:value="modelValue" style="width: 60px" type="text" size="large"
      :min="MIN_DELAY_MS" :max="MAX_DELAY_MS" :step="1" :precision="0" :show-button="false"
      :autofocus="false" placeholder="" />
    <span class="ml-3 text-4 text-[#999999]">ms</span>
  </div>
</template>