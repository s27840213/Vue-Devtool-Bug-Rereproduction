import '@/_require' // Must be import first.
import '@/assets/css/main.css'
import Notifications from '@kyvg/vue3-notification'
import { initApp } from '@nu/vivi-lib/main'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
import vuex from './vuex'
// import '@nu/vivi-lib/css' // Import all CSS rules from vivi-lib

import.meta.glob('./assets/icon/**/*.svg', { eager: true })
import.meta.glob('../../../packages/vivi-lib/src/assets/icon/**/*.svg', { eager: true })

const app = initApp(createApp(App))

app.use(createPinia())
app.use(vuex)
app.use(router)
app.use(i18n)
app.use(Notifications)
app.mount('#app')
