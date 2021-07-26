<template lang="pug">
  div(class="nu-text" :style="wrapperStyles()")
    div(ref="text" class="nu-text__body" :style="bodyStyles()")
        nu-curve-text(v-if="isCurveText"
          :config="config"
          :layerIndex="layerIndex"
          :pageIndex="pageIndex")
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
import { mapGetters } from 'vuex'
import TextUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  components: { NuCurveText },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
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
      const { textEffect } = this.config.styles
      return textEffect && textEffect.name === 'shape'
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
        if (this.config.isTyping && this.config.active) return
        this.$nextTick(() => {
          // console.log('ddd')
          // const text = this.$refs.text as HTMLElement
          // const transform = text.style.transform
          // const isVertical = this.config.styles.writingMode.includes('vertical')
          // text.style.transform = `rotate(${-this.config.styles.rotate}deg)`

          // if (isVertical) {
          //   text.style.height = this.config.widthLimit === -1 ? 'max-content' : `${this.config.widthLimit / this.getLayerScale}px`
          //   text.style.width = 'max-content'
          // } else {
          //   text.style.width = this.config.widthLimit === -1 ? 'max-content' : `${this.config.widthLimit / this.getLayerScale}px`
          //   text.style.height = 'max-content'
          // }

          // const textHW = {
          //   width: text.getBoundingClientRect().width / (this.scaleRatio / 100),
          //   height: text.getBoundingClientRect().height / (this.scaleRatio / 100)
          // }

          // textHW.width += isVertical ? TextUtils.MARGIN_FONTSIZE : 0
          // textHW.height += isVertical ? 0 : TextUtils.MARGIN_FONTSIZE

          // text.style.transform = transform
          // text.style.width = isVertical ? 'auto' : ''
          // text.style.height = isVertical ? '' : 'auto'
          const textHW = TextUtils.getTextHW(this.config, this.config.widthLimit)

          ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
        })
      },
      deep: true
    }
    // 'config.active'() {
    //   const text = this.$refs.text as HTMLElement
    //   if (!this.config.active) {
    //     text.style.width = `${this.config.styles.width / this.getLayerScale}px`
    //     text.style.height = `${this.config.styles.height / this.getLayerScale}px`
    //   }
    // }
  },
  methods: {
    styles(styles: any) {
      return CssConveter.convertFontStyle(styles)
    },
    bodyStyles() {
      const isVertical = this.config.styles.writingMode.includes('vertical')
      return {
        width: isVertical ? 'auto' : '',
        height: isVertical ? '' : 'auto',
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
