import { createApp } from 'vue';
import './plugins/assets';
import './plugins/log';
import { setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins';
import { setupStore } from './store';
import { setupRouter } from './router';
import { setupI18n } from './locales';
import App from './App.vue';
import autofit from 'autofit.js'

async function setupApp() {
  setupLoading();

  setupNProgress();

  setupIconifyOffline();

  setupDayjs();

  const app = createApp(App);

  setupStore(app);

  await setupRouter(app);

  setupI18n(app);

  app.mount('#app');

  autofit.init({
    el: "body",
    resize: true,
    ignore: [
      {
        // @ts-ignore
       dom: "#popover-portal",
      },
   ]
  });
}

setupApp();
