import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import list from '@/apis/list'
import { IListServiceData } from '@/interfaces/api'
import { IListModuleState } from '@/interfaces/module'

const SET_STATE = 'SET_STATE' as const
const SET_CONTENT = 'SET_CONTENT' as const
const SET_MORE_CONTENT = 'SET_MORE_CONTENT' as const

const getDefaultState = (): IListModuleState => ({
  contents: [],
  query: '',
  page: 0,
  perPage: 0,
  nextPage: 0,
  pending: false,
  host: '',
  json: '',
  preview: '',
  locale: 'tw',
  category: undefined,
  error: ''
})

const actions: ActionTree<IListModuleState, unknown> = {
  async getContent ({ commit, state }, params = {}) {
    const { locale } = state
    const { category } = params
    commit(SET_STATE, { pending: true, category, contents: [] })
    try {
      const { data } = await list.getText({ locale, category })
      commit(SET_CONTENT, data.data)
    } catch (error) {
      console.log(error)
    }
  },
  async getMoreContent ({ commit, getters }) {
    const { nextParams, hasNextPage } = getters
    if (!hasNextPage) { return }
    commit(SET_STATE, { pending: true })
    try {
      const { data } = await list.getText(nextParams)
      commit(SET_MORE_CONTENT, data.data)
    } catch (error) {
      console.log(error)
    }
  },
  async getContentJson ({ commit, state }, id: string) {
    const { json, host } = state
    try {
      const response = await fetch(`${host}/${id}/${json}`).then(response => response.json())
      commit('SET_contentJson', { [id]: response }, { root: true })
      return response
    } catch (error) {
      console.log(error)
    }
  }
}

const mutations: MutationTree<IListModuleState> = {
  [SET_STATE] (state: IListModuleState, data: Partial<IListModuleState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IListModuleState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  },
  [SET_CONTENT] (state: IListModuleState, objects: any) {
    state.contents = objects.content
    state.host = objects.host
    state.json = objects.json
    state.preview = objects.preview
    state.pending = false
    state.nextPage = objects.next_page
  },
  [SET_MORE_CONTENT] (state: IListModuleState, objects: IListServiceData) {
    state.contents = state.contents.concat(objects.content)
    state.pending = false
    state.nextPage = objects.next_page
  }
}

const getters: GetterTree<IListModuleState, any> = {
  nextParams (state) {
    const { nextPage, category, locale } = state
    return {
      locale,
      category,
      page_index: nextPage
    }
  },
  hasNextPage (state) {
    return state.nextPage && state.nextPage > 0
  },
  emptyResultMessage (state) {
    const { query, pending, contents } = state
    if (pending || contents.length) {
      return ''
    }
    return query
      ? `Sorry, we couldn't find any text for "${query}". Try searching something related.`
      : 'Sorry, we couldn\'t find any text.'
  }
}

export default {
  namespaced: true,
  state: getDefaultState,
  getters,
  mutations,
  actions
} as ModuleTree<IListModuleState>
