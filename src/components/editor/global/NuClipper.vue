<template lang="pug">
  div(class="nu-clipper" :style="styles()")
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
    index: Number
  },
  methods: {
    styles() {
      return {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
}
</style>
