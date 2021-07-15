<template lang="pug">
  div(ref="text" class="nu-text" :style="textStyles()")
      p(v-for="(p, pIndex) in config.paragraphs" class="nu-text__p"
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
        writingMode: config.styles.writingMode
      }
    },
    getLayerScale(): number {
      return this.config.styles.scale
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
          const text = this.$refs.text as HTMLElement
          text.style.height = 'max-content'
          text.style.width = 'max-content'

          if (this.config.widthLimit !== -1) {
            if (this.config.styles.writingMode.includes('vertical')) {
              text.style.height = `${this.config.widthLimit / this.getLayerScale}px`
            } else {
              text.style.width = `${this.config.widthLimit / this.getLayerScale}px`
            }
          }

          const width = Math.ceil(text.offsetWidth + 1)
          const height = Math.ceil(text.offsetHeight + 1)
          ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, this.getLayerScale)
        })
      },
      deep: true
    },
    'config.active'() {
      const text = this.$refs.text as HTMLElement
      if (!this.config.active) {
        text.style.width = `${this.config.styles.width / this.getLayerScale}px`
        text.style.height = `${this.config.styles.height / this.getLayerScale}px`
      }
    }
  },
  methods: {
    styles(styles: any) {
      return CssConveter.convertFontStyle(styles)
    },
    textStyles() {
      return {
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode,
        opacity: this.config.active ? 0 : 1
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-text {
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
