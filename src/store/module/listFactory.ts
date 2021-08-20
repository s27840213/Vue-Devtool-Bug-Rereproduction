import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { IListServiceData } from '@/interfaces/api'
import { IListModuleState } from '@/interfaces/module'

const SET_STATE = 'SET_STATE' as const
const SET_CONTENT = 'SET_CONTENT' as const
const SET_CATEGORIES = 'SET_CATEGORIES' as const
const SET_MORE_CONTENT = 'SET_MORE_CONTENT' as const

export default function (this: any) {
  const getDefaultState = (): IListModuleState => ({
    content: [],
    categories: [],
    keyword: '',
    page: 0,
    perPage: 0,
    nextPage: 0,
    pending: false,
    host: '',
    data: '',
    preview: '',
    locale: 'tw',
    error: ''
  })

  const actions: ActionTree<IListModuleState, unknown> = {
    getCategories: async ({ commit, state }) => {
      const { locale } = state
      commit(SET_STATE, { pending: true, categories: [] })
      try {
        const { data } = await this.api({ locale, listAll: 0 })
        commit(SET_CATEGORIES, data.data)
      } catch (error) {
        console.log(error)
      }
    },

    getContent: async ({ commit, state }, params = {}) => {
      const { locale } = state
      const { keyword } = params
      commit(SET_STATE, { pending: true, keyword, content: [] })
      try {
        const { data } = await this.api({ locale, keyword, listAll: 1 })
        commit(SET_CONTENT, data.data)
      } catch (error) {
        console.log(error)
      }
    },

    getMoreContent: async ({ commit, getters }) => {
      const { nextParams, hasNextPage } = getters
      if (!hasNextPage) { return }
      commit(SET_STATE, { pending: true })
      try {
        const { data } = await this.api(nextParams)
        commit(SET_MORE_CONTENT, data.data)
      } catch (error) {
        console.log(error)
      }
    },
    getContentJson: async ({ commit, state }, id: string) => {
      const { data, host } = state
      try {
        const response = await fetch(`${host}/${id}/${data}`).then(response => response.json())
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
    [SET_CATEGORIES] (state: IListModuleState, objects: IListServiceData) {
      state.categories = objects.content
      state.host = objects.host.endsWith('/') ? objects.host.slice(0, -1) : objects.host
      state.data = objects.data
      state.preview = objects.preview
      state.pending = false
    },
    [SET_CONTENT] (state: IListModuleState, objects: IListServiceData) {
      state.content = objects.content
      state.host = objects.host.endsWith('/') ? objects.host.slice(0, -1) : objects.host
      state.data = objects.data
      state.preview = objects.preview
      state.pending = false
      state.nextPage = objects.next_page
    },
    [SET_MORE_CONTENT] (state: IListModuleState, objects: IListServiceData) {
      state.content = state.content.concat(objects.content)
      state.pending = false
      state.nextPage = objects.next_page
    }
  }

  const getters: GetterTree<IListModuleState, any> = {
    nextParams (state) {
      const { nextPage, keyword, locale } = state
      return {
        locale,
        keyword,
        listAll: 1,
        page_index: nextPage
      }
    },
    hasNextPage (state) {
      return state.nextPage && state.nextPage > 0
    }
  }

  return {
    namespaced: true,
    state: getDefaultState,
    getters,
    mutations,
    actions
  } as ModuleTree<IListModuleState>
}
