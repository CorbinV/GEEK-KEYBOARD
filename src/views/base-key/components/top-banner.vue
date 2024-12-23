<script setup lang="ts">
import InputTest from '@/components/custom/input-test.vue';
</script>

<template>
  <div class="mb-2 flex flex-row items-center">
    <InputTest class="flex-1" />
    <slot name="right-extra" />
  </div>
</template>
