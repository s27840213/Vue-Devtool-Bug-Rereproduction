import vue from '@vitejs/plugin-vue'
import * as path from 'path'
// import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import svgSpritePlugin from 'vite-plugin-svg-sprite'

function resolve(...dir: string[]) {
  return path.join(__dirname, ...dir)
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgSpritePlugin({
      symbolId: '[name]',
      svgo: false,
      include: '**/src/assets/icon/**/*.svg',
    }),
    // Components({
    //   dirs: ['src/components'],
    //   extensions: ['vue'],
    //   dts: 'src/components.d.ts',
    // }),
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: 'src/main.ts',
      name: '@nu/shared-lib',
      formats: ['es'],
      fileName: (format, entry) => `${entry}.${format}.js`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
        // preserveModules can keep dist folder structure
        // https://github.com/vitejs/vite/discussions/2447#discussioncomment-6768114
        preserveModules: true,
        preserveModulesRoot: './',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve('src'),
      '@nu/vivi-lib': resolve('../../packages/vivi-lib/src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@nu/vivi-lib/assets/scss/utils" as *;',
      },
    },
  },
})
