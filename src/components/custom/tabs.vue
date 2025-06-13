<script setup lang="ts">
// const props = defineProps<{}>();
import type { TabsProps } from 'naive-ui';
import { useAttrs } from 'vue';
const attrs = useAttrs();
type TabsPropsThemeOverrides = NonNullable<TabsProps['themeOverrides']>;
const tabsThemeOverrides: TabsPropsThemeOverrides = {
  tabColor: '#191b1d'
};
</script>

<template>
  <NTabs :theme-overrides="tabsThemeOverrides" v-bind="attrs"></NTabs>
</template>
