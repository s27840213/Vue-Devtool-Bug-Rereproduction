import { Itheme } from '@/interfaces/theme'
import store from '@/store'
import PageUtils from '@/utils/pageUtils'
import listService from '@/apis/list'

class ThemeUtils {
  get themes () { return store.state.themes }
  get getPageSize () { return store.getters.getPageSize }

  getFocusPageSize (pageIndex?: number): { width: number, height: number } {
    return this.getPageSize(pageIndex || PageUtils.currFocusPageIndex)
  }

  setTemplateThemes (themes: Itheme[]) {
    store.commit('templates/SET_STATE', {
      theme: themes.map(theme => theme.id).join(',')
    })
  }

  async fetchTemplateContent () {
    const queryString = new URLSearchParams(window.location.search)
    const keyword = queryString.get('search')
    store.dispatch('templates/resetContent')
    if (keyword) {
      queryString.delete('search')
      store.dispatch('templates/getTagContent', { keyword })
      window.history.replaceState({}, document.title, `${window.location.pathname}?${queryString.toString()}`)
    } else {
      await store.dispatch('templates/getCategories')
      store.dispatch('templates/getContent')
    }
    // await this.getCategories()
    // this.getContent()
  }

  refreshTemplateState (pageIndex?: number) {
    this.setTemplateThemes([])
    this.checkThemeState().then(() => {
      this.setPageThemes(pageIndex)
      this.fetchTemplateContent()
    })
  }

  async checkThemeState () {
    const { themes } = this
    if (!themes.length) {
      await listService.getTheme({})
        .then(response => {
          const { data } = response.data
          store.commit('SET_themes', data.content)
        })
    }
    return Promise.resolve()
  }

  setPageThemes (pageIndex?: number, themes?: Itheme[]) {
    const pageSize = this.getFocusPageSize(pageIndex)
    const pageThemes = (themes || this.getThemesBySize(pageSize.width, pageSize.height))
    this.setTemplateThemes(pageThemes)
  }

  getThemesBySize (width: number, height: number) {
    const { themes } = this
    const ratio = width / height
    const recommendation = themes.filter(theme => {
      const themeRatio = theme.width / theme.height
      return this.isSimilarSize(themeRatio, ratio, 0.2)
    })
    return recommendation.length ? recommendation : [...themes]
  }

  compareThemesWithPage (themes: string, pageIndex?: number) {
    const pageSize = this.getFocusPageSize(pageIndex)
    const pageThemes = this.getThemesBySize(pageSize.width, pageSize.height)
    return pageThemes.some(theme => themes.includes(`${theme.id}`))
  }

  private isSameDirection (targetRatio: number, ratio: number) {
    // @TODO 正方形
    return targetRatio === 1 || (Math.floor(targetRatio) === Math.floor(ratio))
  }

  private isSimilarSize (targetRatio: number, ratio: number, range: number) {
    return targetRatio * (1 + range) >= ratio && targetRatio * (1 - range) <= ratio
  }
}

const themeUtils = new ThemeUtils()

export default themeUtils
