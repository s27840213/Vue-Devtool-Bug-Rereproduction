import store from '@/store'
import Editor from '@/views/Editor.vue'
import Home from '@/views/Home.vue'
import appJson from '@nu/vivi-lib/assets/json/app.json'
import i18n from '@nu/vivi-lib/i18n'
import router from '@nu/vivi-lib/router'
import { LayerType } from '@nu/vivi-lib/store/types'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import brandkitUtils from '@nu/vivi-lib/utils/brandkitUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import localeUtils from '@nu/vivi-lib/utils/localeUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import loginUtils from '@nu/vivi-lib/utils/loginUtils'
import overlayUtils from '@nu/vivi-lib/utils/overlayUtils'
import picWVUtils from '@nu/vivi-lib/utils/picWVUtils'
import textFillUtils from '@nu/vivi-lib/utils/textFillUtils'
import { h, resolveComponent } from 'vue'
import { RouteRecordRaw } from 'vue-router'
import { editorRouteHandler } from './handler'

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
  {
    path: '',
    name: 'Home',
    component: Home,
    beforeEnter: async (to, from, next) => {
      try {
        next()
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'editor',
    name: 'Editor',
    component: Editor,
    beforeEnter: editorRouteHandler
  },
  // {
  //   path: 'mobile-editor',
  //   name: 'MobileEditor',
  //   component: MobileEditor,
  //   // eslint-disable-next-line space-before-function-paren
  //   beforeEnter: editorRouteHandler
  // },
  {
    path: 'preview',
    name: 'Preview',
    component: () => import('@/views/Preview.vue'),
    beforeEnter: async (to, from, next) => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const url = urlParams.get('url')
        const teamId = urlParams.get('team_id')
        const token = urlParams.get('token')
        const dpi = +(urlParams.get('dpi') ?? -1)
        const bleed = !!+(urlParams.get('bleed') ?? 0)
        const trim = !!+(urlParams.get('trim') ?? 0)
        const margin = urlParams.get('margin')
        const margins = margin ? margin.split(',') : []
        const renderForPDF = urlParams.get('renderForPDF')
        const unitScale = urlParams.get('unit_scale')

        store.commit('user/SET_STATE', { renderForPDF: renderForPDF === 'true' })
        store.commit('user/SET_STATE', { unitScale: unitScale === '1' })

        const informBackend = () => {
          console.log('all resize done')
          const div = document.createElement('div')
          div.id = 'vivipic-text-done'
          div.innerHTML = 'xxx'
          div.style.position = 'fixed'
          div.style.top = '100%'
          div.style.left = '100%'
          document.body.appendChild(div)
        }

        if (token && teamId && url) {
          // for new version
          // e.g.: /preview?url=template.vivipic.com%2Fexport%2F<design_team_id>%2F<design_export_id>%2Fpage_<page_index>.json%3Fver%3DJeQnhk9N%26token%3DQT0z7B3D3ZuXVp6R%26team_id%3DPUPPET
          store.commit('user/SET_STATE', { token, teamId, dpi, backendRenderParams: { isBleed: bleed, isTrim: trim, margin: { bottom: +margins[0] || 0, right: +margins[1] || 0 } } })
          store.commit('user/SET_STATE', { userId: 'backendRendering' })
          const response = await (await fetch(`https://${url}`)).json()
          generalUtils.initializeFlags(LayerType.text, [response], informBackend)
          await assetUtils.addTemplate(response, { pageIndex: 0 })
          store.commit('file/SET_setLayersDone')
        } else if (url) {
          // for old version
          // e.g.: /preview?url=template.vivipic.com%2Fexport%2F<design_team_id>%2F<design_export_id>%2Fpage_<page_index>.json%3Fver%3DJeQnhk9N%26token%3DQT0z7B3D3ZuXVp6R%26team_id%3DPUPPET
          const hasToken = url.indexOf('token=') !== -1
          let tokenKey = ''
          let src = url
          if (hasToken) {
            tokenKey = url.match('&token') ? '&token=' : '?token='
            src = url.substring(0, url.indexOf(tokenKey))
            const querys: { [index: string]: string } = {}
            url.split('?')[1].split('&').forEach((query: string) => {
              const [key, val] = query.split('=')
              querys[key] = val
            })
            const token = querys.token
            const teamId = querys.team_id
            const dpi = +(querys.dpi ?? -1)
            const bleed = !!+querys.bleed
            const trim = !!+querys.trim
            const margin = querys.margin
            const margins = margin ? margin.split(',') : []
            store.commit('user/SET_STATE', { token, teamId, dpi, backendRenderParams: { isBleed: bleed, isTrim: trim, margin: { bottom: +margins[0] || 0, right: +margins[1] || 0 } } })
          }
          store.commit('user/SET_STATE', { userId: 'backendRendering' })
          const response = await (await fetch(`https://${src}`)).json()
          generalUtils.initializeFlags(LayerType.text, [response], informBackend)
          await assetUtils.addTemplate(response, { pageIndex: 0 })
          store.commit('file/SET_setLayersDone')
        }
        next()
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'signup',
    name: 'SignUp',
    props: route => ({ redirect: route.query.redirect }),
    component: () => import('@/views/Login/SignUp.vue'),
    beforeEnter: async (to, from, next) => {
      try {
        if (store.getters['user/isLogin']) {
          next({ path: from.query.redirect as string || '/' })
        } else {
          next()
        }
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'login',
    name: 'Login',
    props: route => ({ redirect: route.query.redirect }),
    component: () => import('@/views/Login/Login.vue'),
    beforeEnter: async (to, from, next) => {
      try {
        if (to.query.type) {
          next()
        } else {
          if (store.getters['user/isLogin']) {
            next({ path: from.query.redirect as string || '/' })
          } else {
            next()
          }
        }
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'mydesign/:view?',
    name: 'MyDesign',
    component: () => import('@/views/MyDesign.vue'),
    props: true
  },
  {
    path: 'templates',
    name: 'TemplateCenter',
    component: () => import('@/views/TemplateCenter.vue')
  },
  {
    path: 'settings/:view?',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    props: true
  },
  {
    path: 'mobilewarning',
    name: 'MobileWarning',
    component: () => import('@/views/MobileWarning.vue')
  },
  {
    path: 'browserwarning',
    name: 'BrowserWarning',
    component: () => import('@/views/BrowserWarning.vue')
  },
  {
    path: 'brandkit',
    name: 'BrandKit',
    component: () => import('@/views/BrandKit.vue'),
    beforeEnter: async (to, from, next) => {
      try {
        if (!brandkitUtils.isBrandkitAvailable) {
          next({ path: '/' })
        } else {
          next()
        }
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'pricing',
    name: 'Pricing',
    component: () => import('@/views/Pricing.vue')
  }
]

if (window.location.host !== 'vivipic.com') {
  routes.push({
    path: 'svgicon',
    name: 'SvgIconView',
    component: () => import('@nu/vivi-lib/views/SvgIconView.vue')
  })
  routes.push({
    path: 'copytool',
    name: 'CopyTool',
    component: () => import('@/views/CopyTool.vue')
  })
  routes.push({
    path: 'nubtnlist',
    name: 'NubtnList',
    component: () => import('@nu/vivi-lib/views/NubtnList.vue')
  })
  routes.push({
    path: 'nativeevttest',
    name: 'NativeEventTester',
    component: () => import('@nu/vivi-lib/views/NativeEventTester.vue')
  })
  routes.push({
    path: 'emoji',
    name: 'EmojiTest',
    component: () => import('@nu/vivi-lib/views/EmojiTest.vue')
  })
}

router.addRoute({
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
    const appLoadedTimeout = store.getters['webView/getAppLoadedTimeout']
    if (appLoadedTimeout > 0) {
      window.setTimeout(() => {
        if (!picWVUtils.appLoadedSent) {
          logUtils.setLogAndConsoleLog(`Timeout for APP_LOADED after ${appLoadedTimeout}ms, send APP_LOADED anyway`)
        }
        picWVUtils.sendAppLoaded()
      }, appLoadedTimeout)
    }
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
  const needForceLogin = 
    ['Settings', 'MyDesign', 'BrandKit', 'Editor'].includes(to.name as string) &&
    !(to.name === 'Settings' && !store.getters['webView/getInBrowserMode']) &&
    window.__PRERENDER_INJECTED === undefined
  await loginUtils.checkToken(needForceLogin ? () => {
    next({ name: 'SignUp', query: { redirect: to.fullPath } })
  } : undefined)

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

    store.commit('webView/SET_appLoadedTimeout', json.app_loaded_timeout ?? 8000)

    store.commit('SET_showGlobalErrorModal', json.show_error_modal === 1)

    store.commit('user/SET_STATE', {
      verUni: json.ver_uni,
      verApi: json.ver_api,
      imgSizeMap: json.image_size_map,
      imgSizeMapExtra: json.image_size_map_extra,
      dimensionMap: json.dimension_map
    })
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
    store.commit('SET_modalInfo', json.modal)
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
