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
import { IGroup, IParagraph, ISpanStyle, IText } from '@/interfaces/layer'
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
    if (LayerUtils.getCurrLayer.type === 'tmp') {
      return
    }
    const promises: Array<Promise<void>> = []
    for (const p of (this.config as IText).paragraphs) {
      for (const span of p.spans) {
        const promise = this.addFont({
          type: span.styles.type,
          face: span.styles.font,
          url: span.styles.fontUrl,
          ver: this.verUni
        }).catch(e => console.error(e))

        promises.push(promise)
      }
    }

    await Promise
      .all(promises)

    if (this.config.styles.textShape?.name) {
      return
    }

    if (!this.isDestroyed) {
      // const textHW = TextUtils.getTextHW(this.config, this.config.widthLimit)
      const textHW = this.autoResize()
      if (typeof this.subLayerIndex === 'undefined') {
        ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
      } else if (this.subLayerIndex === this.getLayer(this.pageIndex, this.layerIndex).layers.length - 1) {
        const group = this.getLayer(this.pageIndex, this.layerIndex) as IGroup
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, { width: textHW.width, height: textHW.height })
        const { width, height } = calcTmpProps(group.layers, group.styles.scale)
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
    ...mapState('user', ['verUni']),
    ...mapGetters('text', ['getDefaultFonts']),
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
    }
  },
  methods: {
    ...mapActions('text', ['addFont']),
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
      const { editing, contentEditable } = this.config
      const { isCurveText, isFlipped } = this
      const opacity = editing ? (contentEditable ? ((isCurveText || isFlipped) ? 0.2 : 0) : (isCurveText ? 1 : (isFlipped ? 0.2 : 0))) : 1
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
    },
    autoResize(): {width: number, height: number} {
      if (this.$route.name !== 'Preview' || this.config.widthLimit === -1) return TextUtils.getTextHW(this.config, this.config.widthLimit)
      const dimension = this.config.styles.writingMode.includes('vertical') ? 'width' : 'height'
      let direction = 0
      let shouldContinue = true
      let widthLimit = this.config.widthLimit
      let autoSize = TextUtils.getTextHW(this.config, widthLimit)
      const originDimension = this.config.styles[dimension]
      while (shouldContinue) {
        const autoDimension = autoSize[dimension]
        if (autoDimension - originDimension > 5) {
          if (direction < 0) break
          widthLimit += 1
          direction = 1
          autoSize = TextUtils.getTextHW(this.config, widthLimit)
          continue
        }
        if (originDimension - autoDimension > 5) {
          if (direction > 0) break
          widthLimit -= 1
          direction = -1
          autoSize = TextUtils.getTextHW(this.config, widthLimit)
          continue
        }
        shouldContinue = false
      }
      return autoSize
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
  }
}

</style>
