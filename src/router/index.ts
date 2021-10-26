import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Editor from '../views/Editor.vue'
import SignUp from '../views/Login/SignUp.vue'
import Login from '../views/Login/Login.vue'
import MyDesign from '../views/Navigation/MyDesign.vue'
import Home from '../views/Home.vue'
import Pricing from '../views/Pricing.vue'
import store from '@/store'
import uploadUtils from '@/utils/uploadUtils'
import { SidebarPanelType } from '@/store/types'
Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/editor',
    name: 'Editor',
    component: Editor,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: async (to, from, next) => {
      try {
        next()
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.has('type') && urlParams.has('design_id')) {
          const type = urlParams.get('type')
          const designId = urlParams.get('design_id')
          if (type === 'export' && designId) {
            const teamId = urlParams.get('team_id') || ''
            const background = urlParams.get('background') || '0'
            uploadUtils.getExport(designId, teamId, background)
          } else if (type && designId) {
            uploadUtils.getDesign(type, designId)
          }
        }
        if (urlParams.has('panel_index')) {
          const panelIndex = +(urlParams.get('panel_index') || 0)
          if (panelIndex in SidebarPanelType) {
            store.commit('SET_currSidebarPanelType', panelIndex)
          }
        }
      } catch (error) {
        console.log(error)
      }
    }
  },
  {
    path: '/signup',
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
    path: '/login',
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
    path: '/mydesign',
    name: 'MyDesign',
    component: MyDesign,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: async (to, from, next) => {
      try {
        if (!store.getters['user/isLogin']) {
          next({ name: 'Login', query: { redirect: to.fullPath } })
        } else {
          next()
        }
      } catch (error) {
        console.log(error)
      }
    }
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
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: Pricing,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: async (to, from, next) => {
      try {
        next()
      } catch (error) {
        console.log(error)
      }
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
