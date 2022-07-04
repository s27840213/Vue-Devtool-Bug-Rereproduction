<template lang="pug">
  div(class="nu-text" :style="wrapperStyles()")
    div(ref="text" class="nu-text__body" :style="bodyStyles()")
      nu-curve-text(v-if="isCurveText"
        ref="curveText"
        :config="config"
        :layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :subLayerIndex="subLayerIndex")
      p(v-else
        v-for="(p, pIndex) in config.paragraphs" class="nu-text__p"
        :key="p.id",
        :style="styles(p.styles)")
        template(v-for="(span, sIndex) in p.spans")
          span(class="nu-text__span"
            :data-sindex="sIndex"
            :key="span.id",
            :style="styles(span.styles)") {{ span.text }}
            br(v-if="!span.text && p.spans.length === 1")
    div(v-if="!isCurveText" class="nu-text__observee")
      span(v-for="(span, sIndex) in spans"
        class="nu-text__span"
        :class="`nu-text__span-p${pageIndex}l${layerIndex}s${subLayerIndex ? subLayerIndex : -1}`"
        :data-sindex="sIndex"
        :key="sIndex",
        :style="styles(span.styles, sIndex)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { IGroup, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import { mapState, mapGetters, mapActions } from 'vuex'
import TextUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import LayerUtils from '@/utils/layerUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import TextPropUtils from '@/utils/textPropUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import generalUtils from '@/utils/generalUtils'

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
      isDestroyed: false,
      resizeObserver: undefined as ResizeObserver | undefined,
      initSize: {
        width: this.config.styles.width,
        height: this.config.styles.height,
        widthLimit: this.config.widthLimit === -1 ? -1 : dimension
      }
    }
  },
  created() {
    TextUtils.loadAllFonts(this.config, 1)
  },
  destroyed() {
    this.isDestroyed = true
    this.resizeObserver && this.resizeObserver.disconnect()
    this.resizeObserver = undefined
  },
  mounted() {
    if (this.currSelectedInfo.layers >= 1) {
      TextPropUtils.updateTextPropsState()
    }

    if (LayerUtils.getCurrLayer.type === 'tmp') {
      return
    }

    this.resizeObserver = new (window as any).ResizeObserver((entries: any) => {
      // for (const entry of entries) {
      //   console.log(JSON.stringify(entry.contentRect))
      // }
      const config = generalUtils.deepCopy(this.config) as IText
      if (this.isDestroyed || textShapeUtils.isCurvedText(config.styles)) return

      // console.log('resize')

      const widthLimit = config.widthLimit
      const textHW = TextUtils.getTextHW(config, widthLimit)
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
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, { width: textHW.width, height: textHW.height })
        LayerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { widthLimit })
        const { width, height } = calcTmpProps(group.layers, group.styles.scale)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width, height })
      }
    })
    this.observeAllSpans()
  },
  computed: {
    ...mapState('text', ['fontStore']),
    ...mapState('user', ['verUni']),
    ...mapGetters('text', ['getDefaultFontsList']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      getTextInfo: 'getTextInfo'
    }),
    getLayerScale(): number {
      return this.config.styles.scale
    },
    isCurveText(): any {
      const { textShape } = this.config.styles
      return textShape && textShape.name === 'curve'
    },
    isFlipped(): boolean {
      return this.config.styles.horizontalFlip || this.config.styles.verticalFlip
    },
    spans(): ISpan[] {
      return textShapeUtils.flattenSpans(this.config)
    }
  },
  watch: {
    'config.paragraphs': {
      handler() {
        if (this.resizeObserver) {
          this.resizeObserver.disconnect()
          this.observeAllSpans()
        }
      }
    }
  },
  methods: {
    styles(styles: any) {
      return tiptapUtils.textStylesRaw(styles)
    },
    bodyStyles() {
      const isVertical = this.config.styles.writingMode.includes('vertical')
      return {
        width: isVertical ? 'auto' : '',
        height: isVertical ? '' : '100%',
        textAlign: this.config.styles.align
      }
    },
    wrapperStyles() {
      const { editing, contentEditable } = this.config
      const { isCurveText, isFlipped } = this
      const opacity = editing ? (contentEditable ? ((isCurveText || isFlipped) ? 0.2 : 0) : 1) : 1
      return {
        writingMode: this.config.styles.writingMode,
        opacity
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
  &__body {
    outline: none;
    padding: 0;
    position: relative;
  }
  &__p {
    margin: 0;
  }
  &__span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    line-break: anywhere;
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
