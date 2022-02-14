import { IBgRemoveInfo } from '@/interfaces/image'
import { GetterTree, MutationTree } from 'vuex'

interface IBgRemoveState {
  inBgRemoveMode: boolean,
  brushSize: number,
  showInitImage: boolean,
  clearMode: boolean,
  restoreInitState: boolean,
  canvas: HTMLCanvasElement,
  autoRemoveResult: IBgRemoveInfo,
  modifiedFlag: boolean,
  loading: boolean
}

const getDefaultState = (): IBgRemoveState => ({
  inBgRemoveMode: false,
  brushSize: 16,
  showInitImage: false,
  clearMode: true,
  restoreInitState: false,
  canvas: null as unknown as HTMLCanvasElement,
  autoRemoveResult: null as unknown as IBgRemoveInfo,
  modifiedFlag: false,
  loading: false
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
  },
  getAutoRemoveResult() {
    return state.autoRemoveResult
  },
  getModifiedFlag() {
    return state.modifiedFlag
  },
  getLoading() {
    return state.loading
  }
}

const mutations: MutationTree<IBgRemoveState> = {
  SET_inBgRemoveMode(state: IBgRemoveState, bool: boolean) {
    if (!bool) {
      Object.assign(state, {
        inBgRemoveMode: false,
        brushSize: 16,
        showInitImage: false,
        clearMode: true,
        restoreInitState: false,
        canvas: null as unknown as HTMLCanvasElement,
        autoRemoveResult: null as unknown as IBgRemoveInfo,
        modifiedFlag: false,
        loading: false
      })
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
  },
  SET_autoRemoveResult(state: IBgRemoveState, result: IBgRemoveInfo) {
    state.autoRemoveResult = result
  },
  SET_modifiedFlag(state: IBgRemoveState, flag: boolean) {
    state.modifiedFlag = flag
  },
  SET_loading(state: IBgRemoveState, bool: boolean) {
    state.loading = bool
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
