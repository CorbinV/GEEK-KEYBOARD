<script setup lang="ts">
import { onUnmounted, ref, toRef } from 'vue';
import { KeyboardContainer } from '@/components/custom/keyboard/index';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import Dks from './modules/dks.vue';
import Oks from './modules/oks.vue';
import Socd from './modules/socd.vue';
import MT from './modules/mt.vue';
import TGL from './modules/tgl.vue';
import Rs from './modules/rs.vue';
const keyboardStore = useKeyboardStore();
const allowMutipleSelect = toRef(keyboardStore, 'allowMutipleSelect');
allowMutipleSelect.value = false;

const tabName = ref(KeyTypeEnum.DKS);
function handleKeyEventTabs(value: string | number) {
  tabName.value = Number(value);
}

onUnmounted(() => keyboardStore.resetCurrentSuperKeyType());

const paneList = [
  {
    name: KeyTypeEnum.DKS,
    label: 'DKS动态键程',
    component: Dks
  },
  {
    name: KeyTypeEnum.OKS,
    label: 'OKS单键急停',
    component: Oks
  },
  {
    name: KeyTypeEnum.SOCD,
    label: 'SOCD',
    component: Socd
  },
  {
    name: KeyTypeEnum.MT,
    label: 'MT单击/按住',
    component: MT
  },
  {
    name: KeyTypeEnum.TGL,
    label: 'TGL切换开关',
    component: TGL
  },
  {
    name: KeyTypeEnum.RS,
    label: 'RS',
    component: Rs
  }
];
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #keyboardBottom></template>
      <template #default="{ handleKeyEmit }">
        <!-- <div>点击测试按键</div> -->

        <!--
 <NTabs size="large" justify-content="space-evenly" placement="bottom" class="h-full" pane-class="h-full">
          <NTabPane v-for="pane in paneList" :key="pane.name" :name="pane.name" :tab="pane.label">
            <component :is="pane.component" @key-clicked="handleKeyEmit" />
          </NTabPane>
        </NTabs>
-->

        <div class="h-full flex flex-col">
          <div class="flex-1">
            <component :is="paneList.find(item => item.name === tabName)?.component" @key-clicked="handleKeyEmit" />
          </div>

          <NTabs v-model:value="tabName" type="segment" animated @update:value="handleKeyEventTabs">
            <NTab :name="KeyTypeEnum.DKS" :tab="$t('supperKey.c1')" />
            <NTab :name="KeyTypeEnum.OKS" :tab="$t('supperKey.c2')" />
            <NTab :name="KeyTypeEnum.SOCD" tab="SOCD" />
            <NTab :name="KeyTypeEnum.MT" :tab="$t('supperKey.c3')" />
            <NTab :name="KeyTypeEnum.TGL" :tab="$t('supperKey.c4')" />
            <NTab :name="KeyTypeEnum.RS" :tab="$t('supperKey.c5')" />
          </NTabs>
        </div>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
