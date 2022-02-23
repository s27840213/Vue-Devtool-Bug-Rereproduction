import { IBgRemoveInfo } from '@/interfaces/image'
import { GetterTree, MutationTree } from 'vuex'

const MAX_STEP_COUNT = 20
interface IBgRemoveState {
  inBgRemoveMode: boolean,
  brushSize: number,
  showInitImage: boolean,
  clearMode: boolean,
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
  currStep: number
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
  loading: false,
  prevPageScaleRatio: 100,
  preScrollPos: {
    top: -1,
    left: -1
  },
  steps: [],
  currStep: -1
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
  },
  getPrevPageScaleRatio() {
    return state.prevPageScaleRatio
  },
  getPrevScrollPos() {
    return state.preScrollPos
  },
  getSteps() {
    return state.steps
  },
  getCurrStep(): number {
    return state.currStep
  },
  inLastStep(): boolean {
    return state.currStep === state.steps.length - 1
  },
  inFirstStep(): boolean {
    return state.currStep === 0
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
        loading: false,
        step: [],
        currStep: -1
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
    if (bool) {
      state.steps = []
      state.currStep = -1
    }
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
  SET_currStep(state: IBgRemoveState, step: number) {
    state.currStep = step
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
