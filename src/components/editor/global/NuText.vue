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
    'config.text': function(newVal) {
      this.content = this.getTextContent
      console.log(this.content)
    }
  },
  computed: {
    getTextContent(): string[] {
      const textArr: string[] = []
      const space = /&nbsp;/g
      const text = this.config.text.replace(space, ' ')
      console.log(text)
      let i = 0
      let j = 0
      for (i = 0, j = 0; i < text.length - 4; i++) {
        // if (text.substring(i, i + 6) === '&nbsp;') {
        //   console.log('space')
        //   textArr.push(text.substring(j, i))
        //   i += 7
        //   j = i
        // }
        if (text.substring(i, i + 4) === '<br>') {
          textArr.push(text.substring(j, i))
          i += 4
          j = i
        }
      }
      if (text.substring(text.length - 4, text.length) === '<br>') {
        textArr.push(text.substring(j, text.length - 4))
      } else {
        textArr.push(text.substring(j, text.length))
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
  white-space: nowrap;
  overflow-wrap: break-word;
  user-select: none;
}
</style>
