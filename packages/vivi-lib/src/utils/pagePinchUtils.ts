import { IPage } from "@/interfaces/page"
import store from "@/store"
import { AnyTouchEvent } from "any-touch"
import layerUtils from "./layerUtils"
import pageUtils from "./pageUtils"

class pagePinchUtils {
  private isPinchInit = false
  private initPagePos = { x: 0, y: 0 }
  private initPinchPos = { x: 0, y: 0 }
  private initPinchScale = -1
  private editorView: HTMLElement
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
    this.initPinchScale = e.scale
    store.commit('SET_isPageScaling', true)
    store.commit('mobileEditor/SET_isPinchingEditor', true)

    const pageRenderSize = { width: this.page.width * this.page.contentScaleRatio, height: this.page.height * this.page.contentScaleRatio }
    // const posInConfig = {
    //   x: (e.x - editorUtils.mobileCenterPos.x + pageRenderSize.width * 0.5) / this.page.contentScaleRatio - this.config.styles.imgX,
    //   y: (e.y - editorUtils.mobileCenterPos.y + pageRenderSize.height * 0.5) / this.page.contentScaleRatio - this.config.styles.imgY
    // }
    // this.translationRatio = {
    //   x: -posInConfig.x / this.config.styles.imgWidth,
    //   y: -posInConfig.y / this.config.styles.imgHeight
    // }
    return this.initPinchPos
  }

  private getTranslationRatio(e: AnyTouchEvent, el: HTMLElement) {
    const rect = el.getBoundingClientRect()
    // console.log('rect', rect)
    // console.log(e.x, e.y)
    return {
      x: (e.x - rect.left) / rect.width,
      y: (e.y - rect.top) / rect.height
      // x: (e.x - rect.left) / (rect.width - e.x + rect.left),
      // y: (e.y - rect.top) / (rect.height - e.y + rect.top)
    }
  }

  private pinchMove(e: AnyTouchEvent) {
    const { page, contentScaleRatio } = this
    const newScaleRatio = this.initPinchScale * e.scale
    // size difference via pinching
    const sizeDiff = {
      width: (newScaleRatio - this.initPinchScale) * (page.width * contentScaleRatio),
      height: (newScaleRatio - this.initPinchScale) * (page.height * contentScaleRatio)
    }
    console.log(this.getTranslationRatio(e, this.editorView))
    store.commit('mobileEditor/UPDATE_pinchScale', e.scale * this.initPinchScale)
    // pageUtils.updatePageProps()
  }

  private handleEdging(e: AnyTouchEvent) {
    const newPageScaleRatio = e.scale * this.initPinchScale * this.pageScaleRatio

    if (newPageScaleRatio < 100) {
      store.commit('SET_pageScaleRatio', 100)
      pageUtils.updatePagePos(layerUtils.pageIndex, {
        x: this.page.initPos.x,
        y: this.page.initPos.y
      })
      console.log('page init pos', this.page.initPos)
    } else {
      // no need to edging the page
      store.commit('SET_pageScaleRatio', newPageScaleRatio)
    }
    console.log('SET_pageScaleRatio', newPageScaleRatio)
  }

  private pinchEnd(e: AnyTouchEvent) {
    this.resetState()
    this.handleEdging(e)
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
