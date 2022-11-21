import { ICoordinate } from '@/interfaces/frame'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import store from '@/store'
import { FunctionPanelType, ILayerInfo, LayerType } from '@/store/types'
import Vue from 'vue'
import controlUtils from './controlUtils'
import eventUtils, { PanelEvent } from './eventUtils'
import formatUtils from './formatUtils'
import generalUtils from './generalUtils'
import groupUtils from './groupUtils'
import layerUtils from './layerUtils'
import mathUtils from './mathUtils'
import mouseUtils from './mouseUtils'
import pageUtils from './pageUtils'
import shortcutUtils from './shortcutUtils'
import stepsUtils from './stepsUtils'
import tiptapUtils from './tiptapUtils'

export class MovingUtils {
  private component = undefined as Vue | undefined
  private eventTarget = null as unknown as HTMLElement
  private dblTabsFlag = false
  private config = null as unknown as ILayer
  private initialPos = { x: 0, y: 0 }
  private initTranslate = { x: 0, y: 0 }
  private movingByControlPoint = false
  private isControlling = false
  private isDoingGestureAction = false
  private isHandleMovingHandler = false
  private snapUtils = null as any
  private body = undefined as unknown as HTMLElement
  private isPointerDownFromSubController = false
  private _moving = null as unknown
  private _moveEnd = null as unknown
  private layerInfo = { pageIndex: layerUtils.pageIndex, layerIndex: layerUtils.layerIndex }
  private isTouchDevice = generalUtils.isTouchDevice()

  private get isBgImgCtrl(): boolean { return store.getters['imgControl/isBgImgCtrl'] }
  private get inMultiSelectionMode(): number { return store.getters['mobileEditor/getInMultiSelectionMode'] }
  private get currFunctionPanelType(): number { return store.getters.getCurrFunctionPanelType }
  private get currSelectedInfo(): any { return store.getters.getCurrSelectedInfo }
  private get scaleRatio(): number { return store.getters.getPageScaleRatio }
  private get currHoveredPageIndex(): number { return store.getters.getCurrHoveredPageIndex }
  private get isActive(): boolean { return this.config.active }
  private get getLayerType(): string { return this.config.type }
  private get pageIndex(): number { return this.layerInfo.pageIndex }
  private get layerIndex(): number { return this.layerInfo.layerIndex }
  private get isLocked(): boolean { return this.config.locked }
  private get contentEditable(): boolean { return (this.config as any).contentEditable || false }
  private get getLayerPos(): ICoordinate { return { x: this.config.styles.x, y: this.config.styles.y } }
  private get isDragging(): boolean { return this.config.dragging }
  private get isImgControl(): boolean {
    switch (this.getLayerType) {
      case 'image':
        return (this.config as IImage).imgControl
      case 'group':
        return (this.config as IGroup).layers
          .some(layer => {
            return layer.type === 'image' && layer.imgControl
          })
      case 'frame':
        return (this.config as IFrame).clips
          .some(layer => {
            return layer.imgControl
          })
    }
    return false
  }

  constructor({ config, snapUtils, component, body, layerInfo }: { config: ILayer, snapUtils: unknown, component?: Vue, body: HTMLElement, layerInfo?: ILayerInfo }) {
    this.config = config
    this.snapUtils = snapUtils
    this.body = body
    component && (this.component = component)
    layerInfo && (this.layerInfo = layerInfo)
  }

  private setMoving = (bool: boolean) => store.commit('SET_moving', bool)
  private setBgConfig = (pageIndex?: number) => store.commit('imgControl/SET_BG_CONFIG', pageIndex)
  private setLastSelectedLayerIndex = (layerIndex: number) => store.commit('SET_lastSelectedLayerIndex', layerIndex)
  private setCursorStyle(cursor: string) {
    // document.body.style.cursor = cursor
  }

  disableTouchEvent(e: TouchEvent) {
    if (this.isTouchDevice) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  private start = 0
  private recorded = false

  moveStart(event: MouseEvent | TouchEvent | PointerEvent) {
    this.start = Date.now()
    this.recorded = false
    const currLayerIndex = layerUtils.layerIndex
    if (currLayerIndex !== this.layerIndex) {
      const layer = layerUtils.getLayer(this.pageIndex, currLayerIndex)
      if (layer.type === 'image' && layer.imgControl) {
        layerUtils.updateLayerProps(this.pageIndex, currLayerIndex, { imgControl: false })
      } else if (layer.type === 'group') {
        (layer as IGroup).layers
          .forEach((l, i) => {
            if (l.type === 'image' && l.imgControl) {
              layerUtils.updateLayerProps(this.pageIndex, currLayerIndex, { imgControl: false }, i)
            }
          })
      }
    }
    if (this.isBgImgCtrl) {
      this.setBgConfig(undefined)
    }

    if (this.isImgControl) {
      return
    }

    const eventType = eventUtils.getEventType(event)
    /**
     * used for frame layer for entering detection
     * This is used for moving image to replace frame element
     */
    this.eventTarget = (event.target as HTMLElement)
    this.eventTarget.releasePointerCapture((event as PointerEvent).pointerId)

    if (this.isTouchDevice) {
      if (!this.dblTabsFlag && this.isActive) {
        const touchtime = Date.now()
        const interval = 500
        const doubleTap = (e: PointerEvent) => {
          e.preventDefault()
          if (Date.now() - touchtime < interval && !this.dblTabsFlag) {
            /**
             * This is the dbl-click callback block
             */
            if (this.getLayerType === LayerType.image) {
              layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true })
              eventUtils.emit(PanelEvent.switchTab, 'crop')
            }
            this.dblTabsFlag = true
          }
        }
        this.eventTarget.addEventListener('pointerdown', doubleTap)
        setTimeout(() => {
          this.eventTarget.removeEventListener('pointerdown', doubleTap)
          this.dblTabsFlag = false
        }, interval)
      }
    }
    if (eventType === 'pointer') {
      const pointerEvent = event as PointerEvent
      if (pointerEvent.button !== 0) return
    } else if (eventType === 'mouse') {
      const mouseEvent = event as MouseEvent
      if (mouseEvent.button !== 0) return
    }
    if (eventUtils.checkIsMultiTouch(event)) {
      return
    }
    if (this.currFunctionPanelType === FunctionPanelType.photoShadow) {
      eventUtils.emit(PanelEvent.showPhotoShadow, '')
    }
    /**
     * @Note - in Mobile version, we can't select the layer directly, we should make it active first
     * The exception is that we are in multi-selection mode
     */
    if (this.isTouchDevice && !this.isActive && !this.isLocked && !this.inMultiSelectionMode) {
      this.eventTarget.addEventListener('touchstart', this.disableTouchEvent)
      this.initialPos = mouseUtils.getMouseAbsPoint(event)
      this._moving = this.moving.bind(this)
      this._moveEnd = this.moveEnd.bind(this)
      eventUtils.addPointerEvent('pointerup', this._moveEnd)
      eventUtils.addPointerEvent('pointermove', this._moving)
      return
    }

    this.movingByControlPoint = false
    // const inSelectionMode = (generalUtils.exact([event.shiftKey, event.ctrlKey, event.metaKey])) && !this.contentEditable
    const inCopyMode = (generalUtils.exact([event.altKey])) && !this.contentEditable
    const inSelectionMode = (generalUtils.exact([event.shiftKey, event.ctrlKey, event.metaKey])) && !this.contentEditable && !inCopyMode
    const { inMultiSelectionMode } = this
    if (!this.isLocked) {
      event.stopPropagation()
    }
    formatUtils.applyFormatIfCopied(this.pageIndex, this.layerIndex)
    formatUtils.clearCopiedFormat()
    this.initTranslate = this.getLayerPos

    if (inCopyMode) {
      shortcutUtils.altDuplicate(this.pageIndex, this.layerIndex, this.config)
    }

    switch (this.getLayerType) {
      case 'text': {
        const targetClassList = (event.target as HTMLElement).classList
        const isMoveBar = targetClassList.contains('control-point__move-bar')
        const isMover = targetClassList.contains('control-point__mover')

        // if the text layer is already active and contentEditable
        if (this.isActive && !inSelectionMode && this.contentEditable && !isMoveBar && !isMover) {
          return
        } else if (!this.isActive) {
          let targetIndex = this.layerIndex
          if (!inSelectionMode && !inMultiSelectionMode) {
            groupUtils.deselect()
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedLayerIndex(this.layerIndex)
            groupUtils.select(this.pageIndex, [targetIndex])
          } else {
            if (this.pageIndex === pageUtils.currFocusPageIndex) {
              groupUtils.select(this.pageIndex, [targetIndex])
            }
          }
          if (!this.config.locked) {
            this.isControlling = true
            this.initialPos = mouseUtils.getMouseAbsPoint(event)
            this._moving = this.moving.bind(this)
            this._moveEnd = this.moveEnd.bind(this)
            eventUtils.addPointerEvent('pointerup', this._moveEnd)
            eventUtils.addPointerEvent('pointermove', this._moving)
          }
          return
        }

        /**
         * The cotentEditable updated timing will be move to the moveEnd instead of moveStart
         * bcz if we set it to true when moveStart and we want to move the layer instead of editing the text, it will still make the mobile keyboard show up
         */

        if (isMover || isMoveBar) {
          this.movingByControlPoint = true
        } else {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: true })
        }

        break
      }
    }

    /**
     * @Note InMultiSelection mode should still can move the layer
     */
    if (!this.config.locked && !inSelectionMode) {
      this.initialPos = mouseUtils.getMouseAbsPoint(event)
      this._moving = this.moving.bind(this)
      this._moveEnd = this.moveEnd.bind(this)
      eventUtils.addPointerEvent('pointerup', this._moveEnd)
      eventUtils.addPointerEvent('pointermove', this._moving)
    }
    if (this.config.type !== 'tmp') {
      let targetIndex = this.layerIndex
      if (this.isActive && this.currSelectedInfo.layers.length === 1) {
        if (inSelectionMode) {
          groupUtils.deselect()
          targetIndex = this.config.styles.zindex - 1
          this.setLastSelectedLayerIndex(this.layerIndex)
        }
      } else if (!this.isActive) {
        // already have selected layer
        if (this.currSelectedInfo.index >= 0) {
          // Did not press shift/cmd/ctrl key -> deselect selected layers first
          if (!inSelectionMode && !inMultiSelectionMode) {
            groupUtils.deselect()
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedLayerIndex(this.layerIndex)
            groupUtils.select(this.pageIndex, [targetIndex])
          } else {
            // this if statement is used to prevent select the layer in another page
            if (this.pageIndex === pageUtils.currFocusPageIndex && !this.config.locked) {
              if (!layerUtils.getCurrLayer.locked) {
                groupUtils.select(this.pageIndex, [targetIndex])
              }
            }
          }
        } else {
          targetIndex = this.config.styles.zindex - 1
          this.setLastSelectedLayerIndex(this.layerIndex)
          groupUtils.select(this.pageIndex, [targetIndex])
        }
      }
    }
    console.log('handle start', Date.now() - this.start)
  }

  moving(e: MouseEvent | TouchEvent | PointerEvent) {
    // if (!this.recorded) {
    //   // console.log(Date.now() - this.start)
    //   // this.recorded = true
    this.start = Date.now()
    // }
    const posDiff = {
      x: Math.abs(mouseUtils.getMouseAbsPoint(e).x - this.initialPos.x),
      y: Math.abs(mouseUtils.getMouseAbsPoint(e).y - this.initialPos.y)
    }
    switch (this.config.type) {
      case LayerType.group:
        if ((this.config as IGroup).layers.some(l => l.active && l.type === LayerType.text && l.contentEditable && l.isTyping)) {
          return
        }
    }

    if (this.isTouchDevice && !this.isLocked) {
      if (!this.isActive) {
        if (posDiff.x > 1 || posDiff.y > 1) {
          this.isDoingGestureAction = true
          return
        }
      } else {
        if (posDiff.x < 1 && posDiff.y < 1) {
          return
        }
      }
    }

    this.isControlling = true
    if (!this.isDragging) {
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
        dragging: true
      })
      this.component && this.component.$emit('isDragging', this.layerIndex)
    }
    if (this.isActive) {
      if (generalUtils.getEventType(e) !== 'touch') {
        e.preventDefault()
      }
      this.setCursorStyle('move')
      if (!this.isHandleMovingHandler) {
        window.requestAnimationFrame(() => {
          this.movingHandler(e)
          this.isHandleMovingHandler = false
          // if (!this.recorded) {
          console.log(Date.now() - this.start)
          //   this.recorded = true
          // }
        })
        this.isHandleMovingHandler = true
      }
      const posDiff = {
        x: Math.abs(this.getLayerPos.x - this.initTranslate.x),
        y: Math.abs(this.getLayerPos.y - this.initTranslate.y)
      }
      if (!this.config.moving || !store.state.isMoving) {
        if (Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0) {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moving: true })
          this.setMoving(true)
        }
      }
    }
  }

  movingHandler(e: MouseEvent | TouchEvent | PointerEvent) {
    if (!this.config.moved) {
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
    }
    const offsetPos = mouseUtils.getMouseRelPoint(e, this.initialPos)
    const moveOffset = mathUtils.getActualMoveOffset(offsetPos.x, offsetPos.y)
    groupUtils.movingTmp(
      this.pageIndex,
      {
        x: moveOffset.offsetX,
        y: moveOffset.offsetY
      }
    )
    const offsetSnap = this.snapUtils.calcMoveSnap(this.config, this.layerIndex)
    this.snapUtils.event.emit(`getClosestSnaplines-${this.snapUtils.id}`)
    const totalOffset = {
      // x: offsetPos.x,
      // y: offsetPos.y
      x: offsetPos.x + (offsetSnap.x * this.scaleRatio * 0.01),
      y: offsetPos.y + (offsetSnap.y * this.scaleRatio * 0.01)
    }
    this.initialPos.x += totalOffset.x
    this.initialPos.y += totalOffset.y
  }

  moveEnd(e: MouseEvent | TouchEvent) {
    if (!this.isDoingGestureAction && !this.isActive) {
      this.eventTarget.removeEventListener('touchstart', this.disableTouchEvent)
      groupUtils.deselect()
      const targetIndex = this.config.styles.zindex - 1
      this.setLastSelectedLayerIndex(this.layerIndex)
      groupUtils.select(this.pageIndex, [targetIndex])
      eventUtils.removePointerEvent('pointerup', this._moveEnd)
      eventUtils.removePointerEvent('pointermove', this._moving)
      this.isControlling = false
      this.setCursorStyle('')
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
        dragging: false
      })
      this.isDoingGestureAction = false
      this.snapUtils.event.emit('clearSnapLines')
      return
    }

    layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moving: false })
    this.setMoving(false)

    if (this.isActive) {
      const posDiff = {
        x: Math.abs(this.getLayerPos.x - this.initTranslate.x),
        y: Math.abs(this.getLayerPos.y - this.initTranslate.y)
      }
      const hasActiualMove = Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0
      if (hasActiualMove) {
        if (this.getLayerType === 'text') {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false })
        }
        // dragging to another page
        if (layerUtils.isOutOfBoundary() && this.currHoveredPageIndex !== -1 && this.currHoveredPageIndex !== this.pageIndex) {
          const layerNum = this.currSelectedInfo.layers.length
          if (layerNum > 1) {
            groupUtils.group()
          }

          const layerTmp = generalUtils.deepCopy(layerUtils.getCurrLayer)
          const { top, left } = this.body.getBoundingClientRect()
          const targetPageRect = (document.querySelector(`.nu-page-${this.currHoveredPageIndex}`) as HTMLLIElement)?.getBoundingClientRect()
          const newX = (left - targetPageRect.left) * (100 / this.scaleRatio)
          const newY = (top - targetPageRect.top) * (100 / this.scaleRatio)

          layerTmp.styles.x = newX
          layerTmp.styles.y = newY
          layerUtils.deleteSelectedLayer(false)
          layerUtils.addLayers(this.currHoveredPageIndex, [layerTmp])
          if (layerNum > 1) {
            groupUtils.ungroup()
          }
          // The layerUtils.addLayers will trigger a record function, so we don't need to record the extra step here
        } else {
          if (!(this.config as IImage).isHoveringFrame) {
            stepsUtils.record()
          }
        }
      } else {
        if (this.getLayerType === 'text') {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: true })
          if (this.movingByControlPoint) {
            layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false })
          }
          if (this.config.contentEditable) {
            tiptapUtils.focus({ scrollIntoView: false })
          }
        }
        if (this.inMultiSelectionMode) {
          if (this.config.type !== 'tmp') {
            let targetIndex = this.layerIndex
            if (this.isActive && this.currSelectedInfo.layers.length === 1) {
              groupUtils.deselect()
              targetIndex = this.config.styles.zindex - 1
              this.setLastSelectedLayerIndex(this.layerIndex)
            } else if (!this.isActive) {
              // already have selected layer
              if (this.currSelectedInfo.index >= 0) {
                // this if statement is used to prevent select the layer in another page
                if (this.pageIndex === pageUtils.currFocusPageIndex) {
                  groupUtils.select(this.pageIndex, [targetIndex])
                }
              } else {
                targetIndex = this.config.styles.zindex - 1
                this.setLastSelectedLayerIndex(this.layerIndex)
                groupUtils.select(this.pageIndex, [targetIndex])
              }
            }
          }
        }
      }

      if (this.isTouchDevice && !this.isPointerDownFromSubController && !hasActiualMove) {
        /**
         * This function is used for mobile-control, as one of the sub-controller is active
         * tap at the primary-controller should set the sub-controller to non-active
         */
        if (this.config.type === LayerType.group) {
          const primary = this.config as IGroup
          for (let i = 0; i < (this.config as IGroup).layers.length; i++) {
            if (primary.layers[i].active) {
              if (primary.layers[i].type === LayerType.text) {
                layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false }, i)
              }
              layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { active: false }, i)
            }
          }
        }
      }
      this.isPointerDownFromSubController = false
      this.isControlling = false
      this.setCursorStyle('')
      eventUtils.removePointerEvent('pointerup', this._moveEnd)
      eventUtils.removePointerEvent('pointermove', this._moving)
    }

    if (this.isDragging) {
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
        dragging: false
      })
      this.component && this.component.$emit('isDragging', -1)
    }

    this.isDoingGestureAction = false
    this.snapUtils.event.emit('clearSnapLines')
  }
}
