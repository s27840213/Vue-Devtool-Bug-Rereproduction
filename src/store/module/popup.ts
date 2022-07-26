import { IPopupComponent } from '@/interfaces/popup'
import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IPopupState {
  isPopupOpen: boolean,
  popupComponent: IPopupComponent
}

const SET_STATE = 'SET_STATE' as const

const getDefaultState = (): IPopupState => ({
  isPopupOpen: false,
  popupComponent: {
    component: '',
    properties: {},
    props: {},
    closeHandler: () => {
      return false
    }
  }
})

const state = getDefaultState()
const getters: GetterTree<IPopupState, unknown> = {
  getIsPopupOpen(state: IPopupState) {
    return state.isPopupOpen
  },
  getPopupComponent(state: IPopupState) {
    return state.popupComponent
  }
}

const mutations: MutationTree<IPopupState> = {
  SET_isPopupOpen(state, bool) {
    state.isPopupOpen = bool
  },
  SET_popupComponent(state, configs) {
    Object.assign(state.popupComponent, configs)
  }
}

const actions: ActionTree<IPopupState, unknown> = {
  openPopup({ commit }, data: Partial<IPopupComponent>) {
    commit('SET_isPopupOpen', true)
    commit('SET_popupComponent', data)
  },
  closePopup({ commit }) {
    commit('SET_isPopupOpen', false)
    commit('SET_popupComponent', {
      component: '',
      properties: {},
      closeHandler: () => {
        return false
      }
    })
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
