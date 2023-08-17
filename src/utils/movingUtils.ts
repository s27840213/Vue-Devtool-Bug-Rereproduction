import { ICoordinate } from '@/interfaces/frame'
import { IFrame, IGroup, IImage, ILayer, IShape, IStyle, IText } from '@/interfaces/layer'
import store from '@/store'
import { FunctionPanelType, ILayerInfo, LayerType } from '@/store/types'
import controlUtils from './controlUtils'
import editorUtils from './editorUtils'
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

const initPageTranslate = { x: 0, y: 0 }

export function setInitPageTranslate() {
  initPageTranslate.x = pageUtils.getCurrPage.x
  initPageTranslate.y = pageUtils.getCurrPage.y
}

export class MovingUtils {
  isControlling = false
  private component = undefined as any | undefined
  // private component = undefined as Vue | undefined
  private eventTarget = null as unknown as HTMLElement
  private dblTabsFlag = false
  private _config = { config: null as unknown as ILayer }
  private initialPos = { x: 0, y: 0 } as ICoordinate | null
  private initTranslate = { x: 0, y: 0 }
  // private initPageTranslate = { x: 0, y: 0 }
  private movingByControlPoint = false
  private isDoingGestureAction = false
  private isHandleMovingHandler = false
  private snapUtils = null as any
  private body = undefined as unknown as HTMLElement
  private _moving = null as unknown
  private _moveEnd = null as unknown
  private _cursorDragEnd = null as unknown
  private layerInfo = { pageIndex: layerUtils.pageIndex, layerIndex: layerUtils.layerIndex, subLayerIdx: layerUtils.subLayerIdx } as ILayerInfo

  private isTouchDevice = generalUtils.isTouchDevice()
  private isClickOnController = false

  private get isBgImgCtrl(): boolean { return store.getters['imgControl/isBgImgCtrl'] }
  private get config(): ILayer { return this._config.config }
  private get inMultiSelectionMode(): number { return store.getters['mobileEditor/getInMultiSelectionMode'] }
  private get currFunctionPanelType(): number { return store.getters.getCurrFunctionPanelType }
  private get currSelectedInfo(): any { return store.getters.getCurrSelectedInfo }
  private get scaleRatio(): number { return store.getters.getPageScaleRatio }
  private get currHoveredPageIndex(): number { return store.getters.getCurrHoveredPageIndex }
  private get isActive(): boolean { return this.config.active }
  private get getLayerType(): string { return this.config.type }
  private get pageIndex(): number { return this.layerInfo.pageIndex }
  private get layerIndex(): number { return this.layerInfo.layerIndex }
  private get subLayerIdx(): number { return this.layerInfo.subLayerIdx ?? -1 }
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

  private randId = ''

  constructor({ _config, snapUtils, component, body, layerInfo }: { _config: { config: ILayer }, snapUtils: unknown, component?: any, body: HTMLElement, layerInfo?: ILayerInfo }) {
    this._config = _config
    this.snapUtils = snapUtils
    this.body = body
    this.randId = generalUtils.generateRandomString(4)
    component && (this.component = component)
    layerInfo && (this.layerInfo = layerInfo)
  }

  private setMoving = (bool: boolean) => store.commit('SET_moving', bool)
  private setBgConfig = (pageIndex?: number) => store.commit('imgControl/SET_BG_CONFIG', pageIndex)
  private setLastSelectedLayerIndex = (layerIndex: number) => store.commit('SET_lastSelectedLayerIndex', layerIndex)
  private setCursorStyle(e: Event, cursor: string) {
    if (this.body) {
      this.body.style.cursor = cursor
    }
  }

  updateProps({ _config, body }: { _config: { config: ILayer }, body: HTMLElement }) {
    this._config = _config
    this.body = body
  }

  disableTouchEvent(e: TouchEvent) {
    if (this.isTouchDevice) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  pageMoveStart(e: PointerEvent) {
    if (store.getters['mobileEditor/getIsPinchingEditor']) return
    setInitPageTranslate()
    this.removeListener()
    if (e.type === 'pinch') {
      this.initialPos = null
    } else {
      this.initialPos = mouseUtils.getMouseAbsPoint(e)
    }
    this._moving = this.pageMoving.bind(this)
    this._moveEnd = this.pageMoveEnd.bind(this)
    eventUtils.addPointerEvent('pointerup', this._moveEnd)
    eventUtils.addPointerEvent('pointermove', this._moving)
  }

  pageMoving(e: PointerEvent) {
    if (store.getters['mobileEditor/getIsPinchingEditor']) {
      this.removeListener()
      return
    }
    window.requestAnimationFrame(() => {
      this.pageMovingHandler(e)
    })
  }

  pageMoveEnd(e: PointerEvent) {
    this.removeListener()
  }

  moveStart(event: MouseEvent | TouchEvent | PointerEvent) {
    if (store.getters['mobileEditor/getIsPinchingEditor']) return
    this.initTranslate.x = this.getLayerPos.x
    this.initTranslate.y = this.getLayerPos.y
    initPageTranslate.x = pageUtils.getCurrPage.x
    initPageTranslate.y = pageUtils.getCurrPage.y
    const currLayerIndex = layerUtils.layerIndex

    formatUtils.applyFormatIfCopied(this.pageIndex, this.layerIndex)
    formatUtils.clearCopiedFormat()

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

    if (this.isTouchDevice && !this.config.locked) {
      this.isClickOnController = controlUtils.isClickOnController(event as MouseEvent)
      event.stopPropagation()
      // if (!this.dblTabsFlag && this.isActive) {
      //   const touchtime = Date.now()
      //   const interval = 500
      //   const doubleTap = (e: PointerEvent) => {
      //     e.preventDefault()
      //     if (Date.now() - touchtime < interval && !this.dblTabsFlag) {
      //       /**
      //        * This is the dbl-click callback block
      //        */
      //       if (this.getLayerType === LayerType.image) {
      //         layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true })
      //         eventUtils.emit(PanelEvent.switchTab, 'crop')
      //       }
      //       this.dblTabsFlag = true
      //     }
      //   }
      //   this.eventTarget.addEventListener('pointerdown', doubleTap)
      //   setTimeout(() => {
      //     this.eventTarget.removeEventListener('pointerdown', doubleTap)
      //     this.dblTabsFlag = false
      //   }, interval)
      // }
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
    const inCopyMode = (generalUtils.exact([event.altKey])) && !this.contentEditable
    const inSelectionMode = (generalUtils.exact([event.shiftKey, event.ctrlKey, event.metaKey])) && !this.contentEditable && !inCopyMode
    const { inMultiSelectionMode } = this
    if (!this.isLocked) {
      event.stopPropagation()
    }

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
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isDraggingCursor: true })
          this._cursorDragEnd = this.onCursorDragEnd.bind(this)
          eventUtils.addPointerEvent('pointerup', this._cursorDragEnd)
          return
        } else if (!this.isActive) {
          let targetIndex = this.layerIndex
          if (!inSelectionMode && !inMultiSelectionMode) {
            groupUtils.deselect()
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedLayerIndex(this.layerIndex)
            groupUtils.select(this.pageIndex, [targetIndex])
          } else if (this.pageIndex === pageUtils.currFocusPageIndex) {
            groupUtils.select(this.pageIndex, [targetIndex])
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
        } else if (!this.isTouchDevice) {
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
  }

  moving(e: MouseEvent | TouchEvent | PointerEvent) {
    if (eventUtils.checkIsMultiTouch(e) || store.getters['mobileEditor/getIsPinchingEditor'] || this.initialPos === null) {
      return
    }
    this.isControlling = true
    switch (this.config.type) {
      case LayerType.group:
        if ((this.config as IGroup).layers.some(l => l.active && l.type === LayerType.text && l.contentEditable && l.isTyping)) {
          return
        }
    }

    const updateConfigData = {} as Partial<IText | IImage | IShape>
    if (!this.isDragging) {
      updateConfigData.dragging = true
      // this.component && this.component.$emit('isDragging', this.layerIndex)
    }
    if (this.isActive) {
      if (generalUtils.getEventType(e) !== 'touch') {
        e.preventDefault()
      }
      this.setCursorStyle(e, 'move')

      // this.movingHandler(e)
      if (!this.isHandleMovingHandler) {
        window.requestAnimationFrame(() => {
          this.movingHandler(e)
          this.isHandleMovingHandler = false
        })
        this.isHandleMovingHandler = true
      }
      const posDiff = {
        x: Math.abs(this.getLayerPos.x - this.initTranslate.x),
        y: Math.abs(this.getLayerPos.y - this.initTranslate.y)
      }
      const hasActualMove = posDiff.x !== 0 || posDiff.y !== 0
      if (hasActualMove) {
        if (!this.config.moving || !store.state.isMoving) {
          updateConfigData.moving = true
          this.setMoving(true)
        }
        if (this.getLayerType === 'text' && this.config.contentEditable) {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false })
        }
      }
    }
    if (!this.isActive) {
      // this condition will only happen in Mobile
      const posDiff = {
        x: Math.abs(mouseUtils.getMouseAbsPoint(e).x - this.initialPos.x),
        y: Math.abs(mouseUtils.getMouseAbsPoint(e).y - this.initialPos.y)
      }
      if (this.isTouchDevice && !this.isLocked) {
        if (layerUtils.layerIndex !== this.layerIndex && this.isClickOnController) {
          if (posDiff.x > 1 || posDiff.y > 1) {
            this.isDoingGestureAction = true
            window.requestAnimationFrame(() => {
              this.movingHandler(e)
              this.isHandleMovingHandler = false
            })
            return
          }
        }
        // const { pageRect, editorRect } = pageUtils.getEditorRenderSize
        // const isPageFullyInsideEditor = pageRect.width + 30 < editorRect.width
        const { mobileSize } = editorUtils
        const { getCurrPage: page, scaleRatio } = pageUtils
        const isPageFullyInsideEditor = page.width * scaleRatio * 0.01 * page.contentScaleRatio < mobileSize.width &&
          page.height * scaleRatio * 0.01 * page.contentScaleRatio < mobileSize.height
        // const isPageReachEdge = pageRect.width + pageUtils.getCurrPage.x + 15
        if (!isPageFullyInsideEditor) {
          // if (layerUtils.layerIndex === -1 && !isPageFullyInsideEditor) {
          window.requestAnimationFrame(() => {
            this.pageMovingHandler(e)
          })
        }
      } else {
        if (posDiff.x < 1 && posDiff.y < 1) {
          return
        }
      }
    }
    layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, updateConfigData)
  }

  movingHandler(e: MouseEvent | TouchEvent | PointerEvent) {
    if (this.initialPos === null) return

    const config = this.layerIndex === layerUtils.layerIndex ? this.config : layerUtils.getCurrLayer
    if (Object.values(config).length === 0) {
      /**
       * if the layer is deleted the config will be empty object
       */
      eventUtils.removePointerEvent('pointerup', this._moveEnd)
      eventUtils.removePointerEvent('pointermove', this._moving)
      return
    }
    if (!this.config.moved) {
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
    }
    const offsetPos = mouseUtils.getMouseRelPoint(e, this.initialPos)
    let offsetRatio = 100 / store.getters.getPageScaleRatio
    if (generalUtils.isTouchDevice()) {
      offsetRatio *= 1 / store.getters.getContentScaleRatio
    }

    const moveOffset = mathUtils.getActualMoveOffset(offsetPos.x, offsetPos.y, offsetRatio)

    const isLine = config.type === 'shape' && config.category === 'D'
    const _updateStyles = {
      x: config.styles.x + moveOffset.offsetX,
      y: config.styles.y + moveOffset.offsetY,
      width: config.styles.width,
      height: config.styles.height,
      initWidth: config.styles.initWidth,
      initHeight: config.styles.initHeight,
      rotate: config.styles.rotate
    } as IStyle
    const offsetSnap = this.snapUtils.calcMoveSnap(_updateStyles, isLine ? config : undefined)

    const totalOffset = {
      x: offsetPos.x + (offsetSnap.x / offsetRatio),
      y: offsetPos.y + (offsetSnap.y / offsetRatio)
    }
    this.initialPos.x += totalOffset.x
    this.initialPos.y += totalOffset.y

    if (offsetSnap.x || offsetSnap.y) {
      this.snapUtils.event.emit(`getClosestSnaplines-${this.snapUtils.id}`)
      layerUtils.updateLayerStyles(this.pageIndex, layerUtils.layerIndex, {
        x: _updateStyles.x + offsetSnap.x,
        y: _updateStyles.y + offsetSnap.y
      })
    } else {
      layerUtils.updateLayerStyles(this.pageIndex, layerUtils.layerIndex, {
        x: _updateStyles.x,
        y: _updateStyles.y
      })
    }
  }

  pageMovingHandler(e: MouseEvent | TouchEvent | PointerEvent) {
    if (store.state.isPageScaling || this.scaleRatio <= pageUtils.mobileMinScaleRatio) {
      return
    }
    if (this.initialPos === null) {
      this.initialPos = mouseUtils.getMouseAbsPoint(e)
      return
    }
    const { getCurrPage: page } = pageUtils
    const contentScaleRatio = store.getters.getContentScaleRatio
    const pageScaleRatio = store.state.pageScaleRatio * 0.01
    const EDGE_WIDTH = {
      x: (editorUtils.mobileSize.width - page.width * contentScaleRatio) * 0.5,
      y: (editorUtils.mobileSize.height - page.height * contentScaleRatio) * 0.5
    }
    const offsetPos = mouseUtils.getMouseRelPoint(e, this.initialPos)

    const isReachLeftEdge = page.x >= EDGE_WIDTH.x && offsetPos.x > 0
    const isReachRightEdge = page.x <= editorUtils.mobileSize.width - page.width * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.x && offsetPos.x < 0
    const isReachTopEdge = page.y >= EDGE_WIDTH.y && offsetPos.y > 0
    const isReachBottomEdge = page.y <= editorUtils.mobileSize.height - page.height * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.y && offsetPos.y < 0

    let x = -1
    let y = -1
    if (isReachRightEdge || isReachLeftEdge) {
      x = isReachRightEdge ? editorUtils.mobileSize.width - page.width * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.x : EDGE_WIDTH.x
    } else {
      x = offsetPos.x + page.x
    }

    if (isReachTopEdge || isReachBottomEdge) {
      y = isReachBottomEdge ? editorUtils.mobileSize.height - page.height * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.y : EDGE_WIDTH.y
    } else {
      y = offsetPos.y + page.y
    }
    pageUtils.updatePagePos(this.pageIndex, { x, y })

    if (!isReachLeftEdge && !isReachRightEdge) {
      this.initialPos.x += offsetPos.x
    }
    if (!isReachBottomEdge && !isReachTopEdge) {
      this.initialPos.y += offsetPos.y
    }
  }

  moveEnd(e: MouseEvent | TouchEvent) {
    if (eventUtils.checkIsMultiTouch(e) || this.initialPos === null) {
      return this.removeListener()
    }
    this.isControlling = false
    this.removeListener()
    layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moving: false })
    this.setMoving(false)

    const posDiff = this.isTouchDevice ? {
      x: Math.abs(mouseUtils.getMouseAbsPoint(e).x - this.initialPos.x),
      y: Math.abs(mouseUtils.getMouseAbsPoint(e).y - this.initialPos.y)
    } : {
      x: Math.abs(this.getLayerPos.x - this.initTranslate.x),
      y: Math.abs(this.getLayerPos.y - this.initTranslate.y)
    }
    const pagePosDiff = {
      x: Math.abs(pageUtils.getCurrPage.x - initPageTranslate.x),
      y: Math.abs(pageUtils.getCurrPage.y - initPageTranslate.y)
    }
    const hasActualMove = posDiff.x > 1 || posDiff.y > 1
    const hasActualPageMove = Math.round(pagePosDiff.x) !== 0 || Math.round(pagePosDiff.y) !== 0

    if (this.isActive) {
      if (hasActualMove) {
        shortcutUtils.offsetCount = 0
        if (layerUtils.isOutOfBoundary() && this.currHoveredPageIndex === -1) {
          layerUtils.deleteSelectedLayer()
        } else if (layerUtils.isOutOfBoundary() && this.currHoveredPageIndex !== -1 && this.currHoveredPageIndex !== this.pageIndex) {
          // dragging to another page
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
            stepsUtils.asyncRecord()
          }
        }
      } else {
        if (this.getLayerType === 'text') {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: true })
          if (this.isTouchDevice) {
            if (!this.movingByControlPoint) {
              layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: true })
            }
          } else {
            if (this.movingByControlPoint) {
              layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false })
            }
          }
          if (this.config.contentEditable) {
            tiptapUtils.focus({ scrollIntoView: false }, this.isTouchDevice ? 'end' : null)
            if (!this.config.isEdited) {
              setTimeout(() => {
                tiptapUtils.agent(editor => !editor.isDestroyed && editor.commands.selectAll())
              }, 100) // wait for default behavior to set cursor position, then select (otherwise selection will be overwritten)
            }
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
      this.isControlling = false
      this.setCursorStyle(e, '')
    }

    if (!this.isActive) {
      if (hasActualPageMove) {
        return
      } else if (!this.isDoingGestureAction && !this.isActive && !hasActualMove) {
        this.eventTarget.removeEventListener('touchstart', this.disableTouchEvent)
        if (!this.inMultiSelectionMode) {
          groupUtils.deselect()
          const targetIndex = this.config.styles.zindex - 1
          this.setLastSelectedLayerIndex(this.layerIndex)
          groupUtils.select(this.pageIndex, [targetIndex])
        }
        this.setCursorStyle(e, '')
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
          dragging: false
        })
        this.isDoingGestureAction = false
        this.snapUtils.event.emit('clearSnapLines')
        return
      }
    }

    if (this.isDragging) {
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
        dragging: false
      })
      // this.component && this.component.$emit('isDragging', -1)
    }

    this.isDoingGestureAction = false
    this.snapUtils.event.emit('clearSnapLines')
  }

  onCursorDragEnd(e: MouseEvent | TouchEvent) {
    layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isDraggingCursor: false })
    eventUtils.removePointerEvent('pointerup', this._cursorDragEnd)
  }

  removeListener() {
    this.isControlling = false
    eventUtils.removePointerEvent('pointerup', this._moveEnd)
    eventUtils.removePointerEvent('pointermove', this._moving)
    eventUtils.removePointerEvent('pointerup', this._cursorDragEnd)
  }
}
