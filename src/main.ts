/* eslint-disable */

import Vue, { createApp, h, nextTick } from 'vue';
import VueRecyclerviewNew from 'vue-recyclerview'
import App from '@/App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import VueMeta from 'vue-meta'
// import 'floating-vue/dist/style.css'
// import FloatingVue from 'floating-vue'
import TooltipUtils from './utils/tooltipUtils'
import VueGtm from '@gtm-support/vue2-gtm'
import svgIconUtils from './utils/svgIconUtils'
import logUtils from './utils/logUtils'
import longpress from './utils/longpress'
import generalUtils from './utils/generalUtils'
import imageShadowUtils from './utils/imageShadowUtils'
import Notifications from '@kyvg/vue3-notification'

// global component section
import SvgIcon from '@/components/global/SvgIcon.vue'
import PropertyBar from '@/components/global/PropertyBar.vue'
import Btn from '@/components/global/Btn.vue'
import NuPage from '@/components/editor/global/NuPage.vue'
import NuLayer from '@/components/editor/global/NuLayer.vue'
import NuImage from '@/components/editor/global/NuImage.vue'
import NuText from '@/components/editor/global/NuText.vue'
import NuTmp from '@/components/editor/global/NuTmp.vue'
import NuGroup from '@/components/editor/global/NuGroup.vue'
import NuClipper from '@/components/editor/global/NuClipper.vue'
import NuController from '@/components/editor/global/NuController.vue'
import NuSubController from '@/components/editor/global/NuSubController.vue'
import NuShape from '@/components/editor/global/NuShape.vue'
import NuImgController from '@/components/editor/global/NuImgController.vue'
import NuFrame from '@/components/editor/global/NuFrame.vue'
import Nubtn from '@/components/global/Nubtn.vue'
import Spinner from '@/components/global/Spinner.vue'
import Hint from '@/components/global/Hint.vue'
import Dropdown from '@/components/global/Dropdown.vue'
import { RecycleScroller } from 'vue-virtual-scroller'
// global component section
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


const app = createApp(App).use(i18n).use(router).use(store)

const tooltipUtils = new TooltipUtils()

if (process.env.NODE_ENV !== 'production') {
  app.config.performance = true
}
app.use(VueRecyclerviewNew)
app.use(Notifications)
// app.use(VueMeta)
// app.use(FloatingVue, {
//   themes: tooltipUtils.themes
// })

// app.use(VueGtm, {
//   id: 'GTM-T7LDWBP',
//   enabled: true,
//   // display console logs debugs or not (optional)
//   debug: false
// })

app.component('RecycleScroller', RecycleScroller)

app.component('svg-icon', SvgIcon)
app.component('btn', Btn)
app.component('property-bar', PropertyBar)
app.component('dropdown', Dropdown)
app.component('nu-page', NuPage)
app.component('nu-image', NuImage)
app.component('nu-layer', NuLayer)
app.component('nu-text', NuText)
app.component('nu-group', NuGroup)
app.component('nu-tmp', NuTmp)
app.component('nu-clipper', NuClipper)
app.component('nu-controller', NuController)
app.component('nu-sub-controller', NuSubController)
app.component('nu-shape', NuShape)
app.component('nu-img-controller', NuImgController)
app.component('nu-frame', NuFrame)
app.component('nubtn', Nubtn)
app.component('spinner', Spinner)
app.component('hint', Hint)


app.directive('hint', {
  // When the bound element is inserted into the DOM...
  mounted: (el, binding, vnode) => {
    tooltipUtils.bind(el, binding)
  },
  beforeUpdate: (el, binding) => {
    tooltipUtils.bind(el, binding)
  },
  unmounted: (el) => {
    tooltipUtils.unbind(el)
  }
})

app.directive('ratio-change', {
  // When the bound element is inserted into the DOM...
  mounted: (el, binding, vnode) => {
    el.addEventListener('change', function () {
      el.blur()
    })
  },
  unmounted: (el) => {
    el.removeEventListener('change', function () {
      el.blur()
    })
  }
})

app.directive('header-border', {
  /**
   * Useage: nu-header(v-header-border),
   * nu-header(v-header-border="true"),
   * nu-header(v-header-border="'.template-center'")
   * 預設偵測被加上v-header-border(簡稱header)的下一個元素
   * (簡稱target)是否在最高的位置，若是則不顯示邊框，若不是則
   * 顯示，target可以使用CSS語法選擇，第一個結果會成為target
   * 也可以直接給true指定永久顯示
  */
  mounted(el, binding) {
    if (binding.value === true) {
      el.classList.add('navbar-shadow')
    } else {
      nextTick(() => {
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
app.directive('touch', {
  /**
   * Useage: div(v-touch @tap="..." @swipeleft="...")
   * If you want to prevetDefault, use: div(v-touch="true" ...)
   */
  mounted: (el, binding, vnode) => {
    anyTouchWeakMap.set(el, new AnyTouch(el, { preventDefault: Boolean(binding.value) }))
  },
  unmounted: (el, binding, vnode) => {
    (anyTouchWeakMap.get(el) as AnyTouch).destroy()
    anyTouchWeakMap.delete(el)
  }
})
app.directive('press', longpress)

const requireAll = (requireContext: __WebpackModuleApi.RequireContext) => requireContext.keys().map(requireContext)
const req = require.context('@/assets/icon', true, /\.svg$/)

if (window.location.host !== 'vivipic.com') {
  svgIconUtils.setIcons(requireAll(req).map((context: any) => {
    return context.default?.id ?? ''
  }))
} else {
  requireAll(req)
}

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

// if (['production'].includes(process.env.NODE_ENV)) {
//   const Sentry = require('@sentry/vue')
//   const { Integrations } = require('@sentry/tracing')
//   Sentry.init({
//     Vue,
//     trackComponents: true,
//     maxBreadcrumbs: 10,
//     tracesSampleRate: 1.0,
//     environment: process.env.NODE_ENV,
//     dsn: process.env.VUE_APP_SENTRY_DSN,
//     release: process.env.VUE_APP_SENTRY_RELEASE,
//     integrations: [
//       new Integrations.BrowserTracing({
//         routingInstrumentation: Sentry.vueRouterInstrumentation(router)
//       })
//     ],
//     beforeBreadcrumb(breadcrumb: any, hint: any) {
//       if (hint && breadcrumb.category && ['xhr'].includes(breadcrumb.category)) {
//         const { __sentry_xhr__: request, response } = hint.xhr
//         Object.assign(breadcrumb.data, { response, requestBody: request.body })
//       }
//       return breadcrumb
//     }
//   })
//   // app.config.devtools = false
// }


app.mount('#app')
