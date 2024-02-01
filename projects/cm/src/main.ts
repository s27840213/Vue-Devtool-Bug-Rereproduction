import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// import '@nu/vivi-lib/css' // Import all CSS rules from vivi-lib

const app = createApp(App)

app.use(router)
app.mount('#app')
