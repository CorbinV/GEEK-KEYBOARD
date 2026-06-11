<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watchEffect } from 'vue';
import { onCalibrationListener, removeCalibrationListener, setCalibration } from '@/api/keyConfig-rapid-trigger';

const props = defineProps<{
  visible: boolean
}>()
const emit = defineEmits<{
  (e: 'update:visible', payload: boolean): void;
}>()
function useDialogController() {
  const control = reactive({
    visible: true
  });

  watchEffect(() => {
    control.visible = props.visible;
  });
  return {
    dialogControl: control,
    openDialog: () => {
      control.visible = true;
    },
    closeDialog: () => {
      control.visible = false;
      emit('update:visible', false);
    }
  };
}
const { dialogControl, closeDialog } = useDialogController();

const passedKeys = ref(new Set<string>());

function calibrateCB(data: { key: string }[]) {
  data.forEach(item => {
    passedKeys.value.add(item.key);
  });
}

function handleDialogComfirm() {}

onMounted(async() => {
  await setCalibration({switch: 1})
  onCalibrationListener(calibrateCB);
})

onUnmounted(async() => {
  await setCalibration({switch: 0})
  removeCalibrationListener(calibrateCB);
  passedKeys.value.clear();
})
</script>
<template>
  <NModal v-model:show="dialogControl.visible" preset="card" :closable="false" :title="undefined" :close-on-esc="false"
    :mask-closable="false" class="!bg-#191b1d !min-w-1000px max-w-1560px" :class="`${'w-54%'}`"
    content-class="bg-#191b1d" size="large">
    <template #header>
      <div class="flex flex-row justify-between items-center text-xl relative">
        <span class="w-full text-center h-full">{{ '手动校准' }}</span>
      </div>
    </template>
    <template #default>
      <div class="h-full w-full flex flex-col" ref="dialogCtxRef">
        <NDivider class="!mt-0" />
        <div class="flex flex-col">
          <p class="text-center text-base text-c-second">{{ '为了使键盘达到更好的稳定性与一致性，点击校准按键后需手动按下按键，保持每个按键稳定按压1秒钟，重复2-3次' }}</p>
        </div>
        <div class="flex flex-1 items-center justify-between">
          <div class="flex-1"></div>
          <LightKeybard :layer="1" :config="1" :passed-keys="passedKeys"></LightKeybard>
          <div class="flex-1"></div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-center gap-x-8">
        <NButton class="h-4rem w-12rem md:h-3rem md:w-8rem text-base" type="primary" ghost @click="closeDialog">
          {{ $t('businessCommon.cancel') }}
        </NButton>
        <NButton class="h-4rem w-12rem md:h-3rem md:w-8rem text-lg text-white" type="primary"
          @click="handleDialogComfirm">
          {{ $t('businessCommon.confirm1') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>
