<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';

interface DragConstraints {
  minY: number;
  maxY: number;
}
const props = withDefaults(
  defineProps<{
    initialHeight: number;
    width: number;
    color: string;
    disabled?: boolean;
    index: number;
    height?: number;
    dragConstraints?: DragConstraints;
    isAboveMask?: boolean;
  }>(),
  {
    disabled: false,
    height: 200,
    dragConstraints: () => ({ minY: 0, maxY: 0 }),
    isAboveMask: false
  }
);

const emit = defineEmits<{
  'update:height': [value: number];
  'update:isAboveMask': [value: boolean];
  'position-change': [index: number, position: number];
  'drag-end': [index: number, position: number];
}>();

const position = ref(0);
const isDragging = ref(false);
const startY = ref(0);
const startPosition = ref(0);
let hasDraged = false;
const handleDrag = (e: MouseEvent) => {
  hasDraged = true;
  if (!isDragging.value) return;

  const deltaY = e.clientY - startY.value;
  let newPosition = startPosition.value + deltaY;
  newPosition = Math.max(props.dragConstraints.minY, Math.min(newPosition, props.dragConstraints.maxY));

  position.value = newPosition < 0 ? 0 : newPosition;

  emit('position-change', props.index, position.value);

  const newHeight = props.initialHeight + Math.abs(position.value);
  emit('update:height', newHeight);
};

const stopDrag = () => {
  isDragging.value = false;

  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  emit('drag-end', props.index, position.value);
};

const updateConstraints = (newConstraints: DragConstraints) => {
  position.value = Math.max(newConstraints.minY, Math.min(position.value, newConstraints.maxY));
};

const generatePath = computed(() => {
  const radius = props.width / 2;
  const height = props.height;
  return `
    M ${props.width},${radius}
    L ${props.width},${height - radius}
    A ${radius},${radius} 0 0 1 0,${height - radius}
    L 0,${radius}
    A ${radius},${radius} 0 0 1 ${props.width},${radius}
    Z
  `;
});
const startDrag = (e: MouseEvent) => {
  if (props.disabled) return;

  startY.value = e.clientY;
  startPosition.value = position.value;
  nextTick(() => {
    isDragging.value = true;
  });
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};
function handleClick() {
  if (!hasDraged) {
    emit('update:isAboveMask', false);
    position.value = 0;
    startPosition.value = 0;
    emit('update:height', props.initialHeight);
    emit('position-change', props.index, 0);
  }
  hasDraged = false;
}
defineExpose({
  updateConstraints
});
</script>

<template>
  <svg
    :width="width"
    :height="height"
    class="capsule-container absolute"
    :style="{
      cursor: disabled ? 'default' : 'grab'
    }"
    @mousedown="startDrag"
  >
    <path :d="generatePath" :fill="color" class="capsule" />
  </svg>
</template>

<style scoped>
.capsule-container {
  user-select: none;
  touch-action: none;
}
</style>
