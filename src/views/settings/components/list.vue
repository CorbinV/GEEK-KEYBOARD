<script setup lang="ts">
const props = defineProps<{
  list: {
    label: string;
    value: number;
  }[];
  selectedIdx: number;
}>()
const emit = defineEmits(['update:selectedIdx'])

const handleClick = (e: MouseEvent) => {
  const targetElement = (e.target as Element).closest('[data-idx]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const idx = Number(targetElement.dataset.idx);
    emit('update:selectedIdx', idx);
  }
}
</script>

<template>
  <div class="flex flex-row gap-x-4 py-1 px-2 border rounded border-#232327 text-white" @click="handleClick">
    <div v-for="item in props.list" :key="item.label" :data-idx="item.value" class="w-20 flex items-center justify-center p-0.1 rounded cursor-pointer border-transparent border-1 hover:border-#3c8df4 hover:text-#3c8df4 duration-150"
    :class="[{
      'bg-#3c8df4 hover:text-white ': selectedIdx === item.value,
    }]"
    >
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>
