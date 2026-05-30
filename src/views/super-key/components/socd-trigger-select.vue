<script setup lang="ts">
import { NSelect } from 'naive-ui';
import { SOCDTriggerOps } from '../config';

const modelValue = defineModel<number>({ required: true });
</script>

<template>
  <div class="flex items-center">
    <span class="text-4 text-[#999999]">{{ $t('supperKey.priorityExe') }}</span>
    <NSelect v-model:value="modelValue" to="#popover-portal" class="ml-3 w-45" size="large" :options="SOCDTriggerOps" />
  </div>
</template>