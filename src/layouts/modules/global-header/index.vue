<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watchEffect, toRefs } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '~/src/store/modules/app';
import { useThemeStore } from '~/src/store/modules/theme';
import { useRouteStore } from '~/src/store/modules/route';
import HorizontalMenu from '../global-menu/base-menu.vue';
import GlobalLogo from '../global-logo/index.vue';
import GlobalBreadcrumb from '../global-breadcrumb/index.vue';
import { useMixMenuContext } from '../../context';
import ThemeButton from './components/theme-button.vue';
// import UserAvatar from './components/user-avatar.vue';

const AsyncConfigSelect = defineAsyncComponent({
  loader: () => import('./components/config-select.vue'),
  delay: 200,
  // eslint-disable-next-line max-params
  onError(error, retry, fail, attempts) {
    if (error.message.includes('getActivePinia')) {
      // 如果是 Pinia 错误，可以尝试重试
      if (attempts <= 3) {
        retry();
      } else {
        fail();
      }
    } else {
      fail();
    }
  }
});
const showCfg = ref(false);
onMounted(() => {
  const route = useRoute();
  watchEffect(() => {
    if (route.name === 'connect') {
      showCfg.value = false;
    } else {
      showCfg.value = true;
    }
  });
});
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
  showTitle?: boolean;
}

defineProps<Props>();

const appStore = useAppStore();
const themeStore = useThemeStore();
const routeStore = useRouteStore();
const { menus } = useMixMenuContext();
// const setModalShow = ref(true);

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
  <DarkModeContainer class="h-full flex-y-center px-6 shadow-header" style="background-color: #222226">
    <GlobalLogo
      v-if="showLogo"
      :show-title="showTitle"
      class="h-full"
      :style="{ width: themeStore.sider.width + 'px' }"
    />
    <AsyncConfigSelect v-if="showCfg" />
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
      <!-- <GlobalSetting /> -->

      <!--
 <ButtonIcon tooltip-placement="left">
        <SvgIcon local-icon="setting" />
      </ButtonIcon>
-->

      <GlobalSetting v-if="showCfg" ></GlobalSetting>
      <LangSwitch v-if="showCfg" :lang="appStore.locale" :lang-options="appStore.localeOptions" @change-lang="appStore.changeLocale" />

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
