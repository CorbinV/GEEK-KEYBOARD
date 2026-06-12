<script setup lang="ts">
import { KeyTypeEnum } from '@/enum/keyType';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { computed, onMounted, reactive, ref, toRefs, watch } from 'vue';

interface BaseLayoutProps {
  keyId: string;
  idx: number;
  kbLength?: number;
  keyDetail?: any;
  highLight?: boolean;
}
const emit = defineEmits<{
  (e: 'lastKeyMounted'): void;
}>();
const props = withDefaults(defineProps<BaseLayoutProps>(), {
  highLight: false,
});
const keyboardStore = useKeyboardStore();

const { kbCfg } = toRefs(keyboardStore);

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
      left,
      top,
      pos: [row]
    } = keyInfo.value;
    const kw = width || base.width || 0;
    const kh = height || base.height || 0;
    if (left > -1 && top > -1) {
      keyStyle.value = {
        width: `${kw}px`,
        height: `${kh}px`,
        left: `${left}px`,
        top: `${top}px`
      };
      return;
    }
    const offset = cfg.value.offsetList?.[row] || base.gap;
    keyInfo.value.left = offset + base.sGap * gap;
    keyInfo.value.top = kh * row + (row + 1) * base.gap;

    keyStyle.value = {
      width: `${kw}px`,
      height: `${kh}px`,
      left: `${keyInfo.value.left}px`,
      top: `${keyInfo.value.top}px`
    };
    cfg.value.offsetList[row] = offset + kw + base.gap;
  }
}

const KeyView = reactive({
  label: 'Lost',
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
const updateKeyCfg = (data: import('@/api/modules/keyboard').KeyCfg) => {
  if (!data) {
    const detail = keyboardStore.getKeyDetail({ code: -10, type: -1 as KeyTypeEnum });
    updateKeyView(detail);
    return;
  }
  const { code, type } = data;
  const detail = keyboardStore.getKeyDetail({ code, type });
  updateKeyView(detail);
};

watch(
  () => props.keyDetail,
  (nVal) => { updateKeyCfg(nVal); },
  { immediate: true, deep: true }
);

onMounted(() => {
  useLayout(kbCfg);
  if (props.kbLength !== undefined && props.kbLength === props.idx + 1) {
    emit('lastKeyMounted');
  }
});
</script>

<template>
  <div
    class="inline-box absolute box-border h-50px w-50px border-1 rounded-md base-light-bg text-c-primary"
    :style="keyStyle"
    :class="[
      'border-#222227',
      { 'key-passed': highLight }
    ]"
    :data-id="keyId"
    :data-idx="idx"
  >
    <div class="relative h-full w-full flex flex-col items-center justify-center break-words">
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

<style scoped>
.key-passed {
  background: #3C8DF4 !important;
  color: white;
}
</style>
