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
import store from '@/store'
import uploadUtils from '@/utils/uploadUtils'
import { editorRouteHandler } from './handler'
import i18n from '@/i18n'
import mappingUtils from '@/utils/mappingUtils'
import localeUtils from '@/utils/localeUtils'
Vue.use(VueRouter)

const SUPPORTED_LOCALES = [{
  code: 'en',
  base: '/en',
  flag: 'us',
  name: 'English'
}, {
  code: 'tw',
  base: '',
  flag: 'tw',
  name: '繁體中文'
}, {
  code: 'jp',
  base: '/jp',
  flag: 'jp',
  name: 'Japan'
}]

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
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.has('type') && urlParams.has('design_id')) {
          const type = urlParams.get('type')
          const designId = urlParams.get('design_id')

          if (type && designId) {
            uploadUtils.getDesign(type, designId)
          }
        }
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
    path: 'mydesign',
    name: 'MyDesign',
    component: MyDesign
  },
  {
    path: '/templates',
    name: 'TemplateCenter',
    component: TemplateCenter
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: async (to, from, next) => {
      try {
        next()
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.has('type') && urlParams.has('design_id')) {
          const type = urlParams.get('type')
          const designId = urlParams.get('design_id')

          if (type && designId) {
            uploadUtils.getDesign(type, designId)
          }
        }
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
      beforeEnter(to, from, next) {
        const locale = localeUtils.localeMap[to.params.locale]
        if (locale) {
          i18n.locale = locale
        }
        next()
      },
      children: routes
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  // some pages must render with userInfo,
  // hence we should guarantee to receive login response before navigate to these pages
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
    const token = localStorage.getItem('token')
    if (token && token.length > 0) {
      await store.dispatch('user/login', { token: token })
    }
    next()
  }
})

// router.beforeEach((to, from, next) => {
//   // set the current language for vuex-i18n. note that translation data
//   // for the language might need to be loaded first
//   const locale = to.params.locale
//   if (locale && ['tw', 'en', 'jp'].includes(locale) && locale !== i18n.locale) {
//     i18n.locale = mappingUtils.mappingLocales(locale)
//     next({
//       params: {
//         locale
//       }
//     })
//   }
//   next()
// })

export default router
