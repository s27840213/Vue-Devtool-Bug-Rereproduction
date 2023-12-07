import '@/_require' // Must be import first.
import '@/assets/css/main.css'
import { initApp } from '@nu/vivi-lib/main'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
import vuex from './vuex'
import svgIconUtils from '@nu/vivi-lib/utils/svgIconUtils'
// import '@nu/vivi-lib/css' // Import all CSS rules from vivi-lib

const svgs = import.meta.glob([
    '../../../packages/vivi-lib/src/assets/icon/**/*.svg',
    // Skip pic & stk only icon.
    '!../../../packages/vivi-lib/src/assets/icon/(vivisticker|stk|pic)/**/*.svg',
  ],
  { eager: true }
)

Object.keys(svgs).forEach(icon => {
  svgIconUtils.pushIcon(icon.match(/\/([^/]+)\.svg/)![1])
})

const app = initApp(createApp(App))

app.use(createPinia())
app.use(vuex)
app.use(router)
app.use(i18n)
app.mount('#app')
