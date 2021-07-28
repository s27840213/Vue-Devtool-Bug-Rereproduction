<template lang="pug">
  div(class="nu-clipper" :style="styles()" ref="body")
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
        transform: 'translate3d(0, 0, 0)',
        'clip-path': this.config.clipPath,
        'background-color': '#00000001'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  transform-style: preserve-3d;
}
</style>
