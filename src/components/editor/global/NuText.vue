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
import { IText } from '@/interfaces/layer'
import { mapGetters, mapMutations } from 'vuex'
import TextUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number
  },
  components: { NuCurveText },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo'
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
         * the layer width/height needs to refresh
         */
        if (this.config.isTyping) return
        this.$nextTick(() => {
          const textHW = TextUtils.getTextHW(this.config, this.config.widthLimit)
          //           if (this.currSelectedInfo.layers.length <= 1) {
          if (!this.subLayerIndex) {
            ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
          } else {
            this.updateSelectedLayerStyles({
              styles: {
                width: textHW.width,
                height: textHW.height
              },
              layerIndex: this.subLayerIndex
            })
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
