<template lang="pug">
  keep-alive
    div(class="nu-sub-controller")
      div(class="nu-sub-controller__content"
          ref="body"
          :layer-index="`${layerIndex}`"
          :style="styles('')"
          @mouseout.stop="toggleHighlighter(pageIndex,layerIndex,false)"
          @mouseover.stop="toggleHighlighter(pageIndex,layerIndex,true)"
          @click.left.stop="onClickEvent()")
        template(v-if="config.type === 'text' && config.active")
          div(:style="textScaleStyle()")
            div(ref="text" :id="`text-${layerIndex}`" spellcheck="false"
              :style="textBodyStyle()"
              :contenteditable="config.type === 'tmp' ? false : contentEditable"
              @compositionstart="isComposing = true"
              @compositionend="isComposing = false"
              @keydown="onKeyDown($event)")
              p(v-for="(p, pIndex) in config.paragraphs" class="text__p"
                :data-pindex="pIndex"
                :key="p.id",
                :style="textStyles(p.styles)")
                span(v-for="(span, sIndex) in p.spans" class="text__span"
                  :data-sindex="sIndex"
                  :key="span.id",
                  :style="textStyles(span.styles)") {{ span.text }}
        template(v-if="config.type==='group'")
          div(:style="groupControllerStyle()")
            nu-sub-controller(
              v-for="(layer, index) in config.layers"
              data-identifier="controller"
              :key="`group-controller-${index}`"
              :layerIndex="index"
              :pageIndex="pageIndex"
              :config="layer"
              :color="'#EB5757'"
              @clickSubController="clickSubController")
        div(v-if="isActive && isLocked && (scaleRatio >20)"
            class="nu-sub-controller__lock-icon"
            :style="`transform: scale(${100/scaleRatio})`")
          svg-icon(:iconName="'lock'" :iconWidth="`${20}px`" :iconColor="'red'"
            @click.native="MappingUtils.mappingIconAction('unlock')")
</template>
<script lang="ts">
import Vue from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import { ICoordinate } from '@/interfaces/frame'
import { IImage, IParagraph, IParagraphStyle, IShape, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import { IControlPoints } from '@/interfaces/controller'
import MappingUtils from '@/utils/mappingUtils'
import TextUtils from '@/utils/textUtils'
import TextEffectUtils from '@/utils/textEffectUtils'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    snapUtils: Object,
    color: {
      type: String,
      default: '#BB6BD9'
    }
  },
  data() {
    return {
      MappingUtils,
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
      contentEditable: false
    }
  },
  mounted() {
    // console.log(this.config)
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
        this.contentEditable = false
        const paragraphs: IParagraph[] = this.textParser()
        TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
        ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: false })
      }
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened'
    }),
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
    toggleHighlighter(pageIndex: number, layerIndex: number, shown: boolean) {
      // console.log('shown group controller')
      // LayerUtils.updateLayerProps(pageIndex, layerIndex, {
      //   shown
      // })
    },
    styles(type: string) {
      const zindex = type === 'control-point' ? (this.layerIndex + 1) * 100 : (this.layerIndex + 1)
      const outlineColor = this.isLocked ? '#EB5757' : '#7190CC'
      return {
        transform: `translate3d(${this.config.styles.x}px, ${this.config.styles.y}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        backgroundColor: this.hexToRGB(this.color, '0.2'),
        outline: this.isShown || this.isActive ? ((this.config.type === 'tmp' || this.isControlling)
          ? `${2 * (100 / this.scaleRatio)}px dashed ${outlineColor}` : `${2 * (100 / this.scaleRatio)}px solid ${outlineColor}`) : 'none',
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
      width /= this.getLayerScale
      height /= this.getLayerScale
      const path = `M0 0 L0 ${height} ${width} ${height} ${width} 0Z`
      if (typeof offsetX !== 'undefined' && typeof offsetY !== 'undefined') {
        const imgX = this.control.imgX
        const imgY = this.control.imgY
        offsetX /= this.config.styles.scale
        offsetY /= this.config.styles.scale
        ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, offsetX + imgX, offsetY + imgY)
      }
      ControlUtils.updateImgClipPath(this.pageIndex, this.layerIndex, `path('${path}')`)
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
    onDrop(e: DragEvent) {
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
                ControlUtils.textStopPropagation(e)
              }
            }
          }
        }
        const observer = new MutationObserver(this.onTyping(e, start))
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
    onTyping(e: KeyboardEvent, start: { pIndex: number, sIndex: number, offset: number }) {
      return (mutations: MutationRecord[], observer: MutationObserver) => {
        ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: true })
        const text = this.$refs.text as HTMLElement
        text.style.width = this.config.widthLimit === -1 ? 'max-content' : `${this.config.widthLimit / this.getLayerScale}px`
        text.style.height = 'max-content'
        const textHW = {
          width: Math.ceil(text.offsetWidth + 1),
          height: Math.ceil(text.offsetHeight + 1)
        }

        let layerX = this.getLayerPos.x
        let layerY = this.getLayerPos.y

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
            width: textHW.width - this.getLayerWidth,
            height: textHW.height - this.getLayerHeight
          }
          const trans = ControlUtils.getTranslateCompensation(initData, offsetSize)
          layerX = trans.x
          layerY = trans.y
        }
        text.style.width = `${textHW.width / this.getLayerScale}px`

        ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
        ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, layerX, layerY)

        if (this.isComposing) {
          return
        }

        observer.disconnect()
        const paragraphs: IParagraph[] = this.textParser()
        if (window.getSelection()) {
          const sel = window.getSelection()
          const startContainer = sel?.getRangeAt(0).startContainer
          let [pIndex, sIndex, offset] = [start.pIndex, start.sIndex, start.offset]
          // if the below condition is false, means some paragraph (p-node) is removed
          if (startContainer?.parentElement?.dataset.sindex) {
            offset = sel?.getRangeAt(0).startOffset as number
            sIndex = parseInt(startContainer?.parentElement?.dataset.sindex as string)
            pIndex = parseInt(startContainer?.parentElement?.parentElement?.dataset.pindex as string)
            // used for deleting the first span of the text, and moving the caret to the previous p
            const isSpanDeleted = paragraphs[pIndex].spans.length < (this.config as IText).paragraphs[pIndex].spans.length
            if (e.key !== 'Enter' && isSpanDeleted && sIndex === 1 && offset === 0) {
              pIndex -= 1
              // if below condition is satisfied, means there is deletion at the begining of the text (p=0, s=0, offset=0)
              if (pIndex < 0) {
                [pIndex, sIndex, offset] = [0, 0, 0]
              }
              sIndex = paragraphs[pIndex].spans.length - 1
              offset = paragraphs[pIndex].spans[sIndex].text.length
            } else if (e.key === 'Enter') {
              [sIndex, offset] = [0, 0]
              pIndex += 1
            }
          } else if (e.key === 'Enter') {
            // console.log('inNewLine and some node gone')
            // console.log(startContainer?.parentElement)
            // console.log(startContainer)
            [sIndex, offset] = [0, 0]
            pIndex += 1
          } else if (TextUtils.isArrowKey(e)) {
            /**
             *  If the input key is ArrowKey, the startContainer will be different as the other key pressed
             */
            if (typeof startContainer?.parentElement !== 'undefined' && typeof startContainer?.parentElement !== 'undefined') {
              offset = sel?.getRangeAt(0).startOffset as number
              sIndex = parseInt((startContainer as HTMLElement).dataset.sindex as string)
              pIndex = parseInt(startContainer?.parentElement?.dataset.pindex as string)
            }
          } else if (paragraphs.length < (this.config as IText).paragraphs.length) {
            /**
             * some paragraph is deleted
             */
            pIndex -= 1
            sIndex = paragraphs[pIndex].spans.length - 1 >= 0 ? paragraphs[pIndex].spans.length - 1 : 0
            offset = paragraphs[pIndex].spans[sIndex] ? paragraphs[pIndex].spans[sIndex].text.length : 0
          }
          const text = this.$refs.text as HTMLElement
          TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
          this.$nextTick(() => {
            ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isTyping: false })
            if (text.childNodes.length > (this.config as IText).paragraphs.length && text.lastChild) {
              text.removeChild(text.lastChild)
            }
            const sel = window.getSelection()
            if (sel) {
              const range = new Range()
              range.setStart(text.childNodes[pIndex].childNodes[sIndex].firstChild as Node, offset)
              sel.removeAllRanges()
              sel.addRange(range)
            }
          })
        }
      }
    },
    textParser(): IParagraph[] {
      const paragraphs: IParagraph[] = []
      const div = this.$refs.text as HTMLElement
      const ps = div.childNodes
      const config = (this.config as IText)
      ps.forEach((p, pIndex) => {
        const spans: ISpan[] = []
        for (const [sIndex, span] of p.childNodes.entries()) {
          if (span instanceof HTMLElement) {
            let spanEl = span as HTMLElement
            const text = spanEl.innerText as string
            /**
             * If the span is the same without changed, skip parse it
             */
            if (config.paragraphs[pIndex] && config.paragraphs[pIndex].spans[sIndex] && text === config.paragraphs[pIndex].spans[sIndex].text) {
              spans.push((this.config as IText).paragraphs[pIndex].spans[sIndex])
              continue
            }
            /**
             *  If the span and p are deleted as empty string, the style of the span will be removed by the browser
             *  below detecting the situation and use the style of the last span of previous p to replace it.
             */
            if (spanEl.style.fontFamily === '') {
              const leng = div.childNodes[pIndex - 1].childNodes.length
              spanEl = div.childNodes[pIndex - 1].childNodes[leng - 1] as HTMLElement
            }
            const spanStyle = {
              font: spanEl.style.fontFamily,
              weight: spanEl.style.fontWeight,
              size: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
              initSize: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
              decoration: spanEl.style.textDecorationLine,
              style: spanEl.style.fontStyle,
              color: spanEl.style.color,
              opacity: parseInt(spanEl.style.opacity)
            } as ISpanStyle
            spanEl = span as HTMLElement
            spans.push({ text: text, styles: spanStyle, id: uuidv4() })
          }
        }
        const pEl = p as HTMLElement
        const pStyle: IParagraphStyle = { lineHeight: 0, fontSpacing: 0, align: 'left' }
        pStyle.lineHeight = parseInt(pEl.style.lineHeight.replace(/px/, ''))
        pStyle.fontSpacing = parseInt(pEl.style.letterSpacing)
        pStyle.align = pEl.style.textAlign
        paragraphs.push({ styles: pStyle, spans: spans, id: uuidv4() })
      })
      paragraphs.forEach(p => {
        if (p.spans.length === 1 && p.spans[0].text === '') {
          p.spans[0].text = '\n'
        }
      })
      return paragraphs
    },
    isNoCharactor(e: KeyboardEvent): boolean {
      if (e.key === 'Backspace') {
        return false
      }
      return e.key.length !== 1
    },
    onDblClick() {
      if (this.getLayerType !== 'image' || this.isLocked) return
      ControlUtils.updateImgControl(this.pageIndex, this.layerIndex, true)
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
    onClickEvent() {
      console.log('emit!')
      this.$emit('clickSubController', [this.layerIndex])
    },
    clickSubController(indexs: Array<number>) {
      console.log(indexs)
      indexs.unshift(this.layerIndex)
      this.$emit('clickSubController', indexs)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-sub-controller {
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
