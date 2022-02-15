import { Itheme } from '@/interfaces/theme'
import store from '@/store'
import PageUtils from '@/utils/pageUtils'
import listService from '@/apis/list'
import i18n from '@/i18n'
import _ from 'lodash'

class ThemeUtils {
  get themes() { return store.state.themes }
  get groupType() { return store.state.groupType }
  get getPageSize() { return store.getters.getPageSize }

  getFocusPageSize(pageIndex?: number): { width: number, height: number } {
    return this.getPageSize(pageIndex || PageUtils.currFocusPageIndex)
  }

  setTemplateThemes(themes: Itheme[]) {
    store.commit('templates/SET_STATE', {
      theme: themes.map(theme => theme.id).join(',')
    })
  }

  async fetchTemplateContent() {
    const queryString = new URLSearchParams(window.location.search)
    const keyword = queryString.get('search')
    store.dispatch('templates/resetContent')
    if (keyword) {
      queryString.delete('search')
      store.commit('SET_currSidebarPanelType', 0)
      store.dispatch('templates/getTagContent', { keyword })
      window.history.replaceState({}, document.title, `${window.location.pathname}?${queryString.toString()}`)
    } else {
      await store.dispatch('templates/getCategories')
      store.dispatch('templates/getContent')
    }
    // await this.getCategories()
    // this.getContent()
  }

  refreshTemplateState(pageIndex?: number, newDesignType?: number) {
    // Refresh template in sidebar panel. If pageIndex give, use its width and height to sort template.
    // If newDesignType give, it should be the first priority template result.
    this.setTemplateThemes([])
    return this.checkThemeState().then(() => {
      this.setPageThemes(pageIndex, undefined, newDesignType)
      this.fetchTemplateContent()
    })
  }

  async checkThemeState() {
    const { themes } = this
    if (!themes.length) {
      await listService.getTheme({ locale: i18n.locale })
        .then(response => {
          const { data } = response.data
          store.commit('SET_themes', data.content)
        })
    }
    return Promise.resolve()
  }

  setPageThemes(pageIndex?: number, themes?: Itheme[], newDesignType?: number) {
    const pageSize = this.getFocusPageSize(pageIndex)
    const pageThemes = (themes || this.getThemesBySize(pageSize.width, pageSize.height, newDesignType))
    this.setTemplateThemes(pageThemes)
  }

  getThemesBySize(width: number, height: number, newDesignType?: number) {
    const { themes, groupType } = this

    if (groupType === 1) return themes.filter(theme => theme.id === 7)

    // Sort themes by difference and filter low difference themes.
    const currPageRatio = width / height
    let recommendation: Itheme[] = _.sortBy(themes, [
      (theme: Itheme) => this.themeRatioDifference(theme, currPageRatio),
      (theme: Itheme) => Math.abs(theme.width - width)
    ])
    recommendation = recommendation.filter(
      theme => this.themeRatioDifference(theme, currPageRatio) < 0.2
    )

    // Pick new design type to the top.
    if (newDesignType) {
      recommendation = recommendation.filter((item) => item.id === newDesignType).concat(
        recommendation.filter((item) => item.id !== newDesignType))
    }
    return recommendation.length ? recommendation : [...themes]
  }

  compareThemesWithPage(themes: string, pageIndex?: number) {
    const pageSize = this.getFocusPageSize(pageIndex)
    const pageThemes = this.getThemesBySize(pageSize.width, pageSize.height)
    return pageThemes.some(theme => themes.includes(`${theme.id}`))
  }

  private isSameDirection(targetRatio: number, ratio: number) {
    // @TODO 正方形
    return targetRatio === 1 || (Math.floor(targetRatio) === Math.floor(ratio))
  }

  private isSimilarSize(targetRatio: number, ratio: number, range: number) {
    return targetRatio * (1 + range) >= ratio && targetRatio * (1 - range) <= ratio
  }

  private themeRatioDifference(theme: Itheme, baselineRatio: number) {
    const themeRatio = theme.width / theme.height
    return Math.abs(themeRatio - baselineRatio) / baselineRatio
  }
}

const themeUtils = new ThemeUtils()

export default themeUtils
