import App from '@/App.vue'
import router from '@/router'
import '@nu/vivi-lib/css' // Import all CSS rules from vivi-lib
import store from '@/store'
import { initApp } from '@nu/vivi-lib/main'
import { createApp } from 'vue'
import i18n from '@/i18n'
import svgIconUtils from '@nu/vivi-lib/utils/svgIconUtils'

const app = initApp(createApp(App))
app.use(i18n).use(router).use(store)
app.mount('#app')

// Import svg icon
const svgs = require.context(
  // If we use '@nu/vivi-lib/assets/icon' here, webpack will throw an error: Module not found.
  '../../../packages/vivi-lib/dist/src/assets/icon',
  true,
  /^((?!vivisticker\/|stk).)*\.svg$/, // Skip stk only icon.
  'lazy-once'
)
const svgModules = svgs.keys().map(svgs) as Promise<{ default: { id: string} }>[]
if (window.location.host !== 'vivipic.com') {
  svgModules.forEach(promise => {
    promise.then(context => {
      svgIconUtils.pushIcon(context.default.id)
    })
  })
}

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
