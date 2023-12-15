import pageUtils from '@/utils/pageUtils'
import { GetterTree, MutationTree } from 'vuex'

type size = { width: number, height: number }
type pos = { x: number, y: number }

export interface ICanvasResizeState {
  initSize: size
  layerOffset: pos
}

const getDefaultState = (): ICanvasResizeState => ({
  initSize: { width: 0, height: 0 },
  layerOffset: { x: 0, y: 0 },
})

const state = getDefaultState()
const getters: GetterTree<ICanvasResizeState, unknown> = {
  getInitSize(state: ICanvasResizeState): size {
    return state.initSize
  },
  getSizeDiff(state: ICanvasResizeState): { wDiff: number, hDiff: number } {
    const page = pageUtils.getCurrPage
    return {
      wDiff: page.width - state.initSize.width,
      hDiff: page.height - state.initSize.height,
    }
  },
  getLayerOffset(state: ICanvasResizeState): pos {
    return state.layerOffset
  },
}

const mutations: MutationTree<ICanvasResizeState> = {
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
