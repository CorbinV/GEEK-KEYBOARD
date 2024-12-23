<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { KeyboardContainer } from '@/components/custom/keyboard/index';
import { KeyTypeEnum } from '@/enum/keyType';
import TopBanner from './components/top-banner.vue';

import Macro from './module/marco.vue';
import Base from './module/base.vue';
import ModuleTemplate from './components/module-template.vue';
import Combo from './module/combo.vue';
const tabName = ref(KeyTypeEnum.Normal);
function handleKeyEventTabs(value: string | number) {
  tabName.value = Number(value);
}
const xList = shallowRef([
  {
    label: 'baseKey.tab.basic',
    type: KeyTypeEnum.Normal,
    component: Base,
    isTemplate: false,
    needBanner: false
  },
  {
    label: 'baseKey.tab.system',
    type: KeyTypeEnum.System,
    component: ModuleTemplate,
    isTemplate: true,
    needBanner: true
  },
  {
    label: 'baseKey.tab.media',
    type: KeyTypeEnum.Media,
    component: ModuleTemplate,
    isTemplate: true,
    needBanner: true
  },
  {
    label: 'baseKey.tab.combination',
    type: KeyTypeEnum.Combo,
    component: Combo,
    isTemplate: false,
    needBanner: false
  },
  {
    label: 'baseKey.tab.special',
    type: KeyTypeEnum.Special,
    component: ModuleTemplate,
    isTemplate: true,
    needBanner: true
  },
  {
    label: 'baseKey.tab.macro',
    type: KeyTypeEnum.Marco,
    component: Macro,
    isTemplate: false,
    needBanner: false
  }
]);
const currentContent = computed(() => {
  const res = xList.value.find(item => item.type === tabName.value)!;
  return res;
});
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #default="{ handleKeyEmit }">
        <div class="h-full flex flex-col">
          <TopBanner v-if="currentContent.needBanner" />
          <div class="flex-1">
            <component
              :is="currentContent.component"
              :key="currentContent.label"
              class="h-full w-full"
              :type="currentContent.type"
              @key-clicked="handleKeyEmit"
            ></component>
          </div>

          <NTabs v-model:value="tabName" type="segment" animated @update:value="handleKeyEventTabs">
            <NTab v-for="item in xList" :key="item.label" :name="item.type" :tab="$t(item.label)"></NTab>
          </NTabs>
        </div>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
