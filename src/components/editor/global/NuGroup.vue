<template lang="pug">
  div(class="nu-group"
      :style="styles()")
    nu-layer(v-for="(layer,index) in config.layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :primaryLayer="config"
      :layerIndex="layerIndex"
      :subLayerIndex="index"
      :contentScaleRatio="contentScaleRatio"
      :config="layer"
      :isSubLayer="true")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  inheritAttrs: false,
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  methods: {
    styles() {
      return {
        // width: `${this.config.styles.initWidth * this.contentScaleRatio}px`,
        // height: `${this.config.styles.initHeight * this.contentScaleRatio}px`,
        transform: `scale(${1 / this.contentScaleRatio})`,
        transformOrigin: 'top left'
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
