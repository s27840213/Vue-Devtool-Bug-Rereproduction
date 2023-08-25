import charmixWVUtils from '@/utils/charmixWVUtils'
import HomeView from '@/views/HomeView.vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    beforeEnter: async (to, from, next) => {
      next()
    }
  },
  {
    path: '/mydesign',
    name: 'MyDesign',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('@/views/MyDesignView.vue')
  },
  {
    path: '/editor',
    name: 'Editor',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('@/views/EditorView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // Include the locales you support between ()
      // path: `/:locale${localeUtils.getLocaleRegex()}?`,
      path: '/',
      component: {
        render() {
          return h(resolveComponent('router-view'))
        }
      },
      beforeEnter(to, from, next) {
        charmixWVUtils.getUserInfo()
        next()
      },
      children: routes
    }
  ]
})

// router.beforeEach((to, from, next) => {
//   console.log('beforeEach')
// })

export default router
