<script setup lang="ts">
import SvgIcon from '@/components/custom/svg-icon.vue';
const list1 = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'B', 'X', 'Y', 'NULL'];
const list2 = ['RB', 'LB', 'RT', 'LT', 'R3', 'L3', 'ST', 'SEL'];
const emit = defineEmits<{
  (event: 'listItemClick', btnName: string): void;
}>();
function handleBtnClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-name1]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const btnName = targetElement.dataset.name1;
    emit('listItemClick', btnName!);
  }
}
</script>

<template>
  <div class="rounded-lg bg-#171619 px-11 py-7" @click="handleBtnClick">
    <div class="mb-4 flex flex-row justify-between">
      <span v-for="key1 in list1" :key="key1" :data-name1="key1">
        <SvgIcon local-icon="hp-btn-BG" :local-icons="[`hp-btn-${key1}`]" class="cursor-pointer text-9xl"></SvgIcon>
      </span>
    </div>
    <div class="mx-6 flex flex-row justify-around">
      <span v-for="key2 in list2" :key="key2" :data-name1="key2">
        <SvgIcon local-icon="hp-btn-BG" :local-icons="[`hp-btn-${key2}`]" class="cursor-pointer text-9xl"></SvgIcon>
      </span>
    </div>
  </div>
</template>
