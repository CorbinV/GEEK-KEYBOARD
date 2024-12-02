<script setup lang="ts">
import { inject, onMounted, reactive, ref, toRaw, toRefs, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import type { KeyCfg } from '@/api/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { tranformKeyTypeToChar, tranformKeyTypeToColor } from '@/hooks/common/transform';
import type { BaseKeyView } from '@/api/modules/combo';
import { useResttableRefFn } from '@/hooks/common/basicFnc';

interface KeyboardKeyProps {
  keyId: string;
  selected?: boolean;
  idx: number;
  disabled?: boolean;
  keyDetail?: any;
  kbLength?: number;
  mt?: BaseKeyView;
  dks?: boolean;
  sp?: KeyTypeEnum[];
}
const emit = defineEmits<{
  (e: 'lastKeyMounted', preload: null): void;
}>();
const props = defineProps<KeyboardKeyProps>();
const keyboardStore = useKeyboardStore();
const { kbCfg, currentSuperKeyType } = toRefs(keyboardStore);
const keyInfo = ref();
const keyStyle = ref({});
function useLayout(cfg: any) {
  keyInfo.value = cfg.value.layoutMap.get(props.keyId);
  const base = cfg.value.layoutMap.get('base');
  if (keyInfo.value) {
    const {
      width,
      height,
      gap = 0,
      pos: [row]
    } = keyInfo.value;
    const offset = cfg.value.offsetList?.[row] || base.gap;
    const kw = width || base.width || 0;
    const kh = height || base.height || 0;

    keyStyle.value = {
      width: `${kw}px`,
      height: `${kh}px`,
      left: `${offset + base.sGap * gap}px`,
      top: `${kh * row + (row + 1) * base.gap}px`
    };
    cfg.value.offsetList[row] = offset + kw + base.gap;
  }
}
const KeyView = reactive({
  label: props.keyId,
  icon: '',
  type: 'str'
});
function updateKeyView(data: any) {
  if (!data) {
    return;
  }
  KeyView.label = data.label;
  KeyView.icon = data.icon;
  KeyView.type = data.type;
}
onMounted(async () => {
  const injectSelectedDetail = inject('selectedDetail') as any;
  useLayout(kbCfg);
  function updateKeyCfg(data: KeyCfg) {
    if (!data) {
      return;
    }
    const { code, type } = data;
    const info = kbCfg.value.keyMap[type]?.code?.[code];
    updateKeyView(info);
  }
  function updateKeyViewBySelectedDetail(data: any) {
    if (!props.selected) {
      return;
    }
    if (props.keyId === data?.keyId) {
      updateKeyView(toRaw(data));
    }
  }
  watchEffect(() => {
    updateKeyViewBySelectedDetail(injectSelectedDetail.value);
  });
  watchEffect(() => {
    updateKeyCfg(props.keyDetail);
  });
  if (props.kbLength !== undefined && props.kbLength === props.idx + 1) {
    emit('lastKeyMounted', null);
  }
});
const [spConfig, resetSpConfig] = useResttableRefFn(() => ({
  label: '',
  color: 'transparent'
}));
function updateSpConfig(x: KeyboardKeyProps['sp']) {
  const needReset = [
    !x,
    currentSuperKeyType.value === KeyTypeEnum.None,
    !x?.includes(currentSuperKeyType.value as any)
  ].some(r => r);
  if (needReset) {
    resetSpConfig();
    return;
  }
  const label = tranformKeyTypeToChar(currentSuperKeyType.value as any);
  const color = tranformKeyTypeToColor(currentSuperKeyType.value as any);
  console.log('updateSpConfig', label, color);
  spConfig.value = {
    label,
    color
  };
}
watchEffect(() => {
  updateSpConfig(props.sp);
});
const isLightColor = ['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT'].includes(props.keyId);
</script>

<template>
  <NTooltip trigger="hover" :disabled="true">
    <template #trigger>
      <div
        class="inline-box absolute box-border h-50px w-50px border border-1 rounded-md base-light-bg text-c-primary hover:cursor-pointer"
        :style="keyStyle"
        :class="[
          isLightColor ? 'border-#2c2c3c' : 'border-#222227',
          {
            'bg-[#2c2c3c]': isLightColor,
            '!border-[#3C8DF4]': selected,
            '!text-[#3C8DF4]': selected
          }
        ]"
        :data-id="keyId"
        :data-idx="idx"
        :data-disabled="disabled"
      >
        <div
          class="relative h-full w-full flex flex-col items-center justify-center break-words"
          :class="[
            {
              'cursor-not-allowed': disabled
            }
          ]"
        >
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
          <!-- base super function -->
          <div
            v-if="mt?.type"
            class="absolute bottom-1 left-1 h-4 w-4 rounded-full bg-#0e1eb4 text-center align-middle text-xs text-white"
          >
            <i v-if="mt?.type === 'icon'" class="iconfont text-10px" :class="`icon-${mt?.icon}`"></i>
            <span v-else>{{ mt.label }}</span>
          </div>
          <div
            v-if="spConfig?.label"
            class="absolute bottom-1 right-1 h-4 w-4 rounded-full text-center align-middle text-xs text-white"
            :style="{
              backgroundColor: spConfig.color
            }"
          >
            {{ spConfig.label }}
          </div>
        </div>
      </div>
    </template>
    <!--feat: KEY DESCRIPTION -->
  </NTooltip>
</template>
