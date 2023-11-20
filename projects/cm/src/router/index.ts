import useUploadUtils from '@/composable/useUploadUtils'
import HomeView from '@/views/HomeView.vue'
import store from '@/vuex'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import router from '@nu/vivi-lib/router'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import localeUtils from '@nu/vivi-lib/utils/localeUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import loginUtils from '@nu/vivi-lib/utils/loginUtils'
import { h, resolveComponent } from 'vue'
import { RouteRecordRaw } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    meta: {
      transition: 'fade-top-in',
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
    useI18n() // prevent import being removed
    // useI18n().locale = 'tw'
    cmWVUtils.setupAPIInterface()
    cmWVUtils.detectIfInApp()
    cmWVUtils.getUserInfo()
    cmWVUtils.fetchTutorialFlags()
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
  store.commit('user/SET_state', { userId: generalUtils.generateRandomString(20) })
  useUploadUtils().getUrlMap()

  loginUtils.checkToken()

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
      `https://template.vivipic.com/static/app.json?ver=${generalUtils.generateRandomString(6)}`,
    )
    const json = await response.json()

    const defaultFontsJson = json.default_font as Array<{ id: string; ver: number }>

    defaultFontsJson.forEach((_font) => {
      const font = {
        type: 'public',
        face: _font.id,
        ver: _font.ver,
      }
      store.commit('text/UPDATE_DEFAULT_FONT', { font })
    })
  }
  next()
})

export default router
