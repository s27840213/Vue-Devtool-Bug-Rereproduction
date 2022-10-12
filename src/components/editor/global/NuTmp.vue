<template lang="pug">
  div(class="nu-tmp"
      :style="styles()")
    nu-layer(v-for="(layer,index) in config.layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :layerIndex="layerIndex"
      :subLayerIndex="index"
      :contentScaleRatio="contentScaleRatio"
      :config="layer"
      :style="subLayerStyles(layer)")
</template>

<script lang="ts">
import { ILayer, ITmp } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'
import textPropUtils from '@/utils/textPropUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  created() {
    for (const [idx, layer] of (this.config as ITmp).layers.entries()) {
      if (layer.type === 'text') {
        layerUtils.updateSelectedLayerProps(this.pageIndex, idx, { editing: false })
      }
    }
    textPropUtils.updateTextPropsState()
  },
  computed: {
    ...mapGetters({
      getLayer: 'getLayer'
    })
  },
  methods: {
    styles() {
      return {
        width: `${this.config.styles.initWidth * this.contentScaleRatio}px`,
        height: `${this.config.styles.initHeight * this.contentScaleRatio}px`,
        transform: `scale(${1 / this.contentScaleRatio})`,
        transformOrigin: 'top left'
      }
    },
    subLayerStyles(layer: ILayer) {
      const primaryScale = this.config.styles.scale
      return (layer.type === 'shape' && layer.category === 'D') ? {} : { outline: `${2 / primaryScale}px solid #7190CC` }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-tmp {
  transform-style: preserve-3d;
  position: absolute;
}
</style>
