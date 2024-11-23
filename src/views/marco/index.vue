<script setup lang="ts">
import KeyboardContainer from '@/components/custom/keyboard';
import Macros from './components/macros.vue';
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #default="{ handleKeyEmit }">
        <Macros :edit="true" @key-clicked="handleKeyEmit" />
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
