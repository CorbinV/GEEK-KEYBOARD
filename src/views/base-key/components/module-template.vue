<script setup lang="ts">
import { toRefs } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import type { KeyTypeEnum } from '@/enum/keyType';
import FncCard from '../components/fnc-card.vue';
import { fncDescMap } from '../config';
const props = defineProps<{
  type: KeyTypeEnum;
}>();
const keyboardStore = useKeyboardStore();
const { kbCfg } = toRefs(keyboardStore);
const emit = defineEmits(['key-clicked']);
const keyInfoMap = kbCfg.value.keyMap[props.type].code;
const descList = fncDescMap[props.type as keyof typeof fncDescMap];
const list = Object.values(keyInfoMap).map((item: any, code) => {
  return {
    code,
    icon: item.icon,
    type: item.type,
    label: item.label,
    description: descList[code]
  };
});
function handleItemClick(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-code]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const code = Number(targetElement.dataset.code);
    if (Number.isNaN(code)) return;
    emit('key-clicked', {
      code,
      type: props.type
    });
  }
}
</script>

<template>
  <div class="mid-layer-bg flex flex-row flex-wrap gap-x-8 gap-y-12 px-8 py-12" @click="handleItemClick">
    <FncCard
      v-for="item in list"
      :key="`${type}-${item.code}`"
      :code="item.code"
      :icon="item.icon"
      :type="item.type"
      :label="item.label"
      :desc="item.description"
      :description="item.description"
    />
  </div>
</template>
