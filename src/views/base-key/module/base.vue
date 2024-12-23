<script setup lang="ts">
import { StandardKeyboard } from '@/components/custom/keyboard/index';

import TopBanner from '../components/top-banner.vue';

defineEmits(['key-clicked']);
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <TopBanner></TopBanner>
    <div class="flex-1"></div>
    <StandardKeyboard :edit="false" @key-clicked="data => $emit('key-clicked', data)" />
    <div class="flex-1"></div>
  </div>
</template>
