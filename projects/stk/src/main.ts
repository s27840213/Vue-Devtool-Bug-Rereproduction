import App from '@/App.vue'
import router from '@/router'
// Import all CSS rules from vivi-lib
import '@nu/vivi-lib/css'
import store from '@/store'
import { initApp } from '@nu/vivi-lib/main'
import { createApp } from 'vue'
import i18n from '@/i18n'

const app = initApp(createApp(App))
app.use(i18n).use(router).use(store)
app.mount('#app')

export default app
