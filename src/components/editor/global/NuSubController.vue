<template lang="pug">
  keep-alive
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
            g(v-html="config.clipPath ? FrameUtils.frameClipFormatter(config.clipPath) : `<path d='M0,0h${getLayerWidth}v${getLayerHeight}h${-getLayerWidth}z'></path>`"
              :style="frameClipStyles()"
              @drop="onFrameDrop()"
              @dragenter="onDrageEnter()"
              @dragleave="onDragLeave()")
        template(v-if="config.type === 'text' && config.active")
          div(class="text text__wrapper" :style="textWrapperStyle()")
            div(ref="text" :id="`text-sub-${primaryLayerIndex}-${layerIndex}`" spellcheck="false"
              @dragstart="preventDefault($event)"
              :style="textBodyStyle()"
              class="text__body"
              :contenteditable="contentEditable"
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
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import { ICoordinate } from '@/interfaces/frame'
import { IFrame, IGroup, IImage, IParagraph, IParagraphStyle, IShape, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import { IControlPoints } from '@/interfaces/controller'
import MappingUtils from '@/utils/mappingUtils'
import TextUtils from '@/utils/textUtils'
import TemplateUtils from '@/utils/templateUtils'
import TextPropUtils from '@/utils/textPropUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import StepsUtils from '@/utils/stepsUtils'
import LayerUtils from '@/utils/layerUtils'
import GeneralUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import FrameUtils from '@/utils/frameUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import { ISelection } from '@/interfaces/text'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    primaryLayerIndex: Number,
    snapUtils: Object,
    type: String
  },
  data() {
    return {
      MappingUtils,
      FrameUtils,
      ShortcutUtils,
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      isComposing: false,
      layerSizeBuff: 0,
      contentEditable: true,
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
    ...mapState('text', ['sel', 'props']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
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
    isTextEditing(): boolean {
      // return !this.isControlling && this.contentEditable
      // @Test
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
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
    },
    isActive(val) {
      if (!val) {
        this.setLastSelectedLayerIndex(this.primaryLayerIndex)
        if (this.getLayerType === 'text') {
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
            editing: false,
            isTyping: false
          })
          TextUtils.updateSelection(TextUtils.getNullSel(), TextUtils.getNullSel())
          this.contentEditable = false
          this.isControlling = false
        }
      }
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
        this.layerSizeBuff = NaN
      }
    }
  },
  destroyed() {
    if (this.getLayerType === 'text' && this.getPrimaryLayer && this.getPrimaryLayer.id === this.parentId) {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { editing: false })
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { isTyping: false })
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
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
        width: isVertical ? 'auto' : `${this.getLayerWidth / this.getLayerScale}px`,
        height: isVertical ? '' : 'auto',
        userSelect: this.contentEditable ? 'text' : 'none',
        opacity: this.isTextEditing ? 1 : 0
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
      if (this.getLayerType === 'text') {
        this.posDiff.x = this.getPrimaryLayer.styles.x
        this.posDiff.y = this.getPrimaryLayer.styles.y
        if (this.isActive && this.contentEditable) return
        else if (!this.isActive) {
          this.isControlling = true
          this.contentEditable = false
          document.addEventListener('mouseup', this.onMouseup)
          return
        }
        this.contentEditable = true
      }
      document.addEventListener('mouseup', this.onMouseup)
      this.isControlling = true
    },
    onMouseup() {
      if (this.getLayerType === 'text') {
        this.posDiff.x = this.getPrimaryLayer.styles.x - this.posDiff.x
        this.posDiff.y = this.getPrimaryLayer.styles.y - this.posDiff.y
        if (Math.round(this.posDiff.x) !== 0 || Math.round(this.posDiff.y) !== 0) {
          this.contentEditable = false
        }
      }
      document.removeEventListener('mouseup', this.onMouseup)
      this.isControlling = false
    },
    styles(type: string) {
      const zindex = (type === 'control-point') || (this.isActive && this.getLayerType === 'text')
        ? (this.layerIndex + 1) * 100 : (this.config.styles.zindex + 1)
      const outlineColor = this.isLocked ? '#EB5757' : '#7190CC'
      const outline = (() => {
        if ((this.isShown || this.isActive) && LayerUtils.getCurrLayer.type !== 'frame') {
          if (this.config.type === 'tmp' || this.isControlling) {
            return `${2 * (100 / this.scaleRatio)}px dashed ${outlineColor}`
          } else {
            return `${2 * (100 / this.scaleRatio)}px solid ${outlineColor}`
          }
        } else {
          return 'none'
        }
      })()
      return {
        transform: `translate3d(${this.config.styles.x}px, ${this.config.styles.y}px, ${zindex}px) rotate(${this.config.styles.rotate}deg) `,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        outline,
        'pointer-events': (this.isActive || this.isShown) ? 'initial' : 'initial',
        ...TextEffectUtils.convertTextEffect(this.config.styles.textEffect)
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
              Object.assign(start, this.sel.start)
            }
            TextUtils.updateSelection(start, TextUtils.getNullSel())

            if (e.key === 'Backspace') {
              const isEmptyText = (this.$refs.text as HTMLElement).childNodes[0].childNodes[0].nodeName === 'BR'
              if (start.sIndex === 0 && start.pIndex > 0 && start.offset === 0 && this.config.paragraphs[start.pIndex - 1].spans.length === 1 &&
                !this.config.paragraphs[start.pIndex - 1].spans[0].text) {
                start.pIndex -= 1
                TextUtils.updateSelection(start, TextUtils.getNullSel())
              }
              if ((start.sIndex === 0 && start.pIndex === 0 && sel.anchorOffset === 0 && sel.toString() === '') || isEmptyText) {
                e.preventDefault()
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
        setTimeout(() => { observer.disconnect() }, 0)
      }
    },

    composingEnd() {
      this.isComposing = false
      const start = TextUtils.getSelection()?.start
      TextUtils.updateSelection(start ?? TextUtils.getNullSel(), TextUtils.getNullSel())
      const paragraphs: IParagraph[] = TextUtils.textParser(this.$refs.text as HTMLElement, this.config as IText)
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { paragraphs })
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
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { paragraphs, isEdited: true })
          // TemplateUtils.updateTextInfo(this.config)
          this.textSizeRefresh(this.config)
          this.$nextTick(() => {
            // const afterRender = (mutations: MutationRecord[], observer: MutationObserver) => {
            LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { isTyping: true })
            StepsUtils.record()
            /**
             * TODO: For some reason while hit Enter the text block, the browser would
             * produce extra <p>, the following could temporarily fix this problem
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
      const group = LayerUtils.getCurrLayer as IGroup
      const originSize = { width: this.getLayerWidth, height: this.getLayerHeight }
      const isAllHorizon = !group.layers
        .some(l => l.type === 'text' &&
        ((l as IText).styles.writingMode.includes('vertical') || l.styles.rotate !== 0))

      const newSize = TextUtils.getTextHW(text, this.config.widthLimit)
      if (Number.isNaN(this.layerSizeBuff)) {
        this.layerSizeBuff = newSize.height
      } else if (newSize.height === this.layerSizeBuff) {
        return
      }

      if (isAllHorizon) {
        const lowLine = this.getLayerPos.y + originSize.height
        const diff = newSize.height - originSize.height
        const targetSubLayers: Array<[number, number]> = []
        group.layers
          .forEach((l, idx) => {
            if (l.styles.y >= lowLine) {
              targetSubLayers.push([idx, l.styles.y])
            }
          })
        targetSubLayers
          .forEach(data => {
            LayerUtils.updateSubLayerStyles(this.pageIndex, this.primaryLayerIndex, data[0], {
              y: data[1] + diff
            })
          })
      }
      // @TODO: the vertical kind pending

      TextUtils.updateLayerSize(text, this.primaryLayerIndex, this.layerIndex, this.layerIndex)
    },
    onKeyUp(e: KeyboardEvent) {
      if (this.getLayerType === 'text' && TextUtils.isArrowKey(e)) {
        const sel = TextUtils.getSelection()
        TextUtils.updateSelection(sel?.start as ISelection, sel?.end as ISelection)
        TextPropUtils.updateTextPropsState()
      }
    },
    onClickEvent(e: MouseEvent) {
      if (this.type === 'tmp') {
        if (GeneralUtils.exact([e.shiftKey, e.ctrlKey, e.metaKey])) {
          groupUtils.deselectTargetLayer(this.layerIndex)
        }
        return
      }
      if (this.getLayerType === 'text') {
        this.textClickHandler(e)
      }
      this.$emit('clickSubController', this.layerIndex, this.config.type)
    },
    onDblClick() {
      if (this.type === 'tmp') {
        return
      }
      this.$emit('dblSubController', this.layerIndex)
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
