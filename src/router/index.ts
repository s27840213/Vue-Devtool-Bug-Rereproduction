import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Editor from '../views/Editor.vue'
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
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.has('token')) {
          const token = urlParams.get('token')
          console.log(token)
          if (token) {
            uploadUtils.setToken(token)
            await store.dispatch('getAssets', { token })
            await store.dispatch('login', { token })
            uploadUtils.uploadJSON()
          }
        }
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
