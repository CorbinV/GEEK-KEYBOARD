<script setup lang="ts">
import type { BaseKeyView } from '@/api/modules/combo';
defineProps<{
  hasValue: boolean;
  base?: {
    code: number;
    type: number;
  };
  detail?: BaseKeyView;
}>();
</script>

<template>
  <div
    :key="hasValue ? `${base!.code}-${detail!.icon}-${detail!.label}` : `${Math.random()}`"
    class="box-border h-50px w-50px inline-flex items-center justify-center break-words border border-1 border-#3c3933 rounded-md base-light-bg text-c-primary"
  >
    <template v-if="hasValue">
      <template v-if="detail!.type === 'mix'">
        <span class="inline-flex flex-row items-center justify-center">
          <i class="iconfont" :class="`icon-${detail!.icon}`"></i>
          {{ detail!.label }}
        </span>
      </template>
      <template v-else-if="detail?.type === 'icon'">
        <i class="iconfont" :class="`icon-${detail!.icon}`"></i>
      </template>
      <template v-else>
        <span class="break-words text-center">{{ detail!.label }}</span>
      </template>
    </template>
  </div>
</template>
