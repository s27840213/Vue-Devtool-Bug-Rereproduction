import { ActionTree, MutationTree } from 'vuex'
import { captureException } from '@sentry/browser'
import list from '@/apis/list'
import { IListServiceData, IListServiceParams } from '@/interfaces/api'
import { IListModuleState } from '@/interfaces/module'
import listFactory, { SET_STATE } from './listFactory'

const SET_MORE_CATEGORY = 'SET_MORE_CATEGORY' as const

const font = listFactory.apply({
  api: (params: IListServiceParams) => list.getFont(params)
})

const actions = font.actions as ActionTree<IListModuleState, unknown>
const mutations = font.mutations as MutationTree<IListModuleState>

actions.getMoreCategory = async ({ commit, getters, state }) => {
  const { nextParams, hasNextPage } = getters
  const { pending } = state
  if (!hasNextPage || pending) { return }
  commit(SET_STATE, { pending: true })
  nextParams.keyword = undefined
  try {
    const { data } = await list.getFont(nextParams)
    commit(SET_MORE_CATEGORY, data.data)
  } catch (error) {
    captureException(error)
  }
}

mutations[SET_MORE_CATEGORY] = function(state: IListModuleState, objects: IListServiceData) {
  for (let idx = 0; idx < objects.content.length; idx++) {
    state.categories[idx].list = state.categories[idx].list.concat(objects.content[idx].list)
  }
  state.pending = false
  state.nextPage = objects.next_page
}

export default font
