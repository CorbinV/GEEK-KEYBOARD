<script setup lang="ts">
import { StandardKeyboard } from '@/components/custom/keyboard/index';

import TopBanner from '../components/top-banner.vue';

defineEmits(['key-clicked']);
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <TopBanner></TopBanner>
    <StandardKeyboard :edit="false" @key-clicked="data => $emit('key-clicked', data)" />
  </div>
</template>
