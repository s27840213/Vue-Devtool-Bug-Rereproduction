import '@/assets/css/main.css'
import componentPlugin from '@nu/shared-lib/plugin'
import libType from '@nu/shared-lib/types'
import { initApp } from '@nu/vivi-lib/main'

import '@nu/vivi-lib/css'; // Import all CSS rules from vivi-lib
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
import vuex from './vuex'

const svgs = import.meta.glob('./assets/icon/**/*.svg', { eager: true })
const app = initApp(createApp(App))

// Call variable to prevent it be clear, no any other meaning.
function keepVar(v: unknown) {
  !true && console.log(v)
}

// the *.d.ts file for the global components in shared-lib
keepVar(libType)
keepVar(svgs)

app.use(createPinia())
app.use(vuex)
app.use(router)
app.use(i18n)
app.use(componentPlugin)
app.mount('#app')
