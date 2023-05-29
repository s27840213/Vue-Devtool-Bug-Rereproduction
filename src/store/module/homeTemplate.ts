import list from '@/apis/list'
import localeUtils from '@/utils/localeUtils'
import logUtils from '@/utils/logUtils'
import { captureException } from '@sentry/browser'
import { floor } from 'lodash'
import { ActionTree, GetterTree } from 'vuex'

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
  async getTagContent({ commit }, { keyword, theme, cache, shuffle }) {
    const locale = localeUtils.currLocale()
    try {
      const { data } = await list.getTemplate({
        locale,
        keyword: keyword.includes('::') ? keyword : `tag::${keyword}`,
        theme: theme,
        shuffle: shuffle,
        cache: cache
      })
      return Promise.resolve(data)
    } catch (error) {
      logUtils.setLogForError(error as Error)
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
