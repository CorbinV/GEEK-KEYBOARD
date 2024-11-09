<script setup lang="ts">
import { onMounted, ref, toRefs } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
interface KeyboardKeyProps {
  keyId: string;
  selected?: boolean;
}
const props = defineProps<KeyboardKeyProps>();
const keyInfo = ref();
const keyStyle = ref({});
function useLayout(kbCfg) {
  keyInfo.value = kbCfg.value.data?.[props.keyId];
  const base = kbCfg.value.data?.base;
  if (keyInfo.value) {
    const {
      width,
      height,
      gap = 0,
      pos: [row]
    } = keyInfo.value;
    const offset = kbCfg.value.offsetList?.[row] || base.gap;
    const kw = width || base.width || 0;
    const kh = height || base.height || 0;

    keyStyle.value = {
      width: `${kw}px`,
      height: `${kh}px`,
      left: `${offset + base.sGap * gap}px`,
      top: `${kh * row + (row + 1) * 8}px`
    };
    kbCfg.value.offsetList[row] = offset + kw + base.gap;
  }
}
onMounted(async () => {
  const keyboardStore = useKeyboardStore();
  const { kbCfg } = toRefs(keyboardStore);
  useLayout(kbCfg);
});

const isLightColor = ['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT'].includes(props.keyId);
</script>

<template>
  <NTooltip trigger="hover" :disabled="true">
    <template #trigger>
      <div
        class="inline-box absolute h-50px w-50px border-0 rounded-md bg-[#222227] text-#999999 hover:cursor-pointer"
        :style="keyStyle"
        :class="[
          {
            'bg-[#2c2c3c]': isLightColor
          }
        ]"
        :data-id="keyId"
      >
        {{ keyId }}
      </div>
    </template>
    <!--TODO: KEY DESCRIPTION -->
  </NTooltip>
</template>
