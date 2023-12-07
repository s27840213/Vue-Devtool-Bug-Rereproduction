import App from '@/App.vue'
import i18n from '@/i18n'
import router from '@/router'
import store from '@/store'
import { initApp } from '@nu/vivi-lib/main'
import svgIconUtils from '@nu/vivi-lib/utils/svgIconUtils'
import { createApp } from 'vue'

const app = initApp(createApp(App))
app.use(i18n).use(router).use(store)
app.mount('#app')

// Import svg icon
const svgs = require.context(
  '@nu/vivi-lib/assets/icon',
  true,
  /^((?!vivisticker\/|stk\/|cm\/).)*\.svg$/, // Skip stk & cm only icon.
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
