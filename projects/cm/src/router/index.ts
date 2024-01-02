import useUploadUtils from '@/composable/useUploadUtils'
import { useUserStore } from '@/stores/user'
import HomeView from '@/views/HomeView.vue'
import Screenshot from '@/views/ScreenshotView.vue'
import store from '@/vuex'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import { IPrices } from '@nu/vivi-lib/interfaces/payment'
import router from '@nu/vivi-lib/router'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import constantData from '@nu/vivi-lib/utils/constantData'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import localeUtils from '@nu/vivi-lib/utils/localeUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import loginUtils from '@nu/vivi-lib/utils/loginUtils'
import textFillUtils from '@nu/vivi-lib/utils/textFillUtils'
import uploadUtils from '@nu/vivi-lib/utils/uploadUtils'
import { h, resolveComponent } from 'vue'
import { RouteRecordRaw } from 'vue-router'
import { editorRouteHandler } from './handler'

const routes = [
  {
    path: '/',
    name: 'Home',
    meta: {
      transition: 'fade-top-in',
      scrollPos: { top: 0, left: 0 },
    },
    component: HomeView,
  },
  {
    path: '/mydesign',
    name: 'MyDesign',
    meta: {
      transition: 'fade-right-in',
    },
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('@/views/MyDesignView.vue'),
  },
  {
    path: '/editor',
    name: 'Editor',
    meta: {
      transition: 'fade-bottom-in',
    },
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('@/views/EditorView.vue'),
    beforeEnter: editorRouteHandler,
  },
  {
    path: '/description',
    name: 'Description',
    meta: {
      transition: 'fade-bottom-in',
    },
    component: () => import('@/views/DescriptionView.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    meta: {
      transition: 'fade-bottom-in',
    },
    component: () => import('@/views/SettingsView.vue'),
  },
  {
    path: 'screenshot',
    name: 'Screenshot',
    component: Screenshot,
    beforeEnter: (to, from, next) => {
      try {
        store.commit('user/SET_STATE', { userId: 'backendRendering' })
        next()
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    },
  },
  {
    path: '/test',
    name: 'Test',
    meta: {
      transition: 'fade-bottom-in',
    },
    component: () => import('@/views/TestResult.vue'),
  },
  {
    path: '/nubtnlist',
    name: 'NubtnList',
    meta: {
      transition: 'fade-bottom-in',
    },
    component: () => import('@nu/vivi-lib/views/NubtnList.vue'),
  },
] as RouteRecordRaw[]

if (window.location.host !== 'cm.vivipic.com') {
  routes.push({
    path: 'svgicon',
    name: 'SvgIconView',
    component: () => import('@nu/vivi-lib/views/SvgIconView.vue'),
  })
  routes.push({
    path: 'nativeevttest',
    name: 'NativeEventTester',
    component: () => import('@nu/vivi-lib/views/NativeEventTester.vue'),
  })
  routes.push({
    path: 'emoji',
    name: 'EmojiTest',
    component: () => import('@nu/vivi-lib/views/EmojiTest.vue'),
  })
}

router.addRoute({
  // Include the locales you support between ()
  path: `/:locale${localeUtils.getLocaleRegex()}?`,
  component: {
    render() {
      return h(resolveComponent('router-view'))
    },
  },
  async beforeEnter(to, from, next) {
    cmWVUtils.detectIfInApp()

    // redirect from editor to home on refresh if is in app
    // TODO: remove after implementation of tempDesign
    if (!cmWVUtils.inBrowserMode && to.name === 'Editor') return next({ name: 'Home' })

    loginUtils.checkToken(() => cmWVUtils.restore())

    useI18n() // prevent import being removed
    // useI18n().locale = 'tw'

    const userStore = useUserStore()
    const { listDesigns } = userStore

    await cmWVUtils.getUserInfo()
    const appLoadedTimeout = store.getters['cmWV/getAppLoadedTimeout']
    if (appLoadedTimeout > 0) {
      window.setTimeout(() => {
        if (!cmWVUtils.appLoadedSent) {
          logUtils.setLogAndConsoleLog(
            `Timeout for APP_LOADED after ${appLoadedTimeout}ms, send APP_LOADED anyway`,
          )
        }
        cmWVUtils.sendAppLoaded()
      }, appLoadedTimeout)
    }
    if (logUtils.getLog()) {
      // hostId for uploading log is obtained after getUserInfo
      await logUtils.uploadLog()
    }
    logUtils.setLog('App Start')
    if (!cmWVUtils.checkVersion(store.getters['cmWV/getModalInfo'].ver_min || '0')) {
      cmWVUtils.showUpdateModal(true)
    } // else this.showInitPopups()
    cmWVUtils.fetchTutorialFlags()
    cmWVUtils.setDefaultPrices()
    cmWVUtils.getProducts()
    if (to.name !== 'Screenshot') {
      listDesigns('all')
    }
    let argoError = false
    try {
      const status = (
        await fetch(
          `https://media.vivipic.cc/hello.txt?ver=${generalUtils.generateRandomString(12)}`,
        )
      ).status
      if (status !== 200) {
        argoError = true
        logUtils.setLog(
          `Cannot connect to argo, use non-argo domain instead, status code: ${status}`,
        )
      }
    } catch (error) {
      argoError = true
      logUtils.setLogForError(error as Error)
      logUtils.setLog(
        `Cannot connect to argo, use non-argo domain instead, error: ${(error as Error).message}`,
      )
    } finally {
      store.commit('text/SET_isArgoAvailable', !argoError)
    }
    next()
  },
  children: routes,
})

router.beforeEach(async (to, from, next) => {
  cmWVUtils.setupAPIInterface()
  cmWVUtils.registerCallbacks('base')
  useUploadUtils().getUrlMap()

  // store scroll position
  const elScrollable = document.getElementsByClassName('overflow-scroll')[0] as HTMLElement
  const scrollPos = from.meta.scrollPos as { top: number; left: number } | undefined
  if (scrollPos) {
    scrollPos.top = elScrollable?.scrollTop ?? 0
    scrollPos.left = elScrollable?.scrollLeft ?? 0
  }

  if (from.name === 'MyDesign' && to.name === 'Home') {
    to.meta.transition = 'fade-left-in'
  }

  if (from.name === 'Settings' && to.name === 'MyDesign') {
    to.meta.transition = 'fade-top-in'
  }
  if (store.getters['text/getDefaultFontFacesList'].length === 0) {
    /**
     * @MobileDebug - comment the following two line, and use const json = appJSON, or the request will be blocked by CORS
     */
    const response = await fetch(
      `https://template.vivipic.com/static/app_charmix.json?ver=${generalUtils.generateRandomString(
        6,
      )}`,
    )
    const json = await response.json()

    store.commit('cmWV/SET_appLoadedTimeout', json.app_loaded_timeout ?? 8000)

    store.commit('SET_showGlobalErrorModal', json.show_error_modal === 1)

    store.commit('user/SET_STATE', {
      verUni: json.ver_uni,
      verApi: json.ver_api,
      imgSizeMap: json.image_size_map,
      imgSizeMapExtra: json.image_size_map_extra,
      getTxToken: json.get_tx_token,
    })
    textFillUtils.updateFillCategory(json.text_effect, json.text_effect_admin)
    const defaultFontsJson = json.default_font as Array<{ id: string; ver: number }>

    defaultFontsJson.forEach((_font) => {
      const font = {
        type: 'public',
        face: _font.id,
        ver: _font.ver,
      }
      store.commit('text/UPDATE_DEFAULT_FONT', { font })
    })

    store.commit('cmWV/SET_modalInfo', json.modal)

    if (json.default_price && Object.keys(json.default_price).length) {
      const planPostfix = json.default_price.plan_id ? '_' + json.default_price.plan_id : ''
      store.commit('payment/UPDATE_payment', {
        defaultPrices: Object.fromEntries(
          Object.entries(
            json.default_price.prices as { [key: string]: { monthly: number; annually: number } },
          ).map(([locale, prices]) => {
            const currency = constantData.currencyMap.get(locale) ?? 'USD'
            const defaultAnnuallyPriceOriginal =
              json.default_price.original_prices?.[locale]?.annually ?? NaN
            return [
              locale,
              {
                currency,
                ...Object.fromEntries(
                  Object.entries(prices).map(([plan, price]) => [
                    plan,
                    {
                      value: price,
                      text: price.toString(),
                    },
                  ]),
                ),
                annuallyFree0: {
                  value: prices.annually,
                  text: prices.annually.toString(),
                },
                annuallyOriginal: {
                  value: defaultAnnuallyPriceOriginal,
                  text: defaultAnnuallyPriceOriginal.toString(),
                },
                annuallyFree0Original: {
                  value: defaultAnnuallyPriceOriginal,
                  text: defaultAnnuallyPriceOriginal.toString(),
                },
              },
            ]
          }),
        ) as { [key: string]: IPrices },
        trialDays: json.default_price.trial_days,
        trialCountry: json.default_price.trial_country,
        planId: {
          monthly: constantData.planId.monthly,
          annually: constantData.planId.annually + planPostfix,
          annuallyFree0: constantData.planId.annuallyFree0 + planPostfix,
          annuallyOriginal: constantData.planId.annually,
          annuallyFree0Original: constantData.planId.annuallyFree0,
        },
      })
    }

    uploadUtils.setLoginOutput({
      upload_log_map: json.ul_log_map,
      ul_removebg_map: json.ul_removebg_map,
    })
  }
  next()
})

// restore scroll position
router.options.scrollBehavior = (to, from, savedPosition) => {
  const scrollPos = to.meta.scrollPos as { top: number; left: number } | undefined
  const elScrollable = document.getElementsByClassName('overflow-scroll')[0] as HTMLElement
  if (elScrollable) elScrollable.scrollTop = scrollPos?.top ?? 0
}

export default router
