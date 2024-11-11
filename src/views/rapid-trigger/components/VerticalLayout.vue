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
const triggerPoint = ref(66);
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
function reset() {}
function setAxosome() {}
</script>

<template>
  <div class="ui-dispatch-box">
    <div class="ui-title-btn">
      <ElButton class="title-btn-one" type="primary" plain>全选</ElButton>
      <ElButton class="title-btn-one" type="primary" plain>反选</ElButton>
      <ElButton class="title-btn-one" type="primary" plain>清空</ElButton>
    </div>

    <div class="dispatch-main">
      <div class="dispatch-left">
        <ul>
          <li class="ui-li-one">
            <div class="li-title">显示参数</div>
            <NSpace>
              <!-- 直接使用 v-model 绑定 active -->
              <NSwitch v-model="argShow" value="{{argShow}}" />
            </NSpace>
          </li>

          <li class="ui-li-one">
            <div class="li-title">轮训率</div>
            <!--
 <ElSelect v-model="value1" size="mini" placeholder="请选择">
              <ElOption v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></ElOption>
            </ElSelect>
-->
            <NDropdown
              :options="pollingRateOptions"
              class="h-40px w-100px"
              placement="bottom-start"
              trigger="click"
              @select="pollingRateSelect"
            >
              <NButton class="h-40px w-100px">8K</NButton>
            </NDropdown>
          </li>

          <li class="ui-li-one flex-col">
            <div class="li-title">触发点</div>
            <div class="mt-20px">
              <ElSlider v-model="triggerPoint"></ElSlider>
              <NSlider show-tooltip />
            </div>
          </li>
        </ul>

        <div class="... mt70px text-center space-x-100px">
          <NButton class="h-60px w-160px" type="primary" @click="reset">重置</NButton>
          <NButton class="h-60px w-160px" type="primary" @click="setAxosome">设置轴体</NButton>
        </div>
      </div>
      <div class="dispatch-right">
        <ul>
          <li class="ui-li-one">
            <div class="title-one">
              <div class="li-title">开启快速触发</div>
              <div class="... mt10px text-14px text-[#999]">
                通过设置触发行程，只需按压抬起一定程度即可反复触发按键，达到快速触发效果
              </div>
            </div>

            <NSpace>
              <!-- 直接使用 v-model 绑定 active -->
              <NSwitch v-model="rapidTriggerSiwtch" />
            </NSpace>
          </li>
          <li class="ui-li-one flex-col">
            <div class="li-title">
              灵敏度
              <span class="... text-14px text-[#999]">
                （设置过高的精度，可能回导致手指按压时，细微的晃动而被认定抬起）
              </span>
            </div>
            <div class="mt-20px">
              <ElSlider v-model="triggerPoint" :tooltip="false"></ElSlider>
              <NSlider show-tooltip />
              <p class="... mt20px text-[#3C8DF4] underline underline-offset-4">高级设置</p>
            </div>
          </li>
          <li class="ui-li-one">
            <div class="li-title">断触优化</div>
            <NSpace>
              <!-- 直接使用 v-model 绑定 active -->

              <NSwitch v-model="breakOptimization" />
            </NSpace>
          </li>
          <li class="ui-li-one">
            <div class="li-title">防抖等级</div>
            <NDropdown
              :options="shakelevel"
              class="h-40px w-100px"
              placement="bottom-start"
              trigger="click"
              @select="shakeSelect"
            >
              <NButton class="h-40px w-100px">低</NButton>
            </NDropdown>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-dispatch-box {
  background-color: #000;
}
.dispatch-main {
  display: flex;
}
.dispatch-left {
  border-right: 1px solid #18171a;
}
.dispatch-left,
.dispatch-right {
  flex: 1;
  padding: 0 30px;
}
.ui-li-one {
  font-size: 16px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  padding: 20px 20px;
  border-bottom: 1px solid #18171a;
  box-sizing: border-box;
}
.ui-li-two {
  flex-direction: column;
}

.li-title {
  position: relative;
  text-align: left;
  font-size: 18px;
  &::before {
    content: '';
    position: absolute;
    width: 4px;
    height: 16px;
    background-color: #2c5c9b;
    left: -10px;
    top: 3px;
  }
}

.title-one {
  text-align: left;
}

.ui-left-btn {
  margin-top: 40px;
  margin-bottom: 40px;
}

.ui-btn {
  margin-left: 60px;
  width: 160px;
}

.ui-title-btn {
  padding: 20px 0;
  border-bottom: 1px solid #18171a;
  margin-bottom: 30px;
}
.title-btn-one {
  width: 90px;
  margin-right: 35px;
}
</style>
