import HomeView from '@/views/HomeView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
        transition: 'fade-left-in',
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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  if (from.name === 'MyDesign' && to.name === 'Home') {
    to.meta.transition = 'fade-right-in'
  }
  next()
})

export default router
