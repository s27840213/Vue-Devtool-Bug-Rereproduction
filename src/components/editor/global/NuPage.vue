<template lang="pug">
  div(class="nu-page")
    div(class="page-title text-left text-gray-3")
      span {{config.name}}
    div(class="page-content" :style="styles()")
      nu-layer(v-for="(layer,index) in config.layers"
        :key="`layer-${index}`"
        :config="layer")
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
    index: Number,
    pageScaleRatio: Number
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
.nu-page {
}

.page-content {
  position: relative;
}
</style>
