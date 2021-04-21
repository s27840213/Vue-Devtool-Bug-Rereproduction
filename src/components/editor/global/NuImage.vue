<template lang="pug">
  img(class="nu-image" ref="body"
  :style="styles()"
  draggable="false"
  :src="config.src")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object
  },
  methods: {
    styles() {
      return {
        width: `${this.config.styles.initWidth}px`,
        height: `${this.config.styles.initHeight}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
