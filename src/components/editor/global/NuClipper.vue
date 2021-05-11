<template lang="pug">
  div(class="nu-clipper" :style="styles()" )
    slot
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    config: Object,
    pageIndex: Number
  },
  methods: {
    styles() {
      return {
        width: `${this.config.styles.initWidth}px`,
        height: `${this.config.styles.initHeight}px`,
        'clip-path': "path('M125 0a125 125 0 1 0 0 250a125 125 0 1 0 0-250z')"
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  // overflow: hidden;
}
</style>
