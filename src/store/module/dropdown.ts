import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IDropdownState {
  isOrderDropdownsOpened: boolean,
  isAlignDropdownsOpened: boolean,
  isLayerDropdownsOpened: boolean,
  isFlipDropdownsOpened: boolean,
  isPageDropdownsOpened: boolean
}

const SET_STATE = 'SET_STATE' as const

const getDefaultState = (): IDropdownState => ({
  isOrderDropdownsOpened: false,
  isAlignDropdownsOpened: false,
  isFlipDropdownsOpened: false,
  isLayerDropdownsOpened: false,
  isPageDropdownsOpened: false
})

const state = getDefaultState()
const getters: GetterTree<IDropdownState, unknown> = {
  getIsOrderDropdownsOpened(state: IDropdownState) {
    return state.isOrderDropdownsOpened
  },
  getIsAlignDropdownsOpened(state: IDropdownState) {
    return state.isAlignDropdownsOpened
  },
  getIsFlipDropdownsOpened(state: IDropdownState) {
    return state.isFlipDropdownsOpened
  },
  getIsLayerDropdownsOpened(state: IDropdownState) {
    return state.isLayerDropdownsOpened
  },
  getIsPageDropdownsOpened(state: IDropdownState) {
    return state.isPageDropdownsOpened
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
