import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'

interface IPaymentState {
  userCountry: { value: string, label: string }
}

const getDefaultState = (): IPaymentState => ({
  userCountry: { value: '', label: '' }
})

const state = getDefaultState()

const actions: ActionTree<IPaymentState, unknown> = {
}

const mutations: MutationTree<IPaymentState> = {
  SET_userCountry(state: IPaymentState, userCountry) {
    state.userCountry = userCountry
  }
}

const getters: GetterTree<IPaymentState, any> = {
  getuserCountry(state): typeof state.userCountry {
    return state.userCountry
  },
  isTW(state): boolean {
    return state.userCountry.value === 'TW'
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IPaymentState>
