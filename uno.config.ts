import { defineConfig } from '@unocss/vite';
import transformerDirectives from '@unocss/transformer-directives';
import transformerVariantGroup from '@unocss/transformer-variant-group';
import { presetUno } from '@unocss/preset-uno';
import type { Theme } from '@unocss/preset-uno';
import { presetWebTemplate } from '@sa/uno-preset';
import presetIcons from '@unocss/preset-icons';
import { themeVars } from './src/theme/vars';

export default defineConfig<Theme>({
  content: {
    pipeline: {
      exclude: ['node_modules', 'dist']
    }
  },
  theme: {
    ...themeVars,
    fontSize: {
      'icon-xs': '0.875rem',
      'icon-small': '1rem',
      icon: '1.125rem',
      'icon-large': '1.5rem',
      'icon-xl': '2rem'
    }
  },
  shortcuts: {
    'card-wrapper': 'rd-8px shadow-sm',
    'low-layer-bg': 'bg-#16161d',
    'mid-layer-bg': 'bg-#171619',
    'base-light-bg': 'bg-#222227',
    'higth-light-bg': 'bg-#131313',
    'text-c-hl': 'text-#3C8DF4',
    'text-c-primary': 'text-#999999',
    'text-c-second': 'text-#666666'
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
  presets: [
    presetUno({ dark: 'class' }),
    presetWebTemplate(),
    presetIcons({
      // 可以在这里配置规则排除特定前缀
      // 确保使用不同于 iconfont 的前缀
      prefix: 'i-'
    })
  ]
});
