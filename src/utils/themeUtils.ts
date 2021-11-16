import { Itheme } from '@/interfaces/theme'
import store from '@/store'
import PageUtils from '@/utils/pageUtils'

class ThemeUtils {
  get themes () { return store.state.themes }
  get getPageSize () { return store.getters.getPageSize }

  getFocusPageSize (pageIndex?: number) {
    return this.getPageSize(pageIndex || PageUtils.currFocusPageIndex)
  }

  setTemplateThemes (themes: Itheme[]) {
    store.commit('templates/SET_STATE', {
      theme: themes.map(theme => theme.id).join(',')
    })
  }

  setPageThemes (pageIndex?: number, themes?: Itheme[]) {
    const pageSize = this.getFocusPageSize(pageIndex)
    const pageThemes = (themes || this.getThemesBySize(pageSize.width, pageSize.height))
    this.setTemplateThemes(pageThemes)
  }

  getThemesBySize (width: number, height: number) {
    const { themes } = this
    const ratio = width / height
    return themes.filter(theme => {
      const themeRatio = theme.width / theme.height
      return this.isSameDirection(themeRatio, ratio) && this.isSimilarSize(themeRatio, ratio, 0.2)
    })
  }

  private isSameDirection (targetRatio: number, ratio: number) {
    // @TODO 正方形
    if (targetRatio === 1) return true
    return Math.floor(targetRatio) === Math.floor(ratio)
  }

  private isSimilarSize (targetRatio: number, ratio: number, range: number) {
    return targetRatio * (1 + range) >= ratio && targetRatio * (1 - range) <= ratio
  }
}

const themeUtils = new ThemeUtils()

export default themeUtils
