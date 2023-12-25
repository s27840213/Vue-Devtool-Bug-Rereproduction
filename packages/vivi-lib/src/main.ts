import colorUtils from '@/utils/colorUtils'
import modalUtils from '@/utils/modalUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import Core from '@any-touch/core'
import swipe from '@any-touch/swipe'
import Notifications, { notify } from '@kyvg/vue3-notification'
import PropertyBar from '@nu/shared-lib/components/PropertyBar.vue'
import SvgIcon from '@nu/shared-lib/components/SvgIcon.vue'
import '@nu/shared-lib/css'
import AnyTouch from 'any-touch'
import FloatingVue from 'floating-vue'
import mitt, { Emitter, EventType } from 'mitt'
import platform from 'platform'
import { App, ComputedRef, DirectiveBinding, defineAsyncComponent, nextTick } from 'vue'
import { createMetaManager, plugin as metaPlugin } from 'vue-meta'
import VueRecyclerviewNew from 'vue-recyclerview'
import { RecycleScroller } from 'vue-virtual-scroller'
import i18n from './i18n'
import store from './store'
import generalUtils from './utils/generalUtils'
import logUtils from './utils/logUtils'
import longpress from './utils/longpress'
import TooltipUtils from './utils/tooltipUtils'
import { useEventListener } from '@vueuse/core'
// import '@/imports'

// Add variable that bind in vue this and its type define
// Ex: div(v-if="$isTouchDevice()" ...) in pug
// Ex: if (this.$isTouchDevice()) in .vue ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $isTouchDevice: () => boolean,
    $isPic: boolean
    $isStk: boolean
    $isCm: boolean
    $eventBus: Emitter<Record<EventType, unknown>>
  }
  function provide<T>(key: InjectionKey<T> | string | number, value: T | ComputedRef<T>): void
}

export function initApp(app: App<Element>) {
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
    if ((generalUtils.isPic && store.getters['user/isAdmin']) ||
        (generalUtils.isStk && store.getters['vivisticker/getDebugMode'])) {
      const id = generalUtils.isPic 
        ? store.getters['user/getUserId']
        : stkWVUtils.getUserInfoFromStore().hostId
      const hint = `${id}, ${generalUtils.generateTimeStamp()}, ${errorId}`
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

store.commit('user/SET_BroswerInfo', {
  name: platform.name,
  version: platform.version,
  os: platform.os
})

// app.config.unwrapInjectedRef = true
app.config.globalProperties.$isTouchDevice = () => generalUtils.isTouchDevice()
app.config.globalProperties.$isTablet = () => generalUtils.isTablet()
app.config.globalProperties.$isPic = generalUtils.isPic
app.config.globalProperties.$isStk = generalUtils.isStk
app.config.globalProperties.$isCm = generalUtils.isCm
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
  import(/* webpackChunkName: "global-component" */ '@nu/shared-lib/components/Btn.vue')
))
/**
 * bcz this components use slot, and some components need to get its ref in mounted,
 * so we can't use async component
 */
app.component('property-bar', PropertyBar)
app.component('dropdown', defineAsyncComponent(() =>
  import(/* webpackChunkName: "global-component" */ '@nu/shared-lib/components/Dropdown.vue')
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
  mounted: (el, binding) => {
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
  mounted: (el) => {
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
  mounted: (el, binding) => {
    // pass preventDefault as function to fix tap event issue of apple pencil for unknown reason
    const preventDefault = () => {
      return Boolean(binding.value)
    }
    const at = new AnyTouch(el, { preventDefault })
    at.get('tap').maxDistance = 10 // raise max move distance to trigger double tap event more easily for apple pencil
    anyTouchWeakMap.set(el, at)
  },
  unmounted: (el) => {
    (anyTouchWeakMap.get(el) as AnyTouch).destroy()
    anyTouchWeakMap.delete(el)
  }
})

app.directive('custom-swipe', {
  mounted: (el, binding) => {
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
  unmounted: (el) => {
    if (anyTouchWeakMap.has(el)) {
      (anyTouchWeakMap.get(el) as Core).off('swipe')
      anyTouchWeakMap.delete(el)
    }
  }
})

let changeColor: (e: Event) => void
let resetColor: (e: Event) => void
app.directive('tap-animation', {
  mounted(el: HTMLElement, binding) {
    const { initColor, color, initBgColor, bgColor, disabled, animationDuration = 0.2 } = binding.value

    // Store the original color of the element
    el.dataset.initColor = initColor ?? el.style.color
    el.dataset.initBgColor = initBgColor ?? el.style.backgroundColor
    el.style.transition = `background-color ${animationDuration}s ease-in, color ${animationDuration}s ease`

    // console.log()
    // Add a click event listener to the element

    changeColor = () => {
      if (disabled) return
      // Change the color to the second argument passed to the directive
      if (color) {
        el.style.color = 'none'
        el.classList.add(color)
      }

      if (bgColor) {
        el.style.backgroundColor = colorUtils.colorMap.get(bgColor as string) as string
        el.classList.add(`bg-${bgColor}`)
      }
    }

    resetColor = () => {
      setTimeout(() => {
        el.style.color = el.dataset.initColor as string
        el.style.backgroundColor = el.dataset.initBgColor as string
      }, animationDuration * 1000)
    }
    el.addEventListener('pointerdown', changeColor)
    el.addEventListener('pointerup', resetColor)
  },
  unmounted(el: HTMLElement) {
    el.removeEventListener('pointerdown', changeColor)
    el.removeEventListener('pointerup', resetColor)
  }
})

app.directive('press', longpress)

function setProgressStyle(el: HTMLInputElement) {
  nextTick(() => {
    const value = +el.value
    const max = +el.max || 100
    const min = +el.min || 0
    if (el.disabled) {
      el.style.setProperty('--base', '0')
      el.style.setProperty('--progress', '50%')
    } else {
      el.style.setProperty(
        '--base',
        `${(Math.min(value, 0) - min) / (max - min) * 100}%`
      )
      el.style.setProperty(
        '--progress',
        `${(Math.max(value, 0) - min) / (max - min) * 100}%`
      )
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

type FadeScrollerOption = {
  fadeWidth: string
  left: boolean
  right: boolean
}
function updateFadeScroller(el: HTMLElement, binding: DirectiveBinding<Partial<FadeScrollerOption> | undefined>) {
  const { fadeWidth = '48px', left = !0, right = !0 } = binding.value ?? {}
  const { scrollLeft, scrollWidth, offsetWidth } = el
  const leftOverflow = left && scrollLeft > 0
  const rightOverflow = right && scrollLeft + 1 < (scrollWidth - offsetWidth) && scrollWidth > offsetWidth

  // Use mask-image implement fade scroll style, https://stackoverflow.com/a/70971847
  el.style.maskImage = `
    linear-gradient(to right,
      transparent 0, black ${leftOverflow ? fadeWidth : 0},
      black calc(100% - ${rightOverflow ? fadeWidth : '0px'}), transparent 100%)`
}
app.directive('fade-scroller', {
  mounted: (el: HTMLElement, binding) => {
    nextTick(() => updateFadeScroller(el, binding))
    useEventListener(el, 'scroll', () => updateFadeScroller(el, binding), { passive: true })
  },
  updated: updateFadeScroller,
})

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

return app
}
