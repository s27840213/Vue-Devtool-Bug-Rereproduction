<template lang="pug">
  div(class="nu-text" :style="textWrapperStyle()" draggable="false")
    //- Svg BG for text effex gooey.
    svg(v-if="svgBG" v-bind="svgBG.attrs" class="nu-text__BG" ref="svg")
      component(v-for="(elm, idx) in svgBG.content"
                :key="`textSvgBg${idx}`"
                :is="elm.tag"
                v-bind="elm.attrs")
    div(v-for="text, idx in duplicatedText" class="nu-text__body" ref="body"
        :style="Object.assign(bodyStyles(), text.extraBody)")
      nu-curve-text(v-if="isCurveText"
        :config="config"
        :layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :subLayerIndex="subLayerIndex"
        :isDuplicated="idx !== duplicatedText.length-1")
      p(v-else
        v-for="(p, pIndex) in config.paragraphs" class="nu-text__p"
        :key="p.id"
        :style="pStyle(p.styles)")
        span(v-for="(span, sIndex) in p.spans"
          class="nu-text__span"
          :data-sindex="sIndex"
          :key="span.id"
          :style="Object.assign(spanStyle(p.spans, sIndex), spanEffect, text.extraSpan)") {{ span.text }}
          br(v-if="!span.text && p.spans.length === 1")
    nu-text-editor(v-if="config.active" :initText="textHtml()" :id="subLayerIndex === -1 ? `text-${layerIndex}` : `text-sub-${layerIndex}-${subLayerIndex}`"
      class="nu-text__editor"
      :style="textBodyStyle()"
      :pageIndex="pageIndex"
      :layerIndex="layerIndex"
      :subLayerIndex="subLayerIndex"
      @keydown.native.37.stop
      @keydown.native.38.stop
      @keydown.native.39.stop
      @keydown.native.40.stop
      @keydown.native.ctrl.67.exact.stop.self
      @keydown.native.meta.67.exact.stop.self
      @keydown.native.ctrl.86.exact.stop.self
      @keydown.native.meta.86.exact.stop.self
      @keydown.native.ctrl.88.exact.stop.self
      @keydown.native.meta.88.exact.stop.self
      @keydown.native.ctrl.65.exact.stop.self
      @keydown.native.meta.65.exact.stop.self
      @keydown.native.ctrl.90.exact.stop.self
      @keydown.native.meta.90.exact.stop.self
      @keydown.native.ctrl.shift.90.exact.stop.self
      @keydown.native.meta.shift.90.exact.stop.self
      @update="handleTextChange"
      @compositionend="handleTextCompositionEnd")
    //- div(v-if="isCurveText" v-for="text, idx in duplicatedText" class="nu-text__body nu-text__curve-text-in-editing" ref="body")
    //-   nu-curve-text(
    //-     :config="config"
    //-     :layerIndex="layerIndex"
    //-     :pageIndex="pageIndex"
    //-     :subLayerIndex="subLayerIndex"
    //-     :isDuplicated="idx !== duplicatedText.length-1")
</template>

<script lang="ts">
import Vue from 'vue'
import { IGroup, IParagraph, ISpan, IText } from '@/interfaces/layer'
import { mapGetters, mapState } from 'vuex'
import textUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import LayerUtils from '@/utils/layerUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import generalUtils from '@/utils/generalUtils'
import textBgUtils from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import NuTextEditor from '@/components/editor/global/NuTextEditor.vue'
import _ from 'lodash'
import controlUtils from '@/utils/controlUtils'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  components: { NuCurveText, NuTextEditor },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: {
      type: Number,
      default: -1
    },
    isPagePreview: {
      default: false,
      type: Boolean
    }
  },
  data() {
    const dimension = this.config.styles.writingMode.includes('vertical') ? this.config.styles.height : this.config.styles.width
    return {
      isDestroyed: false,
      initSize: {
        width: this.config.styles.width,
        height: this.config.styles.height,
        widthLimit: this.config.widthLimit === -1 ? -1 : dimension
      },
      isLoading: true,
      svgBG: {} as Record<string, unknown> | null,
      widthLimitSetDuringComposition: false
    }
  },
  created() {
    textUtils.loadAllFonts(this.config)
  },
  destroyed() {
    this.isDestroyed = true
  },
  mounted() {
    // To solve the issues: https://www.notion.so/vivipic/8cbe77d393224c67a43de473cd9e8a24
    textUtils.untilFontLoaded(this.config.paragraphs, true).then(() => {
      setTimeout(() => {
        this.resizeCallback()
        if (this.$route.name === 'Editor' || this.$route.name === 'MobileEditor') {
          this.isLoading = false
        }
      }, 100) // for the delay between font loading and dom rendering
    })
    this.drawSvgBG()
  },
  computed: {
    ...mapState(['isMoving']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getDefaultFontsList: 'text/getDefaultFontsList',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer'
    }),
    primaryLayer(): IGroup | undefined {
      if (this.subLayerIndex === -1) {
        return undefined
      } else {
        return LayerUtils.getLayer(this.pageIndex, this.layerIndex) as IGroup
      }
    },
    spanEffect(): Record<string, unknown> {
      return textBgUtils.convertTextSpanEffect(this.config.styles.textBg)
    },
    isCurveText(): any {
      const { textShape } = this.config.styles
      return textShape && textShape.name === 'curve'
    },
    isFlipped(): boolean {
      return this.config.styles.horizontalFlip || this.config.styles.verticalFlip
    },
    // Use duplicated of text to do some text effect, define their difference css here.
    duplicatedText() {
      const duplicatedBodyBasicCss = {
        position: 'absolute',
        top: '0px',
        width: '100%',
        height: '100%',
        opacity: 1
      }
      const textShadow = textEffectUtils.convertTextEffect(this.config)
      const duplicatedTextShadow = textShadow.duplicatedBody || textShadow.duplicatedSpan
      const textShadowCss = {
        extraBody: Object.assign(duplicatedBodyBasicCss, textShadow.duplicatedBody),
        extraSpan: textShadow.duplicatedSpan
      }
      // const textBgSpan = textBgUtils.convertTextSpanEffect(this.config.styles.textBg)
      // const duplicatedTextBgSpan = textBgSpan.duplicatedBody || textBgSpan.duplicatedSpan
      // const textBgSpanCss = {
      //   extraBody: Object.assign(duplicatedBodyBasicCss, textBgSpan.duplicatedBody),
      //   extraSpan: textBgSpan.duplicatedSpan
      // }
      return [
        // ...(duplicatedTextBgSpan ? [textBgSpanCss] : []),
        ...(duplicatedTextShadow ? [textShadowCss] : []),
        {} // Original text, don't have extra css
      ]
    }
  },
  watch: {
    'config.paragraphs': {
      handler(newVal) {
        this.isLoading = false
        this.drawSvgBG()
        textUtils.untilFontLoaded(newVal).then(() => {
          this.drawSvgBG()
        })
      }
    },
    'config.styles': {
      deep: true,
      handler() {
        this.drawSvgBG()
      }
    }
  },
  methods: {
    handleTextCompositionEnd(toRecord: boolean) {
      if (this.widthLimitSetDuringComposition && this.subLayerIndex === -1) {
        this.widthLimitSetDuringComposition = false
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: -1 })
        this.textSizeRefresh(this.config, false)
      }
      if (toRecord) {
        this.waitFontLoadingAndRecord()
      }
    },
    waitFontLoadingAndRecord() {
      const pageId = LayerUtils.getPage(this.pageIndex).id
      const layerId = this.config.id
      textUtils.waitFontLoadingAndRecord(this.config.paragraphs, () => {
        const { pageIndex, layerIndex, subLayerIdx } = LayerUtils.getLayerInfoById(pageId, layerId)
        if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
        textUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
      })
    },
    waitFontLoadingAndResize() {
      const pageId = LayerUtils.getPage(this.pageIndex).id
      const layerId = this.primaryLayer ? this.primaryLayer.id : this.config.id
      const subLayerId = this.primaryLayer ? this.config.id : ''
      textUtils.untilFontLoaded(this.config.paragraphs).then(() => {
        setTimeout(() => {
          const { pageIndex, layerIndex, subLayerIdx } = LayerUtils.getLayerInfoById(pageId, layerId, subLayerId)
          if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
          textUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
        }, 100)
      })
    },
    checkIfCurve(config: IText): boolean {
      const { textShape } = config.styles
      return textShape && textShape.name === 'curve'
    },
    calcSize(config: IText, composing: boolean) {
      if (this.subLayerIndex === -1) {
        this.checkIfCurve(config) ? this.curveTextSizeRefresh(config) : this.textSizeRefresh(config, composing)
      } else {
        this.checkIfCurve(config) ? this.curveTextSizeRefresh(config) : textUtils.updateGroupLayerSize(this.pageIndex, this.layerIndex, this.subLayerIndex)
      }
    },
    curveTextSizeRefresh(text: IText) {
      if (this.subLayerIndex === -1) {
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, textShapeUtils.getCurveTextProps(text))
      } else {
        const { height: heightOri } = text.styles
        const curveTextHW = textShapeUtils.getCurveTextHW(text)
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, textShapeUtils.getCurveTextPropsByHW(text, curveTextHW))
        textUtils.asSubLayerSizeRefresh(this.pageIndex, this.layerIndex, this.subLayerIndex, curveTextHW.areaHeight, heightOri)
        textUtils.fixGroupCoordinates(this.pageIndex, this.layerIndex)
      }
    },
    textSizeRefresh(text: IText, composing: boolean) {
      const isVertical = this.config.styles.writingMode.includes('vertical')
      const getSize = () => isVertical ? this.config.styles.height : this.config.styles.width
      let widthLimit = this.config.rotate ? getSize() : this.config.widthLimit
      let textHW = textUtils.getTextHW(text, widthLimit)
      let layerX = this.config.styles.x
      let layerY = this.config.styles.y
      if (widthLimit === -1) {
        // const pageSize = (this.$parent.$el as HTMLElement)
        //   .getBoundingClientRect()[isVertical ? 'height' : 'width'] / (this.scaleRatio * 0.01)
        const pageSize = pageUtils.getPage(this.pageIndex)[isVertical ? 'height' : 'width']
        const currTextSize = textHW[isVertical ? 'height' : 'width']

        let layerPos = this.config.styles[isVertical ? 'y' : 'x'] - (currTextSize - getSize()) / 2
        const reachLeftLimit = layerPos <= 0
        const reachRightLimit = layerPos + currTextSize >= pageSize

        if (reachLeftLimit && reachRightLimit) {
          if (composing) this.widthLimitSetDuringComposition = true
          textHW = textUtils.getTextHW(text, pageSize)
          layerPos = 0
          widthLimit = pageSize
        } else if (reachLeftLimit || reachRightLimit) {
          if (composing) this.widthLimitSetDuringComposition = true
          widthLimit = currTextSize
          textHW = textUtils.getTextHW(text, widthLimit)
          layerPos = reachLeftLimit ? 0 : pageSize - widthLimit
        }
        layerX = isVertical ? layerX : layerPos
        layerY = isVertical ? layerPos : layerY
      } else {
        const initData = {
          xSign: 1,
          ySign: 1,
          x: this.config.styles.x,
          y: this.config.styles.y,
          angle: this.config.styles.rotate * Math.PI / 180
        }
        const offsetSize = {
          width: isVertical ? textHW.width - this.config.styles.width : 0,
          height: isVertical ? 0 : textHW.height - this.config.styles.height
        }
        const trans = controlUtils.getTranslateCompensation(initData, offsetSize)
        layerX = trans.x
        layerY = trans.y
      }

      if (isVertical && textHW.width < 5) {
        textHW.width = this.config.styles.width
      } else if (!isVertical && textHW.height < 5) {
        const config = generalUtils.deepCopy(text) as IText
        config.paragraphs[0].spans[0].text = '|'
        config.paragraphs.splice(1)
        textHW.height = textUtils.getTextHW(config).height
      }
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit })
      LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, {
        width: textHW.width,
        height: textHW.height,
        x: layerX,
        y: layerY
      })
    },
    handleTextChange(payload: { paragraphs: IParagraph[], isSetContentRequired: boolean, toRecord?: boolean }) {
      const config = generalUtils.deepCopy(this.config)
      config.paragraphs = payload.paragraphs
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { paragraphs: payload.paragraphs }, this.subLayerIndex)
      this.calcSize(config, !!tiptapUtils.editor?.view?.composing)
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
    textBodyStyle() {
      const textstyles = {
        width: '100%',
        height: '100%',
        userSelect: this.config.contentEditable ? 'text' : 'none'
        // opacity: (this.isTextEditing && this.contentEditable) ? 1 : 0
      }
      return !this.isCurveText ? textstyles
        : {
          width: 'auto',
          height: 'auto',
          position: 'absolute',
          outline: 'none',
          top: 0,
          left: 0
          // opacity: (this.isTextEditing && this.contentEditable) ? 1 : 0
        }
    },
    textHtml(): any {
      return tiptapUtils.toJSON(this.config.paragraphs)
    },
    textWrapperStyle() {
      return {
        width: `${this.config.styles.width / this.config.styles.scale}px`,
        height: `${this.config.styles.height / this.config.styles.scale}px`,
        opacity: `${this.config.styles.opacity * 0.01}`,
        // transform: `scaleX(${this.config.styles.scale}) scaleY(${this.config.styles.scale})`,
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode
      }
    },
    drawSvgBG() {
      this.$nextTick(() => {
        this.svgBG = textBgUtils.drawSvgBg(this.config, this.$refs.body as Element[])
      })
    },
    spans(): ISpan[] {
      return textShapeUtils.flattenSpans(this.config)
    },
    isAutoResizeNeeded(): boolean {
      return LayerUtils.getPage(this.pageIndex).isAutoResizeNeeded
    },
    styles(styles: any) {
      return tiptapUtils.textStylesRaw(styles)
    },
    getOpacity() {
      const { editing, contentEditable } = this.config
      if (this.isCurveText && this.config.active) {
        return 0.2
      }
      if (editing && !this.isMoving) {
        if (contentEditable) {
          if (this.isCurveText || this.isFlipped) {
            return 0.2
          } else {
            return 0
          }
        } else {
          return 1
        }
      } else {
        return 1
      }
    },
    bodyStyles() {
      const opacity = this.getOpacity()
      const isVertical = this.config.styles.writingMode.includes('vertical')
      return {
        width: isVertical ? 'auto' : '',
        height: isVertical ? '' : '100%',
        textAlign: this.config.styles.align,
        opacity
      }
    },
    wrapperStyles() {
      return {
        writingMode: this.config.styles.writingMode
      }
    },
    spanStyle(spans: any, sIndex: number) {
      const span = spans[sIndex]
      return Object.assign(tiptapUtils.textStylesRaw(span.styles),
        sIndex === spans.length - 1 && span.text.match(/^ +$/) ? { whiteSpace: 'pre' } : {}
      )
    },
    pStyle(styles: any) {
      return _.omit(tiptapUtils.textStylesRaw(styles), [
        'text-decoration-line', '-webkit-text-decoration-line'
      ])
    },
    async resizeCallback() {
      const config = generalUtils.deepCopy(this.config) as IText
      if (this.isDestroyed || textShapeUtils.isCurvedText(config.styles)) return

      // console.log('resize')

      let widthLimit
      if (this.isLoading && this.isAutoResizeNeeded()) {
        widthLimit = await textUtils.autoResize(config, this.initSize)
      } else {
        widthLimit = config.widthLimit
      }
      const textHW = await textUtils.getTextHWAsync(config, widthLimit)
      if (typeof this.subLayerIndex === 'undefined' || this.subLayerIndex === -1) {
        let x = config.styles.x
        let y = config.styles.y
        if (config.widthLimit === -1) {
          if (config.styles.writingMode.includes('vertical')) {
            y = config.styles.y - (textHW.height - config.styles.height) / 2
          } else {
            x = config.styles.x - (textHW.width - config.styles.width) / 2
          }
        }
        // console.log(this.layerIndex, textHW.width, textHW.height, config.styles.x, config.styles.y, x, y, widthLimit)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { x, y, width: textHW.width, height: textHW.height })
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit })
      } else {
        // console.log(this.layerIndex, this.subLayerIndex, textHW.width, textHW.height, widthLimit)
        const group = this.getLayer(this.pageIndex, this.layerIndex) as IGroup
        if (group.type !== 'group' || group.layers[this.subLayerIndex].type !== 'text') return
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, { width: textHW.width, height: textHW.height })
        LayerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { widthLimit })
        const { width, height } = calcTmpProps(group.layers, group.styles.scale)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width, height })
      }
      this.drawSvgBG()
    }
  }
})
</script>

<style lang="scss">
.nu-text {
  width: 100%;
  height: 100%;
  position: relative;
  &__BG {
    position: absolute;
    left: 0;
    top: 0;
    overflow: visible;
  }
  &__body {
    pointer-events: none;
    outline: none;
    padding: 0;
    position: relative;
  }
  &__p {
    margin: 0;
  }
  &__span {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    position: relative;
  }
  &__curve-text-in-editing {
    pointer-events: none;
    opacity: 0.2;
  }
  &__observee {
    position: absolute;
    opacity: 0;
    top: 0;
    left: 0;
    & > span {
      display: inline-block;
    }
  }
  &__editor {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
