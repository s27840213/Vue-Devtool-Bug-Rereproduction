import list from '@/apis/list'
import { IListServiceContentDataItem, IListServiceData, IListServiceParams } from '@/interfaces/api'
import { IListModuleState } from '@/interfaces/module'
import { captureException } from '@sentry/browser'
import { ActionTree, GetterTree, MutationTree } from 'vuex'
import listFactory from './listFactory'
import logUtils from '@/utils/logUtils'

const SET_MORE_CATEGORY = 'SET_MORE_CATEGORY' as const

const font = listFactory.apply({
  api: (params: IListServiceParams) => list.getFont(params),
  namespace: 'font'
})

const actions = font.actions as ActionTree<IListModuleState, unknown>
const mutations = font.mutations as MutationTree<IListModuleState>
const getters = font.getters as GetterTree<IListModuleState, any>

actions.getMoreCategory = async ({ commit, getters, state }) => {
  const { nextParams, hasNextPage } = getters
  const pending = state.pending.categories
  if (!hasNextPage || pending) { return }
  commit('SET_pending', { categories: true })
  nextParams.keyword = undefined
  try {
    const { data } = await list.getFont(nextParams)
    commit(SET_MORE_CATEGORY, data.data)
  } catch (error) {
    logUtils.setLogForError(error as Error)
    captureException(error)
  }
}

mutations[SET_MORE_CATEGORY] = function (state: IListModuleState, objects: IListServiceData) {
  for (let idx = 0; idx < objects.content.length; idx++) {
    state.categories[idx].list = state.categories[idx].list.concat(objects.content[idx].list)
  }
  state.pending.categories = false
  state.nextPage = objects.next_page
}

getters.getFont = function (state: IListModuleState): (id: string) => IListServiceContentDataItem | undefined {
  return (id: string) => {
    for (const category of state.categories) {
      for (const font of category.list) {
        if (font.id === id) {
          return font
        }
      }
    }
    return undefined
  }
}

export default font