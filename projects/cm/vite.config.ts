import vuei18n from '@intlify/unplugin-vue-i18n/vite'; // https://vue-i18n.intlify.dev/guide/advanced/optimization.html
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';
import svgSpritePlugin from 'vite-plugin-svg-sprite';
import transformPlugin from 'vite-plugin-transform';

function resolve(...dir: string[]) {
  return path.join(__dirname, ...dir)
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // When Using pug with option api, it will treat ts in pug as js,
    // so remove type assertions to resolve the issue.
    // https://github.com/vitejs/vite-plugin-vue/issues/18#issuecomment-1719035794
    transformPlugin({
      exclude: ['node_modules', /(?<!\.vue)$/],
      callbackArray: [
        (s: string) => s.replace(/(?<==".+)( as [\w<>|', ]+)/g, '')
      ]
    }),
    vue(),
    vuei18n({ // TODO: Check if this plugin will decrease bundle size.
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
      imports: ['vue', 'vue-router', 'vue-i18n', '@vueuse/core', 'pinia'],
      dts: 'src/auto-import.d.ts',
      ignore: ['h'], // To solve: https://www.jianshu.com/p/1739e6bcb543
    }),
    svgSpritePlugin({
      symbolId: '[name]',
      svgo: false,
      include: '**/src/assets/icon/**/*.svg',
    }),
  ],
  resolve: {
    alias: [{
      find: '@nu/vivi-lib',
      replacement: resolve('../../packages/vivi-lib/src'),
    }, {
      find: '@i18n',
      replacement: resolve(
        process.env.NODE_ENV === 'production' ? 'src/i18n/shaked/' : '../../tools/i18n-tool/result',
      ),
    }, {
      find: '@img',
      replacement: resolve('../../packages/vivi-lib/src/assets/img'),
    }, {
      find: '@json',
      replacement: resolve('../../packages/vivi-lib/src/assets/json'),
    }, {
      find: '@',
      replacement: resolve('src'),
      customResolver(source, importer, options) {
        if (importer?.includes('packages/')) {
          source = source.replace('projects/cm', 'packages/vivi-lib')
        }

        if (/\.[\w]{2,4}$/.test(source)) { // With extension
          return source
        }

        for (const ext of ['.ts', '/index.ts']) { // Without extension
          if (fs.existsSync(source + ext)) {
            return source + ext
          }
        }
      },
    }, {
      find: '~',
      replacement: resolve('node_modules/'),
    }]
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@nu/vivi-lib/assets/scss/utils" as *;',
      },
    },
  },
  server: {
    port: 8082,
    host: true,
  },
  preview: {
    port: 8082,
  },
  define: {
    // process not define in vite, inject it here.
    // Ref: https://stackoverflow.com/a/66389044/22514709, https://stackoverflow.com/a/73012106/22514709
    'process.env': loadEnv('production', process.cwd(), 'VUE_APP'),
  },
})
