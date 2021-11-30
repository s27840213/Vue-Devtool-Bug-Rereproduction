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
</template>

<script lang="ts">
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import { ISpanStyle, IText } from '@/interfaces/layer'
import { mapState, mapGetters, mapActions } from 'vuex'
import TextUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import LayerUtils from '@/utils/layerUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import TextPropUtils from '@/utils/textPropUtils'

export default Vue.extend({
  components: { NuCurveText },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number
  },
  data() {
    return {
      isDestroyed: false
    }
  },
  async created() {
    const promises: Array<Promise<void>> = []
    for (const p of (this.config as IText).paragraphs) {
      for (const span of p.spans) {
        const promise = this.addFont({
          type: span.styles.type,
          face: span.styles.font,
          url: span.styles.fontUrl
        }).catch(e => console.error(e))

        promises.push(promise)
      }
    }

    await Promise
      .all(promises)

    if (!this.isDestroyed) {
      const textHW = TextUtils.getTextHW(this.config, this.config.widthLimit)
      if (typeof this.subLayerIndex === 'undefined') {
        ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
      } else if (this.subLayerIndex === this.getLayer(this.pageIndex, this.layerIndex).layers.length - 1) {
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, { width: textHW.width, height: textHW.height })
        const { width, height } = calcTmpProps(this.getLayer(this.pageIndex, this.layerIndex).layers)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width, height })
      }
    }
  },
  destroyed() {
    this.isDestroyed = true
  },
  mounted() {
    if (this.currSelectedInfo.layers >= 1) {
      TextPropUtils.updateTextPropsState()
    }
  },
  computed: {
    ...mapState('text', ['fontStore']),
    ...mapGetters('text', ['getDefaultFonts']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
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
        /**
         * If below conditions is pass, means the text-properties changes,
         * the layer width/height needs to refresh
         */
        if (this.config.isTyping) return
        this.$nextTick(() => {
          TextUtils.updateLayerSize(this.config, this.pageIndex, this.layerIndex, this.subLayerIndex)
        })
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('text', ['addFont']),
    styles(styles: any) {
      const converted = CssConveter.convertFontStyle(styles)
      return Object.assign(converted, {
        'font-family': (converted['font-family'] + ',').concat(this.getDefaultFonts)
      })
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
    getFontUrl(spanStyles: ISpanStyle): string {
      switch (spanStyles.type) {
        case 'public':
          return `url("https://template.vivipic.com/font/${spanStyles.font}/font")`
        case 'private':
          return ''
        case 'URL':
          return 'url("' + spanStyles.fontUrl + '")'
      }
      return `url("https://template.vivipic.com/font/${spanStyles.font}/font")`
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
    margin: 0;
  }
  &__span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
}

</style>
