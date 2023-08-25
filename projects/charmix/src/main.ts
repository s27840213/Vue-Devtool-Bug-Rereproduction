import '@/assets/css/main.css'
import componentPlugin from '@nu/shared-lib/plugin'
import libType from '@nu/shared-lib/types'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'

const svgs = import.meta.glob('./assets/icon/**/*.svg', { eager: true })
const app = createApp(App)

// the *.d.ts file for the global components in shared-lib, must call it once or it will be clear
libType
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(componentPlugin)
// call it once or it may be clear by gbg colection
svgs
app.mount('#app')
