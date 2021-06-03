<template lang="pug">
  div(class="nu-text" ref="body")
    div(class="nu-text" ref="content")
      span(class="text-content" v-for="text in content" :style="contextStyles()") {{ text }}
</template>

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
      content: ['']
    }
  },
  mounted() {
    this.content = this.getTextContent
  },
  watch: {
    'config.text': function() {
      this.content = this.getTextContent
      setTimeout(() => {
        const content = this.$refs.content as HTMLElement
        if (content.offsetHeight >= this.config.styles.height) {
          ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, content.offsetWidth, content.offsetHeight, this.config.styles.size)
          ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, content.offsetWidth, content.offsetHeight, 1)
        }
      }, 0)
    },
    'config.styles.font': function() {
      console.log('change font')
      this.content = this.getTextContent
      setTimeout(() => {
        const content = this.$refs.content as HTMLElement
        ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, content.offsetWidth, content.offsetHeight, this.config.styles.size)
        ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, content.offsetWidth, content.offsetHeight, 1)
      }, 0)
    }
    // 'config.styles.size': function() {

    // }
  },
  computed: {
    getTextContent(): string[] {
      const space = /&nbsp;/g
      let text = this.config.text as string
      text = this.config.text.replace(space, ' ')
      let textArr = text.split('<br>')
      textArr = textArr.map((text) => {
        if (text === '') {
          text = ' '
        }
        return text
      })
      for (let i = textArr.length - 1; i >= 0; i--) {
        if (textArr[i] !== ' ') {
          textArr = textArr.slice(0, i + 1)
          break
        }
      }
      return textArr
    }
  },
  methods: {
    contextStyles() {
      const _styles = Object.assign({}, this.config.styles)
      const styles = Object.assign(_styles, { size: this.config.styles.initSize })
      delete styles.width
      delete styles.height
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
.text-content {
  text-align: left;
  position: relative;
  display: inline-block;
  outline: none;
  // white-space: nowrap
  white-space: pre-wrap;
  overflow-wrap: break-word;
  user-select: none;
}
</style>
