<template lang="pug">
  //- @pointerdown="moveStart"
  div
    div(class="nu-layer" :class="!config.locked ? `nu-layer--p${pageIndex}` : ''" :style="layerStyles()" ref="body" :id="`nu-layer-${pageIndex}-${layerIndex}`"
        :data-index="dataIndex === '-1' ? `${subLayerIndex}` : dataIndex"
        :data-p-index="pageIndex"
        @drop="config.type !== 'image' ? onDrop($event) : onDropClipper($event)"
        @dragover.prevent
        @dragleave.prevent
        @dragenter.prevent)
      div(class="layer-translate posAbs"
          :style="translateStyles()")
        div(class="layer-scale posAbs" ref="scale"
            :style="scaleStyles()")
          nu-clipper(:config="config"
              :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
              :imgControl="imgControl" :contentScaleRatio="contentScaleRatio")
            lazy-load(:target="lazyLoadTarget"
                :rootMargin="'300px 0px 300px 0px'"
                :minHeight="config.styles.height * contentScaleRatio"
                :minWidth="config.styles.width * contentScaleRatio"
                :threshold="[0]"
                :handleUnrender="handleUnrender"
                :anamationEnabled="false"
                :forceRender="isSubLayer || forceRender")
              component(:is="`nu-${config.type}`"
                class="transition-none"
                :config="config"
                :imgControl="imgControl"
                :contentScaleRatio="contentScaleRatio"
                :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
                :scaleRatio="scaleRatio"
                :isPagePreview="isPagePreview"
                :forRender="forRender"
                v-bind="$attrs")
      div(v-if="showSpinner()" class="nu-layer__inProcess")
        square-loading
    //- nu-controller(v-if="isActive && !forRender"
    //-   data-identifier="controller"
    //-   :key="`controller-${config.id}`"
    //-   :layerIndex="layerIndex"
    //-   :pageIndex="pageIndex"
    //-   :config="config"
    //-   :snapUtils="snapUtils"
    //-   :contentScaleRatio="contentScaleRatio")
        //- svg-icon(class="spiner"
        //-   :iconName="'spiner'"
        //-   :iconColor="'white'"
        //-   :iconWidth="'150px'")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { FunctionPanelType, ILayerInfo, LayerType } from '@/store/types'
import CssConveter from '@/utils/cssConverter'
import MouseUtils from '@/utils/mouseUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import textBgUtils from '@/utils/textBgUtils'
import layerUtils from '@/utils/layerUtils'
import SquareLoading from '@/components/global/SqureLoading.vue'
import frameUtils from '@/utils/frameUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import pageUtils from '@/utils/pageUtils'
import { IFrame, IGroup, IImage, ILayer } from '@/interfaces/layer'
import LazyLoad from '@/components/LazyLoad.vue'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import formatUtils from '@/utils/formatUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import groupUtils from '@/utils/groupUtils'
import mathUtils from '@/utils/mathUtils'
import { ICoordinate } from '@/interfaces/frame'
import controlUtils from '@/utils/controlUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import stepsUtils from '@/utils/stepsUtils'
import { MovingUtils } from '@/utils/movingUtils'

export default Vue.extend({
  inheritAttrs: false,
  components: {
    SquareLoading,
    LazyLoad
  },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number,
    imgControl: Boolean,
    snapUtils: Object,
    isSubLayer: {
      type: Boolean,
      default: false
    },
    isFrame: {
      type: Boolean,
      default: false
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    isPagePreview: {
      default: false,
      type: Boolean
    },
    'data-index': {
      default: '-1',
      type: String
    },
    lazyLoadTarget: {
      default: '.editor-view',
      type: String
    },
    forceRender: {
      default: true,
      type: Boolean
    },
    forRender: {
      default: false,
      type: Boolean
    },
    handleUnrender: {
      default: false,
      type: Boolean
    }
    /**
     * @Note Vuex Props
    //  */
    // currSelectedInfo: Object as PropType<ICurrSelectedInfo>,
    // scaleRatio: Number,
    // getCurrFunctionPanelType: Number,
    // isUploadingShadowImg: Boolean,
    // isHandling: Boolean,
    // isShowPagePanel: Boolean,
    // imgSizeMap: Array as PropType<Array<{ [key: string]: string | number }>>,
    // userId: String,
    // verUni: String,
    // uploadId: Object as PropType<ILayerIdentifier>,
    // handleId: Object as PropType<ILayerIdentifier>,
    // uploadShadowImgs: Array as PropType<Array<IUploadShadowImg>>
  },
  data() {
    return {
      LayerType,
      eventTarget: null as unknown as HTMLElement,
      dblTabsFlag: false,
      initialPos: { x: 0, y: 0 },
      initTranslate: { x: 0, y: 0 },
      movingByControlPoint: false,
      isControlling: false,
      isDoingGestureAction: false,
      isHandleMovingHandler: false,
      isMoved: false,
      isPointerDownFromSubController: false,
      movingUtils: null as unknown as MovingUtils
    }
  },
  mounted() {
    const body = this.$refs.body as HTMLElement
    this.movingUtils = new MovingUtils({
      config: this.config,
      component: this,
      snapUtils: this.snapUtils,
      body
    })
    const moveStart = this.movingUtils.moveStart.bind(this.movingUtils)
    body.addEventListener('pointerdown', moveStart)
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapState('shadow', ['processId', 'handleId']),
    ...mapState(['currDraggedPhoto']),
    ...mapGetters('imgControl', ['isBgImgCtrl']),
    ...mapGetters('text', ['getDefaultFonts']),
    ...mapGetters({
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currHoveredPageIndex: 'getCurrHoveredPageIndex',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      isProcessImgShadow: 'shadow/isProcessing',
      currSelectedInfo: 'getCurrSelectedInfo',
      scaleRatio: 'getPageScaleRatio',
      currFunctionPanelType: 'getCurrFunctionPanelType',
      isUploadingShadowImg: 'shadow/isUploading',
      isHandling: 'shadow/isHandling',
      isShowPagePanel: 'page/getShowPagePanel'
    }),
    layerInfo(): ILayerInfo {
      return {
        pageIndex: this.pageIndex,
        layerIndex: this.layerIndex
      }
    },
    isDragging(): boolean {
      return (this.config as ILayer).dragging
    },
    isImgControl(): boolean {
      switch (this.getLayerType) {
        case 'image':
          return this.config.imgControl
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
    },
    isActive(): boolean {
      return this.config.active
    },
    transformStyle(): { [index: string]: string } {
      return {
        transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial'
      }
    },
    enalble3dTransform(): boolean {
      return this.pageIndex === pageUtils._3dEnabledPageIndex
    },
    contentEditable(): boolean {
      return this.config.contentEditable
    },
    getLayerType(): string {
      return this.config.type
    },
    isLine(): boolean {
      return this.config.type === 'shape' && this.config.category === 'D'
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened',
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      setMoving: 'SET_moving',
      setImgConfig: 'imgControl/SET_CONFIG',
      setBgConfig: 'imgControl/SET_BG_CONFIG'
    }),
    outlineStyles() {
      const outlineColor = (() => {
        if (this.getLayerType === 'frame' && this.config.clips[0].isFrameImg) {
          return '#F10994'
        } else if (this.isLocked()) {
          return '#EB5757'
        } else {
          return '#7190CC'
        }
      })()

      if (this.isLine || (this.config.moving && this.currSelectedInfo.index !== this.layerIndex)) {
        return 'none'
      } else if (this.config.shown || this.isActive) {
        if (this.config.type === 'tmp' || this.isControlling) {
          return `${2 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid ${outlineColor}`
        } else {
          return `${2 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid ${outlineColor}`
        }
      } else {
        return 'none'
      }
    },
    // moveStart(event: MouseEvent | TouchEvent | PointerEvent) {
    //   const currLayerIndex = layerUtils.layerIndex
    //   if (currLayerIndex !== this.layerIndex) {
    //     const layer = layerUtils.getLayer(this.pageIndex, currLayerIndex)
    //     if (layer.type === 'image' && layer.imgControl) {
    //       layerUtils.updateLayerProps(this.pageIndex, currLayerIndex, { imgControl: false })
    //     } else if (layer.type === 'group') {
    //       (layer as IGroup).layers
    //         .forEach((l, i) => {
    //           if (l.type === 'image' && l.imgControl) {
    //             layerUtils.updateLayerProps(this.pageIndex, currLayerIndex, { imgControl: false }, i)
    //           }
    //         })
    //     }
    //   }

    //   if (this.isBgImgCtrl) {
    //     this.setBgConfig(undefined)
    //   }

    //   const eventType = eventUtils.getEventType(event)
    //   /**
    //    * used for frame layer for entering detection
    //    * This is used for moving image to replace frame element
    //    */
    //   this.eventTarget = (event.target as HTMLElement)
    //   this.eventTarget.releasePointerCapture((event as PointerEvent).pointerId)

    //   if (generalUtils.isTouchDevice()) {
    //     if (!this.dblTabsFlag && this.config.active) {
    //       const touchtime = Date.now()
    //       const interval = 500
    //       const doubleTap = (e: PointerEvent) => {
    //         e.preventDefault()
    //         if (Date.now() - touchtime < interval && !this.dblTabsFlag) {
    //           /**
    //            * This is the dbl-click callback block
    //            */
    //           if (this.config.type === LayerType.image) {
    //             layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true })
    //             eventUtils.emit(PanelEvent.switchTab, 'crop')
    //           }
    //           this.dblTabsFlag = true
    //         }
    //       }
    //       this.eventTarget.addEventListener('pointerdown', doubleTap)
    //       setTimeout(() => {
    //         this.eventTarget.removeEventListener('pointerdown', doubleTap)
    //         this.dblTabsFlag = false
    //       }, interval)
    //     }
    //   }
    //   if (eventType === 'pointer') {
    //     const pointerEvent = event as PointerEvent
    //     if (pointerEvent.button !== 0) return
    //   } else if (eventType === 'mouse') {
    //     const mouseEvent = event as MouseEvent
    //     if (mouseEvent.button !== 0) return
    //   }
    //   if (eventUtils.checkIsMultiTouch(event)) {
    //     return
    //   }
    //   if (this.currFunctionPanelType === FunctionPanelType.photoShadow) {
    //     eventUtils.emit(PanelEvent.showPhotoShadow, '')
    //   }
    //   /**
    //    * @Note - in Mobile version, we can't select the layer directly, we should make it active first
    //    * The exception is that we are in multi-selection mode
    //    */
    //   if (generalUtils.isTouchDevice() && !this.config.active && !this.isLocked() && !this.inMultiSelectionMode) {
    //     this.eventTarget.addEventListener('touchstart', this.disableTouchEvent)
    //     this.initialPos = MouseUtils.getMouseAbsPoint(event)
    //     eventUtils.addPointerEvent('pointerup', this.moveEnd)
    //     eventUtils.addPointerEvent('pointermove', this.moving)
    //     return
    //   }

    //   this.movingByControlPoint = false
    //   // const inSelectionMode = (generalUtils.exact([event.shiftKey, event.ctrlKey, event.metaKey])) && !this.contentEditable
    //   const inCopyMode = (generalUtils.exact([event.altKey])) && !this.contentEditable
    //   const inSelectionMode = (generalUtils.exact([event.shiftKey, event.ctrlKey, event.metaKey])) && !this.contentEditable && !inCopyMode
    //   const { inMultiSelectionMode } = this
    //   if (!this.isLocked()) {
    //     event.stopPropagation()
    //   }
    //   formatUtils.applyFormatIfCopied(this.pageIndex, this.layerIndex)
    //   formatUtils.clearCopiedFormat()
    //   this.initTranslate = this.getLayerPos()

    //   if (inCopyMode) {
    //     ShortcutUtils.altDuplicate(this.pageIndex, this.layerIndex, this.config)
    //   }

    //   switch (this.getLayerType) {
    //     case 'text': {
    //       const targetClassList = (event.target as HTMLElement).classList
    //       const isMoveBar = targetClassList.contains('control-point__move-bar')
    //       const isMover = targetClassList.contains('control-point__mover')

    //       // if the text layer is already active and contentEditable
    //       if (this.isActive && !inSelectionMode && this.contentEditable && !isMoveBar && !isMover) {
    //         return
    //       } else if (!this.isActive) {
    //         let targetIndex = this.layerIndex
    //         if (!inSelectionMode && !inMultiSelectionMode) {
    //           groupUtils.deselect()
    //           targetIndex = this.config.styles.zindex - 1
    //           this.setLastSelectedLayerIndex(this.layerIndex)
    //           groupUtils.select(this.pageIndex, [targetIndex])
    //         } else {
    //           if (this.pageIndex === pageUtils.currFocusPageIndex) {
    //             groupUtils.select(this.pageIndex, [targetIndex])
    //           }
    //         }
    //         if (!this.config.locked) {
    //           this.isControlling = true
    //           this.initialPos = MouseUtils.getMouseAbsPoint(event)
    //           eventUtils.addPointerEvent('pointerup', this.moveEnd)
    //           eventUtils.addPointerEvent('pointermove', this.moving)
    //         }
    //         return
    //       }

    //       /**
    //        * The cotentEditable updated timing will be move to the moveEnd instead of moveStart
    //        * bcz if we set it to true when moveStart and we want to move the layer instead of editing the text, it will still make the mobile keyboard show up
    //        */

    //       if (isMover || isMoveBar) {
    //         this.movingByControlPoint = true
    //       } else {
    //         layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: true })
    //       }

    //       break
    //     }
    //   }

    //   /**
    //    * @Note InMultiSelection mode should still can move the layer
    //    */
    //   if (!this.config.locked && !inSelectionMode) {
    //     this.initialPos = MouseUtils.getMouseAbsPoint(event)
    //     eventUtils.addPointerEvent('pointerup', this.moveEnd)
    //     eventUtils.addPointerEvent('pointermove', this.moving)
    //   }
    //   if (this.config.type !== 'tmp') {
    //     let targetIndex = this.layerIndex
    //     if (this.isActive && this.currSelectedInfo.layers.length === 1) {
    //       if (inSelectionMode) {
    //         groupUtils.deselect()
    //         targetIndex = this.config.styles.zindex - 1
    //         this.setLastSelectedLayerIndex(this.layerIndex)
    //       }
    //     } else if (!this.isActive) {
    //       // already have selected layer
    //       if (this.currSelectedInfo.index >= 0) {
    //         // Did not press shift/cmd/ctrl key -> deselect selected layers first
    //         if (!inSelectionMode && !inMultiSelectionMode) {
    //           groupUtils.deselect()
    //           targetIndex = this.config.styles.zindex - 1
    //           this.setLastSelectedLayerIndex(this.layerIndex)
    //           groupUtils.select(this.pageIndex, [targetIndex])
    //         } else {
    //           // this if statement is used to prevent select the layer in another page
    //           if (this.pageIndex === pageUtils.currFocusPageIndex && !this.config.locked) {
    //             if (!layerUtils.getCurrLayer.locked) {
    //               groupUtils.select(this.pageIndex, [targetIndex])
    //             }
    //           }
    //         }
    //       } else {
    //         targetIndex = this.config.styles.zindex - 1
    //         this.setLastSelectedLayerIndex(this.layerIndex)
    //         groupUtils.select(this.pageIndex, [targetIndex])
    //       }
    //     }
    //   }
    // },
    // moving(e: MouseEvent | TouchEvent | PointerEvent) {
    //   // console.log('moving in layer')
    //   const posDiff = {
    //     x: Math.abs(MouseUtils.getMouseAbsPoint(e).x - this.initialPos.x),
    //     y: Math.abs(MouseUtils.getMouseAbsPoint(e).y - this.initialPos.y)
    //   }
    //   switch (this.config.type) {
    //     case LayerType.group:
    //       if ((this.config as IGroup).layers.some(l => l.active && l.type === LayerType.text && l.contentEditable && l.isTyping)) {
    //         return
    //       }
    //   }

    //   if (generalUtils.isTouchDevice() && !this.isLocked()) {
    //     if (!this.isActive) {
    //       if (posDiff.x > 1 || posDiff.y > 1) {
    //         this.isDoingGestureAction = true
    //         return
    //       }
    //     } else {
    //       if (posDiff.x < 1 && posDiff.y < 1) {
    //         return
    //       }
    //     }
    //   }

    //   this.isControlling = true
    //   if (!this.isDragging) {
    //     layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
    //       dragging: true
    //     })
    //     this.$emit('isDragging', this.layerIndex)
    //   }
    //   if (this.isImgControl) {
    //     eventUtils.removePointerEvent('pointerup', this.moveEnd)
    //     eventUtils.removePointerEvent('pointermove', this.moving)
    //     return
    //   }
    //   if (this.isActive) {
    //     if (generalUtils.getEventType(e) !== 'touch') {
    //       e.preventDefault()
    //     }
    //     this.setCursorStyle('move')
    //     if (!this.isHandleMovingHandler) {
    //       window.requestAnimationFrame(() => {
    //         this.movingHandler(e)
    //         this.isHandleMovingHandler = false
    //       })
    //       this.isHandleMovingHandler = true
    //     }
    //     const posDiff = {
    //       x: Math.abs(this.getLayerPos().x - this.initTranslate.x),
    //       y: Math.abs(this.getLayerPos().y - this.initTranslate.y)
    //     }
    //     if ((Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0)) {
    //       layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moving: true })
    //       this.setMoving(true)
    //     }
    //   }
    // },
    // movingHandler(e: MouseEvent | TouchEvent | PointerEvent) {
    //   if (!this.config.moved) {
    //     layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
    //   }
    //   const offsetPos = MouseUtils.getMouseRelPoint(e, this.initialPos)
    //   const moveOffset = mathUtils.getActualMoveOffset(offsetPos.x, offsetPos.y)
    //   groupUtils.movingTmp(
    //     this.pageIndex,
    //     {
    //       x: moveOffset.offsetX,
    //       y: moveOffset.offsetY
    //     }
    //   )
    //   const offsetSnap = this.snapUtils.calcMoveSnap(this.config, this.layerIndex)
    //   // const offsetSnap = { x: 0, y: 0 }
    //   this.snapUtils.event.emit(`getClosestSnaplines-${this.snapUtils.id}`)
    //   this.$emit('getClosestSnaplines')
    //   const totalOffset = {
    //     x: offsetPos.x + (offsetSnap.x * this.scaleRatio / 100),
    //     y: offsetPos.y + (offsetSnap.y * this.scaleRatio / 100)
    //   }
    //   this.initialPos.x += totalOffset.x
    //   this.initialPos.y += totalOffset.y
    // },
    // imgHandler(offset: ICoordinate) {
    //   controlUtils.updateImgPos(this.pageIndex, this.layerIndex, this.config.styles.imgX, this.config.styles.imgY)
    // },
    // moveEnd(e: MouseEvent | TouchEvent) {
    //   if (!this.isDoingGestureAction && !this.isActive) {
    //     this.eventTarget.removeEventListener('touchstart', this.disableTouchEvent)
    //     groupUtils.deselect()
    //     const targetIndex = this.config.styles.zindex - 1
    //     this.setLastSelectedLayerIndex(this.layerIndex)
    //     groupUtils.select(this.pageIndex, [targetIndex])
    //     eventUtils.removePointerEvent('pointerup', this.moveEnd)
    //     eventUtils.removePointerEvent('pointermove', this.moving)
    //     this.isMoved = false
    //     this.isControlling = false
    //     this.setCursorStyle('')
    //     layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
    //       dragging: false
    //     })
    //     this.isDoingGestureAction = false
    //     this.snapUtils.event.emit('clearSnapLines')
    //     return
    //   }

    //   layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moving: false })
    //   this.setMoving(false)

    //   if (this.isActive) {
    //     const posDiff = {
    //       x: Math.abs(this.getLayerPos().x - this.initTranslate.x),
    //       y: Math.abs(this.getLayerPos().y - this.initTranslate.y)
    //     }
    //     const hasActiualMove = Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0
    //     if (hasActiualMove) {
    //       if (this.getLayerType === 'text') {
    //         layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false })
    //       }
    //       this.isMoved = true
    //       // dragging to another page
    //       if (layerUtils.isOutOfBoundary() && this.currHoveredPageIndex !== -1 && this.currHoveredPageIndex !== this.pageIndex) {
    //         const layerNum = this.currSelectedInfo.layers.length
    //         if (layerNum > 1) {
    //           groupUtils.group()
    //         }

    //         const layerTmp = generalUtils.deepCopy(layerUtils.getCurrLayer)

    //         const { top, left } = (this.$refs.body as HTMLElement).getBoundingClientRect()
    //         const targetPageRect = (document.querySelector(`.nu-page-${this.currHoveredPageIndex}`) as HTMLLIElement)?.getBoundingClientRect()
    //         const newX = (left - targetPageRect.left) * (100 / this.scaleRatio)
    //         const newY = (top - targetPageRect.top) * (100 / this.scaleRatio)

    //         layerTmp.styles.x = newX
    //         layerTmp.styles.y = newY
    //         layerUtils.deleteSelectedLayer(false)
    //         layerUtils.addLayers(this.currHoveredPageIndex, [layerTmp])
    //         if (layerNum > 1) {
    //           groupUtils.ungroup()
    //         }
    //         // The layerUtils.addLayers will trigger a record function, so we don't need to record the extra step here
    //       } else {
    //         if (!(this.config as IImage).isHoveringFrame) {
    //           stepsUtils.record()
    //         }
    //       }
    //     } else {
    //       if (this.getLayerType === 'text') {
    //         layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: true })
    //         if (this.movingByControlPoint) {
    //           layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false })
    //         }
    //         if (this.config.contentEditable) {
    //           tiptapUtils.focus({ scrollIntoView: false })
    //         }
    //       }
    //       this.isMoved = false
    //       if (this.inMultiSelectionMode) {
    //         if (this.config.type !== 'tmp') {
    //           let targetIndex = this.layerIndex
    //           if (this.isActive && this.currSelectedInfo.layers.length === 1) {
    //             groupUtils.deselect()
    //             targetIndex = this.config.styles.zindex - 1
    //             this.setLastSelectedLayerIndex(this.layerIndex)
    //           } else if (!this.isActive) {
    //             // already have selected layer
    //             if (this.currSelectedInfo.index >= 0) {
    //               // this if statement is used to prevent select the layer in another page
    //               if (this.pageIndex === pageUtils.currFocusPageIndex) {
    //                 groupUtils.select(this.pageIndex, [targetIndex])
    //               }
    //             } else {
    //               targetIndex = this.config.styles.zindex - 1
    //               this.setLastSelectedLayerIndex(this.layerIndex)
    //               groupUtils.select(this.pageIndex, [targetIndex])
    //             }
    //           }
    //         }
    //       }
    //     }

    //     if (generalUtils.isTouchDevice() && !this.isPointerDownFromSubController && !hasActiualMove) {
    //       /**
    //        * This function is used for mobile-control, as one of the sub-controller is active
    //        * tap at the primary-controller should set the sub-controller to non-active
    //        */
    //       if (this.config.type === LayerType.group) {
    //         const primary = this.config as IGroup
    //         for (let i = 0; i < (this.config as IGroup).layers.length; i++) {
    //           if (primary.layers[i].active) {
    //             if (primary.layers[i].type === LayerType.text) {
    //               layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: false }, i)
    //             }
    //             layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { active: false }, i)
    //           }
    //         }
    //       }
    //     }
    //     this.isPointerDownFromSubController = false
    //     this.isControlling = false
    //     this.setCursorStyle('')
    //     eventUtils.removePointerEvent('pointerup', this.moveEnd)
    //     eventUtils.removePointerEvent('pointermove', this.moving)
    //   }

    //   if (this.isDragging) {
    //     layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
    //       dragging: false
    //     })
    //     this.$emit('isDragging', -1)
    //   }

    //   this.isDoingGestureAction = false
    //   this.snapUtils.event.emit('clearSnapLines')
    // },
    onDrop(e: DragEvent) {
      MouseUtils.onDrop(e, this.pageIndex, this.getLayerPos())
      e.stopPropagation()
    },
    onDropClipper(e: DragEvent) {
      MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos(), this.config.path, this.config.styles)
      e.stopPropagation()
    },
    toggleHighlighter(evt: MouseEvent, pageIndex: number, layerIndex: number, shown: boolean) {
      layerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
    },
    layerStyles(): any {
      const styles = Object.assign(
        CssConveter.convertDefaultStyle(this.config.styles, pageUtils._3dEnabledPageIndex !== this.pageIndex, this.contentScaleRatio),
        {
          // 'pointer-events': imageUtils.isImgControl(this.pageIndex) ? 'none' : 'initial'
          // 'pointer-events': 'none',
          outline: this.outlineStyles(),
          transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial',
          willChange: !this.isSubLayer && this.isDragging ? 'transform' : ''
        }
      )
      switch (this.config.type) {
        case LayerType.text: {
          const textEffectStyles = TextEffectUtils.convertTextEffect(this.config)
          const textBgStyles = textBgUtils.convertTextEffect(this.config.styles)
          Object.assign(
            styles,
            textEffectStyles,
            textBgStyles,
            {
              willChange: 'text-shadow' + (this.isDragging ? ', transform' : ''),
              '--base-stroke': `${textEffectStyles.webkitTextStroke?.split('px')[0] ?? 0}px`
            }
          )
          break
        }
        case LayerType.shape: {
          Object.assign(
            styles,
            { 'mix-blend-mode': this.config.styles.blendMode }
          )
        }
      }
      return styles
    },
    getLayerPos(): { x: number, y: number } {
      return {
        x: this.config.styles.x,
        y: this.config.styles.y
      }
    },
    compensationRatio(): number {
      return 1
    },
    showSpinner(): boolean {
      const { config } = this
      const shadow = this.config.styles.shadow
      const hasShadowSrc = shadow && shadow.srcObj && shadow.srcObj.type && shadow.srcObj.type !== 'upload'
      const isHandleShadow = config.inProcess === 'imgShadow' && !hasShadowSrc
      const isHandleBgRemove = config.inProcess === 'bgRemove'
      return isHandleBgRemove || isHandleShadow
    },
    translateStyles(): { [index: string]: string } {
      const { zindex } = this.config.styles
      const { type } = this.config
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config))
      const transform = isImgType ? `scale(${1 / (this.compensationRatio())})` : `scale(${1 / (this.compensationRatio())})`
      /**
      * If layer type is group, we need to set its transform-style to flat, or its order will be affect by the inner layer.
      * And if type is tmp and its zindex value is larger than 0 (default is 0, isn't 0 means its value has been reassigned before), we need to set it to flat too.
      */
      return {
        transform,
        'transform-style': pageUtils._3dEnabledPageIndex !== this.pageIndex ? 'initial' : type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d'
      }
    },
    scaleStyles(): { [index: string]: string } {
      const { zindex } = this.config.styles
      const { scale, scaleX, scaleY } = this.config.styles
      const { type } = this.config
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config))

      const styles = {
        transform: isImgType ? `scale(${this.compensationRatio()})` : `scale(${scale * (this.contentScaleRatio)}) scale(${this.compensationRatio()}) scaleX(${scaleX}) scaleY(${scaleY})`,
        'transform-style': pageUtils._3dEnabledPageIndex !== this.pageIndex ? 'initial' : type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d'
      }
      return styles
    },
    setCursorStyle(cursor: string) {
      const layer = this.$el as HTMLElement
      if (layer) {
        layer.style.cursor = cursor
        document.body.style.cursor = cursor
      }
    },
    isLocked(): boolean {
      return this.config.locked
    },
    disableTouchEvent(e: TouchEvent) {
      if (generalUtils.isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-layer {
  touch-action: none;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  // content-visibility: auto;
  // box-shadow: inset 0px 0px 0px 7px rgba(136, 136, 136, 0.5);
  width: 100px;
  height: 100px;
  &:focus {
    background-color: rgba(168, 218, 220, 1);
  }
  &__BG {
    position: absolute;
    left: 0;
  }
  &__inProcess {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: setColor(gray-1, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.img-shadow-effect {
  position: absolute;
  pointer-events: none;
  display: block;
  border-radius: 100px/50px;
}

.posAbs {
  position: absolute;
  transform-origin: top left;
  top: 0;
  left: 0;
}

.test-index {
  position: absolute;
  top: 0;
  left: 50%;
  font-size: 18px;
  color: white;
  font-weight: bold;
  text-shadow: 2px 2px 5px setColor(blue-1);
  z-index: 100;
}

.test-angle {
  width: 100%;
  position: absolute;
  bottom: -80px;
  font-size: 18px;
  color: white;
  font-weight: bold;
  text-shadow: 2px 2px 5px setColor(blue-1);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.spiner {
  animation: rotation 0.5s infinite linear;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
