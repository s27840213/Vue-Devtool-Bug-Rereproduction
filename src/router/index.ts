import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Editor from '../views/Editor.vue'
import SignUp from '../views/Login/SignUp.vue'
import Login from '../views/Login/Login.vue'
import store from '@/store'
import uploadUtils from '@/utils/uploadUtils'
Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Editor',
    component: Editor,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: async (to, from, next) => {
      try {
        next()
        const urlParams = new URLSearchParams(window.location.search)
        /*
        if (urlParams.has('token')) {
          const token = urlParams.get('token')

          if (token) {
            store.commit('user/SET_STATE', { token })
            await store.dispatch('user/login', { token })
            await store.dispatch('user/getAssets', { token })
            uploadUtils.uploadTmpJSON()
          }
        } else {
          */
        if (urlParams.has('type') && urlParams.has('design_id')) {
          const type = urlParams.get('type')
          const designId = urlParams.get('design_id')

          if (type && designId) {
            uploadUtils.getDesign(type, designId)
          }
        }
        // }
      } catch (error) {
        console.log(error)
      }
    }
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: SignUp,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: async (to, from, next) => {
      try {
        next()
      } catch (error) {
        console.log(error)
      }
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
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
