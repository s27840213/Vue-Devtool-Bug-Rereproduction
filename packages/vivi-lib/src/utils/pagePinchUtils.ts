import { IPage } from "@/interfaces/page"
import store from "@/store"
import { AnyTouchEvent } from "any-touch"
import layerUtils from "./layerUtils"
import mathUtils from "./mathUtils"
import pageUtils from "./pageUtils"

const MAX_SCALE = 300

class pagePinchUtils {
  private isPinchInit = false
  private initPagePos = { x: 0, y: 0 }
  private initPinchPos = { x: 0, y: 0 }
  private initPageScale = -1
  private editorView: HTMLElement
  private translationRatio = { x: 0, y: 0 }
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
    // if (this.isBgImgCtrl || this.isImgCtrl) return

    this.initPagePos.x = this.page.x
    this.initPagePos.y = this.page.y
    this.initPinchPos = { x: e.x, y: e.y }
    this.initPageScale = this.pageScaleRatio
    this.translationRatio = this.getTranslationRatio(e, this.editorView)
    console.warn('initpinch pos', this.initPagePos, this.initPinchPos)
    store.commit('SET_isPageScaling', true)
    store.commit('mobileEditor/SET_isPinchingEditor', true)

    return this.initPinchPos
  }

  private getTranslationRatio(e: AnyTouchEvent, windowEl: HTMLElement) {
    const rect = windowEl.getBoundingClientRect()
    return {
      // x: 0.5,
      // y: 0.5
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
    // pageUtils.updatePageProps()
  }

  private getEdgeLimit(pageScaleRatio: number) {
    const { page, contentScaleRatio } = this
    return {
      left: 0,
      right: (pageScaleRatio - 100) * page.width * contentScaleRatio * 0.01,
      top: 0,
      bottom: (pageScaleRatio - 100) * page.height * contentScaleRatio * 0.01
    }
  }

  private handleEdging(e: AnyTouchEvent) {
    const { page, initPageScale, contentScaleRatio } = this
    const newPageScaleRatio = store.state.mobileEditor.pinchScale * initPageScale
    const edgeLimit = this.getEdgeLimit(newPageScaleRatio)
    const isReachLeft = page.x > edgeLimit.left
    const isReachRight = edgeLimit.right < -page.x
    const isReachTop = page.y > edgeLimit.top
    const isReachBottom = edgeLimit.bottom < -page.y
    console.log(isReachLeft, isReachRight)

    // case 1: page smaller than default size
    if (newPageScaleRatio < 100) {
      console.warn(1)
      store.commit('SET_pageScaleRatio', 100)
      pageUtils.updatePagePos(layerUtils.pageIndex, {
        x: this.page.initPos.x,
        y: this.page.initPos.y
      })
    // case 2: page bigger than maximum size
    } else if (newPageScaleRatio > MAX_SCALE) {
      console.warn(3)
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
      store.commit('SET_pageScaleRatio', MAX_SCALE)
    // case 3: page size proper but reach edges
    } else if (isReachLeft || isReachRight || isReachTop || isReachBottom) {
      console.warn(3)
      const newPos = {
        x: page.x,
        y: page.y
      }
      if (isReachLeft) {
        newPos.x = 0
      } else if (isReachRight) {
        newPos.x = -edgeLimit.right
      }
      if (isReachTop) {
        newPos.y = 0
      } else if (isReachBottom) {
        newPos.y = -edgeLimit.bottom
      }
      pageUtils.updatePagePos(layerUtils.pageIndex, newPos)
    } else {
      console.warn(4)
      // no need to edging the page
      store.commit('SET_pageScaleRatio', newPageScaleRatio)
    }
  }

  private pinchEnd(e: AnyTouchEvent) {
    this.handleEdging(e)
    this.resetState()
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
