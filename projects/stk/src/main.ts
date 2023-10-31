import router from '@/router'
import store from '@/store'
import { initApp } from '@nu/vivi-lib/main'
import { createApp } from 'vue'
import i18n from '@/i18n'
import svgIconUtils from '@nu/vivi-lib/utils/svgIconUtils'
import App from '@/App.vue'

const app = initApp(createApp(App))
app.use(i18n).use(router).use(store)
app.mount('#app')

// Import svg icon
const svgs = require.context(
  '@nu/vivi-lib/assets/icon',
  true,
  /^((?!pic\/).)*\.svg$/, // Skip pic only icon.
  'lazy-once'
)
const svgModules = svgs.keys().map(svgs) as Promise<{ default: { id: string} }>[]
if (window.location.host !== 'sticker.vivipic.com') {
  svgModules.forEach(promise => {
    promise.then(context => {
      svgIconUtils.pushIcon(context.default.id)
    })
  })
}

export default app
