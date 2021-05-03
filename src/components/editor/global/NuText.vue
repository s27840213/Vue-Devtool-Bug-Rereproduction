<template lang="pug">
  div(class="nu-text")
    span(class="text-content" :style="contextStyles()" ref="content")
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
    return {}
  },
  mounted() {
    const text = this.$refs.content as HTMLElement
    text.innerHTML = this.getTextContent
  },
  watch: {
    'config.text': function(newVal) {
      const text = this.$refs.content as HTMLElement
      text.innerHTML = newVal
    }
  },
  computed: {
    getTextContent(): string {
      return this.config.text
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
  position: relative;
  text-align: left;
}
.text-content {
  position: absolute;
  display: inline-block;
  outline: none;
  white-space: nowrap;
  overflow-wrap: break-word;
}
</style>
