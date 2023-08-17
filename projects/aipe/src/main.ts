import '@/assets/css/main.css'
import components from 'component-lib'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
const svgs = import.meta.glob('./assets/icon/*.svg', { eager: true })
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(components as any)
svgs
console.log(components)

app.mount('#app')
