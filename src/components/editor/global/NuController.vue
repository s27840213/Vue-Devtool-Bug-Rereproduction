<template lang="pug">
  keep-alive
    div(class="nu-controller" ref="self")
      div(class="nu-controller__line-hint" :style="hintStyles()" v-if="isLineEndMoving")
        | {{ Math.round(hintLength) + ' | ' + Math.round(hintAngle) % 360  + '°' }}
      div(class="nu-controller__object-hint" :style="hintStyles()" v-if="isRotating")
        div(class="nu-controller__object-hint__icon")
          svg-icon(iconName="angle"
                  iconWidth="12px"
                  iconColor="gray-2")
        div(class="nu-controller__object-hint__text")
          span {{ Math.round(hintAngle) % 360 }}
      div(class="nu-controller__content"
          ref="body"
          :layer-index="`${layerIndex}`"
          :style="styles(getLayerType)"
          @drop="onDrop($event)"
          @dragover.prevent,
          @click.left="onClick"
          @click.right.stop="onRightClick"
          @contextmenu.prevent
          @mousedown.left="moveStart"
          @mouseenter="toggleHighlighter(pageIndex,layerIndex, true)"
          @mouseleave="toggleHighlighter(pageIndex,layerIndex, false)"
          @dblclick="onDblClick")
        svg(v-if="getLayerType === 'frame' && !isLocked" class="full-width" :viewBox="`0 0 ${config.styles.initWidth} ${config.styles.initHeight}`")
          g(v-for="(clip, index) in config.clips"
            v-html="clip.clipPath ? FrameUtils.frameClipFormatter(clip.clipPath) : `<path d='M0,0h${getLayerWidth}v${getLayerHeight}h${-getLayerWidth}z'></path>`"
            :style="frameClipStyles(clip, index)"
            @mouseenter="onFrameMouseEnter(index)"
            @mouseleave="onFrameMouseLeave(index)"
            @mouseup="onFrameMouseUp(index)"
            @dragenter="onFrameDragEnter(index)",
            @dragleave="onFrameDragLeave(index)",
            @drop="onFrameDrop(index)",
            @click="clickSubController(index)"
            @dblclick="dblSubController(index)")
        template(v-if="(['group','frame','tmp'].includes(getLayerType)) && isActive")
          div(class="sub-controller")
            template(v-for="(layer,index) in getLayers")
              component(:is="layer.type === 'image' && layer.imgControl ? 'nu-img-controller' : 'nu-sub-controller'"
                class="relative"
                data-identifier="controller"
                :style="getLayerType === 'frame' ? '' : subControllerStyles(layer.type === 'image' && layer.imgControl)"
                :key="`group-controller-${index}`"
                :pageIndex="pageIndex"
                :layerIndex="index"
                :primaryLayerIndex="layerIndex"
                :config="getLayerType === 'frame' ? frameLayerMapper(layer) : layer"
                :type="config.type"
                @onFrameDrop="getLayerType === 'frame' ? onFrameDrop(index) : null"
                @onFrameDragenter="onFrameDragEnter(index)",
                @onFrameDragleave="onFrameDragLeave(index)",
                @clickSubController="clickSubController"
                @dblSubController="dblSubController")
        template(v-if="config.type === 'text' && config.active")
          div(class="text__wrapper" :style="textWrapperStyle()")
            div(ref="text" :id="`text-${layerIndex}`" spellcheck="false"
              :style="textBodyStyle()"
              class="text__body"
              :contenteditable="config.type === 'tmp' || config.locked ? false : contentEditable"
              @focus="onTextFocus()"
              @blur="onTextBlur()"
              @compositionstart="isComposing = true"
              @compositionend="composingEnd"
              @keydown="onKeyDown"
              @keydown.ctrl.67.exact.stop.prevent.self="ShortcutUtils.textCopy()"
              @keydown.meta.67.exact.stop.prevent.self="ShortcutUtils.textCopy()"
              @keydown.ctrl.86.exact.stop.prevent.self="ShortcutUtils.textPaste()"
              @keydown.meta.86.exact.stop.prevent.self="ShortcutUtils.textPaste()"
              @keydown.ctrl.65.exact.stop.prevent.self="ShortcutUtils.textSelectAll()"
              @keydown.meta.65.exact.stop.prevent.self="ShortcutUtils.textSelectAll()"
              @keydown.ctrl.90.exact.stop.prevent.self="ShortcutUtils.undo()"
              @keydown.meta.90.exact.stop.prevent.self="ShortcutUtils.undo()"
              @keydown.ctrl.shift.90.exact.stop.prevent.self="ShortcutUtils.redo()"
              @keydown.meta.shift.90.exact.stop.prevent.self="ShortcutUtils.redo()"
              @keydown.37.stop
              @keydown.38.stop
              @keydown.39.stop
              @keydown.40.stop
              @keyup="onKeyUp")
              p(v-for="(p, pIndex) in config.paragraphs" class="text__p"
                :data-pindex="pIndex"
                :key="p.id",
                :style="textStyles(p.styles)")
                template(v-for="(span, sIndex) in p.spans")
                  span(v-if="span.text" class="text__span"
                    :data-sindex="sIndex"
                    :key="span.id",
                    :style="textStyles(span.styles)") {{ span.text }}
                  br(v-else
                  :key="span.id"
                  :data-sindex="sIndex")
        div(v-if="isActive && isLocked && (scaleRatio >20)"
            class="nu-controller__lock-icon"
            :style="lockIconStyles"
            v-hint="'unlock'")
          svg-icon(:iconName="'lock'" :iconWidth="`${20}px`" :iconColor="'red'"
            @click.native="MappingUtils.mappingIconAction('unlock')")
      div(v-if="isActive && !isControlling && !isLocked && !isImgControl"
          class="nu-controller__ctrl-points"
          :style="Object.assign(styles('control-point'), {'pointer-events': 'none', outline: 'none'})")
          div(v-for="(end, index) in isLine ? controlPoints.lineEnds : []"
              class="control-point"
              :key="index"
              :marker-index="index"
              :style="Object.assign(end, {'cursor': 'pointer'})"
              @mousedown.left.stop="lineEndMoveStart")
          div(v-for="(scaler, index) in (!isLine) ? controlPoints.scalers : []"
              class="control-point"
              :key="index"
              :style="Object.assign(scaler, cursorStyles(index * 2, getLayerRotate))"
              @mousedown.left.stop="scaleStart")
          div(v-for="(resizer, index) in resizer(controlPoints)"
              @mousedown.left.stop="resizeStart($event)")
            div(class="control-point__resize-bar"
                :key="index"
                :style="resizerBarStyles(resizer)")
            div(class="control-point"
                :style="Object.assign(resizer, cursorStyles(index * 2 + 1, getLayerRotate))")
          div(v-if="config.type === 'text' && contentEditable" v-for="(resizer, index) in resizer(controlPoints, true)"
              @mousedown.left.stop="moveStart($event)")
            div(class="control-point__resize-bar control-point__move-bar"
                :key="index"
                :style="resizerBarStyles(resizer)")
          div(class="control-point__line-controller-wrapper"
              v-if="isLine"
              :style="`transform: scale(${100/scaleRatio})`")
            img(class="control-point__mover"
              :src="require('@/assets/img/svg/move.svg')"
              :style='lineControlPointStyles()'
              @mousedown.left.stop="moveStart")
            svg-icon(class="control-point__rotater"
              :iconName="'rotate'" :iconWidth="`${20}px`"
              :style='lineControlPointStyles()'
              :src="require('@/assets/img/svg/rotate.svg')"
              @mousedown.native.left.stop="lineRotateStart")
          div(class="control-point__rotater-wrapper"
              v-else
              :style="`transform: scale(${100/scaleRatio})`")
            svg-icon(class="control-point__rotater"
              :iconName="'rotate'" :iconWidth="`${20}px`"
              :src="require('@/assets/img/svg/rotate.svg')"
              @mousedown.native.left.stop="rotateStart")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { ICoordinate } from '@/interfaces/frame'
import { IFrame, IGroup, IImage, ILayer, IParagraph, IShape, IText } from '@/interfaces/layer'
import { IControlPoints, IResizer } from '@/interfaces/controller'
import { ISelection } from '@/interfaces/text'
import MathUtils from '@/utils/mathUtils'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import StepsUtils from '@/utils/stepsUtils'
import LayerUtils from '@/utils/layerUtils'
import GeneralUtils from '@/utils/generalUtils'
import MappingUtils from '@/utils/mappingUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import TextUtils from '@/utils/textUtils'
import TextPropUtils from '@/utils/textPropUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import TemplateUtils from '@/utils/templateUtils'
import shapeUtils from '@/utils/shapeUtils'
import FrameUtils from '@/utils/frameUtils'
import ImageUtils from '@/utils/imageUtils'
import popupUtils from '@/utils/popupUtils'
import color from '@/store/module/color'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    snapUtils: Object
  },
  data() {
    return {
      MappingUtils,
      FrameUtils,
      ShortcutUtils,
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      isLineEndMoving: false,
      isRotating: false,
      hintTranslation: { x: 0, y: 0 },
      hintLength: 0,
      hintAngle: 0,
      initialPos: { x: 0, y: 0 },
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
      isComposing: false,
      isSnapping: false,
      contentEditable: true,
      clipedImgBuff: {} as {
        index: number,
        styles: { imgX: number, imgY: number, imgWidth: number, imgHeight: number },
        srcObj: { type: string, assetId: string, userId: string }
      },
      subControlerIndexs: []
    }
  },
  mounted() {
    this.setLastSelectedLayerIndex(this.layerIndex)
  },
  beforeDestroy() {
    window.removeEventListener('mouseup', this.moveEnd)
    window.removeEventListener('mousemove', this.moving)
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapState(['isMoving', 'currDraggedPhoto']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo'
    }),
    getLayerPos(): ICoordinate {
      return {
        x: this.config.styles.x,
        y: this.config.styles.y
      }
    },
    getLayerType(): string {
      return this.config.type
    },
    getControlPoints(): IControlPoints {
      return this.config.controlPoints
    },
    getLayers(): Array<ILayer> {
      const type = this.getLayerType
      return (type === 'group' || type === 'tmp')
        ? this.config.layers : (type === 'frame' ? this.config.clips : [])
    },
    isActive(): boolean {
      return this.config.active
    },
    isShown(): boolean {
      return this.config.shown
    },
    isLocked(): boolean {
      return this.config.locked
    },
    isLine(): boolean {
      return this.config.type === 'shape' && this.config.category === 'D'
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
    getFontSize(): number {
      return this.config.styles.size
    },
    getLayerScale(): number {
      return this.config.styles.scale
    },
    isTextEditing(): boolean {
      return !this.isControlling && this.contentEditable
    },
    isDragging(): boolean {
      return this.config.dragging
    },
    isImgActive(): boolean {
      const layer = LayerUtils.getCurrLayer
      if (layer) {
        return LayerUtils.getCurrLayer.type === 'image' && LayerUtils.getCurrLayer.active
      }
      return false
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
    lockIconStyles(): { [index: string]: string } {
      const zindex = (this.layerIndex + 1) * 100
      return {
        transform: `translate3d(0px, 0px, ${zindex}px) scale(${100 / this.scaleRatio})`
      }
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
    },
    isActive(val) {
      if (!val) {
        this.setLastSelectedLayerIndex(this.layerIndex)
      }
      if (this.getLayerType === 'text' && !val) {
        const { paragraphs } = this.config as IText
        if (paragraphs.length === 1 && !paragraphs[0].spans[0].text) {
          LayerUtils.deleteLayer(this.lastSelectedLayerIndex)
          return
        }

        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
          editing: false
        })
        if (this.currSelectedInfo.layers.length <= 1 && !this.isLocked) {
          this.contentEditable = false
          ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: false })
        }
      } else if ((this.getLayerType === 'text' || this.getLayerType === 'tmp') && this.isActive) {
        this.$store.commit('text/SET_default')
        TextPropUtils.updateTextPropsState()
      }
    },
    isTextEditing(editing) {
      if (this.getLayerType === 'text') {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
          editing
        })
        if (editing && !this.config.isEdited) {
          ShortcutUtils.textSelectAll(this.layerIndex)
        }
      }
    }
  },
  destroyed() {
    /**
     * While image is setted to frame, these event-listener should be removed
     */
    window.removeEventListener('mouseup', this.moveEnd)
    window.removeEventListener('mousemove', this.moving)
    this.isControlling = false
    this.setCursorStyle('default')
    this.setMoving(false)
  },
  methods: {
    ...mapMutations({
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened',
      setMoving: 'SET_moving',
      setCurrDraggedPhoto: 'SET_currDraggedPhoto'
    }),
    frameLayerMapper(_config: any) {
      const config = GeneralUtils.deepCopy(_config)
      const { x, y, width, height, initWidth, initHeight, scale } = config.styles
      return Object.assign(config, {
        styles: {
          ...config.styles,
          ...MathUtils.multipy(this.getLayerScale, ...Object.entries({
            x,
            y,
            width,
            height,
            scale
          }))
        }
      })
    },
    resizerBarStyles(resizer: IResizer) {
      const resizerStyle = Object.assign({}, resizer)
      const ControllerStyles = this.styles('')
      const HW = {
        //  get the widht/height of the controller for resizer-bar and minus the scaler size
        width: resizerStyle.width < resizerStyle.height ? `${parseInt(ControllerStyles.width) - 20}px` : resizerStyle.width,
        height: resizerStyle.width > resizerStyle.height ? `${parseInt(ControllerStyles.height) - 20}px` : resizerStyle.height
      }
      return Object.assign(resizerStyle, HW)
    },
    resizer(controlPoints: any, textMoveBar = false) {
      let resizers = controlPoints.resizers
      switch (this.getLayerType) {
        case 'text':
          if (textMoveBar) {
            resizers = this.config.styles.writingMode.includes('vertical') ? controlPoints.resizers.slice(0, 2)
              : controlPoints.resizers.slice(2, 4)
          } else {
            resizers = this.config.styles.writingMode.includes('vertical') ? controlPoints.resizers.slice(2, 4)
              : controlPoints.resizers.slice(0, 2)
          }
          break
        case 'shape':
          resizers = ControlUtils.shapeCategorySorter(resizers, this.config.category, this.config.scaleType)
          break
        case 'tmp':
          resizers = []
          break
        case 'group':
          resizers = []
          break
        case 'frame':
          if (FrameUtils.isImageFrame(this.config)) {
            return resizers
          } else {
            return []
          }
      }
      return resizers
    },
    lineEnds(scalers: any, point: number[]) {
      const quadrant = shapeUtils.getLineQuadrant(point)
      if (quadrant % 2 === 0) {
        return [scalers[0], scalers[2]]
      } else {
        return [scalers[1], scalers[3]]
      }
    },
    textScaleStyle() {
      return {
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`
      }
    },
    textWrapperStyle() {
      return {
        width: `${this.getLayerWidth / this.getLayerScale}px`,
        height: `${this.getLayerHeight / this.getLayerScale}px`,
        opacity: `${this.config.styles.opacity / 100}`,
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`,
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode
      }
    },
    textBodyStyle() {
      const isVertical = this.config.styles.writingMode.includes('vertical')
      return {
        width: isVertical ? 'auto' : `${this.getLayerWidth / this.getLayerScale}px`,
        height: isVertical ? '' : 'auto',
        userSelect: this.contentEditable ? 'text' : 'none',
        opacity: this.isTextEditing ? 1 : 0
      }
    },
    groupControllerStyle() {
      return {
        width: `${this.config.styles.width / this.getLayerScale}px`,
        height: `${this.config.styles.height / this.getLayerScale}px`,
        position: 'absolute',
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`
      }
    },
    textStyles(styles: any) {
      const textStyles = CssConveter.convertFontStyle(styles)
      Object.assign(textStyles, {
        'caret-color': this.contentEditable && !this.isControlling ? '' : '#00000000'
      })
      return textStyles
    },
    toggleHighlighter(pageIndex: number, layerIndex: number, shown: boolean) {
      if (this.isLine) return
      LayerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    styles(type: string) {
      const zindex = (() => {
        if ((type === 'frame' && this.isMoving) || (type === 'group' && LayerUtils.currSelectedInfo.index === this.layerIndex)) {
          return (this.layerIndex + 1) * 1000
        } else if (type === 'control-point') {
          return (this.layerIndex + 1) * (this.getLayerType === 'frame' && this.isMoving ? 1000 : 100)
        } else if (type === 'tmp') {
          return 0
        } else {
          return this.config.styles.zindex + 1
        }
      })()
      const { x, y, width, height, rotate } = ControlUtils.getControllerStyleParameters(this.config.point, this.config.styles, this.isLine, this.config.size?.[0])
      return {
        transform: `translate3d(${x}px, ${y}px, ${zindex}px) rotate(${rotate}deg)`,
        width: `${width}px`,
        height: `${height}px`,
        outline: this.outlineStyles(type),
        opacity: this.isImgControl ? 0 : 1,
        'pointer-events': this.isImgControl ? 'none' : 'initial',
        ...TextEffectUtils.convertTextEffect(this.config.styles.textEffect)
      }
    },
    lineControlPointStyles() {
      const { angle } = shapeUtils.lineDimension(this.config.point)
      const degree = angle / Math.PI * 180
      return {
        transform: `rotate(${-degree}deg)`
      }
    },
    subControllerStyles(isImgControl: boolean) {
      return isImgControl ? {
        transform: `translate(-50%, -50%) translateZ(1000px) scale(${this.config.styles.scale}) scaleX(${this.config.styles.scaleX}) scaleY(${this.config.styles.scaleY})`
      } : {
        transform: `translate(-50%, -50%) scale(${this.config.styles.scale}) scaleX(${this.config.styles.scaleX}) scaleY(${this.config.styles.scaleY})`
      }
    },
    outlineStyles(type: string) {
      const outlineColor = (() => {
        if (this.getLayerType === 'frame' && this.config.clips[0].isFrameImg) {
          return '#F10994'
        } else if (this.isLocked) {
          return '#EB5757'
        } else {
          return '#7190CC'
        }
      })()

      if (this.isLine || (this.isMoving && LayerUtils.currSelectedInfo.index !== this.layerIndex)) {
        return 'none'
      } else if (this.isShown || this.isActive) {
        if (this.config.type === 'tmp' || this.isControlling) {
          return `${2 * (100 / this.scaleRatio)}px dashed ${outlineColor}`
        } else {
          return `${2 * (100 / this.scaleRatio)}px solid ${outlineColor}`
        }
      } else {
        return 'none'
      }
    },
    frameClipStyles(clip: any, index: number) {
      return {
        transform: `translate(${clip.styles.x}px, ${clip.styles.y}px)`,
        fill: '#00000000',
        stroke: clip.active ? '#7190CC' : 'none',
        strokeWidth: this.config.clips[0].isFrameImg ? '0px' : `${5 * (100 / this.scaleRatio)}px`
      }
    },
    hintStyles() {
      return `transform: translate(${this.hintTranslation.x}px, ${this.hintTranslation.y}px) scale(${100 / this.scaleRatio})`
    },
    moveStart(e: MouseEvent) {
      const inSelectionMode = GeneralUtils.exact([e.shiftKey, e.ctrlKey, e.metaKey])
      if (!this.isLocked) {
        e.stopPropagation()
      }
      if (this.getLayerType === 'image') {
        this.setMoving(true)
      }
      this.initTranslate = this.getLayerPos
      if (this.getLayerType === 'text') {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
          dragging: true
        })
        if (this.isActive && !inSelectionMode && this.contentEditable && !(e.target as HTMLElement).classList.contains('control-point__move-bar')) {
          return
        } else if (!this.isActive) {
          let targetIndex = this.layerIndex
          if (!inSelectionMode && this.currSelectedInfo.index >= 0) {
            GroupUtils.deselect()
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedPageIndex(this.pageIndex)
            this.setLastSelectedLayerIndex(this.layerIndex)
          }
          if (this.pageIndex === this.lastSelectedPageIndex) {
            GroupUtils.select(this.pageIndex, [targetIndex])
          }
          if (!this.config.locked) {
            this.isControlling = true
            this.initialPos = MouseUtils.getMouseAbsPoint(e)
            window.addEventListener('mouseup', this.moveEnd)
            window.addEventListener('mousemove', this.moving)
          }
          return
        }
        this.contentEditable = true
      }
      if (!this.config.locked && !inSelectionMode) {
        this.isControlling = true
        this.initialPos = MouseUtils.getMouseAbsPoint(e)
        window.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)
      }
      if (this.config.type !== 'tmp') {
        let targetIndex = this.layerIndex
        if (this.isActive && this.currSelectedInfo.layers.length === 1) {
          if (inSelectionMode) {
            GroupUtils.deselect()
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedLayerIndex(this.layerIndex)
          }
        } else if (!this.isActive) {
          // already have selected layer
          if (this.currSelectedInfo.index >= 0) {
            // Did not press shift/cmd/ctrl key -> deselect selected layers first
            if (!inSelectionMode) {
              GroupUtils.deselect()
              targetIndex = this.config.styles.zindex - 1
              this.setLastSelectedPageIndex(this.pageIndex)
              this.setLastSelectedLayerIndex(this.layerIndex)
            }
            // this if statement is used to prevent select the layer in another page
            if (this.pageIndex === this.lastSelectedPageIndex) {
              GroupUtils.select(this.pageIndex, [targetIndex])
            }
          } else {
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedPageIndex(this.pageIndex)
            this.setLastSelectedLayerIndex(this.layerIndex)
            GroupUtils.select(this.pageIndex, [targetIndex])
          }
        }
      }
    },
    moving(e: MouseEvent) {
      if (this.isImgControl) {
        window.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
        return
      }
      if (this.isActive) {
        e.preventDefault()
        this.setCursorStyle('move')
        if (!this.config.moved) {
          LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
        }
        const offsetPos = MouseUtils.getMouseRelPoint(e, this.initialPos)
        const moveOffset = MathUtils.getActualMoveOffset(offsetPos.x, offsetPos.y)
        GroupUtils.movingTmp(
          this.pageIndex,
          {
            x: moveOffset.offsetX,
            y: moveOffset.offsetY
          }
        )
        const offsetSnap = this.snapUtils.calcMoveSnap(this.config, this.layerIndex)
        this.$emit('getClosestSnaplines')
        const totalOffset = {
          x: offsetPos.x + (offsetSnap.x * this.scaleRatio / 100),
          y: offsetPos.y + (offsetSnap.y * this.scaleRatio / 100)
        }
        this.initialPos.x += totalOffset.x
        this.initialPos.y += totalOffset.y
        // if (this.getLayerType === 'image') {
        //   (this.$refs.body as HTMLElement).style.pointerEvents = 'none'
        // }
      }
    },
    imgHandler(offset: ICoordinate) {
      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, this.config.styles.imgX, this.config.styles.imgY)
    },
    moveEnd(e: MouseEvent) {
      if (this.getLayerType === 'image') {
        // (this.$refs.body as HTMLElement).style.pointerEvents = 'initial'
        this.setMoving(false)
      }
      if (this.isActive) {
        const posDiff = {
          x: Math.abs(this.getLayerPos.x - this.initTranslate.x),
          y: Math.abs(this.getLayerPos.y - this.initTranslate.y)
        }
        if (posDiff.x === 0 && posDiff.y === 0 && !this.isLocked) {
          if (LayerUtils.isClickOutOfPagePart(e, this.$refs.body as HTMLElement, this.config)) {
            GroupUtils.deselect()
            this.toggleHighlighter(this.pageIndex, this.layerIndex, false)
          }
        }
        if (Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0) {
          StepsUtils.record()
          if (this.getLayerType === 'text') {
            this.contentEditable = false
          }
        }
        this.isControlling = false
        this.setCursorStyle('default')
        window.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
      }
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
        dragging: false
      })
      this.$emit('clearSnap')
    },
    scaleStart(event: MouseEvent) {
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.isControlling = true

      this.initSize = {
        width: this.getLayerWidth,
        height: this.getLayerHeight
      }
      const rect = (this.$refs.body as HTMLElement).getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)
      this.initTranslate = this.getLayerPos
      const angleInRad = this.getLayerRotate * Math.PI / 180
      const vect = MouseUtils.getMouseRelPoint(event, this.center)

      // Get client point as no rotation
      const clientP = ControlUtils.getNoRotationPos(vect, this.center, angleInRad)

      this.control.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - this.center.y > 0) ? 1 : -1

      if (this.config.category === 'E') {
        this.initCorRadPercentage = ControlUtils.getCorRadPercentage(this.config.vSize, this.config.size, this.config.shapeType)
      }

      this.currCursorStyling(event)
      document.documentElement.addEventListener('mousemove', this.scaling, false)
      document.documentElement.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(event: MouseEvent) {
      event.preventDefault()
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }

      let width = this.getLayerWidth
      let height = this.getLayerHeight

      const angleInRad = this.getLayerRotate * Math.PI / 180
      const tmp = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const diff = MathUtils.getActualMoveOffset(tmp.x, tmp.y)
      const [dx, dy] = [diff.offsetX, diff.offsetY]

      const offsetWidth = this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad))
      const offsetHeight = this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad))
      if (offsetWidth === 0 || offsetHeight === 0) return

      const initWidth = this.initSize.width
      const initHeight = this.initSize.height
      if ((width + offsetWidth) / initWidth >= (height + offsetHeight) / initHeight) {
        width = offsetWidth + initWidth
        height = width * initHeight / initWidth
      } else {
        height = offsetHeight + initHeight
        width = height * initWidth / initHeight
      }
      // The minimum size of the layer
      if (width <= 20 || height <= 20) return

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
        width: width / (this.getLayerWidth / this.getLayerScale),
        height: height / (this.getLayerHeight / this.getLayerScale)
      }

      let scale = Math.max(ratio.width, ratio.height)
      switch (this.getLayerType) {
        case 'image': {
          const { imgWidth, imgHeight, imgX, imgY } = (this.config as IImage).styles
          ImageUtils.updateImgSize(this.pageIndex, this.layerIndex, imgWidth * scale, imgHeight * scale)
          ImageUtils.updateImgPos(this.pageIndex, this.layerIndex, imgX * scale, imgY * scale)
          scale = 1
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
          if (FrameUtils.isImageFrame(this.config)) {
            let { imgWidth, imgHeight, imgX, imgY } = (this.config as IFrame).clips[0].styles
            imgWidth *= scale
            imgHeight *= scale
            imgY *= scale
            imgX *= scale

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
            const clipPath = `M0,0h${width}v${height}h${-width}z`
            FrameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, 0, { clipPath })
            scale = 1
          }
          break
        }
        case 'shape':
          if (this.config.category === 'E') {
            scale = this.getLayerScale
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
              const scaleRatio = scale / this.getLayerScale
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
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
    },
    scaleEnd() {
      this.isControlling = false
      StepsUtils.record()

      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.scaling, false)
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false)
      this.$emit('setFocus')
      this.$emit('clearSnap')
    },
    lineEndMoveStart(event: MouseEvent) {
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.isControlling = true
      this.isLineEndMoving = true

      const quadrant = shapeUtils.getLineQuadrant(this.config.point)
      const markerIndex = Number((event.target as HTMLElement).getAttribute('marker-index'))

      this.initMarkerIndex = markerIndex
      this.initCoordinate = { x: this.config.point[markerIndex * 2], y: this.config.point[markerIndex * 2 + 1] }

      const { angle, yDiff, xDiff } = shapeUtils.lineDimension(this.config.point)
      const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
      const mouseActualPos = MathUtils.getActualMoveOffset(mousePos.x, mousePos.y)
      this.hintTranslation = { x: mouseActualPos.offsetX + 35 * 100 / this.scaleRatio, y: mouseActualPos.offsetY + 35 * 100 / this.scaleRatio }
      this.hintAngle = ((angle / Math.PI * 180 + (1 - markerIndex) * 180) + 360) % 360
      this.hintLength = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2))

      const quadrantByMarkerIndex = (markerIndex === 0) ? (quadrant - 1 + 2) % 4 + 1 : quadrant
      this.initReferencePoint = ControlUtils.getAbsPointByQuadrant(this.config.point, this.config.styles, this.config.size[0], quadrantByMarkerIndex)

      this.currCursorStyling(event)
      document.documentElement.addEventListener('mousemove', this.lineEndMoving, false)
      document.documentElement.addEventListener('mouseup', this.lineEndMoveEnd, false)
    },
    lineEndMoving(event: MouseEvent) {
      event.preventDefault()
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }

      const tmp = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const diff = MathUtils.getActualMoveOffset(tmp.x, tmp.y)
      const [dx, dy] = [diff.offsetX, diff.offsetY]
      const markerIndex = this.initMarkerIndex

      const copiedPoint: number[] = Array.from(this.config.point)
      copiedPoint[markerIndex * 2] = this.initCoordinate.x + dx
      copiedPoint[markerIndex * 2 + 1] = this.initCoordinate.y + dy
      const { newPoint, lineLength, lineAngle } = this.snapUtils.calLineAngleSnap(markerIndex, copiedPoint, event.shiftKey)

      const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
      const mouseActualPos = MathUtils.getActualMoveOffset(mousePos.x, mousePos.y)
      this.hintTranslation = { x: mouseActualPos.offsetX + 35 * 100 / this.scaleRatio, y: mouseActualPos.offsetY + 35 * 100 / this.scaleRatio }
      this.hintLength = lineLength
      this.hintAngle = lineAngle

      const trans = ControlUtils.getTranslateCompensationForLine(markerIndex, this.initReferencePoint, this.config.styles, (this.config.size ?? [1])[0], newPoint)

      ControlUtils.updateShapeLinePoint(this.pageIndex, this.layerIndex, newPoint)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
    },
    lineEndMoveEnd() {
      this.isControlling = false
      this.isLineEndMoving = false
      StepsUtils.record()

      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.lineEndMoving, false)
      document.documentElement.removeEventListener('mouseup', this.lineEndMoveEnd, false)
      this.$emit('setFocus')
      this.$emit('clearSnap')
    },
    resizeStart(event: MouseEvent) {
      this.isControlling = true
      const body = this.$refs.body as HTMLElement
      const rect = body.getBoundingClientRect()
      const center = ControlUtils.getRectCenter(rect)

      this.initSize = {
        width: this.getLayerWidth,
        height: this.getLayerHeight
      }
      this.initTranslate = this.getLayerPos
      this.initialPos = { x: event.clientX, y: event.clientY }

      const vect = MouseUtils.getMouseRelPoint(event, center)
      const angeleInRad = this.getLayerRotate * Math.PI / 180
      const clientP = ControlUtils.getNoRotationPos(vect, center, angeleInRad)
      this.control.xSign = (clientP.x - center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - center.y > 0) ? 1 : -1
      this.control.isHorizon = ControlUtils.dirHandler(clientP, rect)

      document.documentElement.addEventListener('mousemove', this.resizing)
      document.documentElement.addEventListener('mouseup', this.resizeEnd)
      this.currCursorStyling(event)

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
          ImageUtils.isHorizon = ControlUtils.dirHandler(clientP, rect)
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
          ImageUtils.isHorizon = ControlUtils.dirHandler(clientP, rect)
      }
    },
    resizing(event: MouseEvent) {
      event.preventDefault()
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }
      let width = this.getLayerWidth
      let height = this.getLayerHeight
      const initWidth = this.initSize.width
      const initHeight = this.initSize.height

      const angleInRad = this.getLayerRotate * Math.PI / 180
      const diff = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const [dx, dy] = [diff.x / (this.scaleRatio / 100), diff.y / (this.scaleRatio / 100)]

      const offsetWidth = this.control.isHorizon ? this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad)) : 0
      const offsetHeight = this.control.isHorizon ? 0 : this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad))
      if (offsetWidth === 0 && offsetHeight === 0) return

      width = offsetWidth + initWidth
      height = offsetHeight + initHeight
      if (width <= 5 || height <= 5) {
        width = width <= 5 ? 5 : width
        height = height <= 5 ? 5 : height
      }

      const offsetSize = {
        width: width - initWidth,
        height: height - initHeight
      }

      const scale = this.getLayerScale
      switch (this.getLayerType) {
        case 'image':
          ImageUtils.imgResizeHandler(width, height, offsetWidth, offsetHeight)
          break
        case 'shape': {
          [width, height] = ControlUtils.resizeShapeHandler(this.config, this.scale, this.initSize, width, height)

          if (this.config.category === 'E') {
            ControlUtils.updateShapeVSize(this.pageIndex, this.layerIndex, [width, height])
          }
          break
        }
        case 'text':
          [width, height] = TextUtils.textResizeHandler(this.pageIndex, this.layerIndex, width, height)
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
    },
    resizeEnd() {
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
      StepsUtils.record()
      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.resizing)
      document.documentElement.removeEventListener('mouseup', this.resizeEnd)
      this.$emit('setFocus')
    },
    rotateStart(event: MouseEvent) {
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
      this.initialRotate = this.getLayerRotate

      const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
      const mouseActualPos = MathUtils.getActualMoveOffset(mousePos.x, mousePos.y)
      this.hintTranslation = { x: mouseActualPos.offsetX + 35 * 100 / this.scaleRatio, y: mouseActualPos.offsetY + 35 * 100 / this.scaleRatio }
      this.hintAngle = (this.initialRotate + 360) % 360

      window.addEventListener('mousemove', this.rotating)
      window.addEventListener('mouseup', this.rotateEnd)
    },
    rotating(event: MouseEvent) {
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

        const mousePos = MouseUtils.getMouseRelPoint(event, this.$refs.self as HTMLElement)
        const mouseActualPos = MathUtils.getActualMoveOffset(mousePos.x, mousePos.y)
        this.hintTranslation = { x: mouseActualPos.offsetX + 35 * 100 / this.scaleRatio, y: mouseActualPos.offsetY + 35 * 100 / this.scaleRatio }
        this.hintAngle = angle

        ControlUtils.updateLayerRotate(this.pageIndex, this.layerIndex, angle)
      }
    },
    rotateEnd() {
      this.isRotating = false
      this.isControlling = false
      StepsUtils.record()
      this.setCursorStyle('default')
      window.removeEventListener('mousemove', this.rotating)
      window.removeEventListener('mouseup', this.rotateEnd)
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
      const mouseActualPos = MathUtils.getActualMoveOffset(mousePos.x, mousePos.y)
      this.hintTranslation = { x: mouseActualPos.offsetX + 35 * 100 / this.scaleRatio, y: mouseActualPos.offsetY + 35 * 100 / this.scaleRatio }
      this.hintAngle = (this.initialRotate + 360) % 360

      window.addEventListener('mousemove', this.lineRotating)
      window.addEventListener('mouseup', this.lineRotateEnd)
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
        const mouseActualPos = MathUtils.getActualMoveOffset(mousePos.x, mousePos.y)
        this.hintTranslation = { x: mouseActualPos.offsetX + 35 * 100 / this.scaleRatio, y: mouseActualPos.offsetY + 35 * 100 / this.scaleRatio }
        this.hintAngle = angle

        ControlUtils.updateShapeLinePoint(this.pageIndex, this.layerIndex, point)
        ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, this.config.styles.x + dx, this.config.styles.y + dy)
      }
    },
    lineRotateEnd() {
      this.isRotating = false
      this.isControlling = false
      StepsUtils.record()
      this.setCursorStyle('default')
      window.removeEventListener('mousemove', this.lineRotating)
      window.removeEventListener('mouseup', this.lineRotateEnd)
      this.$emit('setFocus')
    },
    cursorStyles(index: number, rotateAngle: number) {
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
    },
    setCursorStyle(cursor: string) {
      const layer = this.$el as HTMLElement
      if (layer) {
        layer.style.cursor = cursor
        document.body.style.cursor = cursor
      }
    },
    currCursorStyling(e: MouseEvent) {
      const el = e.target as HTMLElement
      this.setCursorStyle(el.style.cursor)
    },
    onDrop(e: DragEvent) {
      switch (this.getLayerType) {
        case 'image': {
          const config = this.config as IImage
          MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, config.clipPath, config.styles)
          break
        }
        case 'frame':
          return
        default:
          MouseUtils.onDrop(e, this.pageIndex, this.getLayerPos)
      }
    },
    onClick(e: MouseEvent) {
      this.textClickHandler(e)
    },
    textClickHandler(e: MouseEvent) {
      if (this.getLayerType === 'text' && this.isActive && (this.$refs.text as HTMLElement).contains(e.target as Node)) {
        if (window.getSelection() && window.getSelection()!.rangeCount !== 0) {
          const sel = TextUtils.getSelection()
          if (sel) {
            TextUtils.updateSelection(sel.start, sel.end)
          }
        }
        TextPropUtils.updateTextPropsState()
      }
    },
    onKeyDown(e: KeyboardEvent) {
      if (this.config.type === 'text' && !e.ctrlKey && !e.metaKey) {
        const text = this.$refs.text as HTMLElement
        const sel = window.getSelection()
        const start = {
          pIndex: NaN,
          sIndex: NaN,
          offset: 0
        }
        if (sel) {
          const range = sel.getRangeAt(0)
          if (range) {
            const startContainer = range.startContainer
            if (startContainer.nodeName === 'DIV') {
              start.pIndex = 0
              start.sIndex = 0
            } else if (startContainer.nodeName === 'BR') {
              start.pIndex = +(startContainer?.parentElement?.dataset.pindex as string)
              start.sIndex = 0
              start.offset = 1
            } else {
              // start.sIndex = +(startContainer?.parentElement?.dataset.sindex as string)
              // start.pIndex = +(startContainer?.parentElement?.parentElement?.dataset.pindex as string)
              Object.assign(start, this.sel.start)
            }
            TextUtils.updateSelection(start, TextUtils.getNullSel())

            if (e.key === 'Backspace') {
              const isEmptyText = (this.$refs.text as HTMLElement).childNodes[0].childNodes[0].nodeName === 'BR'
              if ((start.sIndex === 0 && start.pIndex === 0 && sel.anchorOffset === 0 && sel.toString() === '') || isEmptyText) {
                e.preventDefault()
                // return
              } else {
                if (e.key === 'Backspace' || e.key === ' ') {
                  e.stopPropagation()
                }
              }
            }
          }
        }
        const observer = new MutationObserver(this.onTyping(e, this.isComposing))
        observer.observe(text, {
          characterData: true,
          childList: true,
          subtree: true,
          attributes: false,
          attributeOldValue: false,
          characterDataOldValue: false
        })
      }
    },
    onKeyUp(e: KeyboardEvent) {
      if (this.getLayerType === 'text' && TextUtils.isArrowKey(e)) {
        const sel = TextUtils.getSelection()
        TextUtils.updateSelection(sel?.start as ISelection, sel?.end as ISelection)
        TextPropUtils.updateTextPropsState()
      }
    },
    composingEnd() {
      this.isComposing = false
      const start = TextUtils.getSelection()?.start
      if (start) {
        TextUtils.updateSelection(start, TextUtils.getNullSel())
      }
      const paragraphs: IParagraph[] = TextUtils.textParser(this.$refs.text as HTMLElement, this.config as IText)
      TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
    },
    onTextFocus() {
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: true })
    },
    onTextBlur() {
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: false })
    },
    onTyping(e: KeyboardEvent, isComposing: boolean) {
      return (mutations: MutationRecord[], observer: MutationObserver) => {
        observer.disconnect()
        const text = this.$refs.text as HTMLElement
        let paragraphs: IParagraph[] = TextUtils.textParser(this.$refs.text as HTMLElement, this.config as IText)
        if (e.key !== 'Enter' && e.key !== 'Backspace') {
          paragraphs = TextUtils.newPropsHandler(paragraphs)
        }

        const sel = TextUtils.getSelection()
        let { pIndex, sIndex, offset } = this.sel.start
        // if below condition is false, means some paragraph (p-node) is removed
        if (sel && TextUtils.isSel(sel.start)) {
          pIndex = sel.start.pIndex
          sIndex = sel.start.sIndex
          offset = sel.start.offset
          if (pIndex === 0 && sIndex === 1 && parseInt((text.childNodes[0].childNodes[0] as HTMLElement).dataset.sindex ?? '1') !== 0) {
            sIndex = 0
            offset = 0
          }
          // Deleting the first span of the text, and moving the caret to the previous p
          const isSpanDeleted = paragraphs[pIndex].spans.length < (this.config as IText).paragraphs[pIndex].spans.length
          if (e.key !== 'Enter' && isSpanDeleted && sIndex === 1 && offset === 0) {
            pIndex -= 1
            sIndex = paragraphs[pIndex].spans.length - 1
            offset = paragraphs[pIndex].spans[sIndex].text.length
            // if below condition is satisfied, means there is deletion at the begining of the text (p=0, s=0, offset=0)
            if (pIndex < 0) {
              [pIndex, sIndex, offset] = [0, 0, 0]
            }
          }
        }
        if (e.key === 'Enter') {
          [sIndex, offset] = [0, 0]
          pIndex += 1
        }
        if (this.isComposing) {
          const config = GeneralUtils.deepCopy(this.config) as IText
          Object.assign(config.paragraphs, paragraphs)
          this.textSizeRefresh(config)
        } else {
          TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
          LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isEdited: true })
          // TemplateUtils.updateTextInfo(this.config)
          this.textSizeRefresh(this.config)
          this.$nextTick(() => {
            // const afterRender = (mutations: MutationRecord[], observer: MutationObserver) => {
            observer.disconnect()
            ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: false })
            StepsUtils.record()
            /**
             * TODO: For some reason while hit Enter the text block, the browser would
             * produce extra <p>, the following could temporarily fix this problem
             * p.s. not sure if this is a bug of vue
             */
            if (text.childNodes.length !== (this.config as IText).paragraphs.length) {
              let isRemoved = false
              for (const p of text.childNodes) {
                const span = p.firstChild
                if (span?.nodeName === 'SPAN' && span.firstChild?.nodeName !== '#text') {
                  text.removeChild(p)
                  isRemoved = true
                  break
                }
              }
              if (!isRemoved && text.lastChild) text.removeChild(text.lastChild)
            }
            const sel = window.getSelection()
            if (sel) {
              const currPropsState = this.props
              const isSameSpanStyles = (() => {
                if (e.key !== 'Enter' && e.key !== 'Backspace' && !Number.isNaN(pIndex) && !Number.isNaN(sIndex)) {
                  const props = ['weight', 'style', 'decoration', 'color']
                  for (const k of props) {
                    if (paragraphs[pIndex].spans[sIndex].styles[k] !== currPropsState[k]) {
                      return false
                    }
                  }
                }
                return true
              })()
              if (!isSameSpanStyles) {
                sIndex += 1
                offset = 1
              }

              if (isComposing) {
                pIndex = this.sel.start.pIndex
                sIndex = this.sel.start.sIndex
                offset = this.sel.start.offset
              } else if (TextUtils.isEmptyText(this.config)) {
                [pIndex, sIndex, offset] = [0, 0, 0]
              }
              if (!Number.isNaN(pIndex)) {
                const range = new Range()
                if (text.childNodes[pIndex].firstChild?.nodeName === 'SPAN') {
                  try {
                    range.setStart(text.childNodes[pIndex].childNodes[sIndex].firstChild as Node, offset)
                  } catch {
                    throw new Error('can not focus at text node of SPAN at: (' + pIndex + ', ' + sIndex + ')')
                  }
                } else if (text.childNodes[pIndex].firstChild?.nodeName === 'BR') {
                  try {
                    range.setStart(text.childNodes[pIndex].firstChild as Node, 0)
                  } catch {
                    throw new Error('can not focus at text node of BR at: ' + pIndex)
                  }
                }
                sel.removeAllRanges()
                sel.addRange(range)
              }
            }
            TextUtils.updateSelection({ pIndex, sIndex, offset }, TextUtils.getNullSel())
            TextPropUtils.updateTextPropsState()
          })
        }
      }
    },
    textSizeRefresh(text: IText) {
      ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: true })
      const isVertical = this.config.styles.writingMode.includes('vertical')

      let layerX = this.getLayerPos.x
      let layerY = this.getLayerPos.y
      const textHW = TextUtils.getTextHW(text, this.config.widthLimit)

      if (this.config.widthLimit === -1) {
        const pageWidth = (this.$parent.$el as HTMLElement).getBoundingClientRect().width / (this.scaleRatio / 100)
        const currTextWidth = textHW.width
        layerX = this.getLayerPos.x - (currTextWidth - this.getLayerWidth) / 2
        if (layerX <= 0) {
          layerX = 0
          textHW.width = this.getLayerWidth
          ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
        } else if (layerX + currTextWidth >= pageWidth) {
          layerX = pageWidth - this.getLayerWidth
          textHW.width = this.getLayerWidth
          ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
        }
      } else {
        const initData = {
          xSign: 1,
          ySign: 1,
          x: this.getLayerPos.x,
          y: this.getLayerPos.y,
          angle: this.getLayerRotate * Math.PI / 180
        }
        const offsetSize = {
          width: isVertical ? textHW.width - this.getLayerWidth : 0,
          height: isVertical ? 0 : textHW.height - this.getLayerHeight
        }
        const trans = ControlUtils.getTranslateCompensation(initData, offsetSize)
        layerX = trans.x
        layerY = trans.y
      }

      if (isVertical && textHW.width < 5) {
        textHW.width = this.getLayerWidth
      } else if (!isVertical && textHW.height < 5) {
        const config = GeneralUtils.deepCopy(text) as IText
        config.paragraphs[0].spans[0].text = '|'
        config.paragraphs.splice(1)
        textHW.height = TextUtils.getTextHW(config).height
      }

      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, layerX, layerY)
    },
    onDblClick() {
      if (this.getLayerType !== 'image' || this.isLocked) return
      if (this.currSelectedInfo.index < 0) {
        GroupUtils.select(this.pageIndex, [this.layerIndex])
      }
      ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true })
    },
    onRightClick(event: MouseEvent) {
      if (this.currSelectedInfo.index < 0) {
        GroupUtils.select(this.pageIndex, [this.layerIndex])
      }
      popupUtils.openPopup('layer', { event, layerIndex: this.layerIndex })
    },
    clickSubController(targetIndex: number, type: string) {
      let updateSubLayerProps = null as any
      switch (this.getLayerType) {
        case 'group':
          updateSubLayerProps = LayerUtils.updateSubLayerProps
          break
        case 'frame':
          updateSubLayerProps = FrameUtils.updateFrameLayerProps
      }

      if (this.currSubSelectedInfo.index !== -1) {
        updateSubLayerProps(this.pageIndex, this.layerIndex, this.currSubSelectedInfo.index, { active: false })
        if (this.currSubSelectedInfo.type === 'image') {
          updateSubLayerProps(this.pageIndex, this.layerIndex, this.currSubSelectedInfo.index, { imgControl: false })
        }
      }
      updateSubLayerProps(this.pageIndex, this.layerIndex, targetIndex, { active: true })
      LayerUtils.setCurrSubSelectedInfo(targetIndex, type)
    },
    dblSubController(targetIndex: number) {
      let updateSubLayerProps = null as any
      switch (this.getLayerType) {
        case 'group':
          updateSubLayerProps = LayerUtils.updateSubLayerProps
          break
        case 'frame':
          updateSubLayerProps = FrameUtils.updateFrameLayerProps
      }
      if (this.getLayerType === 'frame' && (this.config as IFrame).clips[targetIndex].srcObj.type === 'frame') {
        return
      }
      updateSubLayerProps(this.pageIndex, this.layerIndex, targetIndex, { imgControl: true })
    },
    onFrameMouseEnter(clipIndex: number) {
      if (LayerUtils.layerIndex !== this.layerIndex && ImageUtils.isImgControl()) {
        return
      }
      const currLayer = LayerUtils.getCurrLayer as IImage
      LayerUtils.setCurrSubSelectedInfo(clipIndex, 'clip')
      if (currLayer && currLayer.type === 'image' && this.isMoving) {
        const clips = GeneralUtils.deepCopy(this.config.clips) as Array<IImage>
        this.clipedImgBuff = {
          index: clipIndex,
          srcObj: {
            ...clips[clipIndex].srcObj
          },
          styles: {
            imgX: clips[clipIndex].styles.imgX,
            imgY: clips[clipIndex].styles.imgY,
            imgWidth: clips[clipIndex].styles.imgWidth,
            imgHeight: clips[clipIndex].styles.imgHeight
          }
        }
        Object.assign(clips[clipIndex].srcObj, currLayer.srcObj)
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { clips })
        LayerUtils.updateLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, { opacity: 35 })

        const clip = clips[clipIndex]
        const {
          imgWidth, imgHeight,
          imgX, imgY
        } = MouseUtils.clipperHandler(currLayer, clip.clipPath, clip.styles).styles
        FrameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, clipIndex, {
          imgWidth,
          imgHeight,
          imgX,
          imgY
        })
      }
    },
    onFrameMouseLeave(clipIndex: number) {
      const currLayer = LayerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === 'image' && this.isMoving) {
        LayerUtils.updateLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, { opacity: 100 })
        const { clips } = GeneralUtils.deepCopy(this.config) as IFrame
        Object.assign(clips[clipIndex].srcObj, this.clipedImgBuff.srcObj)
        Object.assign(clips[clipIndex].styles, this.clipedImgBuff.styles)

        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { clips })
      }
    },
    onFrameMouseUp(clipIndex: number) {
      const currLayer = LayerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === 'image') {
        LayerUtils.deleteLayer(LayerUtils.layerIndex)
        const newIndex = this.layerIndex > LayerUtils.layerIndex ? this.layerIndex - 1 : this.layerIndex
        GroupUtils.set(this.pageIndex, newIndex, [this.config])
        FrameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, clipIndex, { active: true })
      }
    },
    onFrameDragEnter(clipIndex: number) {
      LayerUtils.setCurrSubSelectedInfo(clipIndex, 'clip')
      if (this.currDraggedPhoto.srcObj.type) {
        const clips = GeneralUtils.deepCopy(this.config.clips) as Array<IImage>
        this.clipedImgBuff = {
          index: clipIndex,
          srcObj: {
            ...clips[clipIndex].srcObj
          },
          styles: {
            imgX: clips[clipIndex].styles.imgX,
            imgY: clips[clipIndex].styles.imgY,
            imgWidth: clips[clipIndex].styles.imgWidth,
            imgHeight: clips[clipIndex].styles.imgHeight
          }
        }
        Object.assign(clips[clipIndex].srcObj, this.currDraggedPhoto.srcObj)
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { clips })

        const clip = clips[clipIndex]
        const {
          imgWidth, imgHeight,
          imgX, imgY
        } = MouseUtils.clipperHandler(this.currDraggedPhoto, clip.clipPath, clip.styles).styles
        FrameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, clipIndex, {
          imgWidth,
          imgHeight,
          imgX,
          imgY
        })
      }
    },
    onFrameDragLeave(clipIndex: number) {
      if (this.currDraggedPhoto.srcObj.type) {
        const clips = GeneralUtils.deepCopy(this.config.clips) as Array<IImage>
        Object.assign(clips[clipIndex].styles, this.clipedImgBuff.styles)
        Object.assign(clips[clipIndex].srcObj, this.clipedImgBuff.srcObj)
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { clips })
      }
    },
    onFrameDrop(clipIndex: number) {
      StepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-controller {
  transform-style: preserve-3d;
  &__line-hint {
    position: absolute;
    z-index: 9;
    background-color: setColor(gray-1);
    border-radius: 5px;
    color: white;
    padding: 5px 10px;
    font-size: 14px;
  }
  &__object-hint {
    position: absolute;
    z-index: 9;
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
      font-family: Mulish;
      font-weight: 400;
      font-size: 14px;
      color: setColor(gray-2);
    }
  }
  &__content {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    transform-style: preserve-3d;
    &:hover {
      cursor: pointer;
    }
  }
  &__ctrl-points {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    &:hover {
      cursor: pointer;
    }
    pointer-events: "none";
  }

  &__lock-icon {
    @include size(30px, 30px);
    @include flexCenter;
    position: absolute;
    right: -15px;
    bottom: -15px;
    border: 1px solid setColor(red);
    border-radius: 50%;
    background-color: setColor(white);
  }
}

@mixin widget-point-wrapper {
  position: absolute;
  top: 100%;
  padding: 10px;
  box-sizing: border-box;
  transform-origin: top;
}

@mixin widget-point {
  @include size(20px, 20px);
  position: relative;
  left: 0;
  top: 0;
  pointer-events: auto;
  cursor: move;
}

.control-point {
  pointer-events: auto;
  position: absolute;
  background-color: setColor(white);
  border: 1.5px solid setColor(blue-2);
  transform-style: preserve-3d;

  &__resize-bar {
    position: absolute;
    pointer-events: auto;
    border: 2.5px solid #00000000;
    color: "#00000000";
  }
  &__rotater-wrapper {
    @include widget-point-wrapper;
  }
  &__rotater {
    @include widget-point;
  }
  &__line-controller-wrapper {
    @include widget-point-wrapper;
  }
  &__mover {
    @include widget-point;
  }
  &__move-bar {
    cursor: move;
  }
}

.text {
  &__p {
    // margin: 0.5em;
    margin: 0;
  }
  &__span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  &__wrapper {
    position: relative;
  }
  &__body {
    outline: none;
    padding: 0;
    position: relative;
  }
}

.sub-controller {
  transform-style: preserve-3d;
  position: absolute;
  top: 0;
  left: 0;
}

.text-content {
  text-align: left;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
