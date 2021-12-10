import store from '@/store'
import userApis from '@/apis/user'

enum GuideStatus {
  INPROGRESS = 0,
  SKIP = 1,
  FINISH = 2
}

const GUEST_VIEW_GUIDE = 'guest_view_guide'

class GuideUtils {
  get isLogin(): boolean { return store.getters['user/isLogin'] }
  get token(): string { return store.getters['user/getToken'] }
  get userViewGuide(): number {
    return store.getters['user/getViewGuide']
  }

  skipGuide () {
    this.updateUserViewGuideStatus(GuideStatus.SKIP)
    this.setLocalUserViewGuideStatus(GuideStatus.SKIP)
  }

  finishGuide () {
    this.updateUserViewGuideStatus(GuideStatus.FINISH)
    this.setLocalUserViewGuideStatus(GuideStatus.FINISH)
  }

  updateUserViewGuideStatus (viewGuide: number) {
    store.commit('user/SET_STATE', { viewGuide })
    if (this.isLogin) {
      userApis.updateUserViewGuide(this.token, viewGuide)
    }
  }

  setLocalUserViewGuideStatus (viewGuide: number) {
    this.isLogin && localStorage[GUEST_VIEW_GUIDE] && localStorage.removeItem(GUEST_VIEW_GUIDE)
    !this.isLogin && (localStorage[GUEST_VIEW_GUIDE] = viewGuide)
  }
}

const guideUtils = new GuideUtils()
export default guideUtils
