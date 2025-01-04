<script setup lang="ts">
import type { BaseKeyView } from '@/api/modules/combo';

defineProps<{
  detail?: BaseKeyView;
  iconClass?: string;
  textClass?: string;
}>();
</script>

<template>
  <div v-if="detail?.type" class="no-wrap flex items-center justify-center text-center text-0.6rem">
    <i v-if="detail?.type === 'icon'" class="iconfont text-10px" :class="`icon-${detail?.icon} ${iconClass}`"></i>
    <span v-else :class="textClass">{{ detail!.label }}</span>
  </div>
</template>
