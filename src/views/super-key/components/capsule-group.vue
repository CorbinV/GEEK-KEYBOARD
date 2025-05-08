<script lang="ts" setup>
import { onMounted, provide, ref, toRef } from 'vue';
import type { CapsuleItem } from '@/store/modules/dks';
import { useDksStore } from '@/store/modules/dks';
import DraggableCapsule from './draggable-capsule.vue';

interface DragConstraints {
  minY: number;
  maxY: number;
}
const props = withDefaults(
  defineProps<{
    groupIdx: number;
    initialHeight?: number;
    width?: number;
    gap?: number;
    disable?: boolean;
  }>(),
  {
    initialHeight: 200,
    width: 50,
    gap: 20,
    disable: false
  }
);
const dksStore = useDksStore();
const dksGroupList = toRef(dksStore, 'dksGroupList');
const items = dksGroupList.value[props.groupIdx] as CapsuleItem[];
items.forEach(item => (item.currentHeight = props.initialHeight));

const groupRef = ref<HTMLElement | null>(null);
const capsuleRefs = ref<any[]>([]);

provide('groupContext', {
  items,
  initialHeight: props.initialHeight,
  gap: props.gap
});

const calculateMaxDragDistance = (index: number): number => {
  for (let i = index + 1; i < items.length; i++) {
    if (items[i].isAboveMask) {
      return (i - index) * (props.initialHeight + props.gap) - props.initialHeight;
    }
  }
  return (items.length - index - 1) * (props.initialHeight + props.gap);
};

const getDragConstraints = (index: number): DragConstraints => {
  return {
    minY: -props.initialHeight,
    maxY: calculateMaxDragDistance(index)
  };
};

const updateCapsulePosition = (index: number, position: number) => {
  items[index].position = position;
  // 更新所有胶囊的约束
  capsuleRefs.value.forEach((dragRef: typeof DraggableCapsule, idx) => {
    if (dragRef && dragRef.updateConstraints) {
      dragRef.updateConstraints(getDragConstraints(idx));
    }
  });
};
const handleMaskClick = (index: number) => {
  if (props.disable) {
    window.$message?.info('请先绑定当前配置的按键');
    return;
  }
  items[index].isAboveMask = true;

  if (capsuleRefs.value[index]?.updateConstraints) {
    capsuleRefs.value[index].updateConstraints(getDragConstraints(index));
  }
};
onMounted(() => {
  capsuleRefs.value.forEach((dragRef: typeof DraggableCapsule, index) => {
    if (dragRef && dragRef.updateConstraints) {
      dragRef.updateConstraints(getDragConstraints(index));
    }
  });
});

function checkOverlap(dragIndex: number, currentPos: number): [boolean, number, number] {
  let res: [boolean, number, number] = [false, -1, items.length - 1];

  if (dragIndex >= items.length - 1) {
    res = [false, -1, dragIndex];
    return res;
  }
  const currentItemBottom = currentPos + (props.initialHeight + props.gap) * dragIndex;
  for (let i = dragIndex + 1; i < items.length; i++) {
    const top = i * (props.initialHeight + props.gap);
    const bottom = top + props.initialHeight;
    const mid = top + props.initialHeight / 2;
    if (currentItemBottom < mid) {
      const idx = i - 1 === 0 ? 1 : i;
      res = [false, -1, idx];
      break;
    }
    if (currentItemBottom < bottom && currentItemBottom >= mid) {
      res = [true, i, -1];
      break;
    }
  }
  return res;
}

const handleDragEnd = (index: number, position: number) => {
  if (items[index + 1]?.isAboveMask) {
    return;
  }
  if (!position) {
    items[index].to = index;
    return;
  }
  const [isOverlap, overlapIndex, passIndex] = checkOverlap(index, position);
  let targetPosition = 0;
  if (!isOverlap) {
    targetPosition = (passIndex - index) * (props.initialHeight + props.gap);
    items[index].to = passIndex;
  } else {
    targetPosition = (overlapIndex - index + 1) * (props.initialHeight + props.gap);
    items[index].to = overlapIndex + 1;
  }
  const item = items[index];
  item.currentHeight = targetPosition - props.gap * 0.2;
  updateCapsulePosition(index, targetPosition);
};
</script>

<template>
  <div ref="groupRef" class="flex flex-col gap-y-8 px-4 ">
    <div v-for="(item, index) in items" :key="index" class="w-full relative" :style="{
      height: initialHeight + 'px',
      width: width + 'px',
      // marginBottom: items.length === index + 1 ? '16px' : gap + 'px'
      zIndex: item.isAboveMask ? 9 : 0
    }">
      <!-- 胶囊根据状态显示/隐藏 -->
      <!-- {{ item.isAboveMask }} -->
      <!-- v-show="item.isAboveMask" -->
      <DraggableCapsule v-show="item.isAboveMask" :ref="el => (capsuleRefs[index] = el)"
        v-model:height="item.currentHeight" v-model:is-above-mask="item.isAboveMask" :initial-height="initialHeight"
        :width="width" :color="item.color" :disabled="index === items.length - 1" :index="index"
        :drag-constraints="getDragConstraints(index)" :style="{

        }" @position-change="updateCapsulePosition" @drag-end="handleDragEnd" />
      <!-- 蒙版始终显示在固定位置 -->
      <div v-if="!item.isAboveMask" class="mask absolute flex justify-center items-center " :style="{
        width: width + 'px',
        height: initialHeight + 'px'
      }" @click="handleMaskClick(index)">
        <i class="iconfont icon-add text-2xl leading-0  rounded-full"
          :class="capsuleRefs[index]?.isDragging ? `hover:cursor-grab` : `hover:cursor-pointer`"></i>
      </div>

    </div>
  </div>
</template>

<style scoped>
.mask {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 25px;
  cursor: pointer;
}
</style>
