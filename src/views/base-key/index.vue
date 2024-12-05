<script setup lang="ts">
import { ref } from 'vue';
import { KeyboardContainer, StandardKeyboard } from '@/components/custom/keyboard/index';
import { KeyTypeEnum } from '@/enum/keyType';
import Macro from '../marco/components/Macro.vue';
import ModuleTemplate from './components/module-template.vue';
import Combo from './module/combo.vue';

const tabName = ref(KeyTypeEnum.Normal);
function handleKeyEventTabs(value: string | number) {
  tabName.value = Number(value);
}
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #default="{ handleKeyEmit }">
        <div class="h-full flex flex-col">
          <div class="flex-1">
            <StandardKeyboard
              v-if="tabName === KeyTypeEnum.Normal"
              @key-clicked="data => handleKeyEmit({ ...data, type: 0 })"
            />
            <ModuleTemplate
              v-if="tabName === KeyTypeEnum.System"
              :type="KeyTypeEnum.System"
              @key-clicked="handleKeyEmit"
            />
            <ModuleTemplate
              v-if="tabName === KeyTypeEnum.Media"
              :type="KeyTypeEnum.Media"
              @key-clicked="handleKeyEmit"
            />
            <Combo v-if="tabName === KeyTypeEnum.Combo" @key-clicked="handleKeyEmit" />
            <ModuleTemplate
              v-if="tabName === KeyTypeEnum.Special"
              :type="KeyTypeEnum.Special"
              @key-clicked="handleKeyEmit"
            />
            <Macro v-if="tabName === KeyTypeEnum.Marco" :edit="false" @key-clicked="handleKeyEmit" />
          </div>

          <NTabs v-model:value="tabName" type="segment" animated @update:value="handleKeyEventTabs">
            <NTab :name="KeyTypeEnum.Normal" tab="基础" />
            <NTab :name="KeyTypeEnum.System" tab="系统" />
            <NTab :name="KeyTypeEnum.Media" tab="媒体" />
            <NTab :name="KeyTypeEnum.Combo" tab="组合" />
            <NTab :name="KeyTypeEnum.Special" tab="特殊" />
            <NTab :name="KeyTypeEnum.Marco" tab="宏按键" />
          </NTabs>
        </div>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
