<script setup lang="ts">
import KeyboardContainer from '@/components/custom/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import Macros from './components/macros.vue';
</script>

<template>
  <!--
 <div class="flex flex-col">
    <div class="basis-1/2">
      <KeyboardContainer></KeyboardContainer>
    </div>
    <div class="basis-1/2 rounded bg-[#171619]">
      <Macros></Macros>
    </div>
  </div>
-->
  <div>
    <KeyboardContainer>
      <template #default="{ handleKeyEmit }">
        <Macros :type="KeyTypeEnum.Marco" @key-clicked="handleKeyEmit"></Macros>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
