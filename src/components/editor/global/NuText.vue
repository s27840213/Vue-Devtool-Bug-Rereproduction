<template lang="pug">
  div(class="nu-text" :style="wrapperStyles()")
    div(ref="text" class="nu-text__body" :style="bodyStyles()")
        nu-curve-text(v-if="isCurveText"
          :config="config"
          :layerIndex="layerIndex"
          :pageIndex="pageIndex"
          :subLayerIndex="subLayerIndex")
        p(v-else
          v-for="(p, pIndex) in config.paragraphs" class="nu-text__p"
          :key="pIndex",
          :style="styles(p.styles)")
          span(v-for="(span, sIndex) in p.spans" class="nu-text__span"
            :key="sIndex",
            :style="styles(span.styles)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import { IParagraph, IText } from '@/interfaces/layer'
import { IFont } from '@/interfaces/text'
import { mapState, mapGetters, mapMutations } from 'vuex'
import TextUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import LayerUtils from '@/utils/layerUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import GeneralUtils from '@/utils/generalUtils'

export default Vue.extend({
  components: { NuCurveText },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number
  },
  async created() {
    const fontPreset = this.fontPreset as Array<IFont>
    let isLoadedFont = false
    for (const p of (this.config as IText).paragraphs) {
      for (const span of p.spans) {
        const spanFont = span.styles.font
        if (!fontPreset.some(font => font.face === spanFont)) {
          isLoadedFont = true
          const newFont = new FontFace(spanFont, this.getFontUrl(spanFont))
          await newFont.load().then(newFont => {
            document.fonts.add(newFont)
            TextUtils.updateFontFace({ name: newFont.family, face: newFont.family })
          })
        }
      }
    }
    if (isLoadedFont) {
      const textHW = TextUtils.getTextHW(this.config, this.config.widthLimit)
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
    }
  },
  mounted() {
    console.log('mounted!')
    console.log(this.config)
    if (this.config.isHeading) {
      if (this.getTextInfo.heading.length) {
        const paraStyles = GeneralUtils.deepCopy(this.config.paragraphs[0].styles)
        const spanStyles = GeneralUtils.deepCopy(this.config.paragraphs[0].spans[0].styles)
        const paragraphs = [] as Array<IParagraph>
        for (const text of this.getTextInfo.heading) {
          paragraphs.push({
            styles: paraStyles,
            spans: [{
              styles: spanStyles,
              text: text
            }]
          })
        }
        TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
      }
    } else if (this.config.isSubheading) {
      // TODO
    } else if (this.config.isBody) {
      // TODO
    }
  },
  computed: {
    ...mapState('text', ['fontPreset']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'store.getters.getLayer',
      getTextInfo: 'getTextInfo'
    }),
    updateTextSize(): any {
      const config = this.config as IText
      return {
        paragraphs: config.paragraphs,
        writingMode: config.styles.writingMode
      }
    },
    getLayerScale(): number {
      return this.config.styles.scale
    },
    isCurveText(): any {
      const { textShape } = this.config.styles
      return textShape && textShape.name === 'curve'
    }
  },
  watch: {
    updateTextSize: {
      handler: function() {
        console.log('updateTextSize')
        /**
         * If below conditions is pass, means the text-properties changes,
         *
         * the layer width/height needs to refresh
         */
        if (this.config.isTyping) return
        this.$nextTick(() => {
          const textHW = TextUtils.getTextHW(this.config, this.config.widthLimit)
          //           if (this.currSelectedInfo.layers.length <= 1) {
          if (typeof this.subLayerIndex === 'undefined') {
            ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
          } else {
            this.updateSelectedLayerStyles({
              styles: {
                width: textHW.width,
                height: textHW.height
              },
              layerIndex: this.subLayerIndex
            })
            if (this.subLayerIndex === this.currSelectedInfo.layers.length - 1) {
              const { width, height } = calcTmpProps(this.currSelectedInfo.layers)
              LayerUtils.updateLayerStyles(this.pageIndex, this.currSelectedInfo.index, { width, height })
            }
          }
        })
      },
      deep: true
    }
  },
  methods: {
    ...mapMutations({
      updateSelectedLayerStyles: 'UPDATE_selectedLayersStyles'
    }),
    styles(styles: any) {
      return CssConveter.convertFontStyle(styles)
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
      const { editing } = this.config
      const { isCurveText } = this
      const opacity = editing ? (isCurveText ? 0.2 : 0) : 1
      return {
        writingMode: this.config.styles.writingMode,
        opacity
      }
    },
    getFontUrl(fontID: string): string {
      return `url("https://template.vivipic.com/font/${fontID}/font")`
    }
  }
})
</script>

<style lang="scss" scoped>
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
      margin: 0.5em;
  }
  &__span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
}

</style>
