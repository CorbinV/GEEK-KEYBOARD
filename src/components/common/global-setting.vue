<script setup lang="ts">
import { ref } from 'vue';
import { description, version } from '@/../package.json';
// import { ref } from 'vue';

defineOptions({
  name: 'GlobalSetting'
});
const showModal = ref(false);
console.log(version);
</script>

<template>
  <ButtonIcon tooltip-placement="left" @click="showModal = true">
    <SvgIcon local-icon="setting" />
  </ButtonIcon>

  <NModal v-model:show="showModal" class="h-550px w-34% rounded-[10px] bg-[#191b1d]">
    <div class="model-bg flex flex-col justify-between p-30px text-[22px]">
      <div class="flex flex-col">
        <p class="w-100% text-center text-22px text-[#fff]">设置</p>
        <!--
 <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">界面风格</p>
        </div>
-->

        <div class="item-style flex flex-col b-b-1px b-b-[#232327]">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-18px">驱动版本</p>
          </div>
          <div class="flex-raw mt-20px flex items-center justify-between text-16px text-[#999]">
            <p>版本信息：{{ description }}</p>
            <p>版本号：{{ version }}</p>
          </div>
        </div>

        <div class="item-style flex flex-col b-b-1px b-b-[#232327]">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-18px">联系我们</p>
          </div>
          <div class="flex-raw mt-20px flex items-center justify-between text-16px">
            <p>
              官网：
              <span class="text-#3C8DF4">www.geekwontek.com</span>
            </p>
            <p>
              公众号：
              <span class="text-#3C8DF4">www.geekwontek.com</span>
            </p>
          </div>
        </div>

        <div class="item-style flex flex-col b-b-1px b-b-[#232327]">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">更多产品</p>
          </div>
          <div class="flex-raw mt-20px flex items-center justify-between text-16px">
            <p>
              官网：
              <span class="text-#3C8DF4">www.geekwontek.com</span>
            </p>
            <p>
              公众号：
              <span class="text-#3C8DF4">www.geekwontek.com</span>
            </p>
          </div>
        </div>
      </div>

      <div class="mt-30px flex flex-row justify-center gap-70px">
        <button class="hollow-btn h-60px w-170px font-[18px]" @click="showModal = false">取消</button>
        <button class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]">确定</button>
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
