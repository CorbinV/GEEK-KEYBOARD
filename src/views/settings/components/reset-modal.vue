<script setup lang="ts">
import { ref } from 'vue';
// import { ref } from 'vue';

defineOptions({
  name: 'RestoreFactoryModal'
});
const showModal = ref(false);
</script>

<template>
  <ButtonIcon tooltip-placement="left" @click="showModal = true">
    <SvgIcon local-icon="setting" />
  </ButtonIcon>

  <NModal v-model:show="showModal" class="h-550px w-34% rounded-[10px] bg-[#191b1d]">
    <div class="model-bg flex flex-col justify-between p-30px text-[22px]">
      <div class="flex flex-col">
        <p class="w-100% text-center text-22px text-[#fff]">{{ $t('businessCommon.restoreFactoryHint') }}</p>

        <div class="mt-30px flex flex-row justify-center gap-70px">
          <button class="hollow-btn h-60px w-170px font-[18px]" @click="showModal = false">
            {{ $t('businessCommon.cancel') }}
          </button>
          <button class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]">
            {{ $t('businessCommon.confirm1') }}
          </button>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.item-style {
  padding-top: 20px;
  padding-bottom: 20px;
}
.vertical-bar {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  background-color: #3c8df4; /* 按钮文字颜色 */
}
.hollow-btn {
  background-color: transparent;
  color: #3c8df4; /* 按钮文字颜色 */
  border: 1px solid #3c8df4; /* 边框颜色 */
  border-radius: 8px; /* 圆角边框 */
  padding: 10px 20px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.hollow-btn:hover {
  background-color: #3c8df4; /* 悬停时的背景颜色 */
  color: white; /* 悬停时文字颜色 */
}
</style>
