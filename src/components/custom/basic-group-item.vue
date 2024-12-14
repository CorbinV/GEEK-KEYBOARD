<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(
  defineProps<{
    base: {
      code: number;
      name: string;
    };
    keyList?: {
      type: string;
      icon: string;
      label: string;
    }[];
    codePreffix?: string;
  }>(),
  {
    keyList: [] as any,
    codePreffix: ''
  }
);
const hasComboKey = computed(() => props.keyList.length);
</script>

<template>
  <div class="h-full min-w-120px flex-col inline-flex">
    <div
      class="flex flex-1 flex-row gap-x-2 rounded-t-md higth-light-bg px-5 py-4"
      :class="[
        {
          'justify-center items-center': !hasComboKey
        }
      ]"
    >
      <div class="flex items-center text-c-primary" :class="`${!hasComboKey ? 'text-center' : 'w-6rem'}`">
        {{ base.name }}
      </div>
      <div v-if="hasComboKey" class="flex flex-row gap-x-2">
        <div
          v-for="comboKey in keyList"
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
      <span class="text-c-primary">{{ codePreffix + (base.code + 1) }}</span>
      <div :key="`${base.code}-${codePreffix}-menu`">
        <slot name="menu"></slot>
      </div>
    </div>
  </div>
</template>
