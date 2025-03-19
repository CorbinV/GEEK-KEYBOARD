<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { NModal } from 'naive-ui';
import { OtaStatusEnum } from '../composables/useOTA';

const props = defineProps<{
  show: boolean;
  progress: number;
  status: OtaStatusEnum
}>();

const emit = defineEmits(['update:show', 'handleBack']);

const progress = ref(props.progress || 0);

const showModal = computed(() => props.show);
const upgradeFinished = computed(() => {
  return props.status === OtaStatusEnum.UPGRADE_SUCCESS || props.status === OtaStatusEnum.UPGRADE_FAIL
});
watchEffect(() => {
  progress.value = props.progress || 0;
});
const backBtnAttr: any = computed(() => {
  if (props.status === OtaStatusEnum.UPGRADE_SUCCESS) {
    return {
      class: 'flex-1 max-w-32 text-white',
      type: 'info',
      gohst: false,
      size: "large",
      onClick: handleBack
    }
  }
  return {
    class: 'flex-1 max-w-32',
    size: "large",
    onClick: handleBack
  }
})
const handleBack = () => {
  emit('update:show', false);
};
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false">
    <div class="rounded-log flex flex-col items-center justify-center gap-y-4 rounded-lg bg-[#171619] p-7 text-center">
      <span class="text-4 text-[#ffffff] mb-4">{{ $t('setting.gjUpdate') }}</span>
      <NProgress type="line" color="#3C8DF4" rail-color="#D9D9D9" style="width: 365px" :show-indicator="false"
        :percentage="progress" class="" />
      <span class="text-4" :class="progress > 0 ? 'text-[#3C8DF4]' : 'text-[#D9D9D9]'">{{ progress }}%</span>
      <template v-if="upgradeFinished">
        <div class="flex flex-row items-center gap-x-2">
          <template v-if="status === OtaStatusEnum.UPGRADE_SUCCESS">
            <i class="iconfont icon-hollow-done text-#a1ec41"></i>
            <p class="text-base text-[#999999]">{{ $t('businessCommon.upgradeSuccess') }}</p>
          </template>
          <template v-else>
            <i class="iconfont icon-hollow-close text-#e4583e"></i>
            <p class="text-base text-[#999999]">{{ $t('businessCommon.upgradeFail') }}</p>
          </template>
        </div>
        <div class="flex flex-row justify-center gap-x-8 w-70%">
          <NButton v-bind="backBtnAttr">
            {{ $t('common.back') }}
          </NButton>
          <NButton class="flex-1  max-w-32 text-white" size="large" type="info" @click="handleBack">
            {{ $t('setting.upgradeAgain') }}
          </NButton>
        </div>
      </template>
      <template v-else>
        <div class=" text-4 text-[#666666]">
          <p>{{ $t('setting.upgradeNotice1') }}</p>
          <p>{{ $t('setting.upgradeNotice2') }}</p>
        </div>
      </template>
    </div>
  </NModal>
</template>

<style scoped></style>
