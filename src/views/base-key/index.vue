<script setup lang="ts">
import { KeyboardContainer, StandardKeyboard } from '@/components/custom/keyboard/index';
import { KeyTypeEnum } from '@/enum/keyType';
import Macro from '../marco/components/Macro.vue';
import ModuleTemplate from './components/module-template.vue';
</script>

<template>
  <div>
    <KeyboardContainer>
      <template #default="{ handleKeyEmit }">
        <NTabs default-value="combo" size="large" justify-content="space-evenly" placement="bottom">
          <NTabPane name="basic" tab="基础">
            <StandardKeyboard @key-clicked="data => handleKeyEmit({ ...data, type: 0 })" />
          </NTabPane>
          <NTabPane name="system" tab="系统">
            <ModuleTemplate :type="KeyTypeEnum.System" @key-clicked="handleKeyEmit" />
          </NTabPane>
          <NTabPane name="media" tab="媒体">
            <ModuleTemplate :type="KeyTypeEnum.Media" @key-clicked="handleKeyEmit" />
          </NTabPane>
          <NTabPane name="special" tab="特殊">
            <ModuleTemplate :type="KeyTypeEnum.Special" @key-clicked="handleKeyEmit" />
          </NTabPane>
          <NTabPane name="macro" tab="宏按键">
            <Macro :edit="false" @key-clicked="handleKeyEmit" />
          </NTabPane>
        </NTabs>
      </template>
    </KeyboardContainer>
  </div>
</template>

<style scoped></style>
