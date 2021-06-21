import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Editor from '../views/Editor.vue'
import store from '@/store'
Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Editor',
    component: Editor,
    // eslint-disable-next-line space-before-function-paren
    beforeEnter: async (to, from, next) => {
      try {
        // await store.dispatch('getRandomPhoto', { count: 30 })
        const url = location.href
        let token = ''
        if (url.indexOf('?') !== -1) {
          token = url.split('?')[1].split('&')[0]
          console.log(token)
          await store.dispatch('getAssets', { token })
          await store.dispatch('login', { token })
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
