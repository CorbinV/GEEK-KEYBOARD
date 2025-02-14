<script setup lang="ts">
import { computed, toRef, watchEffect } from 'vue';
import type { KeyInfo } from '@/api/modules/keyboard';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { useCommonStore } from '@/store/modules/common';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
import type { BaseKeyView } from '@/api/modules/combo';
import { keyTypeEnumProxy } from '@/enum/keyType';
import { $t } from '@/locales';
import KeyLabel from './key-label.vue';
const keyboardStore = useKeyboardStore();
const commonStore = useCommonStore();
type KeyControlProps = {
  keyId?: string;
  keyLabel?: string;
};
const props = withDefaults(defineProps<KeyControlProps>(), {
  keyId: ''
});
const activeKeyLayer = toRef(keyboardStore, 'activeKeyLayer');
const kbCfg = toRef(keyboardStore, 'kbCfg');
const rtConfig = computed(() => {
  return activeKeyLayer.value.rtLabelMap.get(props.keyId);
});
const mtConfig = computed(() => {
  return activeKeyLayer.value.superKeyMap[props.keyId]?.mt;
});
const superTitle = computed(() => {
  // get key type
  const sp = activeKeyLayer.value.superKeyMap[props.keyId]?.sp;
  if (sp) {
    let keyStr = keyTypeEnumProxy.getKey(sp[0]) || '';
    if (keyStr?.length > 3) {
      keyStr = keyStr?.substring(0, 2);
    }
    return keyStr;
  }
  return '';
});
const keyDetail = computed(() => {
  const { code, type } = (activeKeyLayer.value?.keys as any)[props.keyId] || {};
  if (code === undefined || type === undefined) {
    return {} as BaseKeyView;
  }
  return keyboardStore.getKeyDetail({ code, type });
});
const isDisabled = computed(() => {
  return !activeKeyLayer.value?.keys[props.keyId]?.enable;
});
const [keyInfo, resetKeyInfo] = useResttableReactiveFn(() => ({
  currentKey: {} as BaseKeyView,
  params: []
}));
const showIcon = computed(() => {
  return keyInfo.currentKey?.type !== 'str';
});
function updateKeyInfo(data: KeyInfo) {
  keyInfo.currentKey = kbCfg.value.keyMap[data!.type]?.code?.[data!.code] || {};
  if (data.mt?.length) {
    // feat: add new function to get config by key type and code
    // keyInfo.params = ;
  }
}
// optimize: add a notification to show the result
watchEffect(async () => {
  if (props.keyId === '') {
    resetKeyInfo();
    return;
  }
  const data = await commonStore.getTargetKeyInfo(props.keyId);
  updateKeyInfo(data);
});
async function handleResetKey() {
  const data = await commonStore.restoreTargetKeyInfoById(props.keyId);
  updateKeyInfo(data);
  // optimize: add a notification to show the result
  if (props.keyId === '') return;
  emitter.emit(EventNameEnum.resetKey, props.keyId);
}
const originKeyLabel = computed(() => {
  return kbCfg.value.standerMap.get(props.keyId)?.alt || '';
});
async function handleDisableKey() {
  try {
    const enable = Number(isDisabled.value);
    await commonStore.setTargetKeyInfoById(props.keyId, { enable }, { isxx: true });
    window.$message?.success($t('businessCommon.executeSuccess'));
  } catch (error) {
    console.log(error);
    window.$message?.error($t(`businessCommon.executeFail`));
  }
}
</script>

<template>
  <div class="min-w-168px flex flex-col gap-y-4 low-layer-bg p-2">
    <h1 class="text-center text-base">{{ $t('macro.keyInfo') }}</h1>
    <div class="flex flex-col text-c-primary">
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>
          {{ $t('baseKey.keyboard.admin1', { total: originKeyLabel }) }}
        </span>
        <span>
          {{ $t('baseKey.keyboard.current') }}
          <i v-if="showIcon" class=""></i>
          <!-- {{ keyInfo.currentKey?.label }} -->
          <KeyLabel :detail="keyDetail" class="inline-flex" text-class="text-sm" icon-class="" />
        </span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>{{ $t('baseKey.keyboard.exeDot') }}</span>
        <span class="text-c-hl">{{ rtConfig?.trigPt || '/' }}</span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>{{ $t('baseKey.keyboard.exeRt') }}</span>
        <span class="text-c-hl">{{ rtConfig?.rtTrig || '/' }}</span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>{{ $t('baseKey.keyboard.resetRt') }}</span>
        <span class="text-c-hl">{{ rtConfig?.rtReset || '/' }}</span>
      </div>

      <div class="flex flex-row py-3">
        <div>属性:</div>
        <div class="ml-2 flex flex-col flex-1 !text-c-hl !text-xs">
          <div v-if="mtConfig?.type" class="inline-flex flex-1 flex-row items-center justify-between">
            <div>MT</div>
            <div class="ml-2 inline-flex gap-x-0.5">
              <KeyLabel :detail="keyDetail" />
              -
              <KeyLabel :detail="mtConfig" />
            </div>
          </div>
          <div v-if="superTitle" class="inline-flex flex-1 flex-row items-center justify-between">
            <div>{{ superTitle }}</div>
            <div class="ml-2 inline-flex gap-x-0.5">
              <div class="ml-2 inline-flex gap-x-0.5">Y</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="no-wrap flex gap-x-2">
      <NButton type="info" ghost size="small" @click="handleDisableKey">
        {{ isDisabled ? $t('baseKey.keyboard.cancelBandKey') : $t('baseKey.keyboard.bandKey') }}
      </NButton>
      <NButton type="info" ghost size="small" @click="handleResetKey">{{ $t('baseKey.keyboard.recvoer') }}</NButton>
    </div>
  </div>
</template>
