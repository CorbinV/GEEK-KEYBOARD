<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'GlobalLogo'
});

interface Props {
  /** Whether to show the title */
  showTitle?: boolean;
}

withDefaults(defineProps<Props>(), {
  showTitle: true
});
</script>

<template>
  <RouterLink to="/"  class="w-full flex justify-center nowrap-hidden">
      <SystemLogo class="w-4/5 h-4/5 text-primary" />
      <h2 v-show="showTitle" class="font- bold pl-8px text-16px text-primary transition duration-300 ease-in-out">
        {{ $t('system.title') }}
      </h2>
  </RouterLink>
</template>

<style scoped></style>
