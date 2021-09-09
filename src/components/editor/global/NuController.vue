<template lang="pug">
  keep-alive
    div(class="nu-controller")
      div(class="nu-controller__content"
          ref="body"
          :layer-index="`${layerIndex}`"
          :style="styles('')"
          @drop="config.path !== '' || config.isClipped ? onDropClipper($event) : onDrop($event)"
          @dragover.prevent,
          @dragenter.prevent
          @click.left="onClick"
          @click.right.stop="onRightClick"
          @mousedown.left="moveStart"
          @mouseout.stop="toggleHighlighter(pageIndex,layerIndex,false)"
          @mouseover.stop="toggleHighlighter(pageIndex,layerIndex,true)"
          @dblclick="onDblClick")
        template(v-if="config.type === 'text' && config.active")
          //- div(class="text__scale" :style="textScaleStyle()")
          div(class="text__wrapper" :style="textWrapperStyle()")
            div(ref="text" :id="`text-${layerIndex}`" spellcheck="false"
              :style="textBodyStyle()"
              class="text__body"
              :contenteditable="config.type === 'tmp' ? false : contentEditable"
              @compositionstart="isComposing = true"
              @compositionend="composingEnd"
              @keydown="onKeyDown"
              @keydown.ctrl.67.exact.stop.prevent.self="ShortcutUtils.textCopy()"
              @keydown.meta.67.exact.stop.prevent.self="ShortcutUtils.textCopy()"
              @keydown.ctrl.86.exact.stop.prevent.self="ShortcutUtils.textPaste()"
              @keydown.meta.86.exact.stop.prevent.self="ShortcutUtils.textPaste()"
              @keydown.ctrl.65.exact.stop.prevent.self="ShortcutUtils.textSelectAll()"
              @keydown.meta.65.exact.stop.prevent.self="ShortcutUtils.textSelectAll()"
              @keyup="onKeyUp")
              p(v-for="(p, pIndex) in config.paragraphs" class="text__p"
                :data-pindex="pIndex"
                :key="p.id",
                :style="textStyles(p.styles)")
                span(v-for="(span, sIndex) in p.spans" class="text__span"
                  :data-sindex="sIndex"
                  :key="span.id",
                  :style="textStyles(span.styles)") {{ span.text }}
        div(v-if="isActive && isLocked && (scaleRatio >20)"
            class="nu-controller__lock-icon"
            :style="`transform: scale(${100/scaleRatio})`")
          svg-icon(:iconName="'lock'" :iconWidth="`${20}px`" :iconColor="'red'"
            @click.native="MappingUtils.mappingIconAction('unlock')")
      div(v-if="isActive && !isControlling && !isLocked"
          class="nu-controller__ctrl-points"
          :style="Object.assign(styles('control-point'), {'pointer-events': 'none'})")
          div(v-for="(scaler, index) in controlPoints.scalers"
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
          div(class="control-point__rotater-wrapper"
              :style="`transform: scale(${100/scaleRatio})`")
            img(class="control-point__rotater"
              :src="require('@/assets/img/svg/rotate.svg')"
              @mousedown.left.stop="rotateStart")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { ICoordinate } from '@/interfaces/frame'
import { IImage, IParagraph, IShape, IText } from '@/interfaces/layer'
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
      ShortcutUtils,
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      initialPos: { x: 0, y: 0 },
      initTranslate: { x: 0, y: 0 },
      initSize: { width: 0, height: 0 },
      initImgSize: { width: 0, height: 0 },
      imgBuffer: { width: 0, height: 0, x: 0, y: 0 },
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1, imgX: 0, imgY: 0, isHorizon: false },
      scale: { scaleX: 1, scaleY: 1 },
      isComposing: false,
      isSnapping: false,
      contentEditable: false,
      subControlerIndexs: []
    }
  },
  mounted() {
    const body = this.$refs.body as HTMLElement
    /**
     * Prevent the context menu from showing up when right click or Ctrl + left click on controller
     */
    body.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
    }, false)
    this.setLastSelectedLayerIndex(this.layerIndex)
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo'
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
    isActive(): boolean {
      return this.config.active
    },
    isShown(): boolean {
      return this.config.shown
    },
    isLocked(): boolean {
      return this.config.locked
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
        const text = this.$refs.text as HTMLElement
        if (text && text.childNodes[0].childNodes[0].nodeName !== 'SPAN') {
          LayerUtils.deleteLayer(this.lastSelectedLayerIndex)
          return
        }

        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
          editing: false
        })
        if (this.currSelectedInfo.layers.length <= 1) {
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
      }
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened'
    }),
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
        case 'image':
          resizers = this.config.isClipper ? [] : resizers
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
      }
      return resizers
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
      LayerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    styles(type: string) {
      const zindex = type === 'control-point' ? (this.layerIndex + 1) * 100 : (this.layerIndex + 1)
      const outlineColor = this.isLocked ? '#EB5757' : '#7190CC'
      return {
        transform: `translate3d(${this.config.styles.x}px, ${this.config.styles.y}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        outline: this.isShown || this.isActive ? ((this.config.type === 'tmp' || this.isControlling)
          ? `${2 * (100 / this.scaleRatio)}px dashed ${outlineColor}` : `${2 * (100 / this.scaleRatio)}px solid ${outlineColor}`) : 'none',
        'pointer-events': (this.isActive || this.isShown) ? 'initial' : 'initial',
        ...TextEffectUtils.convertTextEffect(this.config.styles.textEffect)
      }
    },
    outlineStyles(type: string) {
      const zindex = type === 'control-point' ? (this.layerIndex + 1) * 100 : (this.layerIndex + 1)
      const outlineColor = this.isLocked ? '#EB5757' : '#7190CC'
      return {
        position: 'relative',
        width: '100%',
        height: '100%',
        outline: this.isShown || this.isActive ? ((this.config.type === 'tmp' || this.isControlling)
          ? `${2 * (100 / this.scaleRatio)}px dashed ${outlineColor}` : `${2 * (100 / this.scaleRatio)}px solid ${outlineColor}`) : 'none'
      }
    },
    moveStart(e: MouseEvent) {
      if (!this.isLocked) {
        e.stopPropagation()
      }
      this.initTranslate = this.getLayerPos
      if (this.getLayerType === 'text') {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
          dragging: true
        })
        if (this.isActive && this.contentEditable && !(e.target as HTMLElement).classList.contains('control-point__move-bar')) {
          return
        } else if (!this.isActive) {
          let targetIndex = this.layerIndex
          if (!GeneralUtils.exact([e.shiftKey, e.ctrlKey, e.metaKey]) && this.currSelectedInfo.index >= 0) {
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
      if (!this.config.locked) {
        this.isControlling = true
        this.initialPos = MouseUtils.getMouseAbsPoint(e)
        window.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)
      }
      if (this.config.type !== 'tmp') {
        let targetIndex = this.layerIndex
        if (!this.isActive) {
          // already have selected layer
          if (this.currSelectedInfo.index >= 0) {
            // Did not press shift/cmd/ctrl key -> deselect selected layers first
            if (!GeneralUtils.exact([e.shiftKey, e.ctrlKey, e.metaKey])) {
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
      }
    },
    imgHandler(offset: ICoordinate) {
      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, this.config.styles.imgX, this.config.styles.imgY)
    },
    moveEnd() {
      if (this.isActive) {
        const posDiff = {
          x: Math.abs(this.getLayerPos.x - this.initTranslate.x),
          y: Math.abs(this.getLayerPos.y - this.initTranslate.y)
        }
        if (this.getLayerType === 'text' && (Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0)) {
          this.contentEditable = false
        }
        this.isControlling = false
        this.setCursorStyle('default')
        window.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
        StepsUtils.record()
        LayerUtils.isOutOfBoundary()
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
      if (width <= 40 || height <= 40) return

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
          const path = `M0 0 L0 ${height} ${width} ${height} ${width} 0Z`

          ControlUtils.updateImgSize(this.pageIndex, this.layerIndex, imgWidth * scale, imgHeight * scale)
          ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, imgX * scale, imgY * scale)
          ControlUtils.updateImgClipPath(this.pageIndex, this.layerIndex, `path('${path}')`)
          scale = this.getLayerScale
          break
        }
        case 'text':
          if (this.config.widthLimit !== -1) {
            ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
              widthLimit: (this.config as IText).styles.writingMode.includes('vertical') ? height : width
            })
          }
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

      if (this.getLayerType === 'shape' && this.config.category === 'B') {
        this.scale = {
          scaleX: this.config.styles.scaleX,
          scaleY: this.config.styles.scaleY
        }
      } else if (this.getLayerType === 'image') {
        this.initImgSize = {
          width: this.config.styles.imgWidth,
          height: this.config.styles.imgHeight
        }
        this.control.imgX = this.config.styles.imgX
        this.control.imgY = this.config.styles.imgY
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
      if (width <= 20 || height <= 20) return

      const offsetSize = {
        width: width - initWidth,
        height: height - initHeight
      }

      const scale = this.getLayerScale
      switch (this.getLayerType) {
        case 'image':
          this.imgResizeHandler(width, height, offsetWidth, offsetHeight)
          break
        case 'shape': {
          [width, height] = ControlUtils.resizeShapeHandler(this.config, this.scale, this.initSize, width, height)
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
    resizeExceedLimit(width: number, height: number, offsetX: number, offsetY: number): boolean {
      const imgPos = {
        x: this.control.imgX,
        y: this.control.imgY
      }
      /**
       * Below is a conclusion of checking-if-the-Resizer-exceed-limit for the top/left resizer
       * The origin derived algorithm is described as in imgContorller.vue: moving section
       */
      if ((this.control.isHorizon && this.control.xSign < 0) || (!this.control.isHorizon && this.control.ySign < 0)) {
        imgPos.x += offsetX / this.getLayerScale
        imgPos.y += offsetY / this.getLayerScale
        if (imgPos.x > 0 || imgPos.y > 0) {
          return true
        }
      } else {
        width += offsetX
        height += offsetY
        if (this.control.isHorizon && width - imgPos.x * this.getLayerScale > this.initImgSize.width * this.getLayerScale) {
          return true
        }
        if (!this.control.isHorizon && height - imgPos.y * this.getLayerScale > this.initImgSize.height * this.getLayerScale) {
          return true
        }
      }
      return false
    },
    imgResizeHandler(width: number, height: number, offsetWidth: number, offsetHeight: number) {
      let offsetX
      let offsetY
      if ((this.control.isHorizon && this.control.xSign < 0) || (!this.control.isHorizon && this.control.ySign < 0)) {
        offsetX = offsetWidth
        offsetY = offsetHeight
      }
      if (this.resizeExceedLimit(this.initSize.width, this.initSize.height, offsetWidth, offsetHeight)) {
        if (this.imgBuffer.width === 0 && this.imgBuffer.height === 0) {
          this.imgScaling(width + offsetWidth, height + offsetHeight, 0, 0)
          this.imgBuffer.width = offsetWidth
          this.imgBuffer.height = offsetHeight
        }
        this.imgScaling(width, height, offsetWidth - this.imgBuffer.width, offsetHeight - this.imgBuffer.height)
      } else {
        this.imgClipping(width, height, offsetX, offsetY)
      }
    },
    imgScaling(layerWidth: number, layerHeight: number, offsetWidth: number, offsetHeight: number) {
      ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, layerWidth, layerHeight, this.getLayerScale)
      let imgWidth = this.initImgSize.width
      let imgHeight = this.initImgSize.height
      const imgPos = {
        x: this.control.imgX,
        y: this.control.imgY
      }

      const ratio = imgHeight / imgWidth
      const width = layerWidth / this.getLayerScale
      const height = layerHeight / this.getLayerScale
      offsetWidth /= this.getLayerScale
      offsetHeight /= this.getLayerScale
      const path = `M0 0 L0 ${height} ${width} ${height} ${width} 0Z`

      if (this.control.isHorizon) {
        imgWidth += offsetWidth
        imgHeight = imgWidth * ratio
      } else {
        imgHeight += offsetHeight
        imgWidth = imgHeight / ratio
      }
      /**
       * Below is used to make sure the imgHW are always larger than (at least equal to) the layerHW,
       * This guarantee the exceedLimitation returns the expect value.
       * p.s. The reason of this the problem which the imgHW somehow smaller than the layerHW might
       * be caused by the 'rounding-number' of the ratio.
       */
      if (imgHeight < layerHeight) {
        imgHeight = layerHeight
        imgWidth = layerHeight / ratio
      } else if (imgWidth < layerWidth) {
        imgWidth = layerWidth
        imgHeight = layerWidth * ratio
      }
      if (this.control.isHorizon) {
        imgPos.y -= (imgHeight - this.initImgSize.height) / 2
        imgPos.x = this.control.xSign > 0 ? -(imgWidth - width) : 0
      } else {
        imgPos.x -= (imgWidth - this.initImgSize.width) / 2
        imgPos.y = this.control.ySign > 0 ? -(imgHeight - height) : 0
      }
      if (this.imgBuffer.x === 0 && this.imgBuffer.y === 0) {
        this.imgBuffer.x = -(imgWidth - this.initImgSize.width) / 2
        this.imgBuffer.y = -(imgHeight - this.initImgSize.height) / 2
      }

      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, imgPos.x, imgPos.y)
      ControlUtils.updateImgSize(this.pageIndex, this.layerIndex, imgWidth, imgHeight)
      ControlUtils.updateImgClipPath(this.pageIndex, this.layerIndex, `path('${path}')`)
    },
    imgClipping(width: number, height: number, offsetX: number | undefined, offsetY: number | undefined) {
      ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, width, height, this.getLayerScale)
      const imgX = this.control.imgX
      const imgY = this.control.imgY
      const scale = this.getLayerScale
      width /= scale
      height /= scale
      const path = `M0 0 L0 ${height} ${width} ${height} ${width} 0Z`

      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, (offsetX ?? 0) / scale + imgX, (offsetY ?? 0) / scale + imgY)
      ControlUtils.updateImgSize(this.pageIndex, this.layerIndex, this.initImgSize.width, this.initImgSize.height)
      ControlUtils.updateImgClipPath(this.pageIndex, this.layerIndex, `path('${path}')`)
    },
    resizeEnd() {
      this.imgBuffer = { width: 0, height: 0, x: 0, y: 0 }
      this.isControlling = false
      StepsUtils.record()
      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.resizing)
      document.documentElement.removeEventListener('mouseup', this.resizeEnd)
      this.$emit('setFocus')
    },
    rotateStart(event: MouseEvent) {
      this.setCursorStyle('move')
      this.isControlling = true

      const body = this.$refs.body as HTMLElement
      const rect = body.getBoundingClientRect()
      this.center = {
        x: rect.left + rect.width / 2 - window.pageXOffset,
        y: rect.top + rect.height / 2 - window.pageYOffset
      }

      this.initialPos = MouseUtils.getMouseAbsPoint(event)

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
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        angle += this.getLayerRotate % 360
        ControlUtils.updateLayerRotate(this.pageIndex, this.layerIndex, angle)
      }
    },
    rotateEnd() {
      this.isControlling = false
      StepsUtils.record()
      this.setCursorStyle('default')
      window.removeEventListener('mousemove', this.rotating)
      window.removeEventListener('mouseup', this.rotateEnd)
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
      layer.style.cursor = cursor
      document.body.style.cursor = cursor
    },
    currCursorStyling(e: MouseEvent) {
      const el = e.target as HTMLElement
      this.setCursorStyle(el.style.cursor)
    },
    onDrop(e: DragEvent) {
      console.log('drop')
      MouseUtils.onDrop(e, this.pageIndex, this.getLayerPos)
    },
    onDropClipper(e: DragEvent) {
      switch (this.getLayerType) {
        case 'image': {
          const config = this.config as IImage
          MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, config.clipPath, config.isClipper, config.styles)
          break
        }
        case 'shape': {
          const config = this.config as IShape
          MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, config.path, true, config.styles)
          break
        }
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
            // TODO: deletion at the begining of the text cause bug.
            start.pIndex = parseInt(startContainer?.parentElement?.parentElement?.dataset.pindex as string)
            start.sIndex = parseInt(startContainer?.parentElement?.dataset.sindex as string)
            // start.offset = sel.anchorOffset
            TextUtils.updateSelection(start, start)

            if (e.key === 'Backspace') {
              const isEmptyText = (this.$refs.text as HTMLElement).childNodes[0].childNodes[0].nodeName === 'BR'
              if ((start.sIndex === 0 && start.pIndex === 0 && sel.anchorOffset === 0 && sel.toString() === '') || isEmptyText) {
                e.preventDefault()
                return
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
        TextUtils.updateSelection(start, start)
      }
      const paragraphs: IParagraph[] = TextUtils.textParser(this.$refs.text as HTMLElement, this.config as IText)
      TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
    },
    onTyping(e: KeyboardEvent, isComposing: boolean) {
      return (mutations: MutationRecord[], observer: MutationObserver) => {
        observer.disconnect()
        /**
         * All text is been deleted, the first node of the paragraph will be 'BR'
         */
        if ((this.$refs.text as HTMLElement).childNodes[0].childNodes[0].nodeName === 'BR') return

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
          TemplateUtils.updateTextInfo(this.config)
          this.textSizeRefresh(this.config)
          this.$nextTick(() => {
            ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: false })
            if (text.childNodes.length > (this.config as IText).paragraphs.length && text.lastChild) {
              text.removeChild(text.lastChild)
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

              const range = new Range()
              range.setStart(text.childNodes[pIndex].childNodes[sIndex].firstChild as Node, offset)
              sel.removeAllRanges()
              sel.addRange(range)
            }
            TextUtils.updateSelection({ pIndex, sIndex, offset }, { pIndex: NaN, sIndex: NaN, offset: NaN })
            if (e.key !== 'Enter') {
              TextPropUtils.updateTextPropsState()
            }
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

      // console.log('textHW---')
      // console.log(textHW.height)
      if (isVertical && textHW.width < 5) {
        textHW.width = this.getLayerWidth
      } else if (!isVertical && textHW.height < 5) {
        const config = GeneralUtils.deepCopy(text) as IText
        config.paragraphs[0].spans[0].text = '|'
        config.paragraphs.splice(1)
        textHW.height = TextUtils.getTextHW(config).height
        // console.log('textHW.height')
        // console.log(textHW.height)
      }

      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, layerX, layerY)
    },
    onDblClick() {
      if (this.getLayerType !== 'image' || this.isLocked) return
      ControlUtils.updateImgControl(this.pageIndex, this.layerIndex, true)
    },
    onRightClick(event: MouseEvent) {
      this.setIsLayerDropdownsOpened(true)
      if (this.currSelectedInfo.index < 0) {
        GroupUtils.select(this.pageIndex, [this.layerIndex])
      }
      this.$nextTick(() => {
        const el = document.querySelector('.dropdowns--layer') as HTMLElement
        const mousePos = MouseUtils.getMouseAbsPoint(event)
        el.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px,0)`
        el.focus()
      })
    },
    clickSubController(indexs: Array<number>) {
      indexs.unshift(this.layerIndex)
      this.subControlerIndexs = GeneralUtils.deepCopy(indexs)
      LayerUtils.updateSubLayerProps(this.pageIndex, indexs, { active: true })
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-controller {
  &__content {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
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
    position: absolute;
    top: 100%;
    padding: 10px;
    box-sizing: border-box;
    transform-origin: top;
  }
  &__rotater {
    @include size(20px, 20px);
    position: relative;
    left: 0;
    top: 0;
    pointer-events: auto;
    cursor: move;
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
  &__scale {
    // position: absolute;
    // top: 0;
    // left: 0;
    // height: 100%;
    // width: 100%;
    // position: relative;
    // transform-origin: 0px 0px;
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

.text-content {
  text-align: left;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
