import i18n from '@/i18n'
import store from '@/store'
import { LayerType } from '@/store/types'
import assetUtils from '@/utils/assetUtils'
import brandkitUtils from '@/utils/brandkitUtils'
import generalUtils from '@/utils/generalUtils'
import localeUtils from '@/utils/localeUtils'
import logUtils from '@/utils/logUtils'
import picWVUtils from '@/utils/picWVUtils'
import Home from '@/views/Home.vue'
import { defineAsyncComponent, h, resolveComponent } from 'vue'
import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'
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
        console.log(error)
      }
    }
  },
  {
    path: 'editor',
    name: 'Editor',
    component: defineAsyncComponent(() => import('@/views/Editor.vue')),
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
    component: defineAsyncComponent(() => import('@/views/Preview.vue')),
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
        console.log(error)
      }
    }
  },
  {
    path: 'signup',
    name: 'SignUp',
    props: route => ({ redirect: route.query.redirect }),
    component: defineAsyncComponent(() => import('@/views/Login/SignUp.vue')),
    beforeEnter: async (to, from, next) => {
      try {
        if (store.getters['user/isLogin']) {
          next({ path: from.query.redirect as string || '/' })
        } else {
          next()
        }
      } catch (error) {
        console.log(error)
      }
    }
  },
  {
    path: 'login',
    name: 'Login',
    props: route => ({ redirect: route.query.redirect }),
    component: defineAsyncComponent(() => import('@/views/Login/Login.vue')),
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
        console.log(error)
      }
    }
  },
  {
    path: 'mydesign/:view?',
    name: 'MyDesign',
    component: defineAsyncComponent(() => import('@/views/MyDesign.vue')),
    props: true
  },
  {
    path: 'templates',
    name: 'TemplateCenter',
    component: defineAsyncComponent(() => import('@/views/TemplateCenter.vue'))
  },
  {
    path: 'settings/:view?',
    name: 'Settings',
    component: defineAsyncComponent(() => import('@/views/Settings.vue')),
    props: true
  },
  {
    path: 'mobilewarning',
    name: 'MobileWarning',
    component: defineAsyncComponent(() => import('@/views/MobileWarning.vue'))
  },
  {
    path: 'browserwarning',
    name: 'BrowserWarning',
    component: defineAsyncComponent(() => import('@/views/BrowserWarning.vue'))
  },
  {
    path: 'brandkit',
    name: 'BrandKit',
    component: defineAsyncComponent(() => import('@/views/BrandKit.vue')),
    beforeEnter: async (to, from, next) => {
      try {
        if (!brandkitUtils.isBrandkitAvailable) {
          next({ path: '/' })
        } else {
          next()
        }
      } catch (error) {
        console.log(error)
      }
    }
  },
  {
    path: 'pricing',
    name: 'Pricing',
    component: defineAsyncComponent(() => import('@/views/Pricing.vue'))
  }
]

if (window.location.host !== 'vivipic.com') {
  routes.push({
    path: 'svgicon',
    name: 'SvgIconView',
    component: defineAsyncComponent(() => import('@/views/SvgIconView.vue'))
  })
  routes.push({
    path: 'copytool',
    name: 'CopyTool',
    component: defineAsyncComponent(() => import('@/views/CopyTool.vue'))
  })
  routes.push({
    path: 'nubtnlist',
    name: 'NubtnList',
    component: defineAsyncComponent(() => import('@/views/NubtnList.vue'))
  })
}

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),

  routes: [
    {
      // Include the locales you support between ()
      path: `/:locale${localeUtils.getLocaleRegex()}?`,
      component: {
        render() { return h(resolveComponent('router-view')) }
      },
      async beforeEnter(to, from, next) {
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
          const status = (await fetch('https://media.vivipic.cc/hello.txt')).status
          if (status !== 200) {
            argoError = true
            logUtils.setLog(`Cannot connect to argo, use non-argo domain instead, status code: ${status}`)
          }
        } catch (error) {
          argoError = true
          console.error(error)
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
        picWVUtils.updateLocale(locale)

        document.title = to.meta?.title as string || i18n.global.t('SE0001')
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
  if ((window as any).__PRERENDER_INJECTED !== undefined) {
    next()
    return
  }
  picWVUtils.detectIfInApp()
  await picWVUtils.changeStatusBarTextColor(to.name?.toString() ?? '')
  // Store campaign param to local storage.
  const urlParams = new URLSearchParams(window.location.search)
  const campaign = urlParams.get('campaign')
  if (campaign) {
    localStorage.setItem('campaign', campaign)
  }

  // Force login in these page
  if (['Settings', 'MyDesign', 'BrandKit', 'Editor'].includes(to.name as string) && !(to.name === 'Settings' && !store.getters['webView/getInBrowserMode'])) {
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

    // const json = appJson

    process.env.NODE_ENV === 'development' && console.log('static json loaded: ', json)

    if (window.location.hostname !== 'vivipic.com') {
      store.commit('SET_showGlobalErrorModal', true) // non-production always show error modal
    } else {
      store.commit('SET_showGlobalErrorModal', json.show_error_modal === 1)
    }

    store.commit('user/SET_STATE', {
      verUni: json.ver_uni,
      verApi: json.ver_api,
      imgSizeMap: json.image_size_map,
      imgSizeMapExtra: json.image_size_map_extra,
      dimensionMap: json.dimension_map
    })
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
      // is Desktop
      if (userAgent.indexOf('Mac OS X') > 0) {
        // is Mac (could be iPad)
        if (window.screen.width <= 1024) {
          // less than iPad Pro width
          isMobile = true
        } // wider
      }
      // not Mac
    } else {
      // is Mobile
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
