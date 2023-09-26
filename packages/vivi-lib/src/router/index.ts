import appJson from '@/assets/json/app.json'
import i18n from '@/i18n'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'
import localeUtils from '@/utils/localeUtils'
import logUtils from '@/utils/logUtils'
import overlayUtils from '@/utils/overlayUtils'
import picWVUtils from '@/utils/picWVUtils'
import textFillUtils from '@/utils/textFillUtils'
import unitUtils from '@/utils/unitUtils'
import { h, resolveComponent } from 'vue'
import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'

const MOBILE_ROUTES = [
  'Home',
  'TemplateCenter',
  'Settings',
  'SignUp',
  'Login',
  'MobileWarning',
  'Preview',
  'MobileEditor',
  'MyDesign',
  'Pricing'
]

const routes: Array<RouteRecordRaw> = [
]

if (window.location.host !== 'vivipic.com') {
  routes.push({
    path: 'svgicon',
    name: 'SvgIconView',
    component: () => import('@/views/SvgIconView.vue')
  })
  // routes.push({
  //   path: 'nubtnlist',
  //   name: 'NubtnList',
  //   component: () => import('@/views/NubtnList.vue')
  // })
  routes.push({
    path: 'nativeevttest',
    name: 'NativeEventTester',
    component: () => import('@/views/NativeEventTester.vue')
  })
}

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  // routes: [],
  routes: [
    {
      name: 'root',
      // Include the locales you support between ()
      path: `/:locale${localeUtils.getLocaleRegex()}?`,
      component: {
        render() { return h(resolveComponent('router-view')) }
      },
      async beforeEnter(to, from, next) {
        if (to.name === 'NativeEventTester') {
          picWVUtils.enterEventTestMode()
        }
        if (logUtils.getLog()) {
          logUtils.uploadLog()
        }
        logUtils.setLog('App Start')
        if (!picWVUtils.inBrowserMode) {
          picWVUtils.registerCallbacks('router')
        }
        await picWVUtils.getUserInfo()
        let argoError = false
        try {
          const status = (await fetch(`https://media.vivipic.cc/hello.txt?ver=${generalUtils.generateRandomString(12)}`)).status
          if (status !== 200) {
            argoError = true
            logUtils.setLog(`Cannot connect to argo, use non-argo domain instead, status code: ${status}`)
          }
        } catch (error) {
          argoError = true
          logUtils.setLogForError(error as Error)
          logUtils.setLog(`Cannot connect to argo, use non-argo domain instead, error: ${(error as Error).message}`)
        } finally {
          store.commit('text/SET_isArgoAvailable', !argoError)
        }
        let locale = localStorage.getItem('locale') as '' | 'tw' | 'us' | 'jp'
        // if local storage is empty
        if (locale === '' || !locale) {
          locale = to.params.locale as '' | 'tw' | 'us' | 'jp'
          // without locale param, determine the locale with browser language
          if (locale === '' || !locale) {
            i18n.global.locale = localeUtils.getBrowserLang()
          } else {
            i18n.global.locale = locale as 'tw' | 'us' | 'jp'
          }
        } else if (locale && ['tw', 'us', 'jp'].includes(locale) && locale !== i18n.global.locale) {
          // if local storage has been set
          i18n.global.locale = locale
          localStorage.setItem('locale', locale)
        }
        picWVUtils.updateLocale(i18n.global.locale)

        // document.title = to.meta?.title as string || i18n.global.t('SE0001')
        next()
        if ((window as any).__PRERENDER_INJECTED === undefined && router.currentRoute.value.params.locale) {
          // Delete locale in url, will be ignore by prerender.
          delete router.currentRoute.value.params.locale
          router.replace({ query: router.currentRoute.value.query, params: router.currentRoute.value.params })
        }
      },
      children: routes
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  /**
   * @Note the following commented codes will cause prerender render error.
   */
  // if ((window as any).__PRERENDER_INJECTED !== undefined) {
  //   next()
  //   return
  // }
  logUtils.setLog(`navigate to route: ${to.path}`)
  picWVUtils.detectIfInApp()
  await picWVUtils.changeStatusBarTextColor(to.name?.toString() ?? '')
  // Store campaign param to local storage.
  const urlParams = new URLSearchParams(window.location.search)
  const campaign = urlParams.get('campaign')
  if (campaign) {
    localStorage.setItem('campaign', campaign)
  }

  // Force login in these page
  if (['Settings', 'MyDesign', 'BrandKit', 'Editor'].includes(to.name as string) && !(to.name === 'Settings' && !store.getters['webView/getInBrowserMode']) && (window as any).__PRERENDER_INJECTED === undefined) {
    if (!store.getters['user/isLogin']) {
      const token = localStorage.getItem('token')
      if (token === '' || !token) {
        next({ name: 'SignUp', query: { redirect: to.fullPath } })
        return
      } else {
        await store.dispatch('user/login', { token: token })
      }
    }
  } else {
    if (!store.getters['user/isLogin']) {
      const token = localStorage.getItem('token')
      if (token && token.length > 0) {
        await store.dispatch('user/login', { token: token })
      }
    }
  }

  if (store.getters['user/getImgSizeMap'].length === 0 && (window as any).__PRERENDER_INJECTED === undefined) {
    /**
     * @MobileDebug - comment the following two line, and use const json = appJSON, or the request will be blocked by CORS
     */
    const response = await fetch(`https://template.vivipic.com/static/app.json?ver=${generalUtils.generateRandomString(6)}`)
    const json = await response.json()

    // eslint-disable-next-line unused-imports/no-unused-vars
    const appJsonHardcode = appJson // Keep this line to prevent import disappear.
    // const json = appJson as any

    process.env.NODE_ENV === 'development' && console.log('static json loaded: ', json)

    store.commit('SET_showGlobalErrorModal', json.show_error_modal === 1)

    store.commit('user/SET_STATE', {
      verUni: json.ver_uni,
      verApi: json.ver_api,
      imgSizeMap: json.image_size_map,
      imgSizeMapExtra: json.image_size_map_extra,
    })
    // TODO: Delete user.dimensionMap in store
    unitUtils.updateDimensionMap(json.dimension_map)
    textFillUtils.updateFillCategory(json.text_effect, json.text_effect_admin)
    overlayUtils.updateOverlayCategory(json.overlay)
    let defaultFontsJson = json.default_font as Array<{ id: string, ver: number }>

    // Firefox doesn't support Noto Color Emoji font, so remove it from the default fonts.
    if (/Firefox/i.test(navigator.userAgent || navigator.vendor)) {
      defaultFontsJson = defaultFontsJson.filter(font => font.id !== 'zVUjQ0MaGOm7HOJXv5gB')
    }

    defaultFontsJson
      .forEach(_font => {
        const font = {
          type: 'public',
          face: _font.id,
          ver: _font.ver
        }
        store.commit('text/UPDATE_DEFAULT_FONT', { font })
      })
  }

  if (!MOBILE_ROUTES.includes(String(to.name) ?? '') && (to.name === 'Editor' || !localStorage.getItem('not-mobile'))) {
    let isMobile = false
    const userAgent = navigator.userAgent || navigator.vendor
    logUtils.setLog(`Read device width: ${window.screen.width}`)
    logUtils.setLog(`User agent: ${userAgent}`)
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      // is Desktop or iPad
      if (userAgent.indexOf('Mac OS X') > 0) {
        // is Mac or iPad
        if (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) {
          // has more than 2 touch points available (iPad) => mobile
          isMobile = true
        }
        // real Mac => desktop
      }
      // not Mac => desktop
    } else {
      // is Mobile => mobile
      isMobile = true
    }
    if (isMobile) {
      logUtils.setLog('=> as mobile')
      if (to.name === 'Editor') {
        const isTablet = generalUtils.isTablet()
        if (isTablet) {
          logUtils.setLog('=> as tablet')
          if (!localStorage.getItem('not-mobile')) {
            next({ name: 'MobileWarning', query: { width: window.screen.width.toString(), url: to.fullPath } })
            return
          } else {
            store.commit('SET_useMobileEditor', true)
          }
        } else {
          logUtils.setLog('=> as smartphone')
          store.commit('SET_useMobileEditor', true)
        }
      } else {
        next({ name: 'MobileWarning', query: { width: window.screen.width.toString(), url: to.fullPath } })
        return
      }
    } else {
      if (to.name === 'Editor') {
        const hasShownBrowserWarning = localStorage.getItem('hasShownBrowserWarning')
        if (!['Microsoft Edge', 'Chrome'].includes(store.getters['user/getBrowserInfo'].name) && hasShownBrowserWarning !== '1') {
          next({ name: 'BrowserWarning' })
          return
        }
      }
      logUtils.setLog('=> as non-mobile')
    }
  }
  next()
})

// // Ingore some normal router console error
// const originalPush = (router as any).prototype.push

// router.prototype.push = function push(location: VueRouter.RouteLocationRaw): Promise<void | VueRouter.NavigationFailure | undefined> {
//   return (originalPush.call(this, location) as unknown as Promise<void | VueRouter.NavigationFailure | undefined>)
//     .catch(err => {
//       switch (err.name) {
//         case 'NavigationDuplicated':
//           break
//         default:
//           console.error(err)
//       }
//       return err
//     })
// }

// const originalReplace = router.prototype.replace
// router.prototype.replace = function repalce(location: VueRouter.RouteLocationRaw): Promise<void | VueRouter.NavigationFailure | undefined> {
//   return (originalReplace.call(this, location) as unknown as Promise<void | VueRouter.NavigationFailure | undefined>)
//     .catch(err => {
//       switch (err.name) {
//         case 'NavigationDuplicated':
//           break
//         default:
//           console.error(err)
//       }
//       return err
//     })
// }

export default router
