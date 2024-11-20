<script setup lang="ts">
defineProps<{
  base: {
    code: number;
    name: string;
  };
  comboKeyList: {
    type: string;
    icon: string;
    label: string;
  }[];
}>();
</script>

<template>
  <div class="w-360px flex-col inline-flex">
    <div class="flex flex-row gap-x-2 rounded-t-md higth-light-bg px-5 py-4">
      <div class="w-6rem flex items-center text-c-primary">{{ base.name }}</div>
      <div class="flex flex-row gap-x-2">
        <div
          v-for="comboKey in comboKeyList"
          :key="`${base.code}-${comboKey.icon}-${comboKey.label}`"
          class="box-border h-50px w-50px inline-flex items-center justify-center break-words border border-1 border-#3c3933 rounded-md base-light-bg text-c-primary"
        >
          <template v-if="comboKey.type === 'mix'">
            <span class="inline-flex flex-row items-center justify-center">
              <i class="iconfont" :class="`icon-${comboKey.icon}`"></i>
              {{ comboKey.label }}
            </span>
          </template>
          <template v-else-if="comboKey.type === 'icon'">
            <i class="iconfont" :class="`icon-${comboKey.icon}`"></i>
          </template>
          <template v-else>
            <span class="break-words text-center">{{ comboKey.label }}</span>
          </template>
        </div>
      </div>
    </div>
    <div class="flex flex-row items-center justify-between rounded-b-md base-light-bg px-5 py-1">
      <span class="text-c-primary">{{ base.code }}</span>
      <div>
        <slot name="menu"></slot>
      </div>
    </div>
  </div>
</template>
