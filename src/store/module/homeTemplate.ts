import { GetterTree, ActionTree } from 'vuex'
import { floor } from 'lodash'
import list from '@/apis/list'
import { captureException } from '@sentry/browser'

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
  async getApiResponse() {
    const locale = 'tw'
    const { data } = await list.getTemplate({ locale, keyword: 'aa', listAll: 1 })
    return data
  },
  getPagesPerRow(state: IHomeTemplateState) {
    return state.pagesPerRow
  }
}

const actions: ActionTree<IHomeTemplateState, unknown> = {
  async getTagContent({ commit }, { keyword }) {
    const { locale } = state
    try {
      const { data } = await list.getTemplate({
        locale,
        keyword: keyword.includes('::') ? keyword : `tag::${keyword}`,
        listAll: 1,
        aspect: 'square'
      })
      return Promise.resolve(data)
    } catch (error) {
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
