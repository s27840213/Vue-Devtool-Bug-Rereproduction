import { GetterTree, ActionTree } from 'vuex'
import { floor } from 'lodash'
import list from '@/apis/list'
import { captureException } from '@sentry/browser'
import localeUtils from '@/utils/localeUtils'

interface IHomeTemplateState {
  locale: string,
  keyword: string,
  isShowPagePreview: boolean,
  pagesPerRow: number
}

const getDefaultState = (): IHomeTemplateState => ({
  locale: 'tw',
  keyword: '',
  isShowPagePreview: false,
  pagesPerRow: floor((window.screen.width - 130) / 180)
})

const state = getDefaultState()
const getters: GetterTree<IHomeTemplateState, unknown> = {
  getPagesPerRow(state: IHomeTemplateState) {
    return state.pagesPerRow
  }
}

const actions: ActionTree<IHomeTemplateState, unknown> = {
  async getTagContent({ commit }, { keyword, theme, cache }) {
    const locale = localeUtils.currLocale()
    try {
      const { data } = await list.getTemplate({
        locale,
        keyword: keyword.includes('::') ? keyword : `tag::${keyword}`,
        theme: theme,
        cache: cache
      })
      return Promise.resolve(data)
    } catch (error) {
      console.error(error)
      captureException(error)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions
}
