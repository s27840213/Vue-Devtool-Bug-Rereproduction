import vue from '@vitejs/plugin-vue'
import * as path from 'path'
// import typescript2 from 'rollup-plugin-typescript2'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import svgSpritePlugin from 'vite-plugin-svg-sprite-component'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgSpritePlugin.default({ symbolId: (name) => name }),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: 'src/components.d.ts',
    }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n'],
      dts: 'src/auto-import.d.ts',
    }),
  ],
  build: {
    cssCodeSplit: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: ['src/index.ts', 'src/plugin.ts', 'src/types.ts'],
      name: '@nu/shared-lib',
      formats: ['es', 'cjs'],
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
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
