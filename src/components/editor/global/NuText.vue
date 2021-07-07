<template lang="pug">
  div(ref="text" class="nu-text text" :style="textStyles()")
      p(v-for="(p, pIndex) in config.paragraphs" class="text__p"
        :key="pIndex",
        :style="styles(p.styles)")
        span(v-for="(span, sIndex) in p.spans" class="text__span"
          :key="sIndex",
          :style="styles(span.styles)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import { IText } from '@/interfaces/layer'
import { mapGetters } from 'vuex'
import { config } from 'vue/types/umd'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    updateTextSize(): any {
      const config = this.config as IText
      return {
        // width: config.styles.width,
        // height: config.styles.height,
        paragraphs: config.paragraphs,
        active: config.active
      }
    },
    getLayerScale(): number {
      return this.config.styles.scale
    }
  },
  watch: {
    updateTextSize: {
      handler: function() {
        this.$nextTick(() => {
          const text = this.$refs.text as HTMLElement
          if (!this.config.active) {
            text.style.width = `${this.config.styles.width / this.getLayerScale}px`
            // text.style.height = 'max-content'
            text.style.height = `${this.config.styles.height / this.getLayerScale}px`
          } else {
            text.style.width = this.config.widthLimit === -1 ? 'max-content' : `${this.config.widthLimit / this.getLayerScale}px`
            text.style.height = 'max-content'
            // text.style.height = 'max-content'
            const textHW = {
              width: Math.ceil(text.getBoundingClientRect().width / (this.scaleRatio / 100)),
              height: Math.ceil(text.getBoundingClientRect().height / (this.scaleRatio / 100))
            }
            text.style.width = `${textHW.width / this.getLayerScale}px`
            text.style.height = `${textHW.height / this.getLayerScale}px`
            ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
          }
        })
      },
      deep: true
    }
  },
  methods: {
    styles(styles: any) {
      return CssConveter.convertFontStyle(styles)
    },
    textStyles() {
      return {
        opacity: this.config.active ? 0 : 1
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-text {
  // display: flex;
  // flex-direction: column;
  // position: relative;
}
.text {
  height: 'max-content';
  // margin: auto;
  position: absolute;
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
