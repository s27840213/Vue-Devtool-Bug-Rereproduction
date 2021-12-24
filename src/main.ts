import Vue, { VueConstructor } from 'vue'
import '@/globalComponents'
import VueRecyclerviewNew from 'vue-recyclerview'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import vueColor from 'vue-color'
import { Store } from 'vuex'
import { IEditorState } from './store/types'
import { RecycleScroller } from 'vue-virtual-scroller'
import Notifications from 'vue-notification'
import hintUtils from './utils/hintUtils'

Vue.config.productionTip = false
Vue.use(VueRecyclerviewNew, vueColor)
Vue.use(Notifications)
Vue.component('RecycleScroller', RecycleScroller)

Vue.directive('ratio-change', {
  // When the bound element is inserted into the DOM...
  bind: (el, binding, vnode) => {
    el.addEventListener('change', function () {
      el.blur()
    })
  },
  unbind: (el) => {
    el.removeEventListener('change', function () {
      el.blur()
    })
  }
})

Vue.directive('hint', {
  bind: (el, binding, vnode) => {
    hintUtils.bind(el, binding.value)
  },
  unbind: (el, binding) => {
    hintUtils.unbind(el, binding.value)
  }
})

const requireAll = (requireContext: __WebpackModuleApi.RequireContext) => requireContext.keys().map(requireContext)
const req = require.context('@/assets/icon', true, /\.svg$/)
requireAll(req)

// add temporarily for testing
if (window.location.href.indexOf('logout') > -1) {
  localStorage.setItem('token', '')
  router.push({ name: 'Login' })
}

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

if (['production'].includes(process.env.NODE_ENV)) {
  const Sentry = require('@sentry/vue')
  const { Integrations } = require('@sentry/tracing')
  Sentry.init({
    Vue,
    trackComponents: true,
    maxBreadcrumbs: 10,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    release: process.env.VUE_APP_SENTRY_RELEASE,
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router)
      })
    ],
    beforeBreadcrumb(breadcrumb: any, hint: any) {
      if (hint && breadcrumb.category && ['xhr'].includes(breadcrumb.category)) {
        const { __sentry_xhr__: request, response } = hint.xhr
        Object.assign(breadcrumb.data, { response, requestBody: request.body })
      }
      return breadcrumb
    }
  })
}

new Vue({
  router,
  store,
  i18n,
  // mounted() {
  //   document.dispatchEvent(new Event('render-event'))
  // }
  render: (h) => h(App)
}).$mount('#app')

// Here is a testing code to export whole porject as a Library
export default {
  install(Vue: { component: (arg0: string, arg1: VueConstructor<Vue>) => void }, options: { store: { registerModule: (arg0: string, arg1: Store<IEditorState>) => void } }): void {
    if (!options || !options.store) {
      throw new Error('Please initialise plugin with a Vuex store.')
    }
    options.store.registerModule('nu-editor', store)
    Vue.component('nu-editor', App as VueConstructor<Vue>)
  }
}
