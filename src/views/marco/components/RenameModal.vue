<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { NInput, NModal } from 'naive-ui';

const props = defineProps<{
  show: boolean;
  name: string;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'rename', payload: { name: string }): void;
}>();

// 最长6个字符
const nameMaxLen = 6;

const inputReName = ref(props.name || '');

const showModal = computed(() => props.show);

watchEffect(() => {
  inputReName.value = props.name?.trim()?.slice(0, nameMaxLen) || '';
});

const handleCancel = () => {
  emit('update:show', false);
};

const handleSave = async () => {
  if (inputReName.value.trim() === '') return;
  emit('rename', { name: inputReName.value.trim().slice(0, nameMaxLen) });
  emit('update:show', false);
};
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false">
    <div class="rounded-log flex flex-col items-center justify-center gap-7 bg-[#191B1D] p-7 text-center">
      <span>{{ $t('businessCommon.rename') }}</span>
      <NInput v-model:value="inputReName" type="text" size="large" placeholder="最长六个字符" maxlength="6" />
      <div class="flex flex-row justify-center gap-x-7 ">
        <NButton type="info" ghost class="h-15 w-42 text-lg sm:!text-base" @click="handleCancel">
          {{ $t('businessCommon.cancel') }}
        </NButton>
        <NButton type="primary" class="h-15 w-42 text-lg sm:!text-base" :disabled="!Boolean(inputReName.length)" @click="handleSave">{{ $t('businessCommon.save') }}</NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped></style>
