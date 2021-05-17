<template lang="pug">
  div(class="nu-text")
    span(class="text-content" v-for="text in content" :style="contextStyles()" ref="content") {{ text }}
</template>

<script lang="ts">
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'
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
    }
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
      for (let i = textArr.length - 1; i > 0; i--) {
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
  text-align: left;
}
.text-content {
  position: relative;
  display: inline-block;
  outline: none;
  // white-space: nowrap
  white-space: pre;
  overflow-wrap: break-word;
  user-select: none;
}
</style>
