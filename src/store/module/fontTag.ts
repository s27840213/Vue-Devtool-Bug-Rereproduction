import apiUtils from '@/utils/apiUtils'
import fontTagUtils from '@/utils/fontTagUtils'
import generalUtils from '@/utils/generalUtils'
import localeUtils from '@/utils/localeUtils'
import { ActionTree } from 'vuex-map-fields'

const ADD_FONT_TAGS = 'ADD_FONT_TAGS' as const

export interface IFontTagState {
  locale: string,
  tags: Array<string>,
}

const state: IFontTagState = {
  locale: localeUtils.currLocale(),
  tags: []
}

// const mutations: MutationTree<IFontTagState> = {
//   [ADD_FONT_TAGS](state, data: Array<string>) {
//     state.tags.concat(data)
//   }
// }

const actions: ActionTree<IFontTagState, unknown> = {
  async [ADD_FONT_TAGS]({ state }) {
    const res = await apiUtils.requestWithRetry(fontTagUtils.getFontTags)
    const { data } = res
    if (data.flag === 0) {
      state.tags = state.tags.concat(data.data.content)
    } else {
      console.error('can not get the api data: font-tags')
    }
  }
}

export default {
  namespaced: true,
  state,
  actions
}
