import store from '@/store'
import Screenshot from '@/views/Screenshot.vue'
import ViviSticker from '@/views/ViviSticker.vue'
import appJson from '@nu/vivi-lib/assets/json/app.json'
import i18n, { LocaleName } from '@nu/vivi-lib/i18n'
import { CustomWindow } from '@nu/vivi-lib/interfaces/customWindow'
import { IPrices } from '@nu/vivi-lib/interfaces/vivisticker'
import router from '@nu/vivi-lib/router'
import assetPanelUtils from '@nu/vivi-lib/utils/assetPanelUtils'
import constantData from '@nu/vivi-lib/utils/constantData'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import localeUtils from '@nu/vivi-lib/utils/localeUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import overlayUtils from '@nu/vivi-lib/utils/overlayUtils'
import picWVUtils from '@nu/vivi-lib/utils/picWVUtils'
import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
import textFillUtils from '@nu/vivi-lib/utils/textFillUtils'
import uploadUtils from '@nu/vivi-lib/utils/uploadUtils'
import { h, resolveComponent } from 'vue'
import { RouteRecordRaw } from 'vue-router'

declare let window: CustomWindow

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    name: 'ViviSticker',
    component: ViviSticker,
    beforeEnter: async (to, from, next) => {
      try {
        if (stkWVUtils.checkVersion('1.5')) {
          if (stkWVUtils.isGetProductsSupported) stkWVUtils.getSubscribeInfo()
          await stkWVUtils.fetchDebugModeEntrance()
          await stkWVUtils.fetchLoadedFonts()
          await stkWVUtils.fetchTutorialFlags()

          // set default tab to show when first update to target app version
          const isTargetLocale = ['us', 'jp'].includes(stkWVUtils.getUserInfoFromStore().locale)
          const appVer = stkWVUtils.getUserInfoFromStore().appVer
          const lastAppVer = (await stkWVUtils.getState('lastAppVer'))?.value ?? '0.0'
          const targetVer = '1.34'
          if (isTargetLocale && stkWVUtils.checkVersion(targetVer) && !generalUtils.versionCheck({ greaterThan: targetVer, version: lastAppVer })) {
            if (stkWVUtils.isTemplateSupported) await stkWVUtils.setState('recentPanel', { value: 'template' })
          }
          if (appVer !== lastAppVer) await stkWVUtils.setState('lastAppVer', { value: appVer })

          const recentPanelRes = await stkWVUtils.getState('recentPanel') as { value: string } | undefined
          let recentPanel = recentPanelRes?.value ?? 'object'
          if (recentPanel === 'none') { // prevent panel being 'none' for stk
            recentPanel = 'object'
          }
          const userSettings = await stkWVUtils.getState('userSettings')
          if (userSettings) {
            store.commit('vivisticker/UPDATE_userSettings', userSettings)
            stkWVUtils.addFontForEmoji()
          }
          const hasCopied = await stkWVUtils.getState('hasCopied')
          stkWVUtils.hasCopied = hasCopied?.data ?? false
          stkWVUtils.setState('hasCopied', { data: stkWVUtils.hasCopied })
          assetPanelUtils.setCurrActiveTab(recentPanel)
        }
        next()
      } catch (error) {
        logUtils.setLogForError(error as Error)
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
        stkWVUtils.hideController()
        next()
      } catch (error) {
        logUtils.setLogForError(error as Error)
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
        logUtils.setLogForError(error as Error)
      }
    }
  }
]

if (window.location.host !== 'sticker.vivipic.com') {
  routes.push({
    path: 'svgicon',
    name: 'SvgIconView',
    component: () => import('@nu/vivi-lib/views/SvgIconView.vue')
  })
  // routes.push({
  //   path: 'copytool',
  //   name: 'CopyTool',
  //   component: () => import('@/views/CopyTool.vue')
  // })
  // routes.push({
  //   path: 'nubtnlist',
  //   name: 'NubtnList',
  //   component: () => import('@/views/NubtnList.vue')
  // })
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
      stkWVUtils.enterEventTestMode()
    }
    stkWVUtils.registerCallbacks('router')
    const urlParams = new URLSearchParams(window.location.search)
    const standalone = urlParams.get('standalone')
    if (standalone) {
      stkWVUtils.enterBrowserMode()
      stkWVUtils.setDefaultLocale()
    } else {
      stkWVUtils.detectIfInApp()
    }
    const userInfo = await stkWVUtils.getUserInfo()
    const appLoadedTimeout = store.getters['vivisticker/getAppLoadedTimeout']
    if (appLoadedTimeout > 0) {
      window.setTimeout(() => {
        if (!stkWVUtils.appLoadedSent) {
          logUtils.setLogAndConsoleLog(`Timeout for APP_LOADED after ${appLoadedTimeout}ms, send APP_LOADED anyway`)
        }
        stkWVUtils.sendAppLoaded()
      }, appLoadedTimeout)
    }
    if (logUtils.getLog()) { // hostId for uploading log is obtained after getUserInfo
      await logUtils.uploadLog()
    }
    logUtils.setLog('App Start')
    let argoError = false
    try {
      const status = (await fetch('https://media.vivipic.cc/hello.txt')).status
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
    // locale = 'pt' // TODO: remove this line since it's only for testing
    i18n.global.locale = locale as LocaleName
    localStorage.setItem('locale', locale) // TODO: uncomment this line since it's only disabled for testing
    const editorBg = userInfo.editorBg
    if (editorBg) {
      store.commit('vivisticker/SET_editorBg', editorBg)
    }
    picWVUtils.updateLocale(i18n.global.locale)
    stkWVUtils.setDefaultPrices()

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

  if (store.getters['user/getImgSizeMap'].length === 0 && (window as any).__PRERENDER_INJECTED === undefined) {
    /**
     * @MobileDebug - comment the following two line, and use const json = appJSON, or the request will be blocked by CORS
     */
    const response = await fetch(`https://template.vivipic.com/static/app_sticker.json?ver=${generalUtils.generateRandomString(6)}`)
    const json = await response.json()

    // eslint-disable-next-line unused-imports/no-unused-vars
    const appJsonHardcode = appJson // Keep this line to prevent import disappear.
    // const json = appJson as any

    process.env.NODE_ENV === 'development' && console.log('static json loaded: ', json)

    store.commit('vivisticker/SET_appLoadedTimeout', json.app_loaded_timeout ?? 8000)

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
    store.commit('vivisticker/SET_promote', json.promote)

    if (json.default_price && Object.keys(json.default_price).length) {
      const planPostfix = json.default_price.plan_id ? '_' + json.default_price.plan_id : ''
      store.commit('vivisticker/UPDATE_payment', {
        defaultPrices: Object.fromEntries(
          Object.entries(
            json.default_price.prices as { [key: string]: { monthly: number; annually: number } },
          ).map(([locale, prices]) => {
            const currency = constantData.currencyMap.get(locale) ?? 'USD'
            const defaultAnnuallyPriceOriginal = json.default_price.original_prices?.[locale]?.annually ?? NaN
            return [
              locale,
              {
                currency,
                ...Object.fromEntries(
                  Object.entries(prices).map(([plan, price]) => [
                    plan,
                    {
                      value: price,
                      text: price.toString()
                    },
                  ]),
                ),
                annuallyFree0: {
                  value: prices.annually,
                  text: prices.annually.toString()
                },
                annuallyOriginal: {
                  value: defaultAnnuallyPriceOriginal,
                  text: defaultAnnuallyPriceOriginal.toString()
                },
                annuallyFree0Original: {
                  value: defaultAnnuallyPriceOriginal,
                  text: defaultAnnuallyPriceOriginal.toString()
                }
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
          annuallyFree0Original: constantData.planId.annuallyFree0
        }
      })
    }

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
