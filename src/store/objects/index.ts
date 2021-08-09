import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import list from '@/apis/list'

const SET_STATE = 'SET_STATE' as const
const SET_OBJECTS = 'SET_OBJECTS' as const

interface IObjectState {
  contents: any[]
  query: string
  page: number
  nextPage: number
  perPage: number
  pending: boolean
  host: string
  json: string
  preview: string
  locale: string
  category: number | null
}

const getDefaultState = (): IObjectState => ({
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
  category: null
})

const actions: ActionTree<IObjectState, unknown> = {
  async getObjects ({ commit, state }, params = {}) {
    const { locale } = state
    commit(SET_STATE, { pending: true, category: null, contents: [] })
    try {
      const { data } = await list.getSvg({ locale })
      commit(SET_OBJECTS, data.data)
    } catch (error) {
      console.log(error)
    }
  },
  async getCategoryObjects ({ commit, state }, category: number) {
    const { locale } = state
    commit(SET_STATE, { pending: true, category, contents: [] })
    try {
      const { data } = await list.getSvg({ locale, category, pageIndex: 2 })
      commit(SET_OBJECTS, data.data)
    } catch (error) {
      console.log(error)
    }
  },
  async getContentJson ({ commit, state }, id: string) {
    const { json, host } = state
    try {
      const response = await fetch(`${host}${id}/${json}`).then(response => response.json())
      commit('SET_contentJson', { [id]: response }, { root: true })
      return response
    } catch (error) {
      console.log(error)
    }
  }
}

const mutations: MutationTree<IObjectState> = {
  [SET_STATE] (state: IObjectState, data: Partial<IObjectState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IObjectState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  },
  [SET_OBJECTS] (state: IObjectState, objects: any) {
    state.contents = objects.content
    state.host = objects.host
    state.json = objects.json
    state.preview = objects.preview
    state.pending = false
    state.nextPage = objects.next_page
  }
}

const getters: GetterTree<IObjectState, any> = {
  getNextParams (state) {
    const { nextPage, category, locale } = state
    return {
      locale,
      category,
      page_index: nextPage
    }
  }
}

export default {
  namespaced: true,
  state: getDefaultState,
  getters,
  mutations,
  actions
} as ModuleTree<IObjectState>
