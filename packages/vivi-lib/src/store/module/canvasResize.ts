import { GetterTree, MutationTree } from 'vuex'

type size = { width: number, height: number }
type pos = { x: number, y: number }

export interface ICanvasResizeState {
  isResizing: boolean
  initSize: size
  layerOffset: pos
}

const getDefaultState = (): ICanvasResizeState => ({
  isResizing: false,
  initSize: { width: 0, height: 0 },
  layerOffset: { x: 0, y: 0 },
})

const state = getDefaultState()
const getters: GetterTree<ICanvasResizeState, unknown> = {
  getIsResizing(state: ICanvasResizeState): boolean {
    return state.isResizing
  },
  getInitSize(state: ICanvasResizeState): size {
    return state.initSize
  },
  getLayerOffset(state: ICanvasResizeState): pos {
    return state.isResizing ? state.layerOffset : { x: 0, y: 0 }
  },
}

const mutations: MutationTree<ICanvasResizeState> = {
  SET_isResizing(state: ICanvasResizeState, isResizing: boolean) {
    state.isResizing = isResizing
  },
  SET_initSize(state: ICanvasResizeState, initSize: size) {
    state.initSize = initSize
    state.layerOffset = { x: 0, y: 0 }
  },
  SET_layerOffset(state: ICanvasResizeState, layerOffset: pos) {
    state.layerOffset = layerOffset
  },
  UPDATE_reset(state: ICanvasResizeState) {
    state.initSize = { width: 0, height: 0 }
    state.layerOffset = { x: 0, y: 0 }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
}
