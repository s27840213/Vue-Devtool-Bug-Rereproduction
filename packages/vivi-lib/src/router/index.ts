import logUtils from '@/utils/logUtils'
import { NavigationGuardNext, RouteLocationNormalized, createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [],
})

// Run at the begining of `beforeEnter` in every project, return if redirect needed.
export function commonBeforeEnter(
  // to: RouteLocationNormalized,
  // from: RouteLocationNormalized,
  // next: NavigationGuardNext
  ) {
  logUtils.setLog(`App Start: v.${process.env.VUE_APP_BUILD_NUMBER}`)
}

// Run at the begining of `beforeEach` in every project, return if redirect needed.
export function commonBeforeEach(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  ) {
  // Keep `ver` in query param in URL, https://www.notion.so/vivipic/a3baa27a8f6946fa9fc3175af3134bbb.
  const urlParams = new URLSearchParams(location.search)
  const ver = urlParams.get('ver')
  if (ver && !to.query.ver && to.name) {
    next({ name: to.name, query: Object.assign({ ver }, to.query) })
    return true
  }

  logUtils.setLog(`Navigate to href: ${to.fullPath}`)
}

export default router
