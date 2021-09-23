import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IDropdownState {
  isOrderDropdownOpened: boolean,
  isAlignDropdownOpened: boolean,
  isLayerDropdownOpened: boolean,
  isFlipDropdownOpened: boolean,
  isPageDropdownOpened: boolean
}

const SET_STATE = 'SET_STATE' as const

const getDefaultState = (): IDropdownState => ({
  isOrderDropdownOpened: false,
  isAlignDropdownOpened: false,
  isFlipDropdownOpened: false,
  isLayerDropdownOpened: false,
  isPageDropdownOpened: false
})

const state = getDefaultState()
const getters: GetterTree<IDropdownState, unknown> = {
  getIsOrderDropdownOpened(state: IDropdownState) {
    return state.isOrderDropdownOpened
  },
  getIsAlignDropdownOpened(state: IDropdownState) {
    return state.isAlignDropdownOpened
  },
  getIsFlipDropdownOpened(state: IDropdownState) {
    return state.isFlipDropdownOpened
  },
  getIsLayerDropdownOpened(state: IDropdownState) {
    return state.isLayerDropdownOpened
  },
  getIsPageDropdownOpened(state: IDropdownState) {
    return state.isPageDropdownOpened
  }
}

const mutations: MutationTree<IDropdownState> = {
  [SET_STATE](state: IDropdownState, data: Partial<IDropdownState>) {
    console.log(data)
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IDropdownState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  }
}

const actions: ActionTree<IDropdownState, unknown> = {
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
