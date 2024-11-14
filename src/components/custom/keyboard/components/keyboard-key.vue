<script setup lang="ts">
import { onMounted, reactive, ref, toRefs, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import type { KeyCfg } from '@/api/modules/keyboard';

interface KeyboardKeyProps {
  keyId: string;
  selected?: boolean;
  keyDetail?: any;
  idx: number;
}
const props = defineProps<KeyboardKeyProps>();
const keyInfo = ref();
const keyStyle = ref({});
function useLayout(kbCfg: any) {
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
      top: `${kh * row + (row + 1) * base.gap}px`
    };
    kbCfg.value.offsetList[row] = offset + kw + base.gap;
  }
}
const KeyView = reactive({
  label: props.keyId,
  icon: '',
  type: 'str'
});
onMounted(async () => {
  const keyboardStore = useKeyboardStore();
  const { kbCfg } = toRefs(keyboardStore);
  useLayout(kbCfg);
  function updateKeyCfg(data: KeyCfg) {
    const { code, type } = data;
    const info = kbCfg.value.keyMap[type]?.code?.[code];
    if (info) {
      KeyView.label = info.label;
      KeyView.icon = info.icon;
      KeyView.type = info.type;
    }
  }
  watchEffect(() => {
    if (props.keyDetail) {
      updateKeyCfg(props.keyDetail);
    }
  });
});

const isLightColor = ['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT'].includes(props.keyId);
</script>

<template>
  <NTooltip trigger="hover" :disabled="true">
    <template #trigger>
      <div
        class="inline-box base-light-bg text-c-primary absolute box-border h-50px w-50px border border-1 rounded-md hover:cursor-pointer"
        :style="keyStyle"
        :class="[
          isLightColor ? 'border-#2c2c3c' : 'border-#222227',
          {
            'bg-[#2c2c3c]': isLightColor,
            '!border-[#3C8DF4]': selected
          }
        ]"
        :data-id="keyId"
        :data-idx="idx"
      >
        <div class="h-full w-full flex flex-col items-center justify-center break-words">
          <template v-if="KeyView.type === 'mix'">
            <span class="inline-flex flex-row items-center justify-center">
              <i class="iconfont" :class="`icon-${KeyView.icon}`"></i>
              {{ KeyView.label }}
            </span>
          </template>
          <template v-else-if="KeyView.type === 'icon'">
            <i class="iconfont" :class="`icon-${KeyView.icon}`"></i>
          </template>
          <template v-else>
            <span class="break-words text-center">{{ KeyView.label }}</span>
          </template>
        </div>
      </div>
    </template>
    <!--feat: KEY DESCRIPTION -->
  </NTooltip>
</template>
