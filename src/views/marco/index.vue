<script setup lang="ts">
import KeyboardContainer from '@/components/custom/keyboard';
import Macro from './components/Macro.vue';
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #default="{ handleKeyEmit }">
        <Macro :edit="true" @key-clicked="handleKeyEmit" />
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
