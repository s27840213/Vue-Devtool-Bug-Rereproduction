import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import ViteRequireContext from '@originjs/vite-plugin-require-context'
import envCompatible from 'vite-plugin-env-compatible'
import { createHtmlPlugin } from 'vite-plugin-html'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import vueI18n from '@intlify/vite-plugin-vue-i18n'
import svgSpritePlugin from 'vite-plugin-svg-sprite-component'
import OptimizationPersist from 'vite-plugin-optimize-persist'
import PkgConfig from 'vite-plugin-package-config'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^~/,
        replacement: ''
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ],
    extensions: [
      '.mjs',
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
      '.vue'
    ]
  },
  plugins: [
    vue(),
    vueJsx(),
    ViteRequireContext(),
    viteCommonjs({ exclude: ['html2pdf_js', 'html2pdf__js'] }),
    envCompatible(),
    createHtmlPlugin({
      inject: {
        data: {
          title: 'nueditor'
        }
      }
    }),
    PkgConfig(),
    OptimizationPersist()
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/scss/utils" as *;'
      }
    }
  },
  build: {},
  server: {
    port: 8080
  }
})
