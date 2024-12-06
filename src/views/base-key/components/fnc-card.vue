<script setup lang="ts">
withDefaults(
  defineProps<{
    code: number;
    icon?: string;
    label?: string;
    type?: string;
    description?: string;
  }>(),
  {
    icon: 'placeholder',
    description: '-'
  }
);
</script>

<template>
  <div class="w-21 flex flex-col gap-y-6 hover:cursor-pointer" :data-code="code">
    <div
      class="h-20 w-full inline-flex items-center justify-center border-1 border-#3C3933 rounded-md higth-light-bg text-c-primary"
    >
      <p v-if="type === 'str'" class="text-center text-lg">
        {{ label || '-' }}
      </p>
      <i v-else class="iconfont text-3xl" :class="`icon-${icon}`"></i>
    </div>
    <p class="text-center text-c-second">{{ $t(description) }}</p>
  </div>
</template>
