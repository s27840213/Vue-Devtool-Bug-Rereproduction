import '@/assets/css/main.css'
import NuSvgIcon from '@/components/global/NuSvgIcon.vue'
import componentPlugin from 'component-lib/plugin'
import libType from 'component-lib/types'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
const svgs = import.meta.glob('./assets/icon/*.svg', { eager: true })
const app = createApp(App)

// the *.d.ts file for the global components in component-lib
libType
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(componentPlugin)
app.component('NuSvgIcon', NuSvgIcon)
// call it once or it may be clear by gbg colection
svgs
app.mount('#app')
