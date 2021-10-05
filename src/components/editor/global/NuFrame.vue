<template lang="pug">
  div(class="nu-frame"
      :style="styles()")
    nu-layer(v-for="(layer,index) in layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :layerIndex="layerIndex"
      :subLayerIndex="index"
      :config="layer")
</template>

<script lang="ts">
import { IFrame, IImage, ILayer, IShape } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'
import { Layer } from 'konva/types/Layer'
import Vue from 'vue'
import { config } from 'vue/types/umd'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  computed: {
    ...mapGetters({
      getLayer: 'getLayer'
    }),
    layers() {
      const config = this.config as IFrame
      let layers: Array<IImage | IShape> = []
      if (config.decoration && config.decoration.svg) {
        layers = layers.concat(config.decoration)
      }

      layers = layers.concat(...config.clips)

      if (config.decorationTop && config.decorationTop.svg) {
        layers = layers.concat(config.decorationTop)
      }
      return layers
    }
  },
  methods: {
    styles() {
      return {
        // width: `${this.config.styles.width}px`,
        // height: `${this.config.styles.height}px`
        width: `${this.config.styles.width / this.config.styles.scale}px`,
        height: `${this.config.styles.height / this.config.styles.scale}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-frame {
  position: absolute;
  transform-style: flat;
}
</style>
