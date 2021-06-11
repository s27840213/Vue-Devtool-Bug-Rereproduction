<template lang="pug">
  div()
      p(v-for="(p, pIndex) in config.paragraphs" class="text__p"
        :key="pIndex",
        :style="styles(p.styles)")
        span(v-for="(span, sIndex) in p.spans" class="text__span"
          :key="sIndex",
          :style="styles(span.styles)") {{ span.text }}
</template>

  // div(class="nu-text" ref="body")
  //   div(class="nu-text" ref="content")
  //     span(class="text-content" v-for="text in textContent" :style="contextStyles()") {{ text }}

<script lang="ts">
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import TextUtils from '@/utils/textUtils'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  data() {
    return {
      textContent: ['']
    }
  },
  mounted() {
    // this.textContent = this.getTextContent
  },
  watch: {
    // 'config.text': function() {
    //   this.textContent = this.getTextContent
    //   setTimeout(() => {
    //     const content = this.getContentBody
    //     if (content.offsetHeight >= this.config.styles.height) {
    //       ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, content.offsetWidth, content.offsetHeight, this.config.styles.size)
    //       ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, content.offsetWidth, content.offsetHeight, 1)
    //     }
    //   }, 0)
    // },
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
  computed: {
    // getTextContent(): string[] {
    //   const space = /&nbsp;/g
    //   let text = this.config.text as string
    //   text = this.config.text.replace(space, ' ')
    //   let textArr = text.split('<br>')
    //   textArr = textArr.map((text) => {
    //     if (text === '') {
    //       text = ' '
    //     }
    //     return text
    //   })
    //   for (let i = textArr.length - 1; i >= 0; i--) {
    //     if (textArr[i] !== ' ') {
    //       textArr = textArr.slice(0, i + 1)
    //       break
    //     }
    //   }
    //   return textArr
    // },
    // getContentBody(): HTMLElement {
    //   return this.$refs.content as HTMLElement
    // }
  },
  methods: {
    styles(styles: any) {
      return CssConveter.convertFontStyle(styles)
    }
    // contextStyles() {
    //   const _styles = Object.assign({}, this.config.styles)
    //   const styles = Object.assign(_styles, { size: this.config.styles.size / this.config.styles.scale })
    //   delete styles.width
    //   delete styles.height
    //   return CssConveter.convertFontStyle(styles)
    // }
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
  &__p {
      margin: 0.5em;
  }
  &__span {
    text-align: left;
    outline: none;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  // text-align: left;
  // position: relative;
  // display: inline-block;
  // outline: none;
  // // white-space: nowrap
  // white-space: pre-wrap;
  // overflow-wrap: break-word;
  // user-select: none;
}
</style>
