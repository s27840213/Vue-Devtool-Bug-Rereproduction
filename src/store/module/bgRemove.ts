import { GetterTree, MutationTree } from 'vuex'

interface IBgRemoveState {
  inBgRemoveMode: boolean,
  brushSize: number,
  showInitImage: boolean,
  clearMode: boolean,
  restoreInitState: boolean,
  canvas: HTMLCanvasElement
}

const getDefaultState = (): IBgRemoveState => ({
  inBgRemoveMode: false,
  brushSize: 16,
  showInitImage: false,
  clearMode: true,
  restoreInitState: false,
  canvas: null as unknown as HTMLCanvasElement
})

const state = getDefaultState()
const getters: GetterTree<IBgRemoveState, unknown> = {
  getInBgRemoveMode() {
    return state.inBgRemoveMode
  },
  getBrushSize() {
    return state.brushSize
  },
  getShowInitImage() {
    return state.showInitImage
  },
  getClearMode() {
    return state.clearMode
  },
  getRestoreInitState() {
    return state.restoreInitState
  },
  getCanvas() {
    return state.canvas
  }
}

const mutations: MutationTree<IBgRemoveState> = {
  SET_inBgRemoveMode(state: IBgRemoveState, bool: boolean) {
    if (!bool) {
      state.brushSize = 16
      state.clearMode = true
      state.showInitImage = false
      state.restoreInitState = false
    }
    state.inBgRemoveMode = bool
  },
  SET_brushSize(state: IBgRemoveState, size: number) {
    state.brushSize = size
  },
  SET_showInitImage(state: IBgRemoveState, bool: boolean) {
    state.showInitImage = bool
  },
  SET_clearMode(state: IBgRemoveState, bool: boolean) {
    state.clearMode = bool
  },
  SET_restoreInitState(state: IBgRemoveState, bool: boolean) {
    state.restoreInitState = bool
  },
  SET_canvas(state: IBgRemoveState, canvas: HTMLCanvasElement) {
    state.canvas = canvas
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
