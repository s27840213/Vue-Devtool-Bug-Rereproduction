import { IFrame, IGroup, IImage, ILayer, ITmp } from '@/interfaces/layer'
import store from '@/store'
import { FunctionPanelType, IExtendLayerInfo, ILayerInfo, LayerType } from '@/store/types'
import pointerEvtUtils from '@/utils/pointerEvtUtils'
import { nextTick } from 'vue'
import colorUtils from './colorUtils'
import eventUtils, { PanelEvent } from './eventUtils'
import formatUtils from './formatUtils'
import frameUtils from './frameUtils'
import generalUtils from './generalUtils'
import groupUtils from './groupUtils'
import layerUtils from './layerUtils'
import tiptapUtils from './tiptapUtils'

export default class SubControllerUtils {
  // private component = undefined as Vue | undefined
  private component = undefined as any | undefined
  private body = undefined as unknown as HTMLElement
  private _config = { config: null as unknown as ILayer, primaryLayer: null as unknown as IGroup | ITmp | IFrame }
  private layerInfo = { pageIndex: layerUtils.pageIndex, layerIndex: layerUtils.layerIndex, subLayerIdx: layerUtils.subLayerIdx } as IExtendLayerInfo
  private dblTapFlag = false
  private posDiff = { x: 0, y: 0 }
  private _onMouseup = null as unknown
  private _cursorDragEnd = null as unknown
  private initTranslate = { x: 0, y: 0 }

  private get isControllerShown(): boolean { return this.primaryLayer.active && (!generalUtils.isStk || !store.getters['vivisticker/getControllerHidden']) }
  private get config(): ILayer { return this._config.config }
  private get primaryLayer(): IGroup | ITmp | IFrame { return this._config.primaryLayer }
  private get pageIndex(): number { return this.layerInfo.pageIndex }
  private get layerIndex(): number { return this.layerInfo.layerIndex }
  private get subLayerIdx(): number { return this.layerInfo.subLayerIdx ?? -1 }
  private get prePrimaryLayerIndex(): number { return this.layerInfo.prePrimaryLayerIndex ?? -1 }
  private get isParentLayerLocked(): boolean {
    if (this.prePrimaryLayerIndex !== -1) {
      return layerUtils.getLayer(this.pageIndex, this.prePrimaryLayerIndex).locked
    } else {
      return layerUtils.getLayer(this.pageIndex, this.layerIndex).locked
    }
  }

  constructor({ _config, body, layerInfo }: { _config: { config: ILayer, primaryLayer: IGroup | ITmp | IFrame }, body: HTMLElement, layerInfo?: ILayerInfo, component?: any }) {
    this._config = _config
    this.body = body
    layerInfo && (this.layerInfo = layerInfo)
  }

  onPointerdown(e: PointerEvent) {
    if (this.isParentLayerLocked ||
      store.getters.getControlState.type === 'pinch') return

    eventUtils.removePointerEvent('pointerup', this._onMouseup)
    this._onMouseup = this.onMouseup.bind(this)

    pointerEvtUtils.addPointer(e)
    this.initTranslate = {
      x: this.primaryLayer.styles?.x || 0,
      y: this.primaryLayer.styles?.y || 0
    }
    if (this.primaryLayer.type === 'tmp') {
      if (generalUtils.exact([e.shiftKey, e.ctrlKey, e.metaKey])) {
        groupUtils.deselectTargetLayer(this.subLayerIdx)
      }
      if (groupUtils.inMultiSelecitonMode) {
        eventUtils.addPointerEvent('pointerup', this._onMouseup)
      }
      return
    }
    if (store.getters['mobileEditor/getIsPinchingEditor']) return
    if (e.button !== 0) return

    if (generalUtils.isTouchDevice()) {
      if (!this.dblTapFlag && this.config.active && this.config.type === 'image') {
        const touchtime = Date.now()
        const interval = 300
        const doubleTap = (e: PointerEvent) => {
          e.preventDefault()
          if (Date.now() - touchtime < interval && !this.dblTapFlag && pointerEvtUtils.pointerIds.length < 2) {
            /**
             * This is the dbl-click callback block
             */
            if (this.config.type === LayerType.image) {
              switch (this.primaryLayer.type) {
                case LayerType.group:
                  if (!generalUtils.isStk || store.getters['vivisticker/getEditorTypeTemplate']) layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true }, this.subLayerIdx)
                  break
                case LayerType.frame:
                  if ((this.config as IImage).srcObj.type !== 'frame') {
                    frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { imgControl: true })
                  }
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
      if (this.config?.active && this.config.contentEditable) {
        layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { isDraggingCursor: true })
        this._cursorDragEnd = this.onCursorDragEnd.bind(this)
        eventUtils.addPointerEvent('pointerup', this._cursorDragEnd)
        return
      } else if (!this.config?.active) {
        layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { contentEditable: false })
        eventUtils.addPointerEvent('pointerup', this._onMouseup)
        return
      }
      layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { contentEditable: true })
    }
    eventUtils.addPointerEvent('pointerup', this._onMouseup)
  }

  onCursorDragEnd(e: PointerEvent) {
    layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { isDraggingCursor: false })
    eventUtils.removePointerEvent('pointerup', this._cursorDragEnd)
  }

  onMouseup(e: PointerEvent) {
    eventUtils.removePointerEvent('pointerup', this._onMouseup)
    e.stopPropagation()
    if (!this.primaryLayer.active) return
    const posDiff = {
      x: this.primaryLayer.styles.x - this.initTranslate.x,
      y: this.primaryLayer.styles.y - this.initTranslate.y
    }
    const hasActualMove = posDiff.x !== 0 || posDiff.y !== 0
    if (this.config.type === 'text') {
      if (hasActualMove) {
        layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { contentEditable: false })
      } else {
        if (this.config.contentEditable) {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: true }, this.subLayerIdx)
          if (generalUtils.isTouchDevice()) {
            nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, 'end')
            })
          } else {
            tiptapUtils.focus({ scrollIntoView: false })
          }
        }
      }
    }
    if (generalUtils.isStk) {
      const isEmptClipInFrame = this.primaryLayer.type === LayerType.frame && (this.config as IImage).srcObj.type === 'frame' &&
        !hasActualMove && !store.getters['vivisticker/getControllerHidden']
      const isEmptClipInGroup = this.primaryLayer.type === LayerType.group && this.config.type === LayerType.image && this.primaryLayer.layers[this.subLayerIdx].type === 'frame' &&
        this.primaryLayer.active && (this.primaryLayer.layers[this.subLayerIdx] as IFrame).clips.length === 1 && (this.config as IImage).srcObj.type === 'frame'
      if (!hasActualMove && (isEmptClipInFrame || isEmptClipInGroup)) {
        let image
        if (isEmptClipInGroup) {
          image = this.config
          const primaryLayer = this.primaryLayer as IGroup
          primaryLayer.layers.forEach((l, i) => {
            if (l.active) {
              layerUtils.updateLayerProps(this.pageIndex, this.prePrimaryLayerIndex, { active: false }, i)
            }
          })
          layerUtils.updateLayerProps(this.pageIndex, this.prePrimaryLayerIndex, { active: true }, this.layerIndex)
          layerUtils.updateInGroupFrame(
            this.pageIndex,
            this.prePrimaryLayerIndex,
            this.layerIndex,
            this.subLayerIdx,
            { active: true }
          )
        } else if (isEmptClipInFrame) {
          image = (this.primaryLayer as IFrame).clips[this.subLayerIdx]
        }
        frameUtils.iosPhotoSelect(this.layerInfo, image as IImage)
      }
    }
    this.onClickEvent(e)
  }

  onClickEvent(e: MouseEvent) {
    colorUtils.event.emit('closeColorPanel', false)
    let updateSubLayerProps = null as any
    let layers = null as any
    switch (this.primaryLayer.type) {
      case 'group':
        updateSubLayerProps = layerUtils.updateSubLayerProps
        layers = (this.primaryLayer as IGroup).layers
        break
      case 'frame':
        if (layerUtils.getCurrLayer.type === 'group') {
          // @TODO: this means the frame is in the group and the sub-clip is clicked
          return
        }
        updateSubLayerProps = frameUtils.updateFrameLayerProps
        layers = (this.primaryLayer as IFrame).clips
    }

    if (!store.getters['shadow/isHandling'] && this.primaryLayer.active && !store.state.isMoving) {
      if (groupUtils.inMultiSelecitonMode && this.primaryLayer.type !== 'frame') {
        groupUtils.deselectTargetLayer(this.subLayerIdx)
        return
      }
      if (layerUtils.layerIndex !== -1) {
        for (let idx = 0; idx < layers.length; idx++) {
          if (idx !== this.subLayerIdx) {
            updateSubLayerProps(this.pageIndex, this.layerIndex, idx, { active: false })
          }
        }
      }
      const isFrameSub = this.primaryLayer.type === LayerType.frame && !(this.primaryLayer as IFrame).clips[this.subLayerIdx].active
      const isGroupSub = this.primaryLayer.type === LayerType.group && !(this.primaryLayer as IGroup).layers[this.subLayerIdx].active
      if (isFrameSub || isGroupSub) {
        if (this.isControllerShown) {
          updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIdx, { active: true })
          layerUtils.setCurrSubSelectedInfo(this.subLayerIdx, this.config.type)
        } else {
          groupUtils.deselect()
          groupUtils.select(this.pageIndex, [this.layerIndex])
        }
      }
    }
  }
}
