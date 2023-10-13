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

// Pic only:
let token = localStorage.getItem('token') || ''
// if token is contained in queryString, it would be used
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.has('token')) {
  const tokenGet = urlParams.get('token')
  if (tokenGet) {
    token = tokenGet
    localStorage.setItem('token', token)
  }
}

export default app
