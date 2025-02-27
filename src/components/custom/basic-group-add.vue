<script setup lang="ts">
defineProps<{
  icon: string;
  desc: string;
}>();
</script>

<template>
  <div
    class="h-full min-w-120px inline-flex items-center justify-center border border-#3C8DF4 rounded-md border-dashed py-6 text-#3C8DF4 hover:cursor-pointer"
  >
    <div class="flex flex-col justify-center gap-y-1.5">
      <i class="iconfont text-center text-2xl font-bold" :class="`icon-${icon}`"></i>
      <p class="text-base">{{ desc }}</p>
    </div>
  </div>
</template>
