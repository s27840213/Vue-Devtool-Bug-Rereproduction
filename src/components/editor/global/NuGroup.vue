<template lang="pug">
div(class="nu-group"
    :style="styles()")
  nu-layer(v-for="(layer,index) in config.layers"
    :key="`layer-${layer.id}`"
    :pageIndex="pageIndex"
    :primaryLayer="config"
    :layerIndex="layerIndex"
    :subLayerIndex="index"
    :contentScaleRatio="contentScaleRatio"
    :config="layer"
    :isSubLayer="true")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    config: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
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
