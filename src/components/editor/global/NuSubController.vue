<template lang="pug">
  keep-alive
    div(class="nu-sub-controller")
      div(class="nu-sub-controller__content"
          ref="body"
          :layer-index="`${layerIndex}`"
          :style="styles('')"
          @dblclick="onDblClick()"
          @click.left.stop="onClickEvent($event)")
        svg(class="full-width" v-if="config.type === 'image' && config.isFrame" :viewBox="`0 0 ${config.styles.initWidth} ${config.styles.initHeight}`")
            g(v-html="config.clipPath ? FrameUtils.frameClipFormatter(config.clipPath) : `<path d='M0,0h${getLayerWidth}v${getLayerHeight}h${-getLayerWidth}z'></path>`"
              :style="frameClipStyles()"
              @drop="onFrameDrop()"
              @dragenter="onDrageEnter()"
              @dragleave="onDragLeave()")
        //- template(v-if="config.type === 'text' && config.active")
        //-   div(:style="textScaleStyle()")
        //-     div(ref="text" :id="`text-${layerIndex}`" spellcheck="false"
        //-       :style="textBodyStyle()"
        //-       :contenteditable="config.type === 'tmp' ? false : contentEditable"
        //-       @compositionstart="isComposing = true"
        //-       @compositionend="isComposing = false"
        //-       @keydown="onKeyDown($event)")
        //-       p(v-for="(p, pIndex) in config.paragraphs" class="text__p"
        //-         :data-pindex="pIndex"
        //-         :key="p.id",
        //-         :style="textStyles(p.styles)")
        //-         span(v-for="(span, sIndex) in p.spans" class="text__span"
        //-           :data-sindex="sIndex"
        //-           :key="span.id",
        //-           :style="textStyles(span.styles)") {{ span.text }}
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import { ICoordinate } from '@/interfaces/frame'
import { IImage, IParagraph, IParagraphStyle, IShape, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
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
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      initialPos: { x: 0, y: 0 },
      initTranslate: { x: 0, y: 0 },
      initialWH: { width: 0, height: 0 },
      imgInitWH: { width: 0, height: 0 },
      imgBuffer: { width: 0, height: 0, x: 0, y: 0 },
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1, imgX: 0, imgY: 0, isHorizon: false },
      scale: { scaleX: 1, scaleY: 1 },
      isComposing: false,
      isSnapping: false,
      contentEditable: false,
      clipedImgBuff: [] as Array<{
        index: number,
        styles: { imgX: number, imgY: number, imgWidth: number, imgHeight: number },
        srcObj: { type: string, assetId: string, userId: string }
      }>
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
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
    },
    isActive() {
      if (this.getLayerType === 'text' && !this.isActive) {
        // this.contentEditable = false
        // const paragraphs: IParagraph[] = this.textParser()
        // TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
        // ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: false })
      }
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
        stroke: this.isActive ? '#7190CC' : 'none',
        strokeWidth: `${5 * (100 / this.scaleRatio)}px`
      }
    },
    textScaleStyle() {
      return {
        position: 'absolute',
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`
      }
    },
    textBodyStyle() {
      return {
        width: `${this.config.styles.width / this.getLayerScale}px`,
        height: `${this.config.styles.height / this.getLayerScale}px`,
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode,
        outline: 'none',
        position: 'absolute',
        userSelect: this.contentEditable ? 'text' : 'none',
        transform: 'translate(-50%, -50%)'
      }
    },
    textStyles(styles: any) {
      // const textStyles = CssConveter.convertFontStyle(Object.assign(newStyles, { color: styles.color ? styles.color : '' }))
      const textStyles = CssConveter.convertFontStyle(styles)
      Object.assign(textStyles, {
        'caret-color': this.contentEditable && !this.isControlling ? '' : '#00000000',
        writingMode: this.config.styles.writingMode
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
    styles(type: string) {
      const zindex = type === 'control-point' ? (this.layerIndex + 1) * 100 : (this.config.styles.zindex + 1)
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
    imgHandler(offset: ICoordinate) {
      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, this.config.styles.imgX, this.config.styles.imgY)
    },
    textResizeHandler(width: number, height: number): [number, number] {
      const text = this.$refs.text as HTMLElement
      if (text && this.config.styles.writingMode.substring(0, 8) !== 'vertical') {
        text.style.height = 'max-content'
        // height = Math.ceil(text.getBoundingClientRect().height / (this.scaleRatio / 100))
        height = Math.ceil(text.offsetHeight + 1)
        ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: width })
      }
      return [width, height]
    },
    imgClipping(width: number, height: number, offsetX: number | undefined, offsetY: number | undefined) {
      ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, width, height, this.getLayerScale)
      if (typeof offsetX !== 'undefined' && typeof offsetY !== 'undefined') {
        const imgX = this.control.imgX
        const imgY = this.control.imgY
        offsetX /= this.config.styles.scale
        offsetY /= this.config.styles.scale
        ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, offsetX + imgX, offsetY + imgY)
      }
    },
    cursorStyles(index: number, rotateAngle: number) {
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
    onClick(e: MouseEvent) {
      this.textClickHandler(e)
    },
    textClickHandler(e: MouseEvent) {
      if (this.getLayerType === 'text' && this.isActive) {
        if ((this.$refs.text as HTMLElement).contains(e.target as Node)) {
          const sel = window.getSelection()
          if (sel && sel.rangeCount !== 0) {
            this.$root.$emit('updateTextPanel')
          }
        }
      }
    },
    onKeyDown(e: KeyboardEvent) {
      if (this.config.type === 'text') {
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
            if (Number.isNaN(parseInt(startContainer?.parentElement?.dataset.sindex as string)) || Number.isNaN(parseInt(startContainer?.parentElement?.parentElement?.dataset.pindex as string))) {
              console.log('NaN')
              // e.preventDefault()
              // return
            }
            // TODO: deletion at the begining of the text cause bug.
            start.sIndex = parseInt(startContainer?.parentElement?.dataset.sindex as string)
            start.pIndex = parseInt(startContainer?.parentElement?.parentElement?.dataset.pindex as string)
            if (e.key === 'Backspace') {
              if (start.sIndex === 0 && start.pIndex === 0 && sel.anchorOffset === 0) {
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
          LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isEdited: true })
          TemplateUtils.updateTextInfo(this.config)
          this.textSizeRefresh(this.config)
          this.$nextTick(() => {
            ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: false })
            StepsUtils.record()
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

              if (!Number.isNaN(pIndex)) {
                const range = new Range()
                range.setStart(text.childNodes[pIndex].childNodes[sIndex].firstChild as Node, offset)
                sel.removeAllRanges()
                sel.addRange(range)
              }
            }
            TextUtils.updateSelection({ pIndex, sIndex, offset }, { pIndex: NaN, sIndex: NaN, offset: NaN })
            if (e.key !== 'Enter' && (e.key === 'Backspace' && paragraphs[pIndex].spans[sIndex].text === '')) {
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
    onRightClick(event: MouseEvent) {
      if (!this.isLocked) {
        this.setIsLayerDropdownsOpened(true)
        if (this.currSelectedInfo.index < 0) {
          // GroupUtils.select([this.layerIndex])
        }
        this.$nextTick(() => {
          const el = document.querySelector('.dropdowns--layer') as HTMLElement
          const mousePos = MouseUtils.getMouseAbsPoint(event)
          el.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px,0)`
          el.focus()
        })
      }
    },
    hexToRGB(hex: string, alpha: string) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)

      if (alpha) {
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      } else {
        return `rgb(${r}, ${g}, ${b})`
      }
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
    onDrageEnter() {
      this.$emit('onFrameDragenter', this.layerIndex)
    },
    onDragLeave() {
      // const clips = GeneralUtils.deepCopy(this.config.clips) as Array<IImage>
      // clips[this.layerIndex].srcObj = {
      //   ...this.clipedImgBuff
      // }
      // LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { clips })
      // this.clipedImgBuff = {
      //   type: '',
      //   userId: '',
      //   assetId: ''
      // }
      // console.log(this.clipedImgBuff)
      this.$emit('onFrameDragleave', this.layerIndex)
    },
    onFrameDrop() {
      this.$emit('onFrameDrop')
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
  &__p {
    margin: 0.5em;
  }
  &__span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
}

.text-content {
  text-align: left;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
