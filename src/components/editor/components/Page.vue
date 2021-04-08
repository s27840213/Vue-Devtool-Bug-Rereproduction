<template lang="pug">
  div(class="page-container")
    div(class="page-title text-left text-gray-3")
      span {{config.name}}
    div(class="page-content" :style="styles()")
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
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.page-container {
}
</style>
