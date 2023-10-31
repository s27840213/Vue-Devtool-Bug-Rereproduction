import { useUserStore } from '@/stores/user'
import cmWVUtils from '@/utils/cmWVUtils'
import uploadUtilsCm from '@/utils/uploadUtilsCm'
import HomeView from '@/views/HomeView.vue'
import { generalUtils } from '@nu/shared-lib'
import router from '@nu/vivi-lib/router'
import localeUtils from '@nu/vivi-lib/utils/localeUtils'
import { h, resolveComponent } from 'vue'

const routes = [{
  path: '/',
  name: 'Home',
  meta: {
    transition: 'fade-top-in',
  },
  component: HomeView,
}, {
  path: '/mydesign',
  name: 'MyDesign',
  meta: {
    transition: 'fade-left-in',
  },
  // route level code-splitting
  // this generates a separate chunk (About.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  component: () => import('@/views/MyDesignView.vue'),
}, {
  path: '/editor',
  name: 'Editor',
  meta: {
    transition: 'fade-bottom-in',
  },
  // route level code-splitting
  // this generates a separate chunk (About.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  component: () => import('@/views/EditorView.vue'),
}, {
  path: '/settings',
  name: 'Settings',
  meta: {
    transition: 'fade-bottom-in',
  },
  // route level code-splitting
  // this generates a separate chunk (About.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  component: () => import('@/views/SettingsView.vue'),
}, {
  path: '/test',
  name: 'Test',
  meta: {
    transition: 'fade-bottom-in',
  },
  // route level code-splitting
  // this generates a separate chunk (About.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  component: () => import('@/views/TestResult.vue'),
}]

router.addRoute({
  // Include the locales you support between ()
  path: `/:locale${localeUtils.getLocaleRegex()}?`,
  component: {
    render() { return h(resolveComponent('router-view')) }
  },
  children: routes
})

router.beforeEach((to, from, next) => {
  const { setUserId } = useUserStore()
  setUserId(generalUtils.generateRandomString(20))
  uploadUtilsCm.getUrlMap()
  cmWVUtils.setupAPIInterface()
  cmWVUtils.detectIfInApp()
  cmWVUtils.getUserInfo()
  if (from.name === 'MyDesign' && to.name === 'Home') {
    to.meta.transition = 'fade-right-in'
  }

  if (from.name === 'Settings' && to.name === 'MyDesign') {
    to.meta.transition = 'fade-top-in'
  }
  next()
})

export default router
