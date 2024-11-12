<script setup lang="ts">
import { ref } from 'vue';
defineOptions({
  name: 'MerchantList',
  components: {},
  data() {
    return {};
  },

  methods: {}
});

const argShow = ref(true);
const showModal = ref(false);
// const triggerPoint = ref(66);
const rapidTriggerSiwtch = ref(true);
const breakOptimization = ref(true);
const pollingRateOptions = ref([
  {
    value: 0,
    label: '1k'
  },
  {
    value: 3,
    label: '2k'
  },
  {
    value: 2,
    label: '4k'
  },
  {
    value: 4,
    label: '8k'
  }
]);
const shakelevel = ref([
  {
    value: 0,
    label: '低'
  },
  {
    value: 3,
    label: '中'
  },
  {
    value: 2,
    label: '高'
  }
]);
function pollingRateSelect() {}
function shakeSelect() {}
function reset() {
  console.log('sds');
}

function setAxosome() {}
</script>

<template>
  <div class="flex-raw flex gap-30px bg-[#171619] p-30px">
    <div class="flex flex-col flex-1">
      <div class="flex-raw flex items-center justify-between border-b-1px border-[#232327] pb-20px">
        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">显示参数</p>
        </div>

        <NSwitch v-model:value="argShow"></NSwitch>
      </div>
      <div class="flex-raw flex items-center justify-between border-b-1px border-[#232327] pb-20px pt-20px">
        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">轮询率</p>
        </div>

        <NDropdown
          :options="pollingRateOptions"
          class="h-40px w-100px"
          placement="bottom-start"
          trigger="click"
          @select="pollingRateSelect"
        >
          <NButton class="h-40px w-100px bg-[#222227]">8K</NButton>
        </NDropdown>
      </div>

      <div class="flex-raw flex items-center pt-20px">
        <p class="vertical-bar"></p>
        <p class="... text-lg">触发点</p>
      </div>
      <NSlider class="mt-20px"></NSlider>
      <div class="flex-raw mt-70px flex place-content-center gap-100px pb-20px pt-20px">
        <button class="hollow-btn h-60px w-170px font-[18px]" @click="reset">重置</button>
        <button
          class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]"
          @click="setAxosome"
        >
          设置轴体
        </button>
      </div>
    </div>

    <div class="border-l-1px border-[#232327]"></div>
    <div class="flex flex-col flex-1">
      <div class="flex-raw flex justify-between pb-10px">
        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">开启快速触发</p>
        </div>

        <NSwitch v-model:value="rapidTriggerSiwtch"></NSwitch>
      </div>
      <span class="... border-b-1px border-[#232327] pb-20px text-14px text-[#999]">
        通过设置触发行程，只需按压抬起一定程度即可反复触发按键，达到快速触发效果
      </span>
      <div class="flex-raw flex items-center pt-20px">
        <p class="vertical-bar"></p>
        <p class="... text-lg">灵敏度</p>
        <span class="... text-14px text-[#999]">（设置过高的精度，可能回导致手指按压时，细微的晃动而被认定抬起）</span>
      </div>
      <!-- <ElSlider v-model="triggerPoint" :tooltip="false"></ElSlider> -->
      <NSlider class="pt20px"></NSlider>
      <p
        class="... mt10px border-b-1px border-[#232327] pb20px text-[#3C8DF4] underline underline-offset-4"
        @click="showModal = true"
      >
        高级设置
      </p>

      <NModal v-model:show="showModal" style="width: 34%; height: 500px; background: #191b1d; border-radius: 10px">
        <div class="model-bg flex flex-col items-center bg-green-4 p-30px text-[22px]">
          <p>高级设置</p>
          <div class="mt-20px w-100% flex flex-row justify-between text-[18px]">
            <p>单独设置抬起按下灵敏度</p>
            <NSwitch></NSwitch>
          </div>
          <p class="mt-40px w-100% text-[18px]">RT顶部死区</p>
          <NSlider class="mt-20px"></NSlider>

          <p class="mt-20px w-100% text-[18px]">RT底部死区</p>
          <NSlider class="mt-20px"></NSlider>

          <div class="mt-30px flex flex-row justify-center gap-70px">
            <button class="hollow-btn h-60px w-170px font-[18px]" @click="showModal = false">取消</button>
            <button
              class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]"
              @click="showModal = false"
            >
              确定
            </button>
          </div>
        </div>
      </NModal>
      <div class="flex-raw flex justify-between border-b-1px border-[#232327] pb-20px pt-20px">
        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">断触优化</p>
        </div>

        <NSwitch v-model:value="breakOptimization"></NSwitch>
      </div>
      <div class="flex-raw flex justify-between pt-20px">
        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">防抖等级</p>
        </div>

        <NDropdown
          :options="shakelevel"
          class="h-40px w-100px"
          placement="bottom-start"
          trigger="click"
          @select="shakeSelect"
        >
          <NButton class="h-40px w-100px bg-[#222227]">低</NButton>
        </NDropdown>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
