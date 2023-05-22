import i18n from '@/i18n'
import { CustomWindow } from '@/interfaces/customWindow'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'
import localeUtils from '@/utils/localeUtils'
import logUtils from '@/utils/logUtils'
import picWVUtils from '@/utils/picWVUtils'
import uploadUtils from '@/utils/uploadUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineAsyncComponent, h, resolveComponent } from 'vue'
import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'
import Screenshot from '../views/Screenshot.vue'
import ViviSticker from '../views/ViviSticker.vue'

declare let window: CustomWindow

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    name: 'ViviSticker',
    component: ViviSticker,
    beforeEnter: async (to, from, next) => {
      try {
        if (vivistickerUtils.checkVersion('1.5')) {
          await vivistickerUtils.fetchDebugModeEntrance()
          await vivistickerUtils.fetchLoadedFonts()
          await vivistickerUtils.fetchTutorialFlags()
          const recentPanel = await vivistickerUtils.getState('recentPanel')
          const userSettings = await vivistickerUtils.getState('userSettings')
          if (userSettings) {
            store.commit('vivisticker/SET_userSettings', userSettings)
          }
          const hasCopied = await vivistickerUtils.getState('hasCopied')
          vivistickerUtils.hasCopied = hasCopied?.data ?? false
          vivistickerUtils.setState('hasCopied', { data: vivistickerUtils.hasCopied })
          vivistickerUtils.setCurrActiveTab(recentPanel?.value ?? 'object')
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
        vivistickerUtils.hideController()
        next()
      } catch (error) {
        console.log(error)
      }
    }
  },
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
        vivistickerUtils.registerCallbacks('router')
        const urlParams = new URLSearchParams(window.location.search)
        const standalone = urlParams.get('standalone')
        if (standalone) {
          vivistickerUtils.enterStandaloneMode()
          vivistickerUtils.setDefaultLocale()
        }
        const userInfo = await vivistickerUtils.getUserInfo()
        if (logUtils.getLog()) { // hostId for uploading log is obtained after getUserInfo
          await logUtils.uploadLog()
        }
        logUtils.setLog('App Start')
        let locale = 'us'
        if (userInfo.appVer === '1.28') {
          const localLocale = localStorage.getItem('locale')
          if (localLocale) {
            locale = localLocale
          } else {
            locale = localeUtils.getBrowserLang()
          }
        } else {
          locale = userInfo.locale
        }
        logUtils.setLog(`LOCALE: ${localeUtils.getBrowserLang()} ${navigator.language}`)
        i18n.global.locale = locale as 'jp' | 'us' | 'tw'
        localStorage.setItem('locale', locale)
        const editorBg = userInfo.editorBg
        if (editorBg) {
          store.commit('vivisticker/SET_editorBg', editorBg)
        }
        picWVUtils.updateLocale(locale)
        vivistickerUtils.setDefaultPrices(locale)

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

  if (store.getters['user/getImgSizeMap'].length === 0 && (window as any).__PRERENDER_INJECTED === undefined) {
    /**
     * @MobileDebug - comment the following two line, and use const json = appJSON, or the request will be blocked by CORS
     */
    const response = await fetch(`https://template.vivipic.com/static/app_sticker.json?ver=${generalUtils.generateRandomString(6)}`)
    const json = await response.json()

    console.log(json)
    // const json = appJson

    process.env.NODE_ENV === 'development' && console.log('static json loaded: ', json)

    if (window.location.hostname !== 'sticker.vivipic.com') {
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
    // if (/Firefox/i.test(navigator.userAgent || navigator.vendor)) {
    //   defaultFontsJson = defaultFontsJson.filter(font => font.id !== 'zVUjQ0MaGOm7HOJXv5gB')
    // }

    // Vivisticker doesn't use Noto Color Emoji font, but iPhone default font.
    // So remove it from the default fonts.
    defaultFontsJson = defaultFontsJson.filter(font => font.id !== 'zVUjQ0MaGOm7HOJXv5gB')

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

    uploadUtils.setLoginOutput({
      upload_log_map: json.ul_log_map,
      ul_removebg_map: json.ul_removebg_map
    })
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
