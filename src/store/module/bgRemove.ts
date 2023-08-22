import { IBgRemoveInfo } from '@/interfaces/image'
import { GetterTree, MutationTree } from 'vuex'

const MAX_STEP_COUNT = 20
export interface IBgRemoveState {
  inBgRemoveMode: boolean,
  brushSize: number,
  showInitImage: boolean,
  clearMode: boolean,
  movingMode: boolean,
  restoreInitState: boolean,
  canvas: HTMLCanvasElement,
  autoRemoveResult: IBgRemoveInfo,
  modifiedFlag: boolean,
  loading: boolean,
  prevPageScaleRatio: number,
  preScrollPos: {
    top: number,
    left: number
  },
  steps: Array<string>,
  currStep: number,
  isProcessing: boolean,
  idInfo: {
    pageId: number,
    layerId: number
  },
  previewImage: {
    src: string,
    width: number,
    height: number
  },
  inEffectEditingMode: boolean,
  pinch: {
    x: number,
    y: number,
    scale: number
  }
}

const getDefaultState = (): IBgRemoveState => ({
  inBgRemoveMode: false,
  brushSize: 16,
  showInitImage: false,
  clearMode: true,
  movingMode: false,
  restoreInitState: false,
  canvas: null as unknown as HTMLCanvasElement,
  autoRemoveResult: null as unknown as IBgRemoveInfo,
  modifiedFlag: false,
  loading: false,
  prevPageScaleRatio: 100,
  preScrollPos: {
    top: -1,
    left: -1
  },
  steps: [],
  currStep: -1,
  isProcessing: false,
  idInfo: {
    pageId: -1,
    layerId: -1
  },
  previewImage: {
    src: '',
    width: 0,
    height: 0
  },
  inEffectEditingMode: false,
  pinch: {
    x: 0,
    y: 0,
    scale: 1
  }
})

const state = getDefaultState()
const getters: GetterTree<IBgRemoveState, unknown> = {
  getInBgRemoveMode(state: IBgRemoveState) {
    return state.inBgRemoveMode
  },
  getInEffectEditingMode(state: IBgRemoveState) {
    return state.inEffectEditingMode
  },
  getBrushSize(state: IBgRemoveState) {
    return state.brushSize
  },
  getShowInitImage(state: IBgRemoveState) {
    return state.showInitImage
  },
  getClearMode(state: IBgRemoveState) {
    return state.clearMode
  },
  getMovingMode(state: IBgRemoveState) {
    return state.movingMode
  },
  getRestoreInitState(state: IBgRemoveState) {
    return state.restoreInitState
  },
  getCanvas(state: IBgRemoveState) {
    return state.canvas
  },
  getAutoRemoveResult(state: IBgRemoveState) {
    return state.autoRemoveResult
  },
  getModifiedFlag(state: IBgRemoveState) {
    return state.modifiedFlag
  },
  getLoading(state: IBgRemoveState) {
    return state.loading
  },
  getPrevPageScaleRatio(state: IBgRemoveState) {
    return state.prevPageScaleRatio
  },
  getPrevScrollPos(state: IBgRemoveState) {
    return state.preScrollPos
  },
  getSteps(state: IBgRemoveState) {
    return state.steps
  },
  getCurrStep(state: IBgRemoveState): number {
    return state.currStep
  },
  inLastStep(state: IBgRemoveState): boolean {
    return state.currStep === state.steps.length - 1
  },
  inFirstStep(state: IBgRemoveState): boolean {
    return state.currStep === 0
  },
  getIsProcessing(state: IBgRemoveState): boolean {
    return state.isProcessing
  },
  getIdInfo(state: IBgRemoveState): { pageId: number, layerId: number } {
    return state.idInfo
  },
  getPreviewImage(state: IBgRemoveState): { src: string, width: number, height: number} {
    return state.previewImage
  }
}

const mutations: MutationTree<IBgRemoveState> = {
  SET_inBgRemoveMode(state: IBgRemoveState, bool: boolean) {
    /**
     * @Note bcz in vivisticker, we need the autoRemoveResult after we leave the bg remove mode, so comment the code below
     */
    // if (!bool) {
    //   Object.assign(state, {
    //     inBgRemoveMode: false,
    //     brushSize: 16,
    //     showInitImage: false,
    //     clearMode: true,
    //     restoreInitState: false,
    //     canvas: null as unknown as HTMLCanvasElement,
    //     autoRemoveResult: null as unknown as IBgRemoveInfo,
    //     modifiedFlag: false,
    //     loading: false,
    //     step: [],
    //     currStep: -1,
    //     previewImage: {
    //       src: '',
    //       width: 0,
    //       height: 0
    //     }
    //   })
    // }
    state.inBgRemoveMode = bool
  },
  SET_inEffectEditingMode (state: IBgRemoveState, bool: boolean) {
    state.inEffectEditingMode = bool
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
  SET_movingMode(state: IBgRemoveState, bool: boolean) {
    state.movingMode = bool
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
  },
  SET_prevPageScaleRatio(state: IBgRemoveState, val: number) {
    state.prevPageScaleRatio = val
  },
  SET_prevScrollPos(state: IBgRemoveState, pos: { top: number, left: number }) {
    Object.assign(state.preScrollPos, pos)
  },
  CLEAR_bgRemoveState(state: IBgRemoveState) {
    Object.assign(state, {
      inBgRemoveMode: false,
      brushSize: 16,
      showInitImage: false,
      clearMode: true,
      restoreInitState: false,
      canvas: null as unknown as HTMLCanvasElement,
      autoRemoveResult: null as unknown as IBgRemoveInfo,
      modifiedFlag: false,
      loading: false,
      prevPageScaleRatio: 100,
      preScrollPos: {
        top: -1,
        left: -1
      },
      previewImage: {
        src: '',
        width: 0,
        height: 0
      }
    })
  },
  ADD_step(state: IBgRemoveState, dataUrl: string) {
    state.steps.length = state.currStep + 1
    if (state.steps.length === MAX_STEP_COUNT) {
      state.steps.shift()
    }
    state.steps.push(dataUrl)
    state.currStep = state.steps.length - 1
  },
  CLEAR_steps(state: IBgRemoveState) {
    state.steps = []
    state.currStep = -1
  },
  SET_currStep(state: IBgRemoveState, step: number) {
    state.currStep = step
  },
  SET_isProcessing(state: IBgRemoveState, type) {
    state.isProcessing = type
  },
  SET_idInfo(state: IBgRemoveState, { pageId, layerId }) {
    Object.assign(state.idInfo, {
      pageId,
      layerId
    })
  },
  SET_previewImage(state: IBgRemoveState, previewImage: { src: string, width: number, height: number }) {
    Object.assign(state.previewImage, previewImage)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
