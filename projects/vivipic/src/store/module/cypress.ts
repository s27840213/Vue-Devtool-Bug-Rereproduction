import { IPage } from '@nu/vivi-lib/interfaces/page'
import store from '@/store'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

export type ICypressState = {
  //
}

const getDefaultState = (): ICypressState => ({
})

const state = getDefaultState()
const getters: GetterTree<ICypressState, unknown> = {
}

const mutations: MutationTree<ICypressState> = {
}

const actions: ActionTree<ICypressState, unknown> = {
  importDesign(state: ICypressState, newPageConfigs: Array<IPage>) {
    store.commit('SET_pages', pageUtils.newPages(newPageConfigs))
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
