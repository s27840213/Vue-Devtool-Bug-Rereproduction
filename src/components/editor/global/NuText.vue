<template lang="pug">
  div(class="nu-text" :style="styles()")
    span {{config.text}}
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
        ...this.config.styles
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-text {
}
</style>
