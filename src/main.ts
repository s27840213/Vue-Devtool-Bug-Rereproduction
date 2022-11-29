/* eslint-disable */

import Vue from 'vue'
import '@/globalComponents'
import VueRecyclerviewNew from 'vue-recyclerview'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import vueColor from 'vue-color'
import { RecycleScroller } from 'vue-virtual-scroller'
import Notifications from 'vue-notification'
import VueMeta from 'vue-meta'
import 'floating-vue/dist/style.css'
import FloatingVue from 'floating-vue'
import TooltipUtils from './utils/tooltipUtils'
import VueGtm from '@gtm-support/vue2-gtm'
import svgIconUtils from './utils/svgIconUtils'
import logUtils from './utils/logUtils'
import longpress from './utils/longpress'
import generalUtils from './utils/generalUtils'
import imageShadowUtils from './utils/imageShadowUtils'
import AnyTouch from 'any-touch'

window.onerror = function (msg, url, line) {
  const message = [
    'Message: ' + msg,
    'URL: ' + url,
    'Line: ' + line,
  ].join(' - ')
  logUtils.setLog(message)
}

// const _console = console as any
// if (_console.everything === undefined) {
//   _console.everything = []

//   _console.defaultLog = console.log.bind(console)
//   _console.log = function() {
//     _console.everything.push({ type: 'log', datetime: Date().toLocaleString(), value: Array.from(arguments) })
//     _console.defaultLog.apply(console, arguments)
//   }
//   _console.defaultError = console.error.bind(console)
//   _console.error = function() {
//     _console.everything.push({ type: 'error', datetime: Date().toLocaleString(), value: Array.from(arguments) })
//     _console.defaultError.apply(console, arguments)
//   }
//   _console.defaultWarn = console.warn.bind(console)
//   _console.warn = function() {
//     _console.everything.push({ type: 'warn', datetime: Date().toLocaleString(), value: Array.from(arguments) })
//     _console.defaultWarn.apply(console, arguments)
//   }
//   _console.defaultDebug = console.debug.bind(console)
//   _console.debug = function() {
//     _console.everything.push({ type: 'debug', datetime: Date().toLocaleString(), value: Array.from(arguments)})
//     _console.defaultDebug.apply(_console, arguments)
//   }
// }

const tooltipUtils = new TooltipUtils()

Vue.config.productionTip = false
if (process.env.NODE_ENV !== 'production') {
  Vue.config.performance = true
}
Vue.use(VueRecyclerviewNew, vueColor)
Vue.use(Notifications)
Vue.use(VueMeta)
Vue.use(FloatingVue, {
  themes: tooltipUtils.themes
})

// Vue.use(VueGtm, {
//   id: 'GTM-T7LDWBP',
//   enabled: true,
//   // display console logs debugs or not (optional)
//   debug: false
// })

Vue.component('RecycleScroller', RecycleScroller)

Vue.directive('hint', {
  // When the bound element is inserted into the DOM...
  bind: (el, binding, vnode) => {
    tooltipUtils.bind(el, binding)
  },
  update: (el, binding) => {
    tooltipUtils.bind(el, binding)
  },
  unbind: (el) => {
    tooltipUtils.unbind(el)
  }
})

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

Vue.directive('header-border', {
  /**
   * Useage: nu-header(v-header-border),
   * nu-header(v-header-border="true"),
   * nu-header(v-header-border="'.template-center'")
   * 預設偵測被加上v-header-border(簡稱header)的下一個元素
   * (簡稱target)是否在最高的位置，若是則不顯示邊框，若不是則
   * 顯示，target可以使用CSS語法選擇，第一個結果會成為target
   * 也可以直接給true指定永久顯示
  */
  bind(el, binding) {
    if (binding.value === true) {
      el.classList.add('navbar-shadow')
    } else {
      Vue.nextTick(() => {
        const target = binding.value
          ? document.querySelector(binding.value)
          : el.nextElementSibling

        target.addEventListener('scroll', (e: Event) => {
          const target = e.target as Element
          if (target?.scrollTop === 0) {
            el.classList.remove('navbar-shadow')
          } else {
            el.classList.add('navbar-shadow')
          }
        }, { passive: true })
      })
    }
  }
})

// How to pass variable to unbind: https://github.com/vuejs/vue/issues/6385#issuecomment-323141918
const anyTouchWeakMap = new WeakMap()
Vue.directive('touch', {
  /**
   * Useage: div(v-touch @tap="..." @swipeleft="...")
   * If you want to prevetDefault, use: div(v-touch="true" ...)
   */
  bind(el, binding) {
    anyTouchWeakMap.set(el, new AnyTouch(el, { preventDefault: Boolean(binding.value) }))
  },
  unbind(el){
    (anyTouchWeakMap.get(el) as AnyTouch).destroy()
    anyTouchWeakMap.delete(el)
  }
})
Vue.directive('press', longpress)

const requireAll = (requireContext: __WebpackModuleApi.RequireContext) => requireContext.keys().map(requireContext)
const req = require.context('@/assets/icon', true, /\.svg$/)

if (process.env.NODE_ENV !== 'production') {
  svgIconUtils.setIcons(requireAll(req).map((context: any) => {
    return context.default.id
  }))
} else {
  requireAll(req)
}

// add temporarily for testing
if (window.location.href.indexOf('logout') > -1) {
  localStorage.setItem('token', '')
  router.push({ name: 'Login' })
}

// let token = localStorage.getItem('token') || ''

// // if token is contained in queryString, it would be used
// const urlParams = new URLSearchParams(window.location.search)
// if (urlParams.has('token')) {
//   const tokenGet = urlParams.get('token')
//   if (tokenGet) {
//     token = tokenGet
//     localStorage.setItem('token', token)
//   }
// }

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
  Vue.config.devtools = false
}

new Vue({
  router,
  store,
  i18n,
  mounted() {
    if ((window as any).__PRERENDER_INJECTED !== undefined) {
      document.dispatchEvent(new Event('render-event'))
    }
  },
  render: (h) => h(App)
}).$mount('#app')

// Here is a testing code to export whole porject as a Library
// export default {
//   install(Vue: { component: (arg0: string, arg1: VueConstructor<Vue>) => void }, options: { store: { registerModule: (arg0: string, arg1: Store<IEditorState>) => void } }): void {
//     if (!options || !options.store) {
//       throw new Error('Please initialise plugin with a Vuex store.')
//     }
//     options.store.registerModule('nu-editor', store)
//     Vue.component('nu-editor', App as VueConstructor<Vue>)
//   }
// }
