import '@/assets/css/main.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
const svgs = import.meta.glob('./assets/icon/**/*.svg', { eager: true })
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
// call it once or it may be clear by gbg colection
svgs
app.mount('#app')
