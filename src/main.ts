import App from '@/App.vue'
import PropertyBar from '@/components/global/PropertyBar.vue'
import SvgIcon from '@/components/global/SvgIcon.vue'
import modalUtils from '@/utils/modalUtils'
import Core from '@any-touch/core'
import swipe from '@any-touch/swipe'
import Notifications, { notify } from '@kyvg/vue3-notification'
import AnyTouch from 'any-touch'
import FloatingVue from 'floating-vue'
import mitt, { Emitter, EventType } from 'mitt'
import platform from 'platform'
import { ComputedRef, createApp, defineAsyncComponent, nextTick } from 'vue'
import { createMetaManager, plugin as metaPlugin } from 'vue-meta'
import VueRecyclerviewNew from 'vue-recyclerview'
import { RecycleScroller } from 'vue-virtual-scroller'
import i18n from './i18n'
import router from './router'
import store from './store'
import generalUtils from './utils/generalUtils'
import logUtils from './utils/logUtils'
import longpress from './utils/longpress'
import TooltipUtils from './utils/tooltipUtils'

const eventBus = mitt()
window.onerror = function (msg, url, line, colno, error) {
  const errorId = generalUtils.generateRandomString(6)
  const message = [
    'Error ID:' + errorId,
    'Message: ' + msg,
    'URL: ' + url,
    'Line: ' + line,
    'Col: ' + colno,
    'Stack: ' + error?.stack
  ].join(' - ')
  logUtils.setLog(message, false) // don't trim the log for stack to be entirely shown
  logUtils.uploadLog().then(() => {
    console.log('showGlobalErrorModal: ', store.getters.getShowGlobalErrorModal)
    // if (store.getters['user/isAdmin'] && (window.location.hostname !== 'vivipic.com' || store.getters.getShowGlobalErrorModal))
    if (store.getters['user/isAdmin']) {
      const hint = `${store.getters['user/getUserId']}, ${generalUtils.generateTimeStamp()}, ${errorId}`
      modalUtils.setModalInfo(
        i18n.global.t('NN0866'),
        hint,
        {
          msg: i18n.global.t('NN0032'),
          action() {
            generalUtils.copyText(hint).then(() => {
              notify({ group: 'copy', text: '已複製' })
            })
          }
        }
      )
    }
  })
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
    $isTouchDevice: () => boolean,
    $eventBus: Emitter<Record<EventType, unknown>>
  }
  function provide<T>(key: InjectionKey<T> | string | number, value: T | ComputedRef<T>): void
}
// app.config.unwrapInjectedRef = true
app.config.globalProperties.$isTouchDevice = () => generalUtils.isTouchDevice()
app.config.globalProperties.$isTablet = () => generalUtils.isTablet()
app.config.globalProperties.$eventBus = eventBus

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
app.component('btn', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/global/Btn.vue')
))
/**
 * bcz this components use slot, and some components need to get its ref in mounted,
 * so we can't use async component
 */
app.component('property-bar', PropertyBar)
app.component('dropdown', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/global/Dropdown.vue')
))
app.component('nu-image', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuImage.vue')
))
app.component('nu-layer', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuLayer.vue')
))
app.component('nu-text', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuText.vue')
))
app.component('nu-group', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuGroup.vue')
))
app.component('nu-tmp', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuTmp.vue')
))
app.component('nu-controller', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuController.vue')
))
app.component('nu-sub-controller', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuSubController.vue')
))
app.component('nu-shape', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuShape.vue')
))
app.component('nu-img-controller', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuImgController.vue')
))
app.component('nu-frame', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/editor/global/NuFrame.vue')
))
app.component('nubtn', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/global/Nubtn.vue')
))
app.component('spinner', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/global/Spinner.vue')
))
app.component('hint', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@/components/global/Hint.vue')
))

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

function setProgressStyle(el: HTMLInputElement) {
  nextTick(() => {
    if (el.disabled) {
      el.style.setProperty('--base', '0')
      el.style.setProperty('--progress', '50%')
    } else {
      el.style.setProperty('--base', `${(Math.min(+el.value, 0) - (+el.min)) / (+el.max - (+el.min)) * 100}%`)
      el.style.setProperty('--progress', `${(Math.max(+el.value, 0) - (+el.min)) / (+el.max - (+el.min)) * 100}%`)
    }
  })
}

app.directive('progress', {
  mounted: (el) => {
    setProgressStyle(el)
  },
  updated: (el) => {
    setProgressStyle(el)
  }
})

/**
 * move to the SvgIcon.vue component
 */
// document.addEventListener('DOMContentLoaded', async () => {
//   const requireAll = (requireContext: __WebpackModuleApi.RequireContext) => requireContext.keys().map(requireContext)
//   const req = require.context('@/assets/icon', true, /\.svg$/)

//   if (window.location.host !== 'vivipic.com') {
//     svgIconUtils.setIcons(requireAll(req).map((context: any) => {
//       return context.default?.id ?? ''
//     }))
//   } else {
//     requireAll(req)
//   }
// }, false)

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
export default app
