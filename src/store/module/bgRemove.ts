import { IBgRemoveInfo } from '@/interfaces/image'
import { ISize } from '@/interfaces/math'
import store from '@/store'
import eventUtils from '@/utils/eventUtils'
import mouseUtils from '@/utils/mouseUtils'
import { GetterTree, MutationTree } from 'vuex'

const MAX_STEP_COUNT = 20

export interface IBgRemovePinchState {
  // this flag used to indicate if is doing the pinching action
  isPinching: boolean,
  // this flag used to indicate if the edging transition is undergoing
  isTransitioning: boolean,
  initPos: {
    x: number,
    y: number
  },
  initSize: {
    width: number,
    height: number
  }
  initScale: number,
  scale: number // scale range from 0 ~ 1
  x: number,
  y: number,
  physicalCenterPos: {
    x: number,
    y: number
  },
  physicalTopLeftPos: {
    top: number,
    left: number
  }
  containerSize: ISize
}

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
  pinch: IBgRemovePinchState
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
    isPinching: false,
    isTransitioning: false,
    x: 0,
    y: 0,
    initPos: {
      x: -1,
      y: -1
    },
    initSize: {
      width: 0,
      height: 0
    },
    initScale: -1,
    scale: -1,
    physicalCenterPos: { x: 0, y: 0 },
    physicalTopLeftPos: { top: 0, left: 0 },
    containerSize: { width: 0, height: 0 }
  }
})

const state = getDefaultState()
const getters: GetterTree<IBgRemoveState, unknown> = {
  getBgCurrSize(state: IBgRemoveState): ISize {
    const scaleIncrement = state.pinch.scale / state.pinch.initScale
    return {
      width: state.pinch.initSize.width * scaleIncrement,
      height: state.pinch.initSize.height * scaleIncrement
    }
  },
  getContainerSize(state: IBgRemoveState): ISize {
    return {
      width: state.pinch.initPos.x > 0 ? 2 * state.pinch.initPos.x + state.pinch.initSize.width : state.pinch.initSize.width,
      height: state.pinch.initPos.y > 0 ? 2 * state.pinch.initPos.y + state.pinch.initSize.height : state.pinch.initSize.height,
    }
  },
  getIsPinching(state: IBgRemoveState) {
    return state.pinch.isPinching
  },
  getIsPinchInitialized(state: IBgRemoveState) {
    return state.pinch.initPos.x !== -1 && state.pinch.initPos.y !== -1
  },
  getPinchState(state: IBgRemoveState) {
    return state.pinch
  },
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
  },
  UPDATE_pinchState(state: IBgRemoveState, data: Partial<IBgRemovePinchState>) {
    Object.entries(data).forEach(([key, val]) => {
      (state.pinch as any)[key] = val
    })
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}

class BgRemoveMoveHandler {
  private get pinch () {
    return state.pinch
  }

  private get currSize () {
    return store.getters['bgRemove/getBgCurrSize']
  }

  private initBgPos: { x: number, y: number }
  private initEvtPos: null | { x: number, y: number }
  private base: { x: number, y: number }
  private _moving = null as unknown
  private _moveEnd = null as unknown

  constructor() {
    this.initBgPos = { x: -1, y: -1 }
    this.initEvtPos = null
    this.base = { x: 0, y: 0 }
  }

  moveStart(evt: PointerEvent) {
    this._moving = this.moving.bind(this)
    this._moveEnd = this.moveEnd.bind(this)
    eventUtils.addPointerEvent('pointerup', this._moveEnd)
    eventUtils.addPointerEvent('pointermove', this._moving)
  }

  private moving(evt: PointerEvent) {
    if (this.pinch.isPinching || this.pinch.isTransitioning || !store.getters['bgRemove/getMovingMode']) {
      return
    }
    if (!this.initEvtPos) {
      // At the moveStart phase, the evt.x, evt.y would got wrong position, we don't know the reason (2023/8/29)
      // so we doing the initialization in the moving phase
      this.initBgPos.x = this.pinch.x
      this.initBgPos.y = this.pinch.y
      this.initEvtPos = mouseUtils.getMouseAbsPoint(evt)

      // baseline coordinates for current size,
      // which means at the baseline, bg-remove-area would be placed at center
      this.base = {
        x: -(this.currSize.width - this.pinch.initSize.width) * 0.5 + this.pinch.initPos.x,
        y: -(this.currSize.height - this.pinch.initSize.height) * 0.5 + this.pinch.initPos.y,
      }
      return
    }
    const offsetPos = mouseUtils.getMouseRelPoint(evt, this.initEvtPos)
    const limitRange = { x: Math.abs(this.base.x), y: Math.abs(this.base.y) }
    const diff = {
      x: Math.abs(this.initBgPos.x + offsetPos.x - this.base.x),
      y: Math.abs(this.initBgPos.y + offsetPos.y - this.base.y)
    }

    let { x, y } = this.pinch
    // container should be as the bg-remove-rm-section
    if (this.currSize.width > this.pinch.containerSize.width) {
      const isReachRightEdge = this.pinch.x < 0 && offsetPos.x < 0 && diff.x > limitRange.x
      const isReachLeftEdge = this.pinch.x >= 0 && offsetPos.x > 0 && diff.x > limitRange.x
      if (isReachRightEdge || isReachLeftEdge) {
        x = isReachRightEdge ? this.pinch.initSize.width - this.currSize.width + this.pinch.initPos.x * 2 : 0
      } else {
        x = this.initBgPos.x + offsetPos.x
      }
    }
    if (this.currSize.height > this.pinch.containerSize.height) {
      const isReachTopEdge = this.pinch.y >= 0 && offsetPos.y > 0 && diff.y > limitRange.y
      const isReachBottomEdge = this.pinch.y < 0 && offsetPos.y < 0 && diff.y > limitRange.y
      if (isReachTopEdge || isReachBottomEdge) {
        y = isReachBottomEdge ? this.pinch.initSize.height - this.currSize.height + this.pinch.initPos.y * 2 : 0
      } else {
        y = this.initBgPos.y + offsetPos.y
      }
    }
    this.updateBgPos(x, y)
  }

  private moveEnd(evt: PointerEvent) {
    this.initEvtPos = null
    eventUtils.removePointerEvent('pointerup', this._moveEnd)
    eventUtils.removePointerEvent('pointermove', this._moving)
  }

  updateBgPos(x: number, y: number) {
    if (this.pinch.isTransitioning) return
    store.commit('bgRemove/UPDATE_pinchState', { x, y })
  }
}

export const bgRemoveMoveHandler = new BgRemoveMoveHandler()
