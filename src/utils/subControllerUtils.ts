import { IFrame, IGroup, ILayer, ITmp } from '@/interfaces/layer'
import store from '@/store'
import { FunctionPanelType, ILayerInfo, LayerType } from '@/store/types'
import colorUtils from './colorUtils'
import eventUtils, { PanelEvent } from './eventUtils'
import formatUtils from './formatUtils'
import frameUtils from './frameUtils'
import generalUtils from './generalUtils'
import groupUtils from './groupUtils'
import imageUtils from './imageUtils'
import layerUtils from './layerUtils'
import tiptapUtils from './tiptapUtils'

export default class SubControllerUtils {
  private component = undefined as Vue | undefined
  private body = undefined as unknown as HTMLElement
  private _config = { config: null as unknown as ILayer }
  private layerInfo = { pageIndex: layerUtils.pageIndex, layerIndex: layerUtils.layerIndex, subLayerIdx: layerUtils.subLayerIdx } as ILayerInfo
  private dblTapFlag = false
  private posDiff = { x: 0, y: 0 }
  private _onMouseup = null as unknown
  private primaryActive = false

  private get config(): ILayer { return this._config.config }
  private get pageIndex(): number { return this.layerInfo.pageIndex }
  private get layerIndex(): number { return this.layerInfo.layerIndex }
  private get subLayerIdx(): number { return this.layerInfo.subLayerIdx ?? -1 }
  private get primaryLayer(): IGroup | IFrame | ITmp { return layerUtils.getLayer(this.pageIndex, this.layerIndex) as IGroup | IFrame | ITmp }

  constructor({ _config, body, layerInfo }: { _config: { config: ILayer }, body: HTMLElement, layerInfo?: ILayerInfo, component?: Vue }) {
    this._config = _config
    this.body = body
    layerInfo && (this.layerInfo = layerInfo)
  }

  onPointerdown(e: PointerEvent) {
    if (this.primaryLayer.type === 'tmp') return
    if (e.button !== 0) return

    this.primaryActive = this.primaryLayer.active
    if (imageUtils.isImgControl()) {
      imageUtils.setImgControlDefault()
    }
    if (generalUtils.isTouchDevice()) {
      if (!this.dblTapFlag && this.config.active && this.config.type === 'image') {
        const touchtime = Date.now()
        const interval = 500
        const doubleTap = (e: PointerEvent) => {
          e.preventDefault()
          if (Date.now() - touchtime < interval && !this.dblTapFlag) {
            /**
             * This is the dbl-click callback block
             */
            if (this.config.type === LayerType.image) {
              switch (this.primaryLayer.type) {
                case LayerType.group:
                  layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true }, this.subLayerIdx)
                  break
                case LayerType.frame:
                  frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { imgControl: true })
                  break
              }
              eventUtils.emit(PanelEvent.switchTab, 'crop')
            }
            this.dblTapFlag = true
          }
        }
        this.body.addEventListener('pointerdown', doubleTap)
        setTimeout(() => {
          this.body.removeEventListener('pointerdown', doubleTap)
          this.dblTapFlag = false
        }, interval)
      }
      this.component && this.component.$emit('pointerDownSubController')
    }

    if (store.getters.getCurrFunctionPanelType === FunctionPanelType.photoShadow) {
      groupUtils.deselect()
      groupUtils.select(this.pageIndex, [this.layerIndex])
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { active: true }, this.subLayerIdx)
      eventUtils.emit(PanelEvent.showPhotoShadow)
    }

    formatUtils.applyFormatIfCopied(this.pageIndex, this.layerIndex, this.subLayerIdx)
    formatUtils.clearCopiedFormat()
    if (this.config.type === 'text') {
      this.posDiff.x = this.primaryLayer.styles.x
      this.posDiff.y = this.primaryLayer.styles.y
      if (this.config?.active && this.config.contentEditable) return
      else if (!this.config?.active) {
        // this.isControlling = true
        layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { contentEditable: false })
        this._onMouseup = this.onMouseup.bind(this)
        eventUtils.addPointerEvent('pointerup', this._onMouseup)
        return
      }
      layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { contentEditable: true })
    }
    this._onMouseup = this.onMouseup.bind(this)
    eventUtils.addPointerEvent('pointerup', this._onMouseup)
  }

  onMouseup(e: PointerEvent) {
    e.stopPropagation()
    if (this.config.type === 'text') {
      this.posDiff.x = this.primaryLayer.styles.x - this.posDiff.x
      this.posDiff.y = this.primaryLayer.styles.y - this.posDiff.y
      if (Math.round(this.posDiff.x) !== 0 || Math.round(this.posDiff.y) !== 0) {
        layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { contentEditable: false })
      } else {
        if (this.config.contentEditable) {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: true }, this.subLayerIdx)
          tiptapUtils.focus({ scrollIntoView: false })
        }
      }
    }
    eventUtils.removePointerEvent('pointerup', this._onMouseup)
    // this.isControlling = false
    this.onClickEvent(e)
    this.primaryActive = false
  }

  onClickEvent(e: MouseEvent) {
    if (!this.primaryLayer.active) return

    colorUtils.event.emit('closeColorPanel', false)
    if (!this.primaryLayer.active) {
      return
    }
    let updateSubLayerProps = null as any
    let layers = null as any
    switch (this.primaryLayer.type) {
      case 'group':
        updateSubLayerProps = layerUtils.updateSubLayerProps
        layers = (layerUtils.getCurrLayer as IGroup).layers
        break
      case 'frame':
        updateSubLayerProps = frameUtils.updateFrameLayerProps
        layers = (layerUtils.getCurrLayer as IFrame).clips
    }

    if (!store.getters['shadow/isHandling'] && this.primaryActive && !store.state.isMoving) {
      if (layerUtils.layerIndex !== -1) {
        for (let idx = 0; idx < layers.length; idx++) {
          if (idx !== this.subLayerIdx) {
            updateSubLayerProps(this.pageIndex, this.layerIndex, idx, { active: false })
          }
        }
      }
      if ((this.primaryLayer.type === LayerType.frame && !(this.primaryLayer as IFrame).clips[this.subLayerIdx].active) ||
      (this.primaryLayer.type === LayerType.group && !(this.primaryLayer as IGroup).layers[this.subLayerIdx].active)) {
        updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { active: true })
      }
      layerUtils.setCurrSubSelectedInfo(this.subLayerIdx, this.config.type)
    }
  }
}
