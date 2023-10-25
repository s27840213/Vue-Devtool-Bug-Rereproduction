import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
// https://vue-i18n.intlify.dev/guide/advanced/optimization.html
import vuei18n from '@intlify/unplugin-vue-i18n/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import svgSpritePlugin from 'vite-plugin-svg-sprite-component'

function resolve(...dir: string[]) {
  return path.join(__dirname, ...dir)
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuei18n({
      // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
      compositionOnly: false,
      runtimeOnly: false,
      // you need to set i18n resource including paths !
      include: path.resolve(__dirname, './src/locales'),
    }),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: 'src/components.d.ts',
    }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n'],
      dts: 'src/auto-import.d.ts',
      ignore: ['h'], // To solve: https://www.jianshu.com/p/1739e6bcb543
    }),
    svgSpritePlugin({ symbolId: (name) => name }),
  ],
  resolve: {
    alias: {
      '@i18n': resolve(
        process.env.NODE_ENV === 'production' 
          ? 'src/i18n/shaked/'
          : '../../tools/i18n-tool/result'
      ),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8082,
    host: true,
  },
  define: {
    // process not define in vite, inject it here.
    // Ref: https://stackoverflow.com/a/66389044/22514709, https://stackoverflow.com/a/73012106/22514709
    'process.env': loadEnv('production', process.cwd(), 'VUE_APP'),
  },
})
