<template lang="pug">
  div(class="nu-text" :style="wrapperStyles()")
    //- Svg BG for text effex gooey.
    svg(v-if="svgBG" v-bind="svgBG.attrs" class="nu-text__BG")
      component(v-for="(elm, idx) in svgBG.content"
                :key="`textSvgBg${idx}`"
                :is="elm.tag"
                v-bind="elm.attrs")
    div(v-for="text in duplicatedText" class="nu-text__body" ref="body"
        :style="Object.assign(bodyStyles(), text.extraBody)")
      nu-curve-text(v-if="isCurveText"
        :config="config"
        :layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :subLayerIndex="subLayerIndex")
      p(v-else
        v-for="(p, pIndex) in config.paragraphs" class="nu-text__p"
        :key="p.id"
        :style="styles(p.styles)")
        span(v-for="(span, sIndex) in p.spans"
          class="nu-text__span"
          :data-sindex="sIndex"
          :key="span.id"
          :style="Object.assign(styles(span.styles), spanEffect, text.extraSpan)") {{ span.text }}
          br(v-if="!span.text && p.spans.length === 1")
    div(v-if="!isCurveText" class="nu-text__observee")
      span(v-for="(span, sIndex) in spans()"
        class="nu-text__span"
        :class="`nu-text__span-p${pageIndex}l${layerIndex}s${subLayerIndex ? subLayerIndex : -1}`"
        :data-sindex="sIndex"
        :key="sIndex",
        :style="styles(span.styles, sIndex)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { IGroup, ISpan, IText } from '@/interfaces/layer'
import { mapState, mapGetters } from 'vuex'
import textUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import LayerUtils from '@/utils/layerUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import generalUtils from '@/utils/generalUtils'
import textBgUtils from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'

export default Vue.extend({
  components: { NuCurveText },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number
  },
  data() {
    const dimension = this.config.styles.writingMode.includes('vertical') ? this.config.styles.height : this.config.styles.width
    return {
      uid: generalUtils.generateRandomString(6),
      isDestroyed: false,
      resizeObserver: undefined as ResizeObserver | undefined,
      initSize: {
        width: this.config.styles.width,
        height: this.config.styles.height,
        widthLimit: this.config.widthLimit === -1 ? -1 : dimension
      },
      isLoading: true,
      svgBG: null as Record<string, unknown> | null
    }
  },
  created() {
    // textUtils.loadAllFonts(this.config, 1)
    textUtils.loadAllFonts(this.config)
  },
  destroyed() {
    this.isDestroyed = true
    this.resizeObserver && this.resizeObserver.disconnect()
    this.resizeObserver = undefined
  },
  mounted() {
    if (this.$route.name === 'Editor' || this.$route.name === 'MobileEditor') {
      textUtils.untilFontLoaded(this.config.paragraphs).then(() => {
        setTimeout(() => {
          this.resizeCallback()
          this.isLoading = false
        }, 500) // for the delay between font loading and dom rendering
      })
    }
    // if (this.currSelectedInfo.layers >= 1) {
    //   TextPropUtils.updateTextPropsState()
    // }

    // if (LayerUtils.getCurrLayer.type === 'tmp') {
    //   return
    // }
    this.resizeObserver = new ResizeObserver(this.resizeCallback)
    this.observeAllSpans()
    this.drawSvgBG()
  },
  computed: {
    ...mapState('text', ['fontStore']),
    ...mapState('user', ['verUni']),
    ...mapGetters({
      getDefaultFontsList: 'text/getDefaultFontsList',
      pageScaleRatio: 'getPageScaleRatio'
    }),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      getTextInfo: 'getTextInfo'
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
    // Use duplicated of text to do some text effect, define there difference css here.
    duplicatedText() {
      const duplicatedBodyBasicCss = {
        position: 'absolute',
        top: '0px',
        width: '100%',
        opacity: 1
      }
      const textShadow = textEffectUtils.convertTextEffect(this.config.styles.textEffect)
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
      handler() {
        this.isLoading = false
        if (this.resizeObserver) {
          this.resizeObserver.disconnect()
          this.observeAllSpans()
        }
        this.drawSvgBG()
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
        const targetLayer = this.getLayer(this.pageIndex, this.layerIndex)
        const groupScaleRatio = this.subLayerIndex !== undefined ? targetLayer.styles.scale : 1
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
    // getFontUrl(spanStyles: ISpanStyle): string {
    //   switch (spanStyles.type) {
    //     case 'public':
    //       return `url("https://template.vivipic.com/font/${spanStyles.font}/font")`
    //     case 'private':
    //       return ''
    //     case 'URL':
    //       return 'url("' + spanStyles.fontUrl + '")'
    //   }
    //   return `url("https://template.vivipic.com/font/${spanStyles.font}/font")`
    // },
    resizeCallback() {
      // for (const entry of entries) {
      //   console.log(JSON.stringify(entry.contentRect))
      // }
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
        // if (group.layers[this.subLayerIndex].type !== 'text') return
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, { width: textHW.width, height: textHW.height })
        LayerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { widthLimit })
        const { width, height } = calcTmpProps(group.layers, group.styles.scale)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width, height })
      }
      this.drawSvgBG()
    },
    observeAllSpans() {
      const spans = document.querySelectorAll(`.nu-text__span-p${this.pageIndex}l${this.layerIndex}s${this.subLayerIndex ? this.subLayerIndex : -1}`) as NodeList
      spans.forEach(span => {
        this.resizeObserver && this.resizeObserver.observe(span as Element)
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
