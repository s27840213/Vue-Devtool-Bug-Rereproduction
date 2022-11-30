<template lang="pug">
  div(class="nu-text" :style="wrapperStyles()")
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
    div(v-if="!isCurveText" class="nu-text__observee")
      span(v-for="(span, sIndex) in spans()"
        class="nu-text__span"
        :class="`nu-text__span-p${pageIndex}l${layerIndex}s${subLayerIndex ? subLayerIndex : -1}`"
        :data-sindex="sIndex"
        :key="sIndex",
        :style="styles(span.styles)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { IGroup, ISpan, IText } from '@/interfaces/layer'
import { mapGetters } from 'vuex'
import textUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import LayerUtils from '@/utils/layerUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import generalUtils from '@/utils/generalUtils'
import textBgUtils from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import _ from 'lodash'
import testUtils from '@/utils/testUtils'

export default Vue.extend({
  components: { NuCurveText },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number,
    isPagePreview: {
      default: false,
      type: Boolean
    }
  },
  data() {
    const dimension = this.config.styles.writingMode.includes('vertical') ? this.config.styles.height : this.config.styles.width
    return {
      isDestroyed: false,
      resizeObserver: undefined as ResizeObserver | undefined,
      initSize: {
        width: this.config.styles.width,
        height: this.config.styles.height,
        widthLimit: this.config.widthLimit === -1 ? -1 : dimension
      },
      isLoading: true,
      svgBG: {} as Record<string, unknown> | null
    }
  },
  created() {
    textUtils.loadAllFonts(this.config)
  },
  destroyed() {
    this.isDestroyed = true
    this.resizeObserver && this.resizeObserver.disconnect()
    this.resizeObserver = undefined
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

    // this.resizeObserver = new ResizeObserver(this.resizeCallback)
    // this.observeAllSpans()
    this.drawSvgBG()
  },
  computed: {
    ...mapGetters({
      getDefaultFontsList: 'text/getDefaultFontsList',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer'
    }),
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
    bodyStyles() {
      const { editing, contentEditable } = this.config
      const opacity = editing ? (contentEditable ? ((this.isCurveText || this.isFlipped) ? 0.2 : 0) : 1) : 1
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
    resizeCallback() {
      const config = generalUtils.deepCopy(this.config) as IText
      if (this.isDestroyed || textShapeUtils.isCurvedText(config.styles)) return

      // console.log('resize')

      let widthLimit
      if (this.isLoading && this.isAutoResizeNeeded()) {
        widthLimit = textUtils.autoResize(config, this.initSize)
      } else {
        widthLimit = config.widthLimit
      }
      const textHW = textUtils.getTextHW(config, widthLimit)
      if (typeof this.subLayerIndex === 'undefined') {
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
      testUtils.setDoneFlag(this.pageIndex, this.layerIndex, this.subLayerIndex)
    },
    observeAllSpans() {
      const spans = document.querySelectorAll(`.nu-text__span-p${this.pageIndex}l${this.layerIndex}s${this.subLayerIndex ? this.subLayerIndex : -1}`) as NodeList
      spans.forEach(span => {
        setTimeout(() => {
          this.resizeObserver && this.resizeObserver.observe(span as Element)
        }, 1)
      })
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
  &__observee {
    position: absolute;
    opacity: 0;
    top: 0;
    left: 0;
    & > span {
      display: inline-block;
    }
  }
}
</style>
