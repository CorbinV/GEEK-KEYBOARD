<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subTitle?: string;
    showBottomLine?: boolean;
  }>(),
  {
    showBottomLine: true
  })
</script>
<template>
  <div class="flex-raw flex items-center justify-between pb-10px"
  :class="{ 'border-b-1px border-[#232327]': showBottomLine }"
  >
    <div class="flex-raw flex items-center">
      <div class="vertical-bar rounded-md"></div>
      <p class=" text-18px">{{ title }}</p>
      <span v-if="subTitle" class="text-[14px] text-[#999999]">{{ subTitle }}</span>
    </div>
    <slot name="end"></slot>
  </div>
</template>
<style>
.vertical-bar {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  background-color: #3c8df4;
}
</style>
