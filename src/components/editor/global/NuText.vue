<template lang="pug">
  div(ref="text" class="text")
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
        initWidth: config.styles.initWidth,
        initHeight: config.styles.initHeight,
        paragraphs: config.paragraphs
      }
    }
  },
  watch: {
    updateTextSize: {
      handler: function() {
        console.log('changedSizeProps')
        setTimeout(() => {
          const text = this.$refs.text as HTMLElement
          const scale = this.config.styles.scale
          text.style.width = this.config.widthLimit === -1 ? 'fit-content' : `${this.config.widthLimit}px`
          text.style.height = 'fit-content'
          const textHW = {
            width: Math.ceil(text.getBoundingClientRect().width / (this.scaleRatio / 100)),
            height: Math.ceil(text.getBoundingClientRect().height / (this.scaleRatio / 100))
          }
          text.style.width = `${Math.ceil(textHW.width / scale)}px`
          text.style.height = `${Math.ceil(textHW.height / scale)}px`
          ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, scale)
        }, 0)
      },
      deep: true
    }
    // 'config.styles.font': function() {
    //   setTimeout(() => {
    //     const content = this.getContentBody
    //     ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, content.offsetWidth, content.offsetHeight, this.config.styles.size)
    //     ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, content.offsetWidth, content.offsetHeight, 1)
    //   }, 0)
    // }

    // 'config.styles.size': function() {
    //   const textHW = TextUtils.getTextHW(this.config.text)
    //   console.log(textHW)
    //   ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.config.styles.size)
    //   ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, 1)
    // }
  },
  methods: {
    styles(styles: any) {
      return CssConveter.convertFontStyle(styles)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-text {
  display: flex;
  flex-direction: column;
  position: relative;
}
.text {
  // margin: auto;
  position: absolute;
  &__p {
      margin: 0.5em;
  }
  &__span {
    text-align: left;
    outline: none;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
}
</style>
