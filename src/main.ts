import App from '@/App.vue'
import NuClipper from '@/components/editor/global/NuClipper.vue'
import NuController from '@/components/editor/global/NuController.vue'
import NuFrame from '@/components/editor/global/NuFrame.vue'
import NuGroup from '@/components/editor/global/NuGroup.vue'
import NuImage from '@/components/editor/global/NuImage.vue'
import NuImgController from '@/components/editor/global/NuImgController.vue'
import NuLayer from '@/components/editor/global/NuLayer.vue'
import NuPage from '@/components/editor/global/NuPage.vue'
import NuShape from '@/components/editor/global/NuShape.vue'
import NuSubController from '@/components/editor/global/NuSubController.vue'
import NuText from '@/components/editor/global/NuText.vue'
import NuTmp from '@/components/editor/global/NuTmp.vue'
import Btn from '@/components/global/Btn.vue'
import Dropdown from '@/components/global/Dropdown.vue'
import Hint from '@/components/global/Hint.vue'
import Nubtn from '@/components/global/Nubtn.vue'
import PropertyBar from '@/components/global/PropertyBar.vue'
import Spinner from '@/components/global/Spinner.vue'
import SvgIcon from '@/components/global/SvgIcon.vue'
import Core from '@any-touch/core'
import swipe from '@any-touch/swipe'
import Notifications from '@kyvg/vue3-notification'
import AnyTouch from 'any-touch'
import FloatingVue from 'floating-vue'
import platform from 'platform'
import { createApp, nextTick } from 'vue'
import { createMetaManager, plugin as metaPlugin } from 'vue-meta'
import VueRecyclerviewNew from 'vue-recyclerview'
import { RecycleScroller } from 'vue-virtual-scroller'
import i18n from './i18n'
import router from './router'
import store from './store'
import generalUtils from './utils/generalUtils'
import logUtils from './utils/logUtils'
import longpress from './utils/longpress'
import svgIconUtils from './utils/svgIconUtils'
import TooltipUtils from './utils/tooltipUtils'

window.onerror = function (msg, url, line) {
  const message = [
    'Message: ' + msg,
    'URL: ' + url,
    'Line: ' + line,
  ].join(' - ')
  logUtils.setLog(message)
}

const app = createApp(App).use(i18n).use(router).use(store)

store.commit('user/SET_BroswerInfo', {
  name: platform.name,
  version: platform.version,
  os: platform.os
})

// Add variable that bind in vue this and its type define
// Ex: div(v-if="$isTouchDevice()" ...) in pug
// Ex: if (this.$isTouchDevice()) in .vue ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $isTouchDevice: () => boolean
  }
}
app.config.globalProperties.$isTouchDevice = () => generalUtils.isTouchDevice()

const tooltipUtils = new TooltipUtils()

if (process.env.NODE_ENV !== 'production') {
  app.config.performance = true
}
app.use(VueRecyclerviewNew)
app.use(Notifications)
app.use(createMetaManager())
app.use(metaPlugin) // optional, only needed for OptionsAPI (see below)
app.use(FloatingVue, {
  themes: tooltipUtils.themes
})

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
  mounted(el, binding) {
    // pass preventDefault as function to fix tap event issue of apple pencil for unknown reason
    const preventDefault = (event: Event) => {
      return Boolean(binding.value)
    }
    const at = new AnyTouch(el, { preventDefault })
    at.get('tap').maxDistance = 10 // raise max move distance to trigger double tap event more easily for apple pencil
    anyTouchWeakMap.set(el, at)
  },
  unmounted: (el, binding, vnode) => {
    (anyTouchWeakMap.get(el) as AnyTouch).destroy()
    anyTouchWeakMap.delete(el)
  }
})

app.directive('custom-swipe', {
  mounted: (el, binding, vnode) => {
    const at = new Core(el as HTMLElement, {
      preventDefault: false
    })
    anyTouchWeakMap.set(el, at)
    // trigger the swipe if moving velocity larger than "velocity" per ms
    // and move distance larger than threshhold
    at.use(swipe, {
      // means 10px/ms
      velocity: 0.1,
      threshold: 5
    })

    at.on('swipe', (event) => {
      binding.value(event)
    })
  },
  unmounted: (el, binding, vnode) => {
    if (anyTouchWeakMap.has(el)) {
      (anyTouchWeakMap.get(el) as Core).off('swipe')
      anyTouchWeakMap.delete(el)
    }
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
