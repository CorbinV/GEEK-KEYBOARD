<script setup lang="ts">
import type { Ref } from 'vue';
import { onUnmounted, toRef } from 'vue';
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
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;

allowMutipleSelect.value = false;
currentSuperKeyType.value = KeyTypeEnum.DKS;

onUnmounted(() => keyboardStore.resetCurrentSuperKeyType());

const paneList = [
  {
    name: KeyTypeEnum.DKS,
    label: 'supperKey.c1',
    component: Dks
  },
  {
    name: KeyTypeEnum.OKS,
    label: 'supperKey.c2',
    component: Oks
  },
  {
    name: KeyTypeEnum.SOCD,
    label: 'supperKey.c9',
    component: Socd
  },
  {
    name: KeyTypeEnum.MT,
    label: 'supperKey.c3',
    component: MT
  },
  {
    name: KeyTypeEnum.TGL,
    label: 'supperKey.c4',
    component: TGL
  },
  {
    name: KeyTypeEnum.RS,
    label: 'supperKey.c5',
    component: Rs
  }
];
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #keyboardBottom></template>
      <template #default="{ handleKeyEmit }">
        <div class="h-full flex flex-col">
          <div class="flex-1 bg-#171619 rounded-md mb-2">
            <component :is="paneList.find(item => item.name === currentSuperKeyType)?.component"
              @key-clicked="handleKeyEmit" />
          </div>
          <NTabs v-model:value="currentSuperKeyType" class="custom-segment-tabs" type="segment" animated>
            <NTab v-for="pane in paneList" :key="pane.name" :name="pane.name" class="text-xl text-#3C8DF4">
              <span :class="`${currentSuperKeyType == pane.name ? 'text-#3C8DF4' : 'text-#999999'} text-lg`">{{
                $t(pane.label) }}</span>
            </NTab>
          </NTabs>
        </div>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped>
.custom-segment-tabs {
  :deep(.n-tabs-tab) {
    margin: 3px 12px
  }
}
</style>
