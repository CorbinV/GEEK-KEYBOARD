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

const inputReName = ref(props.name || '');

const showModal = computed(() => props.show);

watchEffect(() => {
  inputReName.value = props.name?.trim()?.slice(0, 6) || '';
});

const handleCancel = () => {
  emit('update:show', false);
};

const handleSave = async () => {
  if (inputReName.value.trim() === '') return;
  emit('rename', { name: inputReName.value.trim().slice(0, 6) });
  emit('update:show', false);
};
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false">
    <div class="rounded-log flex flex-col items-center justify-center gap-7 bg-[#191B1D] p-7 text-center">
      <span>{{ $t('businessCommon.rename') }}</span>
      <NInput v-model:value="inputReName" type="text" size="large" placeholder="最长六个字符" maxlength="6" />
      <div>
        <button class="h-15 w-42 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]" @click="handleCancel">
          {{ $t('businessCommon.cancel') }}
        </button>
        <button class="ml-7 h-15 w-42 rounded bg-[#3c8df4]" @click="handleSave">{{ $t('businessCommon.save') }}</button>
      </div>
    </div>
  </NModal>
</template>

<style scoped></style>
