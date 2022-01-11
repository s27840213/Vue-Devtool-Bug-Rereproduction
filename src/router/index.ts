import Vue from 'vue'
import VueRouter, { NavigationGuardNext, Route, RouteConfig } from 'vue-router'
import Editor from '../views/Editor.vue'
import SignUp from '../views/Login/SignUp.vue'
import Login from '../views/Login/Login.vue'
import MyDesign from '../views/MyDesign.vue'
import Home from '../views/Home.vue'
import Pricing from '../views/Pricing.vue'
import Settings from '../views/Settings.vue'
import TemplateCenter from '../views/TemplateCenter.vue'
import MobileWarning from '../views/MobileWarning.vue'
import Preview from '../views/Preview.vue'
import store from '@/store'
import uploadUtils from '@/utils/uploadUtils'
import { editorRouteHandler } from './handler'
import i18n from '@/i18n'
import mappingUtils from '@/utils/mappingUtils'
import localeUtils from '@/utils/localeUtils'
import logUtils from '@/utils/logUtils'
import assetUtils from '@/utils/assetUtils'
Vue.use(VueRouter)

const MOBILE_ROUTES = [
  'Home',
  'TemplateCenter',
  'Settings',
  'SignUp',
  'Login',
  'MobileWarning'
]

const routes: Array<RouteConfig> = [
  {
    path: '',
    name: 'Home',
    component: Home,
    beforeEnter: async (to, from, next) => {
      // const locale = from.params.locale
      // if (locale && ['tw', 'en', 'jp'].includes(locale) && locale !== i18n.locale) {
      //   i18n.locale = mappingUtils.mappingLocales(locale)
      // }
      // to.params.locale = 'en'
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
    component: Editor,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: editorRouteHandler
  },
  {
    path: 'preview',
    name: 'Preview',
    component: Preview,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: async (to, from, next) => {
      try {
        next()
        const urlParams = new URLSearchParams(window.location.search)
        const url = urlParams.get('url')

        if (url) {
          // e.g.: https://test.vivipic.com/editor?url=template.vivipic.com%2Fexport%2F9XBAb9yoKlJbzLiWNUVM%2F211123164456873giej3iKR%2Fpage_0.json%3Fver%3DJeQnhk9N%26token%3DVtOldDgVuwPIWP0Y%26team_id%3D9XBAb9yoKlJbzLiWNUVM
          const hasToken = url.indexOf('token=') !== -1
          let tokenKey = ''
          let src = url
          if (hasToken) {
            tokenKey = url.match('&token') ? '&token=' : '?token='
            src = url.substring(0, hasToken ? url.indexOf(tokenKey) : undefined)
            const token = url.substring((src + tokenKey).length, url.indexOf('&team_id='))
            const teamId = url.substr((src + tokenKey + token + '&team_id=').length)
            store.commit('user/SET_STATE', { token, teamId })
          }
          fetch(`https://${src}`)
            .then(response => response.json())
            .then(json => { assetUtils.addTemplate(json, { pageIndex: 0 }) })

          store.commit('user/SET_STATE', { userId: 'backendRendering' })
        }
      } catch (error) {
        console.log(error)
      }
    }
  },
  {
    path: 'signup',
    name: 'SignUp',
    props: route => ({ redirect: route.query.redirect }),
    component: SignUp,
    // eslint-disable-next-line space-before-function-paren
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
    component: Login,
    // eslint-disable-next-line space-before-function-paren
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
    component: MyDesign,
    props: true
  },
  {
    path: 'templates',
    name: 'TemplateCenter',
    component: TemplateCenter
  },
  {
    path: 'settings/:view?',
    name: 'Settings',
    component: Settings,
    props: true
  },
  {
    path: 'mobilewarning',
    name: 'MobileWarning',
    component: MobileWarning
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
      beforeEnter(to, from, next) {
        if (logUtils.getLog()) {
          logUtils.uploadLog()
        }
        logUtils.setLog('App Start')
        let locale = localStorage.getItem('locale')
        if (locale === '' || !locale) {
          locale = to.params.locale
        }
        if (locale && ['tw', 'us', 'jp'].includes(locale) && locale !== i18n.locale) {
          console.log(navigator.language)
          i18n.locale = locale
          localStorage.setItem('locale', locale)
        }
        next()
        if (!process.env.VUE_APP_PRERENDER) {
          router.replace({ query: Object.assign({}, router.currentRoute.query), params: { locale: '' } })
        }
      },
      children: routes
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  // some pages must render with userInfo,
  // hence we should guarantee to receive login response before navigate to these pages
  document.title = to.meta.title || i18n.t('SE0001')
  if (!MOBILE_ROUTES.includes(to.name ?? '') && !localStorage.getItem('not-mobile')) {
    logUtils.setLog(`Read device width: ${window.screen.width}`)
    logUtils.setLog(`User agent: ${navigator.userAgent}`)
    if (window.screen.width <= 1280) {
      logUtils.setLog('=> as mobile')
      next({ name: 'MobileWarning', query: { width: window.screen.width.toString(), url: to.fullPath } })
    }
    logUtils.setLog('=> as non-mobile')
  }

  if (to.name === 'Settings' || to.name === 'MyDesign') {
    // if not login, navigate to login page
    if (!store.getters['user/isLogin']) {
      const token = localStorage.getItem('token')
      if (token === '' || !token) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
      } else {
        const data = await store.dispatch('user/login', { token: token })
        if (data.flag === 0) {
          next()
        } else {
          next({ name: 'Login', query: { redirect: to.fullPath } })
        }
      }
    } else {
      next()
    }
  } else {
    if (!store.getters['user/isLogin']) {
      const token = localStorage.getItem('token')
      if (token && token.length > 0) {
        await store.dispatch('user/login', { token: token })
      }
    }
    next()
  }
})

export default router
