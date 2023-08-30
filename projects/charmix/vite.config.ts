import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'path'
import { defineConfig } from 'vite'
// https://vue-i18n.intlify.dev/guide/advanced/optimization.html
import vuei18n from '@intlify/unplugin-vue-i18n/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import svgSpritePlugin from 'vite-plugin-svg-sprite-component'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuei18n({
      // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
      compositionOnly: false,
      runtimeOnly: false,
      // you need to set i18n resource including paths !
      include: path.resolve(__dirname, './src/locales')
    }),
    svgSpritePlugin({ symbolId: (name) => name }),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: 'src/components.d.ts'
    }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n'],
      dts: 'src/auto-import.d.ts'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8082,
    host: true,
  }
})
