<template lang="pug">
div(:layer-index="`${layerIndex}`"
    class="nu-controller"
    ref="self")
  div(class="nu-controller__line-hint" :style="hintStyles()" v-if="isLineEndMoving")
    | {{ Math.round(hintLength) + ' | ' + Math.round(hintAngle) % 360  + '°' }}
  div(class="nu-controller__object-hint" :style="hintStyles()" v-if="isRotating && !$isTouchDevice()")
    div(class="nu-controller__object-hint__icon")
      svg-icon(iconName="angle"
              iconWidth="12px"
              iconColor="gray-2")
    div(class="nu-controller__object-hint__text")
      span {{ Math.round(hintAngle) % 360 }}
  div(v-if="subLayer && subLayer.config" class="nu-controller__sublayer-container" :style="sizeStyles")
    nu-sub-controller(v-if="subLayer.config.type !== 'image' || !subLayer.config.imgControl"
      :style="subContentStyles"
      class="relative nu-controller__subCtrlContent"
      data-identifier="controller"
      :key="`group-controller-${subLayer.config.id}`"
      :pageIndex="pageIndex"
      :page="page"
      :layerIndex="subLayer.subLayerIdx"
      :primaryLayerIndex="layerIndex"
      :primaryLayer="config"
      :config="getLayerType === 'frame' && !FrameUtils.isImageFrame(subLayer.config) ? frameLayerMapper(subLayer.config) : subLayer.config"
      :type="config.type"
      :primaryLayerZindex="primaryLayerZindex()"
      :isMoved="isMoved"
      :contentScaleRatio="contentScaleRatio")
  div(v-show="isActive && !isImgControl" :style="contentStyles" class="nu-controller__content")
    div(v-show="!isLocked()"
        class="nu-controller__ctrl-points"
        ref="body"
        @contextmenu.prevent
        @click.right.stop="onRightClick")
        div(v-if="config.type === 'text' && config.active" class="text text__wrapper" :style="textWrapperStyle()" draggable="false")
          nu-text-editor(:initText="textHtml" :id="`text-${layerIndex}`"
            class="text__body"
            :style="textBodyStyle()"
            :pageIndex="pageIndex"
            :page="page"
            :layerIndex="layerIndex"
            :config="(config as IText)"
            :subLayerIndex="-1"
            :pageId="page.id"
            :layerId="config.id"
            :subLayerId="''"
            @keydown.left.stop
            @keydown.up.stop
            @keydown.right.stop
            @keydown.down.stop
            @keydown.ctrl.c.exact.stop.self
            @keydown.meta.c.exact.stop.self
            @keydown.ctrl.v.exact.stop.self
            @keydown.meta.v.exact.stop.self
            @keydown.ctrl.x.exact.stop.self
            @keydown.meta.x.exact.stop.self
            @keydown.ctrl.a.exact.stop.self
            @keydown.meta.a.exact.stop.self
            @keydown.ctrl.z.exact.stop.self
            @keydown.meta.z.exact.stop.self
            @keydown.ctrl.shift.z.exact.stop.self
            @keydown.meta.shift.z.exact.stop.self
            @update="handleTextChange"
            @compositionend="handleTextCompositionEnd")
        template(v-if="!$isTouchDevice()")
          div(v-for="(cornerRotater, index) in (!isLine()) ? getCornerRotaters(cornerRotaters) : []"
              v-show="!isMoving"
              class="control-point__corner-rotate"
              :ref="`corner-rotate-${index}`"
              :key="`corner-rotate-${index}`"
              :style="ctrlPointerStyles(cornerRotater.styles, cursorStyles(index, getLayerRotate(), 'cornerRotaters'))"
              @pointerdown.stop="rotateStart($event, index)"
              @touchstart="disableTouchEvent")
        template(v-if="isLine()")
          div(v-for="(end, index) in controlPoints.lineEnds"
              v-show="!isMoving"
              class="control-point"
              :key="index"
              :marker-index="index"
              :style="ctrlPointerStyles(end, {'cursor': 'pointer'})"
              @pointerdown.stop="!$isTouchDevice() ? lineEndMoveStart($event) : null"
              @touchstart="!$isTouchDevice() ? disableTouchEvent($event) : null")
          template(v-if="$isTouchDevice()")
            div(v-for="(end, index) in controlPoints.lineEndTouchAreas"
                v-show="!isMoving"
                class="control-point"
                :key="index"
                :marker-index="index"
                :style="ctrlPointerStyles(end, {'cursor': 'pointer'})"
                @pointerdown.stop="lineEndMoveStart"
                @touchstart="disableTouchEvent")
        div(v-for="(resizer, index) in getResizer(controlPoints)"
            v-show="!isMoving"
            :key="index"
            class="control-point__resize-bar-wrapper")
          div(class="control-point"
              :key="`resizer-${index}`"
              :style="Object.assign(resizerBarStyles(resizer.styles), cursorStyles(resizer.cursor, getLayerRotate()))"
              @pointerdown.prevent.stop="!$isTouchDevice() ? resizeStart($event, resizer.type) : null"
              @touchstart="!$isTouchDevice() ? disableTouchEvent($event) : null")
          div(class="control-point"
              :style="Object.assign(resizerStyles(resizer.styles), cursorStyles(resizer.cursor, getLayerRotate()))"
              @pointerdown.prevent.stop="!$isTouchDevice() ? resizeStart($event, resizer.type) : null"
              @touchstart="!$isTouchDevice() ? disableTouchEvent($event) : null")
        template(v-if="$isTouchDevice()" )
          div(v-for="(resizer, index) in getResizer(controlPoints, false, true)"
              v-show="!isMoving"
              :key="index"
              class="control-point__resize-bar-wrapper")
            div(class="control-point"
                :key="`resizer-touch-${index}`"
                :style="Object.assign(resizerBarStyles(resizer.styles), cursorStyles(resizer.cursor, getLayerRotate()))"
                @pointerdown.prevent.stop="resizeStart($event, resizer.type)"
                @touchstart="disableTouchEvent")
            div(class="control-point"
                :style="Object.assign(resizerStyles(resizer.styles, true), cursorStyles(resizer.cursor, getLayerRotate()))"
                @pointerdown.prevent.stop="resizeStart($event, resizer.type)"
                @touchstart="disableTouchEvent")
        div(v-if="config.type === 'text' && contentEditable && !$isTouchDevice()"
            v-show="!isMoving"
            class="control-point__resize-bar-wrapper")
          div(v-for="(resizer, index) in getResizer(controlPoints, true)"
              class="control-point control-point__move-bar"
              :key="`resizer-text-${index}`"
              :ref="`moveStart-bar_${index}`"
              :style="resizerBarStyles(resizer.styles)")
        div(v-for="(scaler, index) in !isLine() ? getScaler(controlPoints.scalers) : []"
            v-show="!isMoving"
            class="control-point"
            :key="`scaler-${index}`"
            :style="Object.assign(scaler.styles, cursorStyles(scaler.cursor, getLayerRotate()))"
            @pointerdown.prevent.stop="!$isTouchDevice() ? scaleStart($event) : null"
            @touchstart="!$isTouchDevice() ? disableTouchEvent($event) : null")
        template(v-if="$isTouchDevice()")
          div(v-for="(scaler, index) in !isLine() ? getScaler(controlPoints.scalerTouchAreas) : []"
              v-show="!isMoving"
              class="control-point"
              :key="`scaler-touch-${index}`"
              :style="Object.assign(scaler.styles, cursorStyles(scaler.cursor, getLayerRotate()))"
              @pointerdown.prevent.stop="scaleStart"
              @touchstart="disableTouchEvent")
        div(v-show="!isMoving"
            class="control-point__controller-wrapper")
          template(v-if="isLine()")
            template(v-if="!$isTouchDevice()")
              action-icon(iconName="rotate2"
                          iconWidth="20px"
                          theme="shadow"
                          :extraStyle="ctrlPointerStyles(lineControlPointStyles(), { cursor: 'move' })"
                          @action="lineRotateStart")
            div(class="control-point__action-icon")
              div(v-if="$isTouchDevice()"
                  class="control-point__touch-area control-point__mover"
                  ref="moveStart-moverArea")
              div(class="control-point__action shadow control-point__mover"
                  ref="moveStart-mover"
                  :style="ctrlPointerStyles(lineControlPointStyles(), { cursor: 'move' })"
                  @touchstart="disableTouchEvent")
                svg-icon(class="control-point__action-svg"
                  iconName="move2" iconWidth="24px"
                  iconColor="blue-2")
          template(v-else)
            template(v-if="!$isTouchDevice()")
              action-icon(iconName="rotate2"
                          iconWidth="20px"
                          theme="shadow"
                          :extraStyle="ctrlPointerStyles(controlPointStyles(), { cursor: 'move' })"
                          @action="rotateStart")
            div(class="control-point__action-icon")
              div(v-if="$isTouchDevice()"
                  class="control-point__touch-area control-point__mover"
                  ref="moveStart-moverArea")
              div(class="control-point__action shadow control-point__mover"
                  ref="moveStart-mover"
                  :style="ctrlPointerStyles(controlPointStyles(), { cursor: 'move' })"
                  @touchstart="disableTouchEvent")
                svg-icon(class="control-point__action-svg"
                  iconName="move2" iconWidth="24px"
                  iconColor="blue-2")
    action-icon(v-if="isActive && isLocked() && (scaleRatio > 20)"
                class="control-point__bottom-right-icon"
                iconName="lock"
                iconSize="16px"
                iconColor="red"
                theme="shadow"
                :extraStyle="actionIconStyles()"
                @action="MappingUtils.mappingIconAction('lock')")
    template(v-if="$isTouchDevice() && isActive && !isLocked()")
      div(v-show="!isMoving")
        action-icon(class="control-point__top-left-icon"
                    iconName="close"
                    iconSize="18px"
                    theme="border"
                    :extraStyle="ctrlPointerStyles(actionIconStyles(), { cursor: 'pointer' })"
                    @action="MappingUtils.mappingIconAction('trash')")
        action-icon(class="control-point__bottom-left-icon"
                    iconName="rotate2"
                    theme="border"
                    :extraStyle="ctrlPointerStyles(actionIconStyles(), { cursor: 'move' })"
                    @action="(e) => isLine() ? lineRotateStart(e) : rotateStart(e)")
        action-icon(v-if="!tooSmall && !isLine()"
                    class="control-point__bottom-right-icon"
                    iconName="scale"
                    theme="border"
                    :extraStyle="ctrlPointerStyles(actionIconStyles(), cursorStyles(4, getLayerRotate()))"
                    @action="scaleStart")
</template>

<script lang="ts">
import ActionIcon from '@/components/editor/controlPoint/ActionIcon.vue'
import NuTextEditor from '@/components/editor/global/NuTextEditor.vue'
import { IResizer } from '@/interfaces/controller'
import { isTextFill } from '@/interfaces/format'
import { ICoordinate } from '@/interfaces/frame'
import { AllLayerTypes, IFrame, IGroup, IImage, ILayer, IParagraph, IShape, IText } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ILayerInfo, LayerType } from '@/store/types'
import ControlUtils from '@/utils/controlUtils'
import eventUtils from '@/utils/eventUtils'
import FrameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import ImageUtils from '@/utils/imageUtils'
import LayerUtils from '@/utils/layerUtils'
import MappingUtils from '@/utils/mappingUtils'
import mathUtils from '@/utils/mathUtils'
import MouseUtils from '@/utils/mouseUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import shapeUtils from '@/utils/shapeUtils'
import StepsUtils from '@/utils/stepsUtils'
import textPropUtils from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import TextUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

const LAYER_SIZE_MIN = 10
const MIN_THINKNESS = 5
const CONTROLLER_SIZE_MIN = 30
const RESIZER_SHOWN_MIN = 4000

type ICP = ReturnType<typeof ControlUtils.getControlPoints>

export default defineComponent({
  props: {
    config: {
      type: Object,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    page: {
      type: Object as PropType<IPage>,
      required: true
    },
    snapUtils: {
      type: Object,
      required: true
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  emits: ['isDragging', 'setFocus'],
  components: {
    NuTextEditor,
    ActionIcon
  },
  created() {
    this.cornerRotaters = generalUtils.deepCopy(this.controlPoints.cornerRotaters)
    this.cornerRotaterbaffles = generalUtils.deepCopy(this.controlPoints.cornerRotaters)
  },
  data() {
    return {
      MappingUtils,
      FrameUtils,
      controlPoints: ControlUtils.getControlPoints() as ICP,
      resizerProfile: ControlUtils.getResizerProfile(this.config as AllLayerTypes),
      isControlling: false,
      isLineEndMoving: false,
      isRotating: false,
      hintTranslation: { x: 0, y: 0 },
      hintLength: 0,
      hintAngle: 0,
      initialPos: { x: 0, y: 0 },
      currentAbsPos: { x: 0, y: 0 },
      initialRotate: 0,
      initTranslate: { x: 0, y: 0 },
      initSize: { width: 0, height: 0 },
      initCoordinate: { x: 0, y: 0 },
      initReferencePoint: { x: 0, y: 0 },
      initMarkerIndex: 0,
      initCorRadPercentage: -1,
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1, isHorizon: false },
      scale: { scaleX: 1, scaleY: 1 },
      widthLimitSetDuringComposition: false,
      isMoved: false,
      initCornerRotate: -1,
      cornerRotaters: undefined as ReturnType<typeof ControlUtils.getControlPoints>['cornerRotaters'] | undefined,
      cornerRotaterbaffles: undefined as ReturnType<typeof ControlUtils.getControlPoints>['cornerRotaters'] | undefined,
      eventTarget: null as unknown as HTMLElement,
      movingUtils: null as unknown as MovingUtils,
      moveStart: null as any
    }
  },
  mounted() {
    this.setLastSelectedLayerIndex(this.layerIndex)
    if (['text', 'group', 'tmp'].includes(this.getLayerType)) {
      textPropUtils.updateTextPropsState()
    }
    this.addMovingListener()
  },
  beforeUnmount() {
    this.movingUtils && this.movingUtils.removeListener()
    // eventUtils.removePointerEvent('pointerup', this.moveEnd)
    // eventUtils.removePointerEvent('pointermove', this.moving)
    if (this.eventTarget) {
      this.eventTarget.removeEventListener('touchstart', this.disableTouchEvent)
    }
    // window.removeEventListener('scroll', this.scrollUpdate, { capture: true })
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapState('shadow', ['processId', 'handleId']),
    ...mapState(['isMoving', 'currDraggedPhoto']),
    ...mapGetters('imgControl', ['isBgImgCtrl']),
    ...mapGetters({
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currHoveredPageIndex: 'getCurrHoveredPageIndex',
      isProcessImgShadow: 'shadow/isProcessing',
      isUploadImgShadow: 'shadow/isUploading',
      isHandleShadow: 'shadow/isHandling',
      currFunctionPanelType: 'getCurrFunctionPanelType',
      useMobileEditor: 'getUseMobileEditor'
    }),
    subLayer(): any {
      if ([LayerType.group, LayerType.frame].includes(this.config.type)) {
        if (this.config.type === LayerType.group) {
          const subLayerIdx = (this.config as IGroup).layers.findIndex(l => l.active)
          return {
            config: (this.config as IGroup).layers[subLayerIdx],
            subLayerIdx
          }
        } else if ((this.config.type === LayerType.group)) {
          const subLayerIdx = (this.config as IFrame).clips.findIndex(l => l.active)
          return {
            config: (this.config as IFrame).clips[subLayerIdx],
            subLayerIdx
          }
        }
      }
      return undefined
    },
    sizeStyles(): { transform: string, width: string, height: string } {
      const { x, y, width, height, rotate } = ControlUtils.getControllerStyleParameters(this.config.point, this.config.styles, this.isLine(), this.$isTouchDevice(), this.config.size?.[0])
      const page = this.page
      const { bleeds } = pageUtils.getPageSizeWithBleeds(page)
      const _f = this.contentScaleRatio * this.scaleRatio * 0.01
      const finalWidth = width * _f
      const finalHeight = height * _f
      const offsetX = this.$isTouchDevice() ? (CONTROLLER_SIZE_MIN - Math.min(finalWidth, CONTROLLER_SIZE_MIN)) / 2 : 0
      const offsetY = this.$isTouchDevice() ? (CONTROLLER_SIZE_MIN - Math.min(finalHeight, CONTROLLER_SIZE_MIN)) / 2 : 0
      let transform = `translate(${(page.isEnableBleed ? x + bleeds.left : x) * _f - offsetX}px, ${(page.isEnableBleed ? y + bleeds.top : y) * _f - offsetY}px)`
      if (rotate) {
        transform += ` rotate(${rotate}deg)`
      }
      return {
        transform,
        width: `${this.$isTouchDevice() ? Math.max(CONTROLLER_SIZE_MIN, finalWidth) : finalWidth}px`,
        height: `${this.$isTouchDevice() ? Math.max(CONTROLLER_SIZE_MIN, finalHeight) : finalHeight}px`
      }
    },
    subContentStyles(): any {
      const transform = `scale(${this.config.styles.scale})`
      return {
        transform
      }
    },
    getPointerEvents(): any {
      if (this.config.locked) return 'none'
      if (this.config.type === LayerType.text && this.config.active && !this.isMoving) {
        return 'initial'
      } else {
        return 'none'
      }
    },
    contentStyles(): any {
      const pointerEvents = this.getPointerEvents
      return {
        ...this.sizeStyles,
        willChange: this.isDragging() && !this.useMobileEditor ? 'transform' : '',
        ...this.outlineStyles(),
        opacity: this.isImgControl ? 0 : 1,
        pointerEvents,
        /**
         * @Note - set touchAction to none because pointer event will be canceled by touch action
         * So, if we want to control the layer, we need to set it to none.
         * And when the layer is non-active, we need to set it to initial or it make some gesture action failed
         */
        // touchAction: this.isActive ? 'none' : 'initial',
      }
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
    isCurveText(): boolean {
      return this.checkIfCurve(this.config as IText)
    },
    isFlipped(): boolean {
      return this.config.styles.horizontalFlip || this.config.styles.verticalFlip
    },
    isFlipping(): boolean {
      return this.config.isFlipping
    },
    // isTextEditing(): boolean {
    //   // return !this.isControlling && this.contentEditable
    //   // @Test
    //   return !this.isControlling
    // },
    contentEditable(): boolean {
      return this.config.contentEditable
    },
    isDraggingCursor(): boolean {
      return this.config.isDraggingCursor
    },
    isActive(): boolean {
      return this.config.active
    },
    enalble3dTransform(): boolean {
      return this.pageIndex === pageUtils._3dEnabledPageIndex
    },
    getLayerType(): string {
      return this.config.type
    },
    textHtml(): any {
      return tiptapUtils.toJSON(this.config.paragraphs)
    },
    tooSmall(): boolean {
      const { tooShort, tooNarrow } = this.checkLimits(this.$isTouchDevice(), !this.resizerProfile.hasHorizontal && !this.resizerProfile.hasVertical)
      return tooShort || tooNarrow
    }
  },
  watch: {
    contentEditable(newVal) {
      if (this.config.type !== 'text') return
      if (this.config.active) {
        if (!newVal) {
          tiptapUtils.agent(editor => !editor.isDestroyed && editor.commands.selectAll())
        }
        tiptapUtils.agent(editor => {
          editor.setEditable(newVal)
        })
      }
      !this.$isTouchDevice() && StepsUtils.updateHead(LayerUtils.pageIndex, LayerUtils.layerIndex, { contentEditable: newVal })
    }
  },
  unmounted() {
    /**
     * While image is setted to frame, these event-listener should be removed
     */
    if (this.getLayerType === 'text') {
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { shown: false, contentEditable: false, isTyping: false })
    }
    // eventUtils.removePointerEvent('pointerup', this.moveEnd)
    // eventUtils.removePointerEvent('pointermove', this.moving)
    this.isControlling = false
    this.setCursorStyle('')
    /**
     * the unmounted function may be triggered after the page is destroy
     * this would lead to the wrong pageIndex
     */
    const pageIndex = pageUtils.getPages.findIndex(p => p.layers.some(l => l.id === this.config.id))
    if (pageIndex !== -1) {
      LayerUtils.updateLayerProps(pageIndex, this.layerIndex, { moving: false })
    }
    this.setMoving(false)

    popupUtils.closePopup()
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened',
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      setMoving: 'SET_moving',
      replaceLayer: 'REPLACE_layer',
      setImgConfig: 'imgControl/SET_CONFIG',
      setBgConfig: 'imgControl/SET_BG_CONFIG'
    }),
    checkLimits(hasActionIcon = false, noResizer = false): { tooShort: boolean, tooNarrow: boolean } {
      const ACTION_ICON_WIDTH = 24
      const RESCALER_WIDTH = 12
      let limit
      if (noResizer) {
        if (hasActionIcon) {
          limit = 3000 // defined in Figma
        } else {
          limit = RESCALER_WIDTH * 100
        }
      } else {
        if (hasActionIcon) {
          limit = RESIZER_SHOWN_MIN
        } else {
          limit = RESIZER_SHOWN_MIN - (ACTION_ICON_WIDTH - RESCALER_WIDTH) * 100
        }
      }
      const totalScaleRatio = this.scaleRatio * this.contentScaleRatio
      return {
        tooShort: this.getLayerHeight() * totalScaleRatio < limit,
        tooNarrow: this.getLayerWidth() * totalScaleRatio < limit
      }
    },
    addMovingListener() {
      const body = (this.$refs.body as HTMLElement[])[0]
      const lineMover = this.$refs.lineMover as HTMLElement
      const props = this.$props
      const layerInfo = {} as ILayerInfo
      Object.defineProperty(layerInfo, 'pageIndex', {
        get() {
          return props.pageIndex
        }
      })
      Object.defineProperty(layerInfo, 'layerIndex', {
        get() {
          return props.layerIndex
        }
      })
      Object.defineProperty(layerInfo, 'subLayerIdx', {
        get() {
          return -1
        }
      })
      const _config = { config: this.config }
      Object.defineProperty(_config, 'config', {
        get() {
          return props.config
        }
      })

      const data = {
        _config: _config,
        component: this,
        snapUtils: this.snapUtils,
        layerInfo,
        body
      }

      this.movingUtils = new MovingUtils(data as any)
      this.moveStart = this.movingUtils.moveStart.bind(this.movingUtils)
      Object.keys(this.$refs)
        .forEach((k) => {
          if (k.includes('moveStart')) {
            const ref = this.$refs[k]
            if (ref instanceof Array) {
              if (ref[0].$el) {
                ref[0].$el.addEventListener('pointerdown', this.moveStart)
              } else {
                ref[0].addEventListener('pointerdown', this.moveStart)
              }
            } else {
              const refElement = ref as any
              if (refElement.$el) {
                refElement.$el.addEventListener('pointerdown', this.moveStart)
              } else {
                refElement.addEventListener('pointerdown', this.moveStart)
              }
            }
          }
        })
    },
    resizerBarStyles(resizer: IResizer) {
      const resizerStyle = { ...resizer }
      const width = parseFloat(resizerStyle.width.replace('px', ''))
      const height = parseFloat(resizerStyle.height.replace('px', ''))
      const isHorizon = width > height
      const scalerOffset = this.$isTouchDevice() ? 36 : 20
      const HW = {
        // Get the widht/height of the controller for resizer-bar and minus the scaler size
        width: isHorizon ? `${(this.getLayerWidth() - scalerOffset) * this.contentScaleRatio * this.scaleRatio * 0.01}px` : `${width * this.contentScaleRatio * this.scaleRatio * 0.01}px`,
        height: !isHorizon ? `${(this.getLayerHeight() - scalerOffset) * this.contentScaleRatio * this.scaleRatio * 0.01}px` : `${height * this.contentScaleRatio * this.scaleRatio * 0.01}px`,
        opacity: 0
      }
      return Object.assign(resizerStyle, HW)
    },
    resizerStyles(resizer: IResizer, isTouchArea = false) {
      const resizerStyle = { ...resizer }
      const { tooShort, tooNarrow } = this.checkLimits()
      const tooSmall = this.getLayerType === 'text'
        ? (this.config.styles.writingMode.includes('vertical') ? tooNarrow : tooShort) : false
      const width = parseFloat(resizerStyle.width.replace('px', ''))
      const height = parseFloat(resizerStyle.height.replace('px', ''))
      const scale = isTouchArea ? 2 : 1

      const isHorizon = width > height
      const sizeForWidth = this.getLayerWidth() * this.scaleRatio / 100 * this.contentScaleRatio - 10
      const sizeForHeight = this.getLayerHeight() * this.scaleRatio / 100 * this.contentScaleRatio - 10

      const HW = {
        // Get the widht/height of the controller for resizer-bar and minus the scaler size
        width: isHorizon && tooSmall ? `${sizeForWidth * scale}px`
          : resizerStyle.width,
        height: !isHorizon && tooSmall ? `${sizeForHeight * scale}px`
          : resizerStyle.height
      }
      return Object.assign(resizerStyle, HW)
    },
    getResizer(controlPoints: ICP, textMoveBar = false, isTouchArea = false) {
      let resizers = isTouchArea ? controlPoints.resizerTouchAreas : controlPoints.resizers
      resizers = textMoveBar
        ? resizers.slice(this.resizerProfile.moveBarStart, this.resizerProfile.moveBarEnd)
        : resizers.slice(this.resizerProfile.start, this.resizerProfile.end)
      const isMobile = this.$isTouchDevice()
      const { tooShort, tooNarrow } = this.checkLimits(isMobile)
      if (this.getLayerType === 'text') {
        if (!textMoveBar && !textShapeUtils.isCurvedText(this.config.styles.textShape)) {
          resizers = this.config.styles.writingMode.includes('vertical') ? (
            tooNarrow ? (isMobile ? [] : resizers.slice(1, 2)) : resizers
          ) : (
            tooShort ? (isMobile ? [] : resizers.slice(0, 1)) : resizers
          )
        }
      } else {
        if (tooShort) {
          resizers = resizers.filter(r => r.type !== 'H')
        }
        if (tooNarrow) {
          resizers = resizers.filter(r => r.type !== 'V')
        }
      }
      return resizers
    },
    getScaler(scalers: any) {
      return this.tooSmall ? scalers.slice(2, 3)
        : (this.$isTouchDevice() ? scalers.slice(1, 2) : scalers)
    },
    getCornerRotaters(scalers: any) {
      return (this.tooSmall) ? scalers.slice(2, 3) : scalers
    },
    textWrapperStyle() {
      return {
        width: `${this.getLayerWidth() / this.getLayerScale()}px`,
        height: `${this.getLayerHeight() / this.getLayerScale()}px`,
        opacity: `${this.config.styles.opacity / 100}`,
        transform: `scaleX(${this.getLayerScale() * this.contentScaleRatio * this.scaleRatio * 0.01}) scaleY(${this.getLayerScale() * this.contentScaleRatio * this.scaleRatio * 0.01}) translate(-50%, -50%)`,
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode,
        ...(this.isDraggingCursor ? { zIndex: 100 } : {})
      }
    },
    textBodyStyle() {
      const checkTextFill = isTextFill(this.config.styles.textFill)
      // To fix tiptap focus issue that opacity 0 need one more tap to focus, set opacity to 0.0001.
      const opacity = (this.isCurveText || this.isFlipped || this.isFlipping || checkTextFill) &&
        !this.contentEditable ? 0.0001 : 1
      return {
        width: '100%',
        height: '100%',
        opacity,
      }
    },
    primaryLayerZindex() {
      return (this.config as ILayer).styles.zindex
    },
    lineControlPointStyles() {
      const { angle } = shapeUtils.lineDimension(this.config.point)
      const degree = angle / Math.PI * 180
      return {
        transform: `rotate(${-degree}deg)`
      }
    },
    controlPointStyles() {
      return {
        transform: `rotate(${-this.config.styles.rotate}deg)`
      }
    },
    outlineStyles(): { outline: string, outlineOffset: string } {
      const outlineColor = (() => {
        if (this.getLayerType === 'frame' && this.config.clips[0].isFrameImg) {
          return '#F10994'
        } else if (this.isLocked()) {
          return '#EB5757'
        } else {
          return '#7190CC'
        }
      })()

      let outline = ''

      if ((this.isLine() && !this.$isTouchDevice()) || (this.isMoving && this.currSelectedInfo.index !== this.layerIndex)) {
        outline = 'none'
      } else if (this.isShown() || this.isActive) {
        outline = `2px solid ${outlineColor}`
      } else {
        outline = 'none'
      }
      return {
        outline,
        outlineOffset: '-1px'
      }
    },
    hintStyles() {
      return `transform: translate(calc(${this.hintTranslation.x}px - 100%), ${this.hintTranslation.y}px)`
    },
    scaleStart(event: MouseEvent | TouchEvent | PointerEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }

      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.isControlling = true

      this.initSize = {
        width: this.getLayerWidth(),
        height: this.getLayerHeight()
      }
      const rect = (this.$refs.body as HTMLElement).getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)
      this.initTranslate = this.getLayerPos()
      if (this.tooSmall) {
        this.control.xSign = 1
        this.control.ySign = 1
      } else {
        const angleInRad = this.getLayerRotate() * Math.PI / 180
        const vect = MouseUtils.getMouseRelPoint(event, this.center)

        // Get client point as no rotation
        const clientP = ControlUtils.getNoRotationPos(vect, this.center, angleInRad)

        this.control.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
        this.control.ySign = (clientP.y - this.center.y > 0) ? 1 : -1
      }

      if (this.config.category === 'E') {
        this.initCorRadPercentage = ControlUtils.getCorRadPercentage(this.config.vSize, this.config.size, this.config.shapeType)
      }
      const body = this.$refs.body as HTMLElement
      body.classList.remove('hover')
      this.currCursorStyling(event)
      eventUtils.addPointerEvent('pointermove', this.scaling)
      eventUtils.addPointerEvent('pointerup', this.scaleEnd)
      window.addEventListener('keyup', this.handleScaleOffset)
      window.addEventListener('keydown', this.handleScaleOffset)
    },
    scaling(event: MouseEvent | TouchEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      if (generalUtils.getEventType(event) !== 'touch') {
        event.preventDefault()
      }
      const altPressed = generalUtils.exact([event.altKey])
      const isCenterBased = altPressed || this.$isTouchDevice()

      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }

      let width = this.getLayerWidth()
      let height = this.getLayerHeight()

      const angleInRad = this.getLayerRotate() * Math.PI / 180
      this.currentAbsPos = MouseUtils.getMouseAbsPoint(event)

      const tmp = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const diff = mathUtils.getActualMoveOffset(tmp.x, tmp.y, this.$isTouchDevice() ? 1 / this.contentScaleRatio : undefined)
      const [dx, dy] = [diff.offsetX, diff.offsetY]

      /**
       * @param {number} offsetMultiplier - if we press alt, we need to scale from center, and then make offsetWidth and offsetHeight become twice large
       */
      const offsetMultiplier = isCenterBased ? 2 : 1
      const offsetWidth = this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad)) * offsetMultiplier
      const offsetHeight = this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad)) * offsetMultiplier
      if ((offsetWidth === 0 || offsetHeight === 0)) {
        return
      }

      const initWidth = this.initSize.width
      const initHeight = this.initSize.height
      if ((width + offsetWidth) / initWidth >= (height + offsetHeight) / initHeight) {
        width = offsetWidth + initWidth
        height = width * initHeight / initWidth
      } else {
        height = offsetHeight + initHeight
        width = height * initWidth / initHeight
      }
      /** The minimum size of the layer
       *  */
      if (width <= LAYER_SIZE_MIN) {
        width = LAYER_SIZE_MIN
        height = LAYER_SIZE_MIN * this.getLayerHeight() / this.getLayerWidth()
      } else if (height <= LAYER_SIZE_MIN) {
        width = LAYER_SIZE_MIN * this.getLayerWidth() / this.getLayerHeight()
        height = LAYER_SIZE_MIN
      }

      const offsetSize = {
        width: width - initWidth,
        height: height - initHeight
      }
      const initData = {
        xSign: this.control.xSign,
        ySign: this.control.ySign,
        x: this.initTranslate.x,
        y: this.initTranslate.y,
        angle: angleInRad
      }
      const trans = ControlUtils.getTranslateCompensation(initData, offsetSize)

      const ratio = {
        width: width / (this.getLayerWidth() / this.getLayerScale()),
        height: height / (this.getLayerHeight() / this.getLayerScale())
      }

      let scale = Math.max(ratio.width, ratio.height)
      switch (this.getLayerType) {
        case 'image': {
          const { imgWidth, imgHeight, imgX, imgY } = (this.config as IImage).styles
          const scaleForImg = Math.max(width / this.getLayerWidth(), height / this.getLayerHeight())
          ImageUtils.updateImgSize(this.pageIndex, this.layerIndex, imgWidth * scaleForImg, imgHeight * scaleForImg)
          ImageUtils.updateImgPos(this.pageIndex, this.layerIndex, imgX * scaleForImg, imgY * scaleForImg)
          break
        }
        case 'text':
          if (this.config.widthLimit !== -1) {
            ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
              widthLimit: (this.config as IText).styles.writingMode.includes('vertical') ? height : width
            })
          }
          break
        case 'frame': {
          if (FrameUtils.isImageFrame(this.config as IFrame)) {
            let { imgWidth, imgHeight, imgX, imgY } = (this.config as IFrame).clips[0].styles
            const _scale = scale / this.config.styles.scale
            imgWidth *= _scale
            imgHeight *= _scale
            imgY *= _scale
            imgX *= _scale

            LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, {
              initWidth: width,
              initHeight: height
            })
            FrameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, 0, {
              width: width,
              height: height,
              imgWidth,
              imgHeight,
              imgX,
              imgY
            })
            // scale = 1
          }
          break
        }
        case 'shape':
          if (this.config.category === 'E') {
            scale = 1
            ControlUtils.updateShapeVSize(this.pageIndex, this.layerIndex, [width, height])
            const corRad = ControlUtils.getCorRadValue([width, height], this.initCorRadPercentage, this.config.shapeType)
            ControlUtils.updateShapeCorRad(this.pageIndex, this.layerIndex, this.config.size, corRad)
          }
          break
        case 'tmp':
        case 'group':
          (this.config as IGroup).layers.forEach((layer, index) => {
            if (layer.type === 'shape') {
              layer = layer as IShape
              const scaleRatio = scale / this.getLayerScale()
              if (layer.category === 'D') {
                const [lineWidth] = layer.size ?? [1]
                LayerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, index, {
                  size: [lineWidth / scaleRatio]
                })
                const trans = shapeUtils.getTranslateCompensationForLineWidth(layer.point ?? [], layer.styles, lineWidth, lineWidth / scaleRatio)
                LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, index, {
                  x: trans.x,
                  y: trans.y
                })
              }
              if (layer.category === 'E') {
                const [lineWidth, corRad] = layer.size ?? [1, 0]
                LayerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, index, {
                  size: [lineWidth / scaleRatio, corRad]
                })
              }
            }
          })
          break
      }
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
      textPropUtils.updateTextPropState('fontSize', true)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
      // scale from center
      if (isCenterBased) {
        const currCenter = mathUtils.getCenter(this.config.styles)
        const initCenter = mathUtils.getCenter(Object.assign({}, this.initSize, this.initTranslate))
        const scaleOffset = {
          x: (initCenter.x - currCenter.x),
          y: (initCenter.y - currCenter.y)
        }
        ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x + scaleOffset.x, trans.y + scaleOffset.y)
      }
    },
    scaleEnd(event: PointerEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      this.isControlling = false
      // StepsUtils.record()
      if (['text', 'group', 'tmp'].includes(this.getLayerType)) {
        const newLayer = TextUtils.resetScaleForLayer(this.config as AllLayerTypes)
        LayerUtils.replaceLayer(this.pageIndex, this.layerIndex, newLayer)
        if (newLayer.type === 'tmp') {
          groupUtils.set(this.pageIndex, this.layerIndex, newLayer.layers)
        } else {
          groupUtils.set(this.pageIndex, this.layerIndex, [newLayer])
        }
        tiptapUtils.updateHtml()
      }
      StepsUtils.asyncRecord()

      this.setCursorStyle('')
      eventUtils.removePointerEvent('pointermove', this.scaling)
      eventUtils.removePointerEvent('pointerup', this.scaleEnd)
      window.removeEventListener('keyup', this.handleScaleOffset)
      window.removeEventListener('keydown', this.handleScaleOffset)
      this.$emit('setFocus')
      this.snapUtils.event.emit('clearSnapLines')
    },
    lineEndMoveStart(event: MouseEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.isControlling = true
      this.isLineEndMoving = true

      const quadrant = shapeUtils.getLineQuadrant(this.config.point)
      const markerIndex = Number((event.target as HTMLElement).getAttribute('marker-index'))

      this.initMarkerIndex = markerIndex
      this.initCoordinate = { x: this.config.point[markerIndex * 2], y: this.config.point[markerIndex * 2 + 1] }

      const { angle, yDiff, xDiff } = shapeUtils.lineDimension(this.config.point)
      const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
      const mouseActualPos = mathUtils.getActualMoveOffset(mousePos.x, mousePos.y, 1)
      this.hintTranslation = { x: mouseActualPos.offsetX - 35, y: mouseActualPos.offsetY + 35 }
      this.hintAngle = ((angle / Math.PI * 180 + (1 - markerIndex) * 180) + 360) % 360
      this.hintLength = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2))

      const quadrantByMarkerIndex = (markerIndex === 0) ? (quadrant - 1 + 2) % 4 + 1 : quadrant
      this.initReferencePoint = ControlUtils.getAbsPointByQuadrant(this.config.point, this.config.styles, this.config.size[0], quadrantByMarkerIndex)

      this.currCursorStyling(event)
      eventUtils.addPointerEvent('pointermove', this.lineEndMoving)
      eventUtils.addPointerEvent('pointerup', this.lineEndMoveEnd)
    },
    lineEndMoving(event: MouseEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      event.preventDefault()
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }

      const tmp = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const diff = mathUtils.getActualMoveOffset(tmp.x, tmp.y)
      const [dx, dy] = [diff.offsetX / this.contentScaleRatio, diff.offsetY / this.contentScaleRatio]
      const markerIndex = this.initMarkerIndex

      const copiedPoint: number[] = Array.from(this.config.point)
      copiedPoint[markerIndex * 2] = this.initCoordinate.x + dx
      copiedPoint[markerIndex * 2 + 1] = this.initCoordinate.y + dy
      const { newPoint, lineLength, lineAngle } = this.snapUtils.calLineAngleSnap(markerIndex, copiedPoint, event.shiftKey)

      const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
      const mouseActualPos = mathUtils.getActualMoveOffset(mousePos.x, mousePos.y, 1)
      this.hintTranslation = { x: mouseActualPos.offsetX - 35, y: mouseActualPos.offsetY + 35 }
      this.hintLength = lineLength
      this.hintAngle = lineAngle

      const trans = ControlUtils.getTranslateCompensationForLine(markerIndex, this.initReferencePoint, this.config.styles, (this.config.size ?? [1])[0], newPoint)

      ControlUtils.updateShapeLinePoint(this.pageIndex, this.layerIndex, newPoint)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
    },
    lineEndMoveEnd(event: PointerEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      this.isControlling = false
      this.isLineEndMoving = false
      StepsUtils.asyncRecord()
      // StepsUtils.record()

      this.setCursorStyle('')
      eventUtils.removePointerEvent('pointermove', this.lineEndMoving)
      eventUtils.removePointerEvent('pointerup', this.lineEndMoveEnd)
      this.$emit('setFocus')
      this.snapUtils.event.emit('clearSnapLines')
    },
    resizeStart(event: MouseEvent, type: string) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }

      this.isControlling = true
      const body = this.$refs.body as HTMLElement
      body.classList.remove('hover')
      this.currCursorStyling(event)

      const rect = body.getBoundingClientRect()
      const center = ControlUtils.getRectCenter(rect)

      this.initSize = {
        width: this.getLayerWidth(),
        height: this.getLayerHeight()
      }
      this.initTranslate = this.getLayerPos()
      this.initialPos = { x: event.clientX, y: event.clientY }

      const vect = MouseUtils.getMouseRelPoint(event, center)
      const angeleInRad = this.getLayerRotate() * Math.PI / 180
      const clientP = ControlUtils.getNoRotationPos(vect, center, angeleInRad)
      this.control.xSign = (clientP.x - center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - center.y > 0) ? 1 : -1

      this.control.isHorizon = type === 'H'
      // this.control.isHorizon = ControlUtils.dirHandler(clientP, rect)

      eventUtils.addPointerEvent('pointermove', this.resizing)
      eventUtils.addPointerEvent('pointerup', this.resizeEnd)
      window.addEventListener('keyup', this.handleScaleOffset)
      window.addEventListener('keydown', this.handleScaleOffset)
      switch (this.getLayerType) {
        case 'shape':
          if (this.config.category === 'B') {
            this.scale = {
              scaleX: this.config.styles.scaleX,
              scaleY: this.config.styles.scaleY
            }
          }
          break
        case 'image':
          ImageUtils.initImgSize = {
            width: this.config.styles.imgWidth,
            height: this.config.styles.imgHeight
          }
          ImageUtils.initImgPos = {
            x: this.config.styles.imgX,
            y: this.config.styles.imgY
          }
          ImageUtils.initLayerSize = this.initSize
          ImageUtils.xSign = (clientP.x - center.x > 0) ? 1 : -1
          ImageUtils.ySign = (clientP.y - center.y > 0) ? 1 : -1
          ImageUtils.isHorizon = this.control.isHorizon
          break
        case 'frame':
          /**
           * only plain-rectangular-frame would have resizer
           * the following logic of resizing is only for this kind of frame
           */
          ImageUtils.initImgSize = {
            width: (this.config as IFrame).clips[0].styles.imgWidth,
            height: (this.config as IFrame).clips[0].styles.imgHeight
          }
          ImageUtils.initImgPos = {
            x: (this.config as IFrame).clips[0].styles.imgX,
            y: (this.config as IFrame).clips[0].styles.imgY
          }
          ImageUtils.initLayerSize = this.initSize
          ImageUtils.xSign = (clientP.x - center.x > 0) ? 1 : -1
          ImageUtils.ySign = (clientP.y - center.y > 0) ? 1 : -1
          ImageUtils.isHorizon = this.control.isHorizon
      }
    },
    resizing(event: MouseEvent | TouchEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      event.preventDefault()
      const altPressed = generalUtils.exact([event.altKey])
      const isCenterBased = altPressed || this.$isTouchDevice()

      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }
      let width = this.getLayerWidth()
      let height = this.getLayerHeight()
      const initWidth = this.initSize.width
      const initHeight = this.initSize.height

      const angleInRad = this.getLayerRotate() * Math.PI / 180
      const diff = MouseUtils.getMouseRelPoint(event, this.initialPos)
      this.currentAbsPos = MouseUtils.getMouseAbsPoint(event)

      const _f = (this.$isTouchDevice() ? 1 / this.contentScaleRatio : 1 / (this.scaleRatio * 0.01))
      const [dx, dy] = [diff.x * _f, diff.y * _f]

      const offsetMultiplier = isCenterBased ? 2 : 1
      let offsetWidth = this.control.isHorizon ? this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad)) * offsetMultiplier : 0
      let offsetHeight = this.control.isHorizon ? 0 : this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad)) * offsetMultiplier
      if (offsetWidth === 0 && offsetHeight === 0) return

      width = Math.max(MIN_THINKNESS, offsetWidth + initWidth)
      height = Math.max(MIN_THINKNESS, offsetHeight + initHeight)

      const offsetSize = {
        width: width - initWidth,
        height: height - initHeight
      }

      let scale = this.getLayerScale()
      switch (this.getLayerType) {
        case 'image':
          width === MIN_THINKNESS && (offsetWidth = MIN_THINKNESS - initWidth)
          height === MIN_THINKNESS && (offsetHeight = MIN_THINKNESS - initHeight)
          ImageUtils.imgResizeHandler(width, height, offsetWidth, offsetHeight)
          scale = 1
          break
        case 'shape': {
          [width, height] = ControlUtils.resizeShapeHandler(this.config as IShape, this.scale, this.initSize, width, height)
          if (this.config.category === 'E') {
            width === MIN_THINKNESS && (width = MIN_THINKNESS * 4)
            height === MIN_THINKNESS && (height = MIN_THINKNESS * 4)
            ControlUtils.updateShapeVSize(this.pageIndex, this.layerIndex, [width, height])
          }
          break
        }
        case 'text':
          /**
           * When the size is very close to the text-wrapping boundary, the getBoundingClientRect() result in textResizeHandler may be
           * wrong. That maybe results from the tiny delay between the size-update by setting layerSize and the function call. Thus,
           * use computed size given widthlimit instead of querying the DOM object property to achieve higher consistency.
           */
          if (this.config.styles.writingMode.includes('vertical')) {
            ControlUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { widthLimit: height })
            width = TextUtils.getTextHW(this.config as IText, height).width
          } else {
            ControlUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { widthLimit: width })
            height = TextUtils.getTextHW(this.config as IText, width).height
          }
          /**
           * below make the anchor-point always pinned at the top-left or top-right
           */
          if (this.config.styles.writingMode.includes('vertical')) {
            this.control.xSign = 1
          } else {
            this.control.ySign = 1
          }
          break
        case 'frame': {
          /**
           * only plain-rectangular-frame would have resizer
           * the follow logic is only for this kind of frame.
           */
          FrameUtils.frameResizeHandler(width, height, offsetWidth, offsetHeight)
        }
      }

      const initData = {
        xSign: this.control.xSign,
        ySign: this.control.ySign,
        x: this.initTranslate.x,
        y: this.initTranslate.y,
        angle: angleInRad
      }
      offsetSize.height = height - initHeight
      offsetSize.width = width - initWidth
      const trans = ControlUtils.getTranslateCompensation(initData, offsetSize)

      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
      if (isCenterBased) {
        const currCenter = mathUtils.getCenter(this.config.styles)
        const initCenter = mathUtils.getCenter(Object.assign({}, this.initSize, this.initTranslate))
        const scaleOffset = {
          x: (initCenter.x - currCenter.x),
          y: (initCenter.y - currCenter.y)
        }
        ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x + scaleOffset.x, trans.y + scaleOffset.y)
      }
    },
    resizeEnd(event: PointerEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      ImageUtils.imgBuffer = {
        width: 0,
        height: 0,
        x: 0,
        y: 0
      }
      if (this.config.type === 'shape' && this.config.category === 'E') {
        ControlUtils.updateShapeCorRad(this.pageIndex, this.layerIndex, this.config.size, shapeUtils.clipCorRad(this.config.shapeType, this.config.vSize, this.config.size))
      }
      this.isControlling = false
      // StepsUtils.record()
      StepsUtils.asyncRecord()

      this.setCursorStyle('')
      eventUtils.removePointerEvent('pointermove', this.resizing)
      eventUtils.removePointerEvent('pointerup', this.resizeEnd)
      window.removeEventListener('keyup', this.handleScaleOffset)
      window.removeEventListener('keydown', this.handleScaleOffset)
      this.$emit('setFocus')
    },
    rotateStart(event: MouseEvent | PointerEvent, index = -1) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      this.setCursorStyle((event.target as HTMLElement).style.cursor || 'move')
      if (this.tooSmall) {
        index = 2
      }
      this.initCornerRotate = index * 2
      this.isRotating = true
      this.isControlling = true

      const body = this.$refs.body as HTMLElement
      const rect = body.getBoundingClientRect()
      this.center = {
        x: rect.left + rect.width / 2 - window.pageXOffset,
        y: rect.top + rect.height / 2 - window.pageYOffset
      }

      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initialRotate = this.getLayerRotate()

      const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
      const mouseActualPos = mathUtils.getActualMoveOffset(mousePos.x, mousePos.y, 1)
      this.hintTranslation = { x: mouseActualPos.offsetX - 35, y: mouseActualPos.offsetY + 35 }
      this.hintAngle = (this.initialRotate + 360) % 360

      eventUtils.addPointerEvent('pointermove', this.rotating)
      eventUtils.addPointerEvent('pointerup', this.rotateEnd)
    },
    rotating(event: MouseEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }
      const vectA = {
        x: this.initialPos.x - this.center.x,
        y: this.initialPos.y - this.center.y
      }
      const vectB = {
        x: event.clientX - this.center.x,
        y: event.clientY - this.center.y
      }
      const lineA = ControlUtils.getLength(vectA)
      const lineB = ControlUtils.getLength(vectB)
      const ADotB = vectA.x * vectB.x + vectA.y * vectB.y

      let angle = Math.round(Math.acos(ADotB / (lineA * lineB)) * 180 / Math.PI)
      if (angle) {
        const ACrosB = vectB.y * vectA.x - vectB.x * vectA.y
        if (ACrosB < 0) {
          angle *= -1
        }
        angle += this.initialRotate % 360
        angle = this.snapUtils.calAngleSnap((angle + 360) % 360, event.shiftKey)

        let rotateAngle = angle
        if (rotateAngle > 180) {
          rotateAngle = rotateAngle - 360
        }

        const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
        const mouseActualPos = mathUtils.getActualMoveOffset(mousePos.x, mousePos.y, 1)
        this.hintTranslation = { x: mouseActualPos.offsetX - 35, y: mouseActualPos.offsetY + 35 }
        this.hintAngle = rotateAngle
        ControlUtils.updateLayerRotate(this.pageIndex, this.layerIndex, angle)

        const _ang = angle > 0 ? angle : 360 + angle
        let index = this.initCornerRotate
        if (_ang > 22.5) {
          index += Math.floor((_ang - 22.5) / 45) + 1
        }
        this.setCursorStyle(ControlUtils.getCornerRataterMap[(index + 8) % 8])
      }
    },
    rotateEnd(event: PointerEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      this.isRotating = false
      this.isControlling = false
      this.initCornerRotate = -1
      // StepsUtils.record()
      StepsUtils.asyncRecord()
      this.setCursorStyle('')
      eventUtils.removePointerEvent('pointermove', this.rotating)
      eventUtils.removePointerEvent('pointerup', this.rotateEnd)
      this.$emit('setFocus')
    },
    lineRotateStart(event: MouseEvent) {
      this.setCursorStyle('move')
      this.isRotating = true
      this.isControlling = true

      const body = this.$refs.body as HTMLElement
      const rect = body.getBoundingClientRect()
      this.center = {
        x: rect.left + rect.width / 2 - window.pageXOffset,
        y: rect.top + rect.height / 2 - window.pageYOffset
      }

      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      const { angle } = shapeUtils.lineDimension(this.config.point)
      this.initialRotate = angle / Math.PI * 180

      const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
      const mouseActualPos = mathUtils.getActualMoveOffset(mousePos.x, mousePos.y, 1)
      this.hintTranslation = { x: mouseActualPos.offsetX - 35, y: mouseActualPos.offsetY + 35 }
      this.hintAngle = (this.initialRotate + 360) % 360

      eventUtils.addPointerEvent('pointermove', this.lineRotating)
      eventUtils.addPointerEvent('pointerup', this.lineRotateEnd)
    },
    lineRotating(event: MouseEvent) {
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }
      const vectA = {
        x: this.initialPos.x - this.center.x,
        y: this.initialPos.y - this.center.y
      }
      const vectB = {
        x: event.clientX - this.center.x,
        y: event.clientY - this.center.y
      }
      const lineA = ControlUtils.getLength(vectA)
      const lineB = ControlUtils.getLength(vectB)
      const ADotB = vectA.x * vectB.x + vectA.y * vectB.y

      let angle = Math.round(Math.acos(ADotB / (lineA * lineB)) * 180 / Math.PI)
      if (angle) {
        if (vectA.y * vectB.x - vectA.x * vectB.y > 0) {
          angle *= -1
        }
        angle += this.initialRotate % 360
        angle = this.snapUtils.calAngleSnap((angle + 360) % 360, event.shiftKey)

        const { point, dx, dy } = shapeUtils.lineCenterRotate(this.config.point, angle, this.config.size?.[0] ?? 1, false)

        const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
        const mouseActualPos = mathUtils.getActualMoveOffset(mousePos.x, mousePos.y, 1)
        this.hintTranslation = { x: mouseActualPos.offsetX - 35, y: mouseActualPos.offsetY + 35 }
        this.hintAngle = angle

        ControlUtils.updateShapeLinePoint(this.pageIndex, this.layerIndex, point)
        ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, this.config.styles.x + dx, this.config.styles.y + dy)
      }
    },
    lineRotateEnd() {
      this.isRotating = false
      this.isControlling = false
      // StepsUtils.record()
      StepsUtils.asyncRecord()
      this.setCursorStyle('')
      eventUtils.removePointerEvent('pointermove', this.lineRotating)
      eventUtils.removePointerEvent('pointerup', this.lineRotateEnd)
      this.$emit('setFocus')
    },
    ctrlPointerStyles(ctrlPointerStyles: { [key: string]: string | number | undefined }, attrs?: { [key: string]: string | number }) {
      return {
        ...ctrlPointerStyles,
        ...attrs
      }
    },
    cursorStyles(index: number | string, rotateAngle: number, type = 'cursors') {
      if (this.isControlling) return { cursor: 'initial' }
      if (typeof index === 'number') {
        if (type === 'cornerRotaters') {
          if (this.tooSmall) {
            index = 2
          }
          index = index * 2
          if (rotateAngle > 180) {
            rotateAngle = rotateAngle - 360
          }
          let cursorIndex = index
          if (rotateAngle >= 22.5) {
            cursorIndex++
            cursorIndex += Math.floor((rotateAngle - 22.5) / 45)
            if (cursorIndex > 7) {
              cursorIndex = cursorIndex - 8
            }
          } else if (rotateAngle <= -22.5) {
            cursorIndex--
            cursorIndex -= Math.floor((-rotateAngle - 22.5) / 45)
            if (cursorIndex < 0) {
              cursorIndex = 8 + cursorIndex
            }
          }
          return { cursor: ControlUtils.getCornerRataterMap[cursorIndex] }
        } else {
          switch (this.getLayerType) {
            case 'text':
              if (this.config.styles.writingMode.includes('vertical')) index += 4
              break
            case 'shape':
              if (this.config.scaleType === 3) index += 4
          }
          const cursorIndex = rotateAngle >= 0 ? (index + Math.floor(rotateAngle / 45)) % 8
            : (index + Math.ceil(rotateAngle / 45) + 8) % 8
          return { cursor: this.controlPoints.cursors[cursorIndex] }
        }
      } else {
        return { cursor: index }
      }
    },
    setCursorStyle(cursor: string) {
      this.$store.commit('SET_cursor', cursor)
    },
    currCursorStyling(e: MouseEvent | TouchEvent | PointerEvent) {
      const el = e.target as HTMLElement
      this.setCursorStyle(el.style.cursor)
    },
    waitFontLoadingAndRecord() {
      const pageId = this.page.id
      const layerId = this.config.id
      TextUtils.waitFontLoadingAndRecord(this.config.paragraphs, () => {
        const { pageIndex, layerIndex, subLayerIdx } = LayerUtils.getLayerInfoById(pageId, layerId)
        if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
        TextUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
      })
    },
    waitFontLoadingAndResize() {
      const pageId = this.page.id
      const layerId = this.config.id
      TextUtils.untilFontLoaded(this.config.paragraphs).then(() => {
        setTimeout(() => {
          const { pageIndex, layerIndex, subLayerIdx } = LayerUtils.getLayerInfoById(pageId, layerId)
          if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
          TextUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
        }, 100)
      })
    },
    checkIfCurve(config: IText): boolean {
      return textShapeUtils.isCurvedText(config.styles.textShape)
    },
    calcSize(config: IText, composing: boolean) {
      this.checkIfCurve(config) ? this.curveTextSizeRefresh(config) : this.textSizeRefresh(config, composing)
    },
    handleTextChange(payload: { paragraphs: IParagraph[], isSetContentRequired: boolean, toRecord?: boolean }) {
      const config = generalUtils.deepCopy(this.config)
      config.paragraphs = payload.paragraphs
      this.calcSize(config as IText, !!tiptapUtils.editor?.view?.composing)
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { paragraphs: payload.paragraphs })
      if (payload.toRecord) {
        this.waitFontLoadingAndRecord()
      } else {
        this.waitFontLoadingAndResize()
      }
      if (payload.isSetContentRequired && !tiptapUtils.editor?.view?.composing) {
        // if composing starts from empty line, isSetContentRequired will be true in the first typing.
        // However, setContent will break the composing, so skip setContent when composing.
        // setContent will be done when 'composeend' (in NuTextEditor.vue)
        this.$nextTick(() => {
          tiptapUtils.agent(editor => {
            editor.chain().setContent(tiptapUtils.toJSON(payload.paragraphs)).selectPrevious().run()
          })
        })
      }
    },
    handleTextCompositionEnd(toRecord: boolean) {
      if (this.widthLimitSetDuringComposition) {
        this.widthLimitSetDuringComposition = false
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: -1 })
        this.textSizeRefresh(this.config as IText, false)
      }
      if (toRecord) {
        this.waitFontLoadingAndRecord()
      }
    },
    textSizeRefresh(text: IText, composing: boolean) {
      const isVertical = this.config.styles.writingMode.includes('vertical')
      const getSize = () => isVertical ? this.getLayerHeight() : this.getLayerWidth()

      let widthLimit = this.getLayerRotate() ? getSize() : this.config.widthLimit
      let textHW = TextUtils.getTextHW(text, widthLimit)
      let layerX = this.getLayerPos().x
      let layerY = this.getLayerPos().y

      if (widthLimit === -1) {
        const pageSize = (pageUtils.getPage(this.pageIndex) as IPage)[isVertical ? 'height' : 'width']
        const _pageSize = (this.$parent?.$el as HTMLElement)
          .getBoundingClientRect()[isVertical ? 'height' : 'width'] / (this.scaleRatio * 0.01)
        const currTextSize = textHW[isVertical ? 'height' : 'width']

        let layerPos = this.getLayerPos()[isVertical ? 'y' : 'x'] - (currTextSize - getSize()) / 2
        const reachLeftLimit = layerPos <= 0
        const reachRightLimit = layerPos + currTextSize >= pageSize

        if (reachLeftLimit && reachRightLimit) {
          if (composing) this.widthLimitSetDuringComposition = true
          textHW = TextUtils.getTextHW(text, pageSize)
          layerPos = 0
          widthLimit = pageSize
        } else if (reachLeftLimit || reachRightLimit) {
          if (composing) this.widthLimitSetDuringComposition = true
          widthLimit = getSize()
          textHW = TextUtils.getTextHW(text, widthLimit)
          layerPos = reachLeftLimit ? 0 : pageSize - widthLimit
        }
        layerX = isVertical ? layerX : layerPos
        layerY = isVertical ? layerPos : layerY
      } else {
        const initData = {
          xSign: 1,
          ySign: 1,
          x: this.getLayerPos().x,
          y: this.getLayerPos().y,
          angle: this.getLayerRotate() * Math.PI / 180
        }
        const offsetSize = {
          width: isVertical ? textHW.width - this.getLayerWidth() : 0,
          height: isVertical ? 0 : textHW.height - this.getLayerHeight()
        }
        const trans = ControlUtils.getTranslateCompensation(initData, offsetSize)
        layerX = trans.x
        layerY = trans.y
      }

      if (isVertical && textHW.width < 5) {
        textHW.width = this.getLayerWidth()
      } else if (!isVertical && textHW.height < 5) {
        const config = generalUtils.deepCopy(text) as IText
        config.paragraphs[0].spans[0].text = '|'
        config.paragraphs.splice(1)
        textHW.height = TextUtils.getTextHW(config).height
      }

      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit })
      LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, {
        width: textHW.width,
        height: textHW.height,
        x: layerX,
        y: layerY
      })
    },
    curveTextSizeRefresh(text: IText) {
      LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, textShapeUtils.getCurveTextProps(text))
    },
    onRightClick(event: MouseEvent) {
      if (this.$isTouchDevice()) {
        // in touch device, right click will be triggered by long click
        event.preventDefault()
        return
      }
      this.$nextTick(() => {
        popupUtils.openPopup('layer', { event, layerIndex: this.layerIndex })
      })
    },
    frameLayerMapper(_config: any) {
      const config = generalUtils.deepCopy(_config)
      const { x, y, width, height, scale } = config.styles
      return Object.assign(config, {
        styles: {
          ...config.styles,
          ...mathUtils.multipy(this.getLayerScale(), {
            x,
            y,
            width,
            height,
            scale
          })
        }
      })
    },
    handleScaleOffset(e: KeyboardEvent) {
      e.preventDefault()
      if (e.key === 'Alt') {
        const event = new MouseEvent('mousemove', {
          clientX: this.currentAbsPos.x,
          clientY: this.currentAbsPos.y,
          // custome emit event will not contain the keypress information, so we need to manually append it
          altKey: e.altKey
        })
        window.dispatchEvent(event)
      }
    },
    disableTouchEvent(e: TouchEvent) {
      if (this.$isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    // computed -> method
    getLayerPos(): ICoordinate {
      return {
        x: this.config.styles.x,
        y: this.config.styles.y
      }
    },
    isShown(): boolean {
      return this.config.shown
    },
    isLocked(): boolean {
      return this.config.locked
    },
    isLine(): boolean {
      return shapeUtils.isLine(this.config as AllLayerTypes)
    },
    getLayerWidth(): number {
      return this.config.styles.width
    },
    getLayerHeight(): number {
      return this.config.styles.height
    },
    getLayerRotate(): number {
      return this.config.styles.rotate
    },
    getLayerScale(): number {
      return this.config.styles.scale
    },
    isDragging(): boolean {
      return this.config.dragging
    },
    actionIconStyles(): { [index: string]: string } {
      const zindex = (this.layerIndex + 1) * 100
      return {
        transform: this.enalble3dTransform ? `translate3d(0px, 0px, ${zindex}px)`
          : 'translate(0px, 0px)'
      }
    },
  }
})
</script>

<style lang="scss" scoped>
.nu-controller {
  pointer-events: initial;
  &__line-hint {
    position: absolute;
    z-index: 10001;
    background-color: setColor(gray-1);
    border-radius: 5px;
    color: white;
    padding: 5px 10px;
    font-size: 14px;
  }
  &__object-hint {
    position: absolute;
    z-index: 10001;
    background-color: white;
    width: 56px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid setColor(gray-4);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    &__icon {
      margin-left: 5px;
      width: 12px;
      height: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__text {
      margin-right: 5px;
      font-weight: 400;
      font-size: 14px;
      color: setColor(gray-2);
    }
  }
  &__content {
    border-width: 0;
    z-index: 10000;
    border-color: transparent;
    background-color: transparent;
    background-image: none;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    touch-action: none;
  }
  &__sublayer-container {
    display: relative;
    position: absolute;
    pointer-events: none;
    touch-action: none;
  }
  &__subCtrlContent {
    transform-origin: 0;
  }
  &__ctrl-points {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.text {
  p {
    // margin: 0.5em;
    margin: 0;
  }
  span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  &__wrapper {
    position: absolute;
    left: 50%;
    top: 50%;
    transform-origin: 0 0;
  }
  &__body {
    outline: none;
    padding: 0;
    position: relative;
  }
  &__content {
    text-align: left;
    outline: none;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
}

.hover {
  &:hover {
    cursor: pointer;
  }
}
</style>
