import { IPage } from "@/interfaces/page"
import store from "@/store"
import { AnyTouchEvent } from "any-touch"
import layerUtils from "./layerUtils"
import mathUtils from "./mathUtils"
import { MovingUtils } from "./movingUtils"
import pageUtils from "./pageUtils"
import pointerEvtUtils from "./pointerEvtUtils"

const MAX_SCALE = 400
const TRANSITION_TIME = 300
const TRANSITION_CLASS = ['transition-transform', 'duration-300']

class pagePinchUtils {
  private isPinchInit = false
  private initPagePos = { x: 0, y: 0 }
  private initPinchPos = { x: 0, y: 0 }
  private initPageScale = -1
  private editorView: HTMLElement
  private pointerIds: Array<number> = []
  private translationRatio = { x: 0, y: 0 }
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
    console.warn('editorView', editorView)
    this.pinchHandler = this.pinchHandler.bind(this)
    this.editorView = editorView
  }

  private pinchInit(e: AnyTouchEvent) {
    console.log('pinch init')
    this.isPinchInit = true

    this.initPagePos.x = this.page.x
    this.initPagePos.y = this.page.y
    this.initPinchPos = { x: e.x, y: e.y }
    this.initPageScale = this.pageScaleRatio
    this.translationRatio = this.getTranslationRatio(e, this.editorView)
    store.commit('SET_isPageScaling', true)
    store.commit('mobileEditor/SET_isPinchingEditor', true)

    this.pointerIds = [...pointerEvtUtils.pointerIds]

    return this.initPinchPos
  }

  private getTranslationRatio(e: AnyTouchEvent, windowEl: HTMLElement) {
    const rect = windowEl.getBoundingClientRect()
    return {
      x: ((e.x - rect.left) - this.page.x) / (this.page.width * this.pageScaleRatio * this.contentScaleRatio * 0.01),
      y: ((e.y - rect.top) - this.page.y) / (this.page.height * this.pageScaleRatio * this.contentScaleRatio * 0.01)
    }
  }

  private pinchMove(e: AnyTouchEvent) {
    const { page, contentScaleRatio } = this
    const newScaleRatio = e.scale

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

    store.commit('mobileEditor/UPDATE_pinchScale', e.scale)
  }

  private getEdgeLimit(pageScaleRatio: number) {
    const { page, contentScaleRatio } = this
    return {
      left: 0,
      right: -(pageScaleRatio - 100) * page.width * contentScaleRatio * 0.01,
      top: 0,
      bottom: -(pageScaleRatio - 100) * page.height * contentScaleRatio * 0.01
    }
  }

  private handleEdging(e: AnyTouchEvent) {
    const { page, initPageScale, contentScaleRatio } = this
    const newPageScaleRatio = store.state.mobileEditor.pinchScale * initPageScale
    const edgeLimit = this.getEdgeLimit(newPageScaleRatio)
    const isReachLeft = page.x > edgeLimit.left
    const isReachRight = edgeLimit.right > page.x
    const isReachTop = page.y > edgeLimit.top
    const isReachBottom = edgeLimit.bottom > page.y
    const currPageEl = document.getElementById(`nu-page-wrapper_${layerUtils.pageIndex}`) as HTMLElement

    // case 1: page smaller than default size
    if (newPageScaleRatio < 100) {
      console.warn('case 1')
      currPageEl.classList.add(...TRANSITION_CLASS)
      pageUtils.updatePagePos(layerUtils.pageIndex, {
        x: this.page.initPos.x,
        y: this.page.initPos.y
      })
      const shrinkRatio = 100 / this.initPageScale
      store.commit('mobileEditor/UPDATE_pinchScale', shrinkRatio)
      setTimeout(() => {
        currPageEl.classList.remove(...TRANSITION_CLASS)
        store.commit('SET_pageScaleRatio', 100)
        this.resetState()
        this.addPageMoveEvt(e)
      }, TRANSITION_TIME)
    // case 2: page bigger than maximum size
    } else if (newPageScaleRatio > MAX_SCALE) {
      console.warn('case 2')
      currPageEl.classList.add(...TRANSITION_CLASS)
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
        currPageEl.classList.remove(...TRANSITION_CLASS)
        this.resetState()
        this.addPageMoveEvt(e)
      }, TRANSITION_TIME)
    // case 3: page size proper but reach edges
    } else if (isReachLeft || isReachRight || isReachTop || isReachBottom) {
      console.warn('case 3')
      currPageEl.classList.add(...TRANSITION_CLASS)
      const newPos = {
        x: page.x,
        y: page.y
      }
      if (isReachLeft) {
        newPos.x = 0
      } else if (isReachRight) {
        newPos.x = edgeLimit.right
      }
      if (isReachTop) {
        newPos.y = 0
      } else if (isReachBottom) {
        newPos.y = edgeLimit.bottom
      }
      pageUtils.updatePagePos(layerUtils.pageIndex, newPos)
      setTimeout(() => {
        store.commit('SET_pageScaleRatio', newPageScaleRatio)
        currPageEl.classList.remove(...TRANSITION_CLASS)
        this.resetState()
        this.addPageMoveEvt(e)
      }, TRANSITION_TIME)
    // no need to edging the page
    } else {
      console.warn('case 4')
      this.resetState()
      store.commit('SET_pageScaleRatio', newPageScaleRatio)
      this.addPageMoveEvt(e)
    }
  }

  private addPageMoveEvt(e: AnyTouchEvent) {
    if (pointerEvtUtils.pointerIds.length === 1) {
      this.movingUtils.pageMoveStart(e as any)
    }
  }

  private pinchEnd(e: AnyTouchEvent) {
    this.handleEdging(e)
    this.pointerIds.length = 0

    console.log('pinch end', e.scale)
  }

  private resetState() {
    store.commit('mobileEditor/SET_isPinchingEditor', false)
    store.commit('mobileEditor/UPDATE_pinchScale', 1)
    store.commit('SET_isPageScaling', false)
    this.isPinchInit = false
  }

  pinchHandler(e: AnyTouchEvent) {
    window.requestAnimationFrame(() => this._pinchHandler(e))
  }

  private _pinchHandler(e: AnyTouchEvent) {
    const touches = (e.nativeEvent as TouchEvent).touches
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
}

export default pagePinchUtils
