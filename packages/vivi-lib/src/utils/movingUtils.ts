import { ICoordinate } from '@/interfaces/frame'
import { AllLayerTypes, IGroup, IImage, ILayer, IShape, IStyle, IText, ITmp } from '@/interfaces/layer'
import store from '@/store'
import { FunctionPanelType, ILayerInfo } from '@/store/types'
import pointerEvtUtils from '@/utils/pointerEvtUtils'
import { nextTick } from 'vue'
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

export class MovingUtils {
  private eventTarget = null as unknown as HTMLElement
  private _config = { config: null as unknown as ILayer }
  private initialPos = { x: 0, y: 0 } as ICoordinate | null
  // this flag used to indicate the real initial position of at the beginning of moveStart
  private _initMousePos = { x: 0, y: 0 }
  private initTranslate = { x: 0, y: 0 }
  private pointerId = 0
  private initMousePos = { x: 0, y: 0 } as ICoordinate | null
  private initLayerPos = { x: 0, y: 0 }
  private movingByControlPoint = false
  private isHandleMovingHandler = false
  private snapUtils = null as any
  private body = undefined as unknown as HTMLElement
  private _moving = null as unknown
  private _moveEnd = null as unknown
  private _cursorDragEnd = null as unknown
  private layerInfo = { pageIndex: layerUtils.pageIndex, layerIndex: layerUtils.layerIndex, subLayerIdx: layerUtils.subLayerIdx } as ILayerInfo
  private isFollowByPinch = false

  private isTouchDevice = generalUtils.isTouchDevice()

  private get isBgImgCtrl(): boolean { return store.getters['imgControl/isBgImgCtrl'] }
  private get config(): ILayer { return this._config.config }
  private get inMultiSelectionMode(): number { return store.getters['mobileEditor/getInMultiSelectionMode'] }
  private get currFunctionPanelType(): number { return store.getters.getCurrFunctionPanelType }
  private get currSelectedInfo(): any { return store.getters.getCurrSelectedInfo }
  private get scaleRatio(): number { return store.getters.getPageScaleRatio }
  private get currHoveredPageIndex(): number { return store.getters.getCurrHoveredPageIndex }
  private get isActive(): boolean { return this.config.active }
  private get isControllerShown(): boolean { return this.isActive && (!generalUtils.isStk || !store.getters['webView/getControllerHidden']) }
  private get getLayerType(): string { return this.config.type }
  private get pageIndex(): number { return this.layerInfo.pageIndex }
  private get layerIndex(): number { return this.layerInfo.layerIndex }
  private get subLayerIdx(): number { return this.layerInfo.subLayerIdx ?? -1 }
  private get contentEditable(): boolean { return (this.config as any).contentEditable || false }
  private get getLayerPos(): ICoordinate { return { x: this.config.styles.x, y: this.config.styles.y } }
  private get isDragging(): boolean { return this.config.dragging }
  private initPageTranslate = { x: 0, y: 0 }
  private id = ''

  constructor({ _config, snapUtils, body, layerInfo }: { _config: { config: ILayer }, snapUtils: unknown, component?: any, body: HTMLElement, layerInfo?: ILayerInfo }) {
    this._config = _config
    this.snapUtils = snapUtils
    this.body = body
    this.id = generalUtils.generateRandomString(4)
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
    if (store.getters['mobileEditor/getIsPinchingEditor'] || layerUtils.getCurrLayer.isTyping) return

    store.commit('SET_STATE', {
      controlState: {
        layerInfo: {
          pageIndex: this.pageIndex,
          layerIndex: this.layerIndex
        },
        type: 'pageMove',
        phase: 'start',
        id: 'pageMove-' + this.config.id
      }
    })

    this.initPageTranslate.x = pageUtils.getCurrPage.x
    this.initPageTranslate.y = pageUtils.getCurrPage.y

    this.removeListener()
    if (e.type === 'pinch') {
      this.initMousePos = null
    } else {
      this.initMousePos = mouseUtils.getMouseAbsPoint(e)
    }
    this._initMousePos = mouseUtils.getMouseAbsPoint(e)
    this._moving = this.pageMoving.bind(this)
    this._moveEnd = this.pageMoveEnd.bind(this)
    eventUtils.addPointerEvent('pointerup', this._moveEnd)
    eventUtils.addPointerEvent('pointermove', this._moving)
  }

  pageMoving(e: PointerEvent) {
    if (store.getters['mobileEditor/getIsPinchingEditor'] ||
      store.getters.getControlState.type === 'pinch' ||
      pointerEvtUtils.pointers.length > 1 ||
      (layerUtils.getCurrLayer.isTyping)) {
      this.removeListener()
      return
    }
    if (store.state.controlState.type === 'pageMove' && store.state.controlState.phase !== 'moving') {
      store.commit('SET_STATE', {
        controlState: {
          ...store.state.controlState,
          phase: 'moving'
        }
      })
    }
    window.requestAnimationFrame(() => {
      this.pageMovingHandler(e)
    })
  }

  pageMoveEnd(e: PointerEvent) {
    if (store.getters.getControlState.id === 'pageMove-' + this.id) {
      store.commit('SET_STATE', { controlState: { type: '' } })
    }
    this.removeListener()
  }

  lockedLayerMoveStart(e: PointerEvent) {
    this._moveEnd = this.lockedLayerMoveEnd.bind(this)
    this._moving = this.lockedLayerMoving.bind(this)
    this.initTranslate.x = layerUtils.getCurrLayer.styles.x
    this.initTranslate.y = layerUtils.getCurrLayer.styles.y
    this.initialPos = mouseUtils.getMouseAbsPoint(e)
    eventUtils.addPointerEvent('pointerup', this._moveEnd)
    eventUtils.addPointerEvent('pointermove', this._moving)
  }

  lockedLayerMoving(e: PointerEvent) {
    if (!this.initialPos) return

    const isStartedPointer = this.pointerId === (e as PointerEvent).pointerId
    const isSinglePointer = pointerEvtUtils.pointers.length <= 1
    if (!isStartedPointer || !isSinglePointer
      || store.getters['mobileEditor/getIsPinchingEditor']
      || store.getters.getControlState.type === 'pinch' || this.initialPos === null) return

    const offsetPos = mouseUtils.getMouseRelPoint(e, this.initialPos)
    let offsetRatio = 100 / store.getters.getPageScaleRatio
    if (generalUtils.isTouchDevice()) {
      offsetRatio *= 1 / store.getters.getContentScaleRatio
    }

    const moveOffset = mathUtils.getActualMoveOffset(offsetPos.x, offsetPos.y, offsetRatio)
    const config = layerUtils.getCurrLayer
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

  lockedLayerMoveEnd(e: PointerEvent) {
    this.removeListener()
    const posDiff = {
      x: Math.abs(mouseUtils.getMouseAbsPoint(e).x - this._initMousePos.x),
      y: Math.abs(mouseUtils.getMouseAbsPoint(e).y - this._initMousePos.y)
    }
    const hasActualMove = posDiff.x > 1 || posDiff.y > 1
    if (!hasActualMove) {
      groupUtils.deselect()
      const targetIndex = this.config.styles.zindex - 1
      this.setLastSelectedLayerIndex(this.layerIndex)
      groupUtils.select(this.pageIndex, [targetIndex])
    }
  }

  moveStart(event: MouseEvent | TouchEvent | PointerEvent, params?: { pointerId?: number, isFollowByPinch?: boolean }) {
    if(store.state.allowLayerAction === 'none') return

    const { pointerId, isFollowByPinch = false } = params || {}
    const eventType = eventUtils.getEventType(event)
    if (eventType === 'pointer') {
      pointerEvtUtils.addPointer(event as PointerEvent)
    }
    if (store.getters['imgControl/isImgCtrl']) return
    if (eventUtils.checkIsMultiTouch(event)) return
    if (store.getters['mobileEditor/getIsPinchingEditor'] || store.getters.getControlState.type) return

    store.commit('SET_STATE', {
      controlState: {
        layerInfo: this.layerInfo,
        type: 'move',
        phase: 'start',
        id: 'move-' + this.id
      }
    })

    if (pointerId) {
      this.pointerId = pointerId
    } else if (eventUtils.getEventType(event) === 'pointer') {
      this.pointerId = (event as PointerEvent).pointerId
    }

    this.isFollowByPinch = isFollowByPinch
    this.initLayerPos.x = this.getLayerPos.x
    this.initLayerPos.y = this.getLayerPos.y
    this._initMousePos = mouseUtils.getMouseAbsPoint(event)
    this.initPageTranslate.x = pageUtils.getCurrPage.x
    this.initPageTranslate.y = pageUtils.getCurrPage.y
    const currLayerIndex = layerUtils.layerIndex

    formatUtils.applyFormatIfCopied(this.pageIndex, this.layerIndex)
    formatUtils.clearCopiedFormat()

    // the currLayer active target is not exactly the same fire event layer
    if (generalUtils.isStk && generalUtils.isTouchDevice() && (layerUtils.layerIndex !== this.layerIndex && this.config.locked)) {
      return this.lockedLayerMoveStart(event as PointerEvent)
    }

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
    /**
     * used for frame layer for entering detection
     * This is used for moving image to replace frame element
     */
    this.eventTarget = (event.target as HTMLElement)
    if (event.type === 'pointerdown') {
      this.eventTarget.releasePointerCapture((event as PointerEvent).pointerId)
    }

    if (this.isTouchDevice) {
      event.stopPropagation()
    }
    if (eventType === 'pointer') {
      const pointerEvent = event as PointerEvent
      if (pointerEvent.button !== 0) return
    } else if (eventType === 'mouse') {
      const mouseEvent = event as MouseEvent
      if (mouseEvent.button !== 0) return
    }
    if (this.currFunctionPanelType === FunctionPanelType.photoShadow) {
      eventUtils.emit(PanelEvent.showPhotoShadow, '')
    }
    /**
     * @Note - in Mobile version, we can't select the layer directly, we should make it active first
     * The exception is that we are in multi-selection mode
     */
    if (this.isTouchDevice && !this.isControllerShown && !this.inMultiSelectionMode) {
      this.eventTarget.addEventListener('touchstart', this.disableTouchEvent)
      this.initMousePos = mouseUtils.getMouseAbsPoint(event)
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

    if (inCopyMode) {
      shortcutUtils.altDuplicate(this.pageIndex, this.layerIndex, this.config)
    }

    switch (this.getLayerType) {
      case 'text': {
        const targetClassList = (event.target as HTMLElement).classList
        const isMoveBar = targetClassList.contains('control-point__move-bar')
        const isMover = targetClassList.contains('control-point__mover')

        // if the text layer is already active and contentEditable
        if (this.isControllerShown && !inSelectionMode && this.contentEditable && !isMoveBar && !isMover) {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isDraggingCursor: true })
          this._cursorDragEnd = this.onCursorDragEnd.bind(this)
          eventUtils.addPointerEvent('pointerup', this._cursorDragEnd)
          return
        } else if (!this.isControllerShown) {
          let targetIndex = this.layerIndex
          if (!inSelectionMode && !inMultiSelectionMode) {
            groupUtils.deselect()
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedLayerIndex(this.layerIndex)
            groupUtils.select(this.pageIndex, [targetIndex])
          } else if (this.pageIndex === pageUtils.currFocusPageIndex) {
            groupUtils.select(this.pageIndex, [targetIndex])
          }
          this.initMousePos = mouseUtils.getMouseAbsPoint(event)
          this._moving = this.moving.bind(this)
          this._moveEnd = this.moveEnd.bind(this)
          eventUtils.addPointerEvent('pointerup', this._moveEnd)
          eventUtils.addPointerEvent('pointermove', this._moving)
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
      case 'group': {
        if (this.subLayerIdx !== -1 && layerUtils.getCurrConfig.isTyping) {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isDraggingCursor: true })
          this._cursorDragEnd = this.onCursorDragEnd.bind(this)
          eventUtils.addPointerEvent('pointerup', this._cursorDragEnd)

          // check if the sub-layer is editing.
          // if so, check if the pointer is on the sub-layer.
          const [targetLayerInPage] = groupUtils.mapLayersToPage([layerUtils.getCurrConfig as IText], this.config as IGroup)
          if (!controlUtils.isClickOnController(event as PointerEvent, targetLayerInPage)) {
            layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false }, layerUtils.subLayerIdx)
          }
          return
        }
      }
    }

    /**
     * @Note InMultiSelection mode should still can move the layer
     */
    if (!inSelectionMode) {
      this.initMousePos = mouseUtils.getMouseAbsPoint(event)
      this._moving = this.moving.bind(this)
      this._moveEnd = this.moveEnd.bind(this)
      eventUtils.addPointerEvent('pointerup', this._moveEnd)
      eventUtils.addPointerEvent('pointermove', this._moving)
    }
    if (this.config.type !== 'tmp') {
      let targetIndex = this.layerIndex
      if (this.isControllerShown && this.currSelectedInfo.layers.length === 1) {
        if (inSelectionMode) {
          groupUtils.deselect()
          targetIndex = this.config.styles.zindex - 1
          this.setLastSelectedLayerIndex(this.layerIndex)
        }
      } else if (!this.isControllerShown) {
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
            if (this.pageIndex === pageUtils.currFocusPageIndex) {
              groupUtils.select(this.pageIndex, [targetIndex])
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

  moving(e: PointerEvent) {
    if(store.state.allowLayerAction === 'crop-only') return
    const isStartedPointer = this.pointerId === (e as PointerEvent).pointerId
    const isSinglePointer = pointerEvtUtils.pointers.length <= 1
    if (!isStartedPointer || !isSinglePointer || store.getters['mobileEditor/getIsPinchingEditor'] || store.getters.getControlState.type === 'pinch' || this.initMousePos === null) {
      if (store.getters.getControlState.type === 'pinch') {
        // if the pinch is started, the moving logic should be turn off
        this.removeListener()
      }
      return
    }

    if (store.state.controlState.type === 'move' && store.state.controlState.phase !== 'moving') {
      store.commit('SET_STATE', {
        controlState: {
          ...store.state.controlState,
          phase: 'moving'
        }
      })
    }

    const updateConfigData = {} as Partial<IText | IImage | IShape>
    if (!this.isDragging) {
      updateConfigData.dragging = true
    }
    // stk always moving the layer
    if (!this.config.locked && (this.isControllerShown || controlUtils.isClickOnController(e, layerUtils.getCurrLayer) || generalUtils.isStk)) {
      if (generalUtils.getEventType(e) !== 'touch') {
        e.preventDefault()
      }
      this.setCursorStyle(e, 'move')

      if (!this.isHandleMovingHandler) {
        window.requestAnimationFrame(() => {
          this.movingHandler(e)
          this.isHandleMovingHandler = false
        })
        this.isHandleMovingHandler = true
      }
      const posDiff = {
        x: Math.abs(mouseUtils.getMouseAbsPoint(e).x - this._initMousePos.x),
        y: Math.abs(mouseUtils.getMouseAbsPoint(e).y - this._initMousePos.y)
      }
      const hasActualMove = posDiff.x !== 0 || posDiff.y !== 0
      if (hasActualMove) {
        if (!this.config.moving || !store.state.isMoving) {
          updateConfigData.moving = true
          this.setMoving(true)
        }
        if (layerUtils.getCurrConfig.type === 'text' && layerUtils.getCurrConfig.contentEditable) {
          layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { contentEditable: false }, layerUtils.subLayerIdx)
        }
      }
    } else {
      const posDiff = {
        x: Math.abs(mouseUtils.getMouseAbsPoint(e).x - this._initMousePos.x),
        y: Math.abs(mouseUtils.getMouseAbsPoint(e).y - this._initMousePos.y)
      }
      if (this.isTouchDevice) {
        const { mobileSize } = editorUtils
        const { getCurrPage: page, scaleRatio } = pageUtils
        const isPageFullyInsideEditor = page.width * scaleRatio * 0.01 * page.contentScaleRatio < mobileSize.width &&
          page.height * scaleRatio * 0.01 * page.contentScaleRatio < mobileSize.height
        if (!isPageFullyInsideEditor) {
          this.pageMoving(e)
        }
      } else {
        if (posDiff.x < 1 && posDiff.y < 1) {
          return
        }
      }
    }
    layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, updateConfigData)
  }

  movingHandler(e: MouseEvent | PointerEvent) {
    if (this.initMousePos === null) return
    if (generalUtils.isTouchDevice() && !generalUtils.isStk &&
      this.layerIndex !== layerUtils.layerIndex && !controlUtils.isClickOnController(e, layerUtils.getCurrLayer)) return
    if (layerUtils.getCurrLayer.locked) return

    const config = layerUtils.getCurrLayer
    const targetLayerIdx = layerUtils.layerIndex
    if (Object.values(config).length === 0) {
      /**
       * if the layer is deleted the config will be empty object
       */
      eventUtils.removePointerEvent('pointerup', this._moveEnd)
      eventUtils.removePointerEvent('pointermove', this._moving)
      return
    }
    if (!this.config.moved) {
      layerUtils.updateLayerProps(this.pageIndex, targetLayerIdx, { moved: true })
    }
    const offsetPos = mouseUtils.getMouseRelPoint(e, this.initMousePos)
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
    this.initMousePos.x += totalOffset.x
    this.initMousePos.y += totalOffset.y

    if (offsetSnap.x || offsetSnap.y) {
      this.snapUtils.event.emit(`getClosestSnaplines-${this.snapUtils.id}`)
      layerUtils.updateLayerStyles(this.pageIndex, targetLayerIdx, {
        x: _updateStyles.x + offsetSnap.x,
        y: _updateStyles.y + offsetSnap.y
      })
    } else {
      layerUtils.updateLayerStyles(this.pageIndex, targetLayerIdx, {
        x: _updateStyles.x,
        y: _updateStyles.y
      })
    }
  }

  _pageMovingHandler4cm(e: MouseEvent | TouchEvent | PointerEvent) {
    if (['none', 'crop-only'].includes(store.state.allowLayerAction)) return

    if (store.state.isPageScaling || this.scaleRatio <= pageUtils.mobileMinScaleRatio) {
      return
    }
    if (this.initMousePos === null) {
      this.initMousePos = mouseUtils.getMouseAbsPoint(e)
      return
    }
    const { getCurrPage: page } = pageUtils
    const contentScaleRatio = store.getters.getContentScaleRatio
    const pageScaleRatio = store.state.pageScaleRatio * 0.01
    const offsetPos = mouseUtils.getMouseRelPoint(e, this.initMousePos)

    const isReachLeftEdge = offsetPos.x > 0 && page.x + offsetPos.x >= 0
    const isReachRightEdge = offsetPos.x < 0 && page.x + offsetPos.x <= page.width * contentScaleRatio * (1 - pageScaleRatio)
    const isReachTopEdge = offsetPos.y > 0 && page.y + offsetPos.y >= 0
    const isReachBottomEdge = offsetPos.y < 0 && page.y + offsetPos.y <= page.height * contentScaleRatio * (1 - pageScaleRatio)

    let x = -1
    let y = -1
    if (isReachRightEdge || isReachLeftEdge) {
      x = isReachRightEdge ? page.width * contentScaleRatio * (1 - pageScaleRatio) : 0
    } else {
      x = offsetPos.x + page.x
    }

    if (isReachTopEdge || isReachBottomEdge) {
      y = isReachBottomEdge ? page.height * contentScaleRatio * (1 - pageScaleRatio) : 0
    } else {
      y = offsetPos.y + page.y
    }
    pageUtils.updatePagePos(this.pageIndex, { x, y })

    if (!isReachLeftEdge && !isReachRightEdge) {
      this.initMousePos.x += offsetPos.x
    }
    if (!isReachBottomEdge && !isReachTopEdge) {
      this.initMousePos.y += offsetPos.y
    }
  }

  _pageMovingHandler4pic(e: MouseEvent | TouchEvent | PointerEvent) {
    if (store.state.isPageScaling || this.scaleRatio <= pageUtils.mobileMinScaleRatio) {
      return
    }
    if (this.initMousePos === null) {
      this.initMousePos = mouseUtils.getMouseAbsPoint(e)
      return
    }
    const { getCurrPage: page } = pageUtils
    const contentScaleRatio = store.getters.getContentScaleRatio
    const pageScaleRatio = store.state.pageScaleRatio * 0.01
    const EDGE_WIDTH = {
      x: (editorUtils.mobileSize.width - page.width * contentScaleRatio) * 0.5,
      y: (editorUtils.mobileSize.height - page.height * contentScaleRatio) * 0.5
    }
    const offsetPos = mouseUtils.getMouseRelPoint(e, this.initMousePos)

    const isReachLeftEdge = offsetPos.x > 0 && page.x + offsetPos.x >= EDGE_WIDTH.x
    const isReachRightEdge = offsetPos.x < 0 && page.x + offsetPos.x <= editorUtils.mobileSize.width - page.width * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.x
    const isReachTopEdge = offsetPos.y > 0 && page.y + offsetPos.y >= EDGE_WIDTH.y
    const isReachBottomEdge = offsetPos.y < 0 && page.y + offsetPos.y <= editorUtils.mobileSize.height - page.height * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.y

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
      this.initMousePos.x += offsetPos.x
    }
    if (!isReachBottomEdge && !isReachTopEdge) {
      this.initMousePos.y += offsetPos.y
    }
  }

  pageMovingHandler(e: MouseEvent | TouchEvent | PointerEvent) {
    if (generalUtils.isPic) {
      this._pageMovingHandler4pic(e)
    } else if (generalUtils.isCm) {
      this._pageMovingHandler4cm(e)
    }
  }

  moveEnd(e: MouseEvent | TouchEvent) {
    if (store.getters.getControlState.id === 'move-' + this.id) {
      store.commit('SET_STATE', { controlState: { type: '' } })
    }
    if (eventUtils.getEventType(e) === 'pointer' && ['pointerup', 'poinerleave'].includes(e.type)) {
      this.pointerId = 0
      pointerEvtUtils.removePointer((e as PointerEvent).pointerId)
    }

    const isLayerExist = layerUtils.getLayer(this.layerInfo.pageIndex, this.layerInfo.layerIndex).id === this.config.id
    if (pointerEvtUtils.pointerIds.length > 1 || !isLayerExist ||
      eventUtils.checkIsMultiTouch(e) || this.initMousePos === null) {
      return this.removeListener()
    }

    this.removeListener()
    layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moving: false })
    this.setMoving(false)

    const currMousePos = mouseUtils.getMouseAbsPoint(e)
    const mousePosDiff = {
      x: Math.abs(currMousePos.x - this._initMousePos.x),
      y: Math.abs(currMousePos.y - this._initMousePos.y)
    }
    const layerPosDiff = {
      x: Math.abs(this.getLayerPos.x - this.initLayerPos.x),
      y: Math.abs(this.getLayerPos.y - this.initLayerPos.y)
    }
    const pagePosDiff = {
      x: Math.abs(pageUtils.getCurrPage.x - this.initPageTranslate.x),
      y: Math.abs(pageUtils.getCurrPage.y - this.initPageTranslate.y)
    }
    const hasActualLayerMove = layerPosDiff.x > 1 || layerPosDiff.y > 1
    const hasActualPageMove = Math.round(pagePosDiff.x) !== 0 || Math.round(pagePosDiff.y) !== 0
    const hasActualMouseMove = Math.round(mousePosDiff.x) !== 0 || Math.round(mousePosDiff.y) !== 0

    if (this.isControllerShown) {
      if (hasActualLayerMove) {
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
            stepsUtils.record()
          }
          // turn off text layer's auto rescale mode after moving
          switch (this.getLayerType) {
            case 'text':
              layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { inAutoRescaleMode: false })
              break
            case 'tmp':
              for (const [subLayerIdx, subLayer] of (this.config as ITmp).layers.entries()) {
                if (subLayer.type === 'text') {
                  layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { inAutoRescaleMode: false }, subLayerIdx)
                }
              }
              break
          }
        }
      } else {
        if (this.isFollowByPinch) {
          stepsUtils.record()
        }
        if (this.getLayerType === 'text' && controlUtils.isClickOnController(e as PointerEvent, this.config as AllLayerTypes) && !this.isFollowByPinch) {
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
            nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, this.isTouchDevice ? 'end' : null)
            })
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
            if (this.isControllerShown && this.currSelectedInfo.layers.length === 1) {
              groupUtils.deselect()
              targetIndex = this.config.styles.zindex - 1
              this.setLastSelectedLayerIndex(this.layerIndex)
            } else if (!this.isControllerShown) {
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
      this.setCursorStyle(e, '')
    } else {
      if (hasActualPageMove || hasActualMouseMove) {
        return
      } else if (!hasActualMouseMove) {
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
        this.snapUtils.event.emit('clearSnapLines')
        return
      }
    }

    if (this.isDragging) {
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
        dragging: false
      })
    }

    this.snapUtils.event.emit('clearSnapLines')
  }

  onCursorDragEnd(e: MouseEvent | TouchEvent) {
    layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isDraggingCursor: false })
    eventUtils.removePointerEvent('pointerup', this._cursorDragEnd)
  }

  removeListener() {
    eventUtils.removePointerEvent('pointerup', this._moveEnd)
    eventUtils.removePointerEvent('pointermove', this._moving)
    eventUtils.removePointerEvent('pointerup', this._cursorDragEnd)
  }
}
