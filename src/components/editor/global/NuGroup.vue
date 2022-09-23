<template lang="pug">
  div(class="nu-group"
      :style="styles()")
    nu-layer(v-for="(layer,index) in config.layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :layerIndex="layerIndex"
      :subLayerIndex="index"
      :config="layer"
      :inGroup="true")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
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
.nu-group {
  position: absolute;
  transform-style: flat;
}
</style>
