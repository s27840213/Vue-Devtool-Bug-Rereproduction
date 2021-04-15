<template lang="pug">
  div(class="nu-text")
    span(:style="fontStyles()") {{config.text}}
</template>

<script lang="ts">
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'

export default Vue.extend({
  props: {
    config: Object
  },
  methods: {
    fontStyles() {
      return CssConveter.convertFontStyle(this.config.styles)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-text {
  text-align: left;
}
</style>
