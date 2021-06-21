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

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  computed: {
    initSize(): any {
      return {
        initWidth: (this.config as IText).styles.initWidth,
        initHeight: (this.config as IText).styles.initHeight
      }
    }
  },
  watch: {
    initSize: {
      handler: function() {
        console.log('initSize ')
        setTimeout(() => {
          const text = this.$refs.text as HTMLElement
          const scale = this.config.styles.scale
          // text.style.width = `${Math.ceil(this.config.styles.width / scale)}px`
          const textHW = {
            width: Math.ceil(text.getBoundingClientRect().width),
            height: Math.ceil(text.getBoundingClientRect().height)
          }
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
