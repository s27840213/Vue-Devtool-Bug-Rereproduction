import { ICoordinate } from "@/interfaces/frame"
import { IPage } from "@/interfaces/page"
import store from "@/store"
import { AnyTouchEvent } from "any-touch"
import editorUtils from "./editorUtils"
import generalUtils from "./generalUtils"
import layerUtils from "./layerUtils"
import mathUtils from "./mathUtils"
import { MovingUtils } from "./movingUtils"
import pageUtils from "./pageUtils"
import pointerEvtUtils from "./pointerEvtUtils"

const MAX_SCALE = 300
const TRANSITION_TIME = 300
const TRANSITION_CLASS = ['transition-transform', 'duration-300']

class pagePinchUtils {
  private isPinchInit = false
  private isHandleEdging = false
  private initPagePos = { x: 0, y: 0 }
  private initPinchPos = { x: 0, y: 0 }
  private initPageScale = -1
  private initPosLength = -1
  private editorView: HTMLElement
  private pointerIds: Array<number> = []
  private translationRatio = { x: 0, y: 0 }
  private evtCycleIdentifier = ''
  private movingUtils = new MovingUtils({
    _config: { config: layerUtils.getCurrLayer },
    snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
    body: document.getElementById(
      `nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`,
    ) as HTMLElement
  })

  private get page(): IPage { return pageUtils.getCurrPage }
  private get contentScaleRatio(): number { return this.page.contentScaleRatio}
  private get pageScaleRatio(): number { return store.getters.getPageScaleRatio }

  constructor(editorView: HTMLElement) {
    this.pinchHandler = this.pinchHandler.bind(this)
    this.editorView = editorView
  }

  private pinchInit(e: AnyTouchEvent) {
    if (pointerEvtUtils.pointerIds.length !== 2) return

    this.isPinchInit = true
    this.initPagePos.x = this.page.x
    this.initPagePos.y = this.page.y
    this.initPinchPos = { x: e.x, y: e.y }
    this.initPageScale = this.pageScaleRatio
    this.initPosLength = this.getLength({
      x: (e.nativeEvent as TouchEvent).touches[0].clientX,
       y: (e.nativeEvent as TouchEvent).touches[0].clientY
    }, {
      x: (e.nativeEvent as TouchEvent).touches[1].clientX,
      y: (e.nativeEvent as TouchEvent).touches[1].clientY
    })
    this.evtCycleIdentifier = generalUtils.generateRandomString(6)

    this.translationRatio = this.getTranslationRatio(e, this.editorView)
    store.commit('SET_isPageScaling', true)
    store.commit('mobileEditor/SET_isPinchingEditor', true)
    store.commit('mobileEditor/SET_isDisableSwipe', true)

    this.pointerIds = [...pointerEvtUtils.pointerIds]

    return this.initPinchPos
  }

  private pinchMove(e: AnyTouchEvent) {
    const { page, contentScaleRatio } = this
    const newScaleRatio = this.getScale({
        x: (e.nativeEvent as TouchEvent).touches[0].clientX,
         y: (e.nativeEvent as TouchEvent).touches[0].clientY
      }, {
        x: (e.nativeEvent as TouchEvent).touches[1].clientX,
        y: (e.nativeEvent as TouchEvent).touches[1].clientY
    })

    // size difference via pinching
    const sizeDiff = {
      width: (newScaleRatio - 1) * (page.width * contentScaleRatio * this.initPageScale * 0.01),
      height: (newScaleRatio - 1) * (page.height * contentScaleRatio * this.initPageScale * 0.01)
    }

    const movingTranslate = {
      x: e.x - this.initPinchPos.x,
      y: e.y - this.initPinchPos.y
    }

    pageUtils.updatePagePos(layerUtils.pageIndex, {
      x: this.initPagePos.x - this.translationRatio.x * sizeDiff.width + movingTranslate.x,
      y: this.initPagePos.y - this.translationRatio.y * sizeDiff.height + movingTranslate.y
    })

    store.commit('mobileEditor/UPDATE_pinchScale', newScaleRatio)
  }

  private handleEdging(e: AnyTouchEvent) {
    const { page, initPageScale, contentScaleRatio } = this
    const newPageScaleRatio = store.state.mobileEditor.pinchScale * initPageScale
    const edgeLimit = this.getEdgeLimit(newPageScaleRatio)
    const { isReachLeftEdge, isReachRightEdge, isReachTopEdge, isReachBottomEdge } = this.pageEdgeLimitHandler(newPageScaleRatio)
    this.isHandleEdging = true

    // case 1: page smaller than default size
    if (newPageScaleRatio < 100) {
      this.addEdgingTransition()

      pageUtils.updatePagePos(layerUtils.pageIndex, {
        x: this.page.initPos.x,
        y: this.page.initPos.y
      })
      const shrinkRatio = 100 / this.initPageScale
      store.commit('mobileEditor/UPDATE_pinchScale', shrinkRatio)
      setTimeout(() => {
        this.removeEdgingTransition()
        store.commit('SET_pageScaleRatio', 100)
        this.resetState()
        this.addPageMoveEvt(e)
      }, TRANSITION_TIME)
    // case 2: page bigger than maximum size
    } else if (newPageScaleRatio > MAX_SCALE) {
      this.addEdgingTransition()
      const sizeDiff = {
        width: (newPageScaleRatio - MAX_SCALE) * (page.width * contentScaleRatio * 0.01),
        height: (newPageScaleRatio - MAX_SCALE) * (page.height * contentScaleRatio * 0.01)
      }
      const newPos = {
        x: page.x + sizeDiff.width * this.translationRatio.x,
        y: page.y + sizeDiff.height * this.translationRatio.y
      }
      const newEdgeLimit = this.getEdgeLimit(MAX_SCALE)
      pageUtils.updatePagePos(layerUtils.pageIndex, {
        x: mathUtils.clamp(newPos.x, newEdgeLimit.right, newEdgeLimit.left),
        y: mathUtils.clamp(newPos.y, newEdgeLimit.bottom, newEdgeLimit.top)
      })
      const newPinchScale = MAX_SCALE / this.initPageScale
      store.commit('mobileEditor/UPDATE_pinchScale', newPinchScale)
      setTimeout(() => {
        store.commit('SET_pageScaleRatio', MAX_SCALE)
        this.removeEdgingTransition()
        this.resetState()
        this.addPageMoveEvt(e)
      }, TRANSITION_TIME)
    // case 3: page size proper but reach edges
    } else if (isReachLeftEdge || isReachRightEdge || isReachTopEdge || isReachBottomEdge) {
      this.addEdgingTransition()
      const newPos = {
        x: page.x,
        y: page.y
      }
      if (isReachLeftEdge) {
        newPos.x = edgeLimit.left
      } else if (isReachRightEdge) {
        newPos.x = edgeLimit.right
      }
      if (isReachTopEdge) {
        newPos.y = edgeLimit.top
      } else if (isReachBottomEdge) {
        newPos.y = edgeLimit.bottom
      }
      pageUtils.updatePagePos(layerUtils.pageIndex, newPos)
      setTimeout(() => {
        store.commit('SET_pageScaleRatio', newPageScaleRatio)
        this.removeEdgingTransition()
        this.resetState()
        this.addPageMoveEvt(e)
      }, TRANSITION_TIME)
    // no need to edging the page
    } else {
      this.resetState()
      store.commit('SET_pageScaleRatio', newPageScaleRatio)
      this.addPageMoveEvt(e)
    }
  }

  pinchEnd(e: AnyTouchEvent) {
    // pointerIds.length equals to 0 means the pinchEnd has been called
    if (this.pointerIds.length === 0) return
    this.handleEdging(e)
    this.pointerIds.length = 0
  }

  private resetState() {
    store.commit('mobileEditor/SET_isPinchingEditor', false)
    store.commit('mobileEditor/UPDATE_pinchScale', 1)
    store.commit('SET_isPageScaling', false)
    this.isPinchInit = false
    this.isHandleEdging = false

    // the swipe might be triggered as the pinch-gesture-end,
    // a delay-time waiting for the gesture ended saving the UX
    const _evtCycleIdentifier = this.evtCycleIdentifier
    setTimeout(() => {
      if (this.evtCycleIdentifier === _evtCycleIdentifier) {
        store.commit('mobileEditor/SET_isDisableSwipe', false)
      }
    }, 500)
  }

  pinchHandler(e: AnyTouchEvent) {
    window.requestAnimationFrame(() => this._pinchHandler(e))
  }

  private _pinchHandler(e: AnyTouchEvent) {
    const touches = (e.nativeEvent as TouchEvent).touches
    if (this.isHandleEdging) return
    if (this.pointerIds.length === 2 && touches.length === 2 &&
      (!this.pointerIds.includes(touches[0].identifier) ||
      !this.pointerIds.includes(touches[1].identifier))) return this.pinchInit(e)

    switch (e.phase) {
      case 'move': {
        if (!this.isPinchInit) {
          return this.pinchInit(e)
        }
        this.pinchMove(e)
        break
      }
      case 'end': {
        this.pinchEnd(e)
      }
    }
  }

  private getEdgeLimit(pageScaleRatio: number) {
    const { page, contentScaleRatio } = this
    if (generalUtils.isCm) {
      return {
        left: 0,
        right: -(pageScaleRatio - 100) * page.width * contentScaleRatio * 0.01,
        top: 0,
        bottom: -(pageScaleRatio - 100) * page.height * contentScaleRatio * 0.01
      }
    } else {
      // isPic
      const EDGE_WIDTH = {
        x: (editorUtils.mobileSize.width - pageUtils.getCurrPage.width * contentScaleRatio) * 0.5,
        y: (editorUtils.mobileSize.height - pageUtils.getCurrPage.height * contentScaleRatio) * 0.5
      }
      return {
        left: EDGE_WIDTH.x,
        right: (editorUtils.mobileSize.width - page.width * contentScaleRatio * pageScaleRatio * 0.01 - EDGE_WIDTH.x),
        top: EDGE_WIDTH.y,
        bottom: (editorUtils.mobileSize.height - page.height * contentScaleRatio * pageScaleRatio * 0.01 - EDGE_WIDTH.y)
      }
    }
  }

  private getTranslationRatio(e: AnyTouchEvent, windowEl: HTMLElement) {
    const rect = windowEl.getBoundingClientRect()
    if (generalUtils.isCm) {
      return {
        x: ((e.x - rect.left) - this.page.x) / (this.page.width * this.pageScaleRatio * this.contentScaleRatio * 0.01),
        y: ((e.y - rect.top) - this.page.y) / (this.page.height * this.pageScaleRatio * this.contentScaleRatio * 0.01)
      }
    } else {
      // isPic
      const { page, pageScaleRatio, contentScaleRatio } = this
      const translationRatio_ori_pos = {
        x: ((page.initPos.x - this.initPagePos.x) / (page.width * this.pageScaleRatio * 0.01 * contentScaleRatio)),
        y: ((page.initPos.y - this.initPagePos.y) / (page.height * this.pageScaleRatio * 0.01 * contentScaleRatio))
      }

      // actual translation ratio equals to current pinch-in-current-window plus current-window-pos
      return {
        x: ((this.initPinchPos.x - editorUtils.mobileCenterPos.x) / (page.width * contentScaleRatio) + 0.5) / (pageScaleRatio * 0.01) + translationRatio_ori_pos.x,
        y: ((this.initPinchPos.y - editorUtils.mobileCenterPos.y) / (page.height * contentScaleRatio) + 0.5) / (pageScaleRatio * 0.01) + translationRatio_ori_pos.y
      }
    }
  }

  private getLength(p1: ICoordinate, p2: ICoordinate) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
  }

  private getScale(p1: ICoordinate, p2: ICoordinate) {
    return this.getLength(p1, p2) / this.initPosLength
  }

  private addEdgingTransition() {
    if (generalUtils.isCm) {
      const currPageEl = document.getElementById('screenshot-target') as HTMLElement
      currPageEl.classList.add(...TRANSITION_CLASS)
      // const canvasSection = document.getElementById('canvas-section-canvas') as HTMLElement
      // canvasSection.classList.add(...TRANSITION_CLASS)
    } else {
      const canvasSection = document.getElementById('canvas-section-canvas') as HTMLElement
      canvasSection.classList.add(...TRANSITION_CLASS)
    }
  }

  private removeEdgingTransition() {
    if (generalUtils.isCm) {
      const currPageEl = document.getElementById('screenshot-target') as HTMLElement
      currPageEl.classList.remove(...TRANSITION_CLASS)
      // const canvasSection = document.getElementById('canvas-section-canvas') as HTMLElement
      // canvasSection.classList.remove(...TRANSITION_CLASS)
    } else {
      const currPageEl = document.getElementById(`nu-page-wrapper_${layerUtils.pageIndex}`) as HTMLElement
      currPageEl.classList.remove(...TRANSITION_CLASS)
    }
  }

  private pageEdgeLimitHandler(pageScaleRatio: number) {
    const { page } = this
    const edgeLimit = this.getEdgeLimit(pageScaleRatio)
    if (generalUtils.isCm) {
      return {
        isReachLeftEdge: page.x > edgeLimit.left,
        isReachRightEdge: edgeLimit.right > page.x,
        isReachTopEdge: page.y > edgeLimit.top,
        isReachBottomEdge: edgeLimit.bottom > page.y
      }
    }
    // isPic
    return {
      isReachLeftEdge: page.x >= edgeLimit.left,
      isReachRightEdge: page.x <= edgeLimit.right,
      isReachTopEdge: page.y >= edgeLimit.top,
      isReachBottomEdge: page.y <= edgeLimit.bottom
    }
  }

  private addPageMoveEvt(e: AnyTouchEvent) {
    if (pointerEvtUtils.pointerIds.length === 1) {
      this.movingUtils.pageMoveStart(e as any)
    }
  }

  static resetPageScale() {
    store.commit('SET_pageScaleRatio', 100)
    pageUtils.updatePagePos(layerUtils.pageIndex, {
      x: layerUtils.getCurrPage.initPos.x || 0,
      y: layerUtils.getCurrPage.initPos.y || 0
    })
  }
}

export default pagePinchUtils
