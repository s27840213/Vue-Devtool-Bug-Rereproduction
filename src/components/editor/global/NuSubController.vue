<template lang="pug">
  div(class="nu-sub-controller")
    div(class="nu-sub-controller__content"
        ref="body"
        :layer-index="`${layerIndex}`"
        :style="styles('')"
        @dblclick="onDblClick()"
        @click.left.stop="onClickEvent($event)"
        @mousedown="onMousedown($event)")
      svg(class="full-width" v-if="config.type === 'image' && (config.isFrame || config.isFrameImg)"
          :viewBox="`0 0 ${config.isFrameImg ? config.styles.width : config.styles.initWidth} ${config.isFrameImg ? config.styles.height : config.styles.initHeight}`")
          g(v-html="!config.isFrameImg ? FrameUtils.frameClipFormatter(config.clipPath) : `<path d='M0,0h${config.styles.width}v${config.styles.height}h${-config.styles.width}z'></path>`"
            :style="frameClipStyles()"
            @drop="onFrameDrop()"
            @dragenter="onDrageEnter()"
            @dragleave="onDragLeave()")
      template(v-if="config.type === 'text' && config.active")
        div(class="text text__wrapper" :style="textWrapperStyle()" draggable="false")
          nu-text-editor(:initText="textHtml" :id="`text-sub-${primaryLayerIndex}-${layerIndex}`"
            :style="textBodyStyle()"
            :pageIndex="pageIndex"
            :layerIndex="primaryLayerIndex"
            :subLayerIndex="layerIndex"
            @keydown.native.37.stop
            @keydown.native.38.stop
            @keydown.native.39.stop
            @keydown.native.40.stop
            @keydown.native.ctrl.67.exact.stop.self
            @keydown.native.meta.67.exact.stop.self
            @keydown.native.ctrl.86.exact.stop.self
            @keydown.native.meta.86.exact.stop.self
            @keydown.native.ctrl.65.exact.stop.self
            @keydown.native.meta.65.exact.stop.self
            @keydown.native.ctrl.90.exact.stop.self
            @keydown.native.meta.90.exact.stop.self
            @keydown.native.ctrl.shift.90.exact.stop.self
            @keydown.native.meta.shift.90.exact.stop.self
            @update="handleTextChange")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import { ICoordinate } from '@/interfaces/frame'
import { IFrame, IGroup, IParagraph, IText } from '@/interfaces/layer'
import { IControlPoints } from '@/interfaces/controller'
import MappingUtils from '@/utils/mappingUtils'
import TextUtils from '@/utils/textUtils'
import TextPropUtils from '@/utils/textPropUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import StepsUtils from '@/utils/stepsUtils'
import LayerUtils from '@/utils/layerUtils'
import GeneralUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import FrameUtils from '@/utils/frameUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import { ISelection } from '@/interfaces/text'
import { FunctionPanelType, PopupSliderEventType } from '@/store/types'
import popupUtils from '@/utils/popupUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import NuTextEditor from '@/components/editor/global/NuTextEditor.vue'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    primaryLayerIndex: Number,
    snapUtils: Object,
    type: String
  },
  components: {
    NuTextEditor
  },
  data() {
    return {
      MappingUtils,
      FrameUtils,
      ShortcutUtils,
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      isComposing: false,
      layerSizeBuff: -1,
      posDiff: { x: 0, y: 0 },
      parentId: ''
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
    this.parentId = this.getPrimaryLayer.id as string
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    ...mapGetters({
      middlemostPageIndex: 'getMiddlemostPageIndex',
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType'
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
    isLocked(): boolean {
      return this.config.locked
    },
    isTextEditing(): boolean {
      return !this.isControlling
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
    getPrimaryLayer(): IGroup | IFrame {
      return LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex) as IGroup | IFrame
    },
    textHtml(): any {
      return tiptapUtils.toJSON(this.config.paragraphs)
    },
    contentEditable(): boolean {
      return this.config.contentEditable
    },
    isCurveText(): any {
      const { textShape } = this.config.styles
      return textShape && textShape.name === 'curve'
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
    },
    isActive(val) {
      if (val) {
        // @todo
        if (this.getCurrFunctionPanelType === FunctionPanelType.colorPicker && this.getLayerType === 'shape') {
          // colorUtils.setCurrColor(this.getColors[index])
        }
      }
      if (!val) {
        this.setLastSelectedLayerIndex(this.primaryLayerIndex)
        if (this.getLayerType === 'text') {
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
            editing: false,
            isTyping: false
          })
          this.isControlling = false

          if (this.currTextInfo.subLayerIndex === this.layerIndex) {
            TextUtils.setCurrTextInfo({
              config: LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex) as IGroup,
              subLayerIndex: undefined
            })
          }
        }
        popupUtils.closePopup()
      } else {
        TextUtils.setCurrTextInfo({
          config: this.config as IText,
          subLayerIndex: this.layerIndex
        })
      }
      TextUtils.updateSelection(TextUtils.getNullSel(), TextUtils.getNullSel())
    },
    isTextEditing(editing) {
      if (this.getLayerType === 'text') {
        LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { editing })
        if (editing && !this.config.isEdited) {
          // ShortcutUtils.textSelectAll(this.layerIndex)
        }
      }
    },
    isComposing(val) {
      if (!val) {
        this.layerSizeBuff = this.config.styles.writingMode.includes('vertical')
          ? this.getLayerWidth : this.getLayerHeight
      } else {
        this.layerSizeBuff = -1
      }
    },
    contentEditable(newVal) {
      tiptapUtils.agent(editor => editor.setEditable(newVal))
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: newVal })
    }
  },
  destroyed() {
    // the condition indicates the primaryLayer transform from group-layer to tmp-layer
    if (this.getLayerType === 'text' && this.getPrimaryLayer && this.getPrimaryLayer.id === this.parentId) {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { editing: false })
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { isTyping: false })
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened'
    }),
    frameClipStyles() {
      return {
        fill: '#00000000',
        stroke: this.isActive ? (this.config.isFrameImg ? '#F10994' : '#7190CC') : 'none',
        strokeWidth: `${2.5 * (100 / this.scaleRatio)}px`
      }
    },
    textScaleStyle() {
      return {
        position: 'absolute',
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
        width: `${this.getLayerWidth / this.getLayerScale}px`,
        height: `${this.getLayerHeight / this.getLayerScale}px`,
        // width: isVertical ? 'auto' : `${this.getLayerWidth / this.getLayerScale}px`,
        // height: isVertical ? '' : 'auto',
        userSelect: this.contentEditable ? 'text' : 'none',
        opacity: this.isTextEditing ? (this.isCurveText && !this.contentEditable ? 0 : 1) : 0
      }
    },
    textStyles(styles: any) {
      const textStyles = CssConveter.convertFontStyle(styles)
      Object.assign(textStyles, {
        'caret-color': this.contentEditable && !this.isControlling ? '' : '#00000000'
      })
      return textStyles
    },
    groupControllerStyle() {
      return {
        width: `${this.config.styles.width / this.getLayerScale}px`,
        height: `${this.config.styles.height / this.getLayerScale}px`,
        position: 'absolute',
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`
      }
    },
    onMousedown() {
      if (this.type === 'tmp') return
      if (this.getLayerType === 'text') {
        this.posDiff.x = this.getPrimaryLayer.styles.x
        this.posDiff.y = this.getPrimaryLayer.styles.y
        if (this.isActive && this.contentEditable) return
        else if (!this.isActive) {
          this.isControlling = true
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: false })
          document.addEventListener('mouseup', this.onMouseup)
          return
        }
        LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: true })
      }
      document.addEventListener('mouseup', this.onMouseup)
      this.isControlling = true
    },
    onMouseup() {
      if (this.getLayerType === 'text') {
        this.posDiff.x = this.getPrimaryLayer.styles.x - this.posDiff.x
        this.posDiff.y = this.getPrimaryLayer.styles.y - this.posDiff.y
        if (Math.round(this.posDiff.x) !== 0 || Math.round(this.posDiff.y) !== 0) {
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: false })
        }
      }
      document.removeEventListener('mouseup', this.onMouseup)
      this.isControlling = false
    },
    styles(type: string) {
      const zindex = (type === 'control-point') || (this.isActive && this.getLayerType === 'text')
        ? (this.layerIndex + 1) * 100 : (this.config.styles.zindex + 1)
      return {
        transform: `translate3d(${this.config.styles.x}px, ${this.config.styles.y}px, ${zindex}px) rotate(${this.config.styles.rotate}deg) `,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        outline: this.outlineStyles(),
        'pointer-events': 'initial',
        ...TextEffectUtils.convertTextEffect(this.config.styles.textEffect)
      }
    },
    outlineStyles() {
      const outlineColor = this.isLocked ? '#EB5757' : '#7190CC'
      const currLayer = LayerUtils.getCurrLayer
      const primaryScale = currLayer.styles.scale
      if (this.isActive && LayerUtils.getCurrLayer.type !== 'frame') {
        if (this.isControlling) {
          return `${2 * (100 / this.scaleRatio) / primaryScale}px dashed ${outlineColor}`
        } else {
          return `${2 * (100 / this.scaleRatio) / primaryScale}px solid ${outlineColor}`
        }
      } else {
        return 'none'
      }
    },
    onRightClick(event: MouseEvent) {
      if (!this.isLocked) {
        this.setIsLayerDropdownsOpened(true)
        this.$nextTick(() => {
          const el = document.querySelector('.dropdowns--layer') as HTMLElement
          const mousePos = MouseUtils.getMouseAbsPoint(event)
          el.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px,0)`
          el.focus()
        })
      }
    },
    handleTextChange(payload: { paragraphs: IParagraph[], isSetContentRequired: boolean }) {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { paragraphs: payload.paragraphs })
      // !this.isCurveText && this.textSizeRefresh(this.config)
      !this.isCurveText && TextUtils.updateGroupLayerSize(this.pageIndex, this.primaryLayerIndex, this.layerIndex)
      if (payload.isSetContentRequired && !tiptapUtils.editor?.view?.composing) {
        this.$nextTick(() => {
          tiptapUtils.agent(editor => {
            editor.chain().setContent(tiptapUtils.toJSON(payload.paragraphs)).selectPrevious().run()
          })
        })
      }
    },
    textSizeRefresh(text: IText) {
      // const group = LayerUtils.getCurrLayer as IGroup
      // const originSize = { width: this.getLayerWidth, height: this.getLayerHeight }
      // const isAllHorizon = !group.layers
      //   .some(l => l.type === 'text' &&
      //     ((l as IText).styles.writingMode.includes('vertical') || l.styles.rotate !== 0))

      // const newSize = TextUtils.getTextHW(text, this.config.widthLimit)
      // if (this.layerSizeBuff === -1) {
      //   this.layerSizeBuff = newSize.height
      // } else if (newSize.height === this.layerSizeBuff) {
      //   return
      // }

      // if (isAllHorizon) {
      //   const lowLine = this.getLayerPos.y + originSize.height
      //   const diff = newSize.height - originSize.height
      //   const targetSubLayers: Array<[number, number]> = []
      //   group.layers
      //     .forEach((l, idx) => {
      //       if (l.styles.y >= lowLine) {
      //         targetSubLayers.push([idx, l.styles.y])
      //       }
      //     })
      //   targetSubLayers
      //     .forEach(data => {
      //       LayerUtils.updateSubLayerStyles(this.pageIndex, this.primaryLayerIndex, data[0], {
      //         y: data[1] + diff
      //       })
      //     })
      // }
      // @TODO: the vertical kind pending

      TextUtils.updateGroupLayerSize(this.pageIndex, this.primaryLayerIndex, this.layerIndex)
    },
    onClickEvent(e: MouseEvent) {
      if (this.type === 'tmp') {
        if (GeneralUtils.exact([e.shiftKey, e.ctrlKey, e.metaKey])) {
          groupUtils.deselectTargetLayer(this.layerIndex)
        }
        return
      }
      this.$emit('clickSubController', this.layerIndex, this.config.type)
    },
    onDblClick() {
      if (this.type === 'tmp') {
        return
      }
      this.$emit('dblSubController', this.layerIndex)
    },
    onTextFocus() {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { isTyping: true })
    },
    onTextBlur() {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { isTyping: false })
    },
    onDrageEnter() {
      if (!LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex).locked) {
        this.$emit('onFrameDragenter', this.layerIndex)
      }
    },
    onDragLeave() {
      if (!LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex).locked) {
        this.$emit('onFrameDragleave', this.layerIndex)
      }
    },
    onFrameDrop() {
      if (!LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex).locked) {
        this.$emit('onFrameDrop')
      }
    },
    preventDefault(e: Event) {
      e.preventDefault()
    },
    undo() {
      ShortcutUtils.undo()
      LayerUtils.updateLayerProps(this.pageIndex, this.primaryLayerIndex, { active: true })
      LayerUtils.updateSubLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { active: true })
      setTimeout(() => TextUtils.focus({ pIndex: 0, sIndex: 0, offset: 0 }, TextUtils.getNullSel(), this.layerIndex), 0)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-sub-controller {
  transform-style: preserve-3d;
  &__content {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    // &:hover {
    //   cursor: pointer;
    // }
  }
  &__ctrl-points {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    // &:hover {
    //   cursor: pointer;
    // }
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
    padding: 20px;
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
  p {
    margin: 0;
  }
  span {
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

.text-content {
  text-align: left;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
