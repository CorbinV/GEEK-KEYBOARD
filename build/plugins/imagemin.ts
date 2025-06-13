import viteImagemin from 'vite-plugin-imagemin'
export function setupImageminPlugin() {
  return viteImagemin({
    gifsicle: { optimizationLevel: 7 },
    optipng: { optimizationLevel: 7 },
    mozjpeg: { quality: 20 },
    pngquant: { quality: [0.8, 0.9] },
    svgo: {
      plugins: [
        { name: 'removeViewBox' },
        { name: 'removeEmptyAttrs', active: false }
      ]
    }
  })
}