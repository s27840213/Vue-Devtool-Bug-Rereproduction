import logUtils from '@/utils/logUtils'
import { NavigationGuardNext, RouteLocationNormalized, createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [],
})

// Run at the begining of `beforeEnter` in every project.
export function commonBeforeEnter(
  // to: RouteLocationNormalized,
  // from: RouteLocationNormalized,
  // next: NavigationGuardNext
  ) {
  //
}

// Run at the begining of `beforeEach` in every project.
export function commonBeforeEach(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  ) {
  logUtils.setLog(`navigate to route: ${to.path}`)

  // Keep `ver` in query param in URL.
  if (from.query.ver && !to.query.ver && to.name) {
    next({ name: to.name, query: Object.assign({ ver: from.query.ver }, to.query) })
  }
}

export default router
