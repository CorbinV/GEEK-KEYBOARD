<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '~/src/store/modules/app';
import { useThemeStore } from '~/src/store/modules/theme';
import { useRouteStore } from '~/src/store/modules/route';
import HorizontalMenu from '../global-menu/base-menu.vue';
import GlobalLogo from '../global-logo/index.vue';
import GlobalBreadcrumb from '../global-breadcrumb/index.vue';
import { useMixMenuContext } from '../../context';
import ThemeButton from './components/theme-button.vue';
// import UserAvatar from './components/user-avatar.vue';

defineOptions({
  name: 'GlobalHeader'
});

interface Props {
  /** Whether to show the logo */
  showLogo?: App.Global.HeaderProps['showLogo'];
  /** Whether to show the menu toggler */
  showMenuToggler?: App.Global.HeaderProps['showMenuToggler'];
  /** Whether to show the menu */
  showMenu?: App.Global.HeaderProps['showMenu'];
}

defineProps<Props>();

const appStore = useAppStore();
const themeStore = useThemeStore();
const routeStore = useRouteStore();
const { menus } = useMixMenuContext();

const headerMenus = computed(() => {
  if (themeStore.layout.mode === 'horizontal') {
    return routeStore.menus;
  }

  if (themeStore.layout.mode === 'horizontal-mix') {
    return menus.value;
  }

  return [];
});
</script>

<template>
  <DarkModeContainer class="h-full flex-y-center shadow-header" style="background-color: #222226">
    <GlobalLogo v-if="showLogo" class="h-full" :style="{ width: themeStore.sider.width + 'px' }" />
    <HorizontalMenu v-if="showMenu" mode="horizontal" :menus="headerMenus" class="win-drag px-12px" />
    <div v-else class="win-drag h-full flex-y-center flex-1-hidden">
      <MenuToggler
        v-if="showMenuToggler"
        :collapsed="appStore.siderCollapse"
        class="win-no-drag"
        @click="appStore.toggleSiderCollapse"
      />
      <GlobalBreadcrumb v-if="!appStore.isMobile" class="win-no-drag ml-12px" />
      <!-- <UserAvatar class="win-no-drag" /> -->
    </div>
    <div class="win-drag mr-12px h-full flex-y-center justify-end">
      <!--
 <GlobalSearch />
      <FullScreen v-if="!appStore.isMobile" :full="isFullscreen" @click="toggle" />
-->
      <LangSwitch :lang="appStore.locale" :lang-options="appStore.localeOptions" @change-lang="appStore.changeLocale" />
      <!--
 <ThemeSchemaSwitch
        :theme-schema="themeStore.themeScheme"
        :is-dark="themeStore.darkMode"
        @switch="themeStore.toggleThemeScheme"
      />
-->
      <ThemeButton v-if="themeStore.themeVisible" class="win-no-drag" />
    </div>
  </DarkModeContainer>
</template>

<style scoped></style>
