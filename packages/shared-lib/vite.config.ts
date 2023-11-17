import vue from '@vitejs/plugin-vue'
import * as path from 'path'
// import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import svgSpritePlugin from 'vite-plugin-svg-sprite'

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
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
