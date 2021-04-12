<template lang="pug">
  img(class="nu-image" ref="body"
  :style="styles()"
  draggable="false")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object
  },
  mounted() {
    // TODO: used for as temporary src for testing other components
    this.$el.src = require('@/assets/img/svg/img-tmp.svg');
  },
  methods: {
    styles() {
      return {
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
