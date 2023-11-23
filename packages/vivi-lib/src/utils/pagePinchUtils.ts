import { IPage } from "@/interfaces/page"
import store from "@/store"
import { AnyTouchEvent } from "any-touch"
import pageUtils from "./pageUtils"

class pagePinchUtils {
  private isPinchInit = false
  private initPagePos = { x: 0, y: 0 }
  private initPinchPos = { x: 0, y: 0 }
  private initPinchScale = -1
  private get page(): IPage { return pageUtils.getCurrPage }
  private get scaleRatio(): number { return pageUtils.scaleRatio }
  private get contentScaleRatio(): number { return this.page.contentScaleRatio}

  constructor() {
    this.pinchHandler = this.pinchHandler.bind(this)
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

  private pinchMove(e: AnyTouchEvent) {
    const { page, contentScaleRatio } = this
    const newScaleRatio = this.initPinchScale * e.scale
    // size difference via pinching
    const sizeDiff = {
      width: (newScaleRatio - this.initPinchScale) * 0.01 * (page.width * contentScaleRatio),
      height: (newScaleRatio - this.initPinchScale) * 0.01 * (page.height * contentScaleRatio)
    }
    store.commit('mobileEditor/UPDATE_pinchScale', e.scale * this.initPinchScale)
    // pageUtils.updatePageProps()
  }

  pinchHandler(e: AnyTouchEvent) {
    window.requestAnimationFrame(() => this._pinchHandler(e))
  }

  private _pinchHandler(e: AnyTouchEvent) {
    switch (e.phase) {
      case 'move': {
        if (!this.isPinchInit || !this.initPinchPos) {
          return this.pinchInit(e)
        }
        this.pinchMove(e)
        console.log('pinch move')
        break
      }
      case 'end': {
        console.log('pinch end')
      }
    }
  }
}

export default pagePinchUtils
