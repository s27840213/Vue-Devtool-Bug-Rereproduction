import { IPopupComponent, ISliderConfig } from '@/interfaces/popup'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

interface IPopupState {
  isPopupOpen: boolean,
  popupComponent: IPopupComponent,
  sliderConfig: ISliderConfig
}

const DEFAULT_SLIDER_CONFIG = {
  value: 0,
  min: 0,
  max: 0,
  step: 1,
  noText: false,
  width: 150,
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
  },
  sliderConfig: Object.assign({}, DEFAULT_SLIDER_CONFIG)
})

const state = getDefaultState()
const getters: GetterTree<IPopupState, unknown> = {
  getIsPopupOpen(state: IPopupState) {
    return state.isPopupOpen
  },
  getPopupComponent(state: IPopupState) {
    return state.popupComponent
  },
  getSliderConfig(state: IPopupState) {
    return state.sliderConfig
  }
}

const mutations: MutationTree<IPopupState> = {
  SET_isPopupOpen(state, bool) {
    state.isPopupOpen = bool
  },
  SET_popupComponent(state, configs) {
    Object.assign(state.popupComponent, configs)
  },
  SET_sliderConfig(state, sliderConfig) {
    Object.assign(state.sliderConfig, sliderConfig)
  },
  UPDATE_clearSliderConfig(state) {
    state.sliderConfig = Object.assign({}, DEFAULT_SLIDER_CONFIG)
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
