<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref, toRaw, toRefs, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import type { KeyCfg } from '@/api/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { tranformKeyTypeToChar, tranformKeyTypeToColor } from '@/hooks/common/transform';
import type { BaseKeyView } from '@/api/modules/combo';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { useCommonStore } from '@/store/modules/common';

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
const commonStore = useCommonStore();
const { kbCfg, currentSuperKeyType, showKeyParams } = toRefs(keyboardStore);
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
const keyConfigView = computed(() => {
  return kbCfg.value.rtLabelMap.get(props.keyId);
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
  const specKeyEffect = (code: number, type: KeyTypeEnum) => {
    if (KeyTypeEnum.Combo === type) {
      commonStore.updateComboKeyTag(props.keyId, { code, type }, { type: 'add', updateOrigin: false });
    } else if (KeyTypeEnum.DKS === type) {
      commonStore.updateDksKeyTag(props.keyId, { code, type }, { type: 'add', updateOrigin: false });
    }
  };
  function updateKeyCfg(data: KeyCfg) {
    if (!data) {
      return;
    }
    const { code, type } = data;
    specKeyEffect(code, type);
    const detail = keyboardStore.getKeyDetail({ code, type });
    updateKeyView(detail);
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
  watch(
    () => props.keyDetail,
    nVal => {
      updateKeyCfg(nVal);
    },
    {
      immediate: true,
      deep: true
    }
  );
  if (props.kbLength !== undefined && props.kbLength === props.idx + 1) {
    emit('lastKeyMounted', null);
  }
});
const [spConfig, resetSpConfig] = useResttableRefFn(() => ({
  label: '',
  color: 'transparent'
}));
function updateSpConfig(x: KeyboardKeyProps['sp']) {
  const needReset = [!x, currentSuperKeyType.value === KeyTypeEnum.None].some(r => r);
  if (needReset) {
    resetSpConfig();
    return;
  }
  x?.forEach(type => {
    const label = tranformKeyTypeToChar(type as any);
    const color = tranformKeyTypeToColor(type as any);
    spConfig.value = {
      label,
      color
    };
  });
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
          <template v-if="!showKeyParams">
            <div
              v-if="mt?.type"
              class="no-wrap absolute bottom-0.5 left-0.5 h-4.5 w-4.5 flex items-center justify-center rounded-full bg-#0e1eb4 text-center text-0.6rem text-white"
            >
              <i v-if="mt?.type === 'icon'" class="iconfont text-10px" :class="`icon-${mt?.icon}`"></i>
              <span v-else>{{ mt.label }}</span>
            </div>
            <div
              v-if="spConfig?.label"
              class="no-wrap absolute bottom-0.5 right-0.5 h-4.5 w-4.5 flex items-center justify-center rounded-full bg-#0e1eb4 text-center text-0.6rem text-white"
              :style="{
                backgroundColor: spConfig.color
              }"
            >
              {{ spConfig.label }}
            </div>
          </template>
          <template v-else>
            <div
              class="absolute z-1 grid grid-cols-2 grid-rows-2 h-full w-full p-0.5 text-8px will-change-transform"
              style="transform: translateZ(0)"
            >
              <span class="self-start justify-self-start">{{ keyConfigView?.trigPt }}</span>
              <span class="self-start justify-self-end">
                <SvgIcon v-if="keyConfigView?.enableRt" local-icon="thunder" class="color-#3c8df4" />
              </span>
              <span class="self-end justify-self-start">{{ keyConfigView?.rtTrig }}</span>
              <span class="self-end justify-self-end">{{ keyConfigView?.rtReset }}</span>
            </div>
          </template>
        </div>
      </div>
    </template>
    <!--feat: KEY DESCRIPTION -->
  </NTooltip>
</template>
