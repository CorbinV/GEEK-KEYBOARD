import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { setupVitePlugins } from './build/plugins';
import { createViteProxy, getBuildTime } from './build/config';

export default defineConfig(configEnv => {
  const viteEnv = loadEnv(configEnv.mode, process.cwd()) as unknown as Env.ImportMeta;
  const buildTime = getBuildTime();
  process.env.MODE = configEnv.mode;
  const enableProxy = configEnv.command === 'serve' && !configEnv.isPreview;

  return {
    base: viteEnv.VITE_BASE_URL,
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "@/styles/scss/global.scss" as *;`
        }
      }
    },
    plugins: setupVitePlugins(viteEnv, buildTime),
    define: {
      BUILD_TIME: JSON.stringify(buildTime),
      'process.env.LOG_LEVEL': JSON.stringify(viteEnv.VITE_LOG_LEVEL)
    },
    server: {
      host: '0.0.0.0',
      port: 9527,
      open: true,
      proxy: createViteProxy(viteEnv, enableProxy),
      fs: {
        cachedChecks: false
      }
    },
    preview: {
      port: 9719
    },
    build: {
      reportCompressedSize: false,
      sourcemap: process.env.NODE_ENV === 'production' ? false : viteEnv.VITE_SOURCE_MAP === 'Y',
      commonjsOptions: {
        ignoreTryCatch: false
      },
      minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('src')) {
              return;
            }
            let tempId = id;
            if (tempId.includes('.pnpm')) {
              tempId = tempId.split('node_modules/.pnpm/').pop() || '';
            }
            if (tempId.match(/^naive-ui*/)) {
              return 'uiframe';
            }
            if (tempId.match(/^@?vue[-\+@]/)) {
              return 'vue';
            }
          }
        }
      }
    }
  };
});
