import Vue from 'vue'
import VueRouter, { RawLocation, Route, RouteConfig } from 'vue-router'
import ViviSticker from '../views/ViviSticker.vue'
import Screenshot from '../views/Screenshot.vue'
import SvgIconView from '../views/SvgIconView.vue'
import store from '@/store'
import i18n from '@/i18n'
import localeUtils from '@/utils/localeUtils'
import logUtils from '@/utils/logUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { IUserInfo } from '@/interfaces/vivisticker'
import { CustomWindow } from '@/interfaces/customWindow'

declare let window: CustomWindow

Vue.use(VueRouter)

// Ingore some normal router console error
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location: RawLocation): Promise<Route> {
  return (originalPush.call(this, location) as unknown as Promise<Route>)
    .catch(err => {
      switch (err.name) {
        case 'NavigationDuplicated':
          break
        default:
          console.error(err)
      }
      return err
    })
}

const originalReplace = VueRouter.prototype.replace
VueRouter.prototype.replace = function repalce(location: RawLocation): Promise<Route> {
  return (originalReplace.call(this, location) as unknown as Promise<Route>)
    .catch(err => {
      switch (err.name) {
        case 'NavigationDuplicated':
          break
        default:
          console.error(err)
      }
      return err
    })
}

const routes: Array<RouteConfig> = [
  {
    path: '',
    name: 'ViviSticker',
    component: ViviSticker,
    beforeEnter: async (to, from, next) => {
      try {
        if (vivistickerUtils.checkVersion('1.5')) {
          const recentPanel = await vivistickerUtils.getState('recentPanel')
          const userSettings = await vivistickerUtils.getState('userSettings')
          if (userSettings) {
            store.commit('vivisticker/SET_userSettings', userSettings)
          }
          vivistickerUtils.setCurrActiveTab(recentPanel?.value ?? 'object')
          const tempDesign = await vivistickerUtils.fetchDesign()
          if (tempDesign) {
            vivistickerUtils.initWithTempDesign(tempDesign)
          }
        }
        next()
      } catch (error) {
        console.log(error)
      }
    }
  },
  {
    path: 'screenshot',
    name: 'Screenshot',
    component: Screenshot,
    beforeEnter: async (to, from, next) => {
      try {
        store.commit('user/SET_STATE', { userId: 'backendRendering' })
        next()
      } catch (error) {
        console.log(error)
      }
    }
  },
  ...(process.env.NODE_ENV !== 'production') ? [{
    path: 'svgicon',
    name: 'SvgIconView',
    component: SvgIconView
  }] : [],
  {
    path: '*',
    name: 'Fallback',
    component: ViviSticker,
    beforeEnter: async (to, from, next) => {
      try {
        router.replace({ name: 'ViviSticker', query: {}, params: {} })
      } catch (error) {
        console.log(error)
      }
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      // Include the locales you support between ()
      path: `/:locale${localeUtils.getLocaleRegex()}?`,
      component: {
        render(h) { return h('router-view') }
      },
      async beforeEnter(to, from, next) {
        if (logUtils.getLog()) {
          logUtils.uploadLog()
        }
        logUtils.setLog('App Start')
        vivistickerUtils.registerRouterCallbacks()
        const urlParams = new URLSearchParams(window.location.search)
        const standalone = urlParams.get('standalone')
        if (standalone) {
          vivistickerUtils.enterStandaloneMode()
          vivistickerUtils.setDefaultLocale()
        }
        const userInfo = await vivistickerUtils.getUserInfo()
        const locale = userInfo.locale
        i18n.locale = locale
        localStorage.setItem('locale', locale)
        const editorBg = userInfo.editorBg
        if (editorBg) {
          store.commit('vivisticker/SET_editorBg', editorBg)
        }
        next()
        if ((window as any).__PRERENDER_INJECTED === undefined && router.currentRoute.params.locale) {
          // Delete locale in url, will be ignore by prerender.
          delete router.currentRoute.params.locale
          router.replace({ query: router.currentRoute.query, params: router.currentRoute.params })
        }
      },
      children: routes
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta?.title || i18n.t('SE0001')

  if ((window as any).__PRERENDER_INJECTED !== undefined) {
    next()
    return
  }
  // Store campaign param to local storage.
  const urlParams = new URLSearchParams(window.location.search)
  const campaign = urlParams.get('campaign')
  if (campaign) {
    localStorage.setItem('campaign', campaign)
  }

  if (store.getters['user/getImgSizeMap'].length === 0 && (window as any).__PRERENDER_INJECTED === undefined) {
    /**
     * @MobileDebug - comment the following two line, and use const json = appJSON, or the request will be blocked by CORS
     */
    const response = await fetch(`https://template.vivipic.com/static/app_sticker.json?ver=${generalUtils.generateRandomString(6)}`)
    const json = await response.json()

    // const json = appJson

    process.env.NODE_ENV === 'development' && console.log('static json loaded: ', json)

    store.commit('user/SET_STATE', {
      verUni: json.ver_uni,
      verApi: json.ver_api,
      imgSizeMap: json.image_size_map
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

    store.commit('vivisticker/SET_modalInfo', json.modal)
  }

  next()
})

export default router
