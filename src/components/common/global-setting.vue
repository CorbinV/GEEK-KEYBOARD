<script setup lang="ts">
import { ref } from 'vue';
import { description, version } from '@/../package.json';

defineOptions({
  name: 'GlobalSetting'
});
const showModal = ref(false);
const websiteInfo = JSON.parse(import.meta.env.VITE_WEBSITE);
const productionInfo = JSON.parse(import.meta.env.VITE_PRODUCTION);
</script>

<template>
  <ButtonIcon tooltip-placement="left" @click="showModal = true">
    <SvgIcon local-icon="setting" />
  </ButtonIcon>

  <NModal v-model:show="showModal" class="h-550px min-w-40% rounded-[10px] bg-[#191b1d]">
    <div class="model-bg flex flex-col justify-between p-30px text-[22px]">
      <div class="flex flex-col">
        <p class="w-100% text-center text-22px text-[#fff]">{{ $t('businessCommon.set') }}</p>
        <!--
 <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">界面风格</p>
        </div>
-->

        <div class="item-style flex flex-col b-b-1px b-b-[#232327]">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-18px">{{ $t('global_Setting.qdVersion') }}</p>
          </div>
          <div class="flex-raw mt-20px flex items-center justify-between text-16px text-[#999]">
            <p>{{ $t('global_Setting.versionInfo', { total: description }) }}</p>
            <p>{{ $t('global_Setting.version', { total: version }) }}</p>
          </div>
        </div>

        <div class="item-style flex flex-col b-b-1px b-b-[#232327]">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-18px">{{ $t('global_Setting.contactUs') }}</p>
          </div>
          <div class="flex-raw mt-20px flex items-center justify-between text-16px">
            <p>
              {{ $t('global_Setting.officialWeb') }}
              <a class="text-#3C8DF4 hover:text-blue duration-150" :href="websiteInfo?.url" target="_blank">{{ websiteInfo?.name }}
              </a>
            </p>
            <p>
              {{ $t('global_Setting.wechart') }}
              <span class="text-#3C8DF4">www.geekwontek.com</span>
            </p>
          </div>
        </div>

        <div class="item-style flex flex-col b-b-1px b-b-[#232327]">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="text-lg">{{ $t('global_Setting.moreProduct') }}</p>
          </div>
          <div class="flex-raw mt-20px flex items-center justify-between text-16px">
            <p>
              {{ $t('global_Setting.officialWeb') }}
              <a class="text-#3C8DF4 hover:text-blue duration-150" :href="productionInfo?.url" target="_blank">
                {{ productionInfo?.name }}
              </a>
            </p>
            <p>
              {{ $t('global_Setting.wechart') }}

              <span class="text-#3C8DF4">www.geekwontek.com</span>
            </p>
          </div>
        </div>
      </div>

      <div class="mt-30px flex flex-row justify-center gap-70px">
        <button class="hollow-btn h-60px w-170px font-[18px]" @click="showModal = false">{{ $t('common.close') }}</button>
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
  background-color: #3c8df4;
  /* 按钮文字颜色 */
}

.hollow-btn {
  background-color: transparent;
  color: #3c8df4;
  /* 按钮文字颜色 */
  border: 1px solid #3c8df4;
  /* 边框颜色 */
  border-radius: 8px;
  /* 圆角边框 */
  padding: 10px 20px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hollow-btn:hover {
  background-color: #3c8df4;
  /* 悬停时的背景颜色 */
  color: white;
  /* 悬停时文字颜色 */
}
</style>
