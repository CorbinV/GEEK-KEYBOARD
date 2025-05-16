<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';

interface DragConstraints {
  minY: number;
  maxY: number;
}
// Props 定义
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
let afterDraged = false;
const startDrag = (e: MouseEvent) => {
  if (props.disabled || !props.isAboveMask || isDragging.value) return;
  startY.value = e.clientY;
  startPosition.value = position.value;
  isDragging.value = true;
  // e.currentTarget.style.zIndex=20
  document.body.style.cursor = 'grabbing !important';
};
const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value || !props.isAboveMask) return;
  const deltaY = e.clientY - startY.value;
  if (deltaY === 0) {
    // exit: click event
    return
  }
  afterDraged = true;
  let newPosition = startPosition.value + deltaY;
  newPosition = Math.max(props.dragConstraints.minY, Math.min(newPosition, props.dragConstraints.maxY));

  position.value = newPosition < 0 ? 0 : newPosition;

  emit('position-change', props.index, position.value);

  const newHeight = props.initialHeight + Math.abs(position.value);
  emit('update:height', newHeight);
};

const stopDrag = () => {
  if (isDragging.value) {
    isDragging.value = false;
    // document.removeEventListener('mousemove', handleDrag);
    // document.removeEventListener('mouseup', stopDrag);
    // 发出停止拖动事件，让父组件处理位置检查
    emit('drag-end', props.index, position.value);
    return;
  }

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
function handleClick() {
  if (isDragging.value || !props.isAboveMask) {
    return
  }
  if (!afterDraged) {
    emit('update:isAboveMask', false);
    emit('update:height', props.initialHeight);
    emit('position-change', props.index, 0);
    nextTick(() => {
      position.value = 0;
      startPosition.value = 0;
    });
  }
  afterDraged = false;
}
onMounted(() => {
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('mouseleave', stopDrag);
})
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('mouseleave', stopDrag);
})
defineExpose({
  updateConstraints,
  isDragging
});
</script>

<template>
  <svg :width="width" :height="height" class="capsule-container" :style="{
    // cursor: disabled ? 'default' : 'grab'
  }" @mousedown="startDrag" @click="handleClick">
    <path :d="generatePath" :fill="color" class="capsule" />
    <!-- <path :d="arcPath" :fill="'white'" class="capsule" /> -->
  </svg>
</template>

<style scoped>
.capsule-container {
  user-select: none;
  touch-action: none;
}
</style>
