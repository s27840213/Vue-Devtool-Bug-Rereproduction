<template lang="pug">
  div(class="nu-tmp"
      :style="styles()")
    nu-layer(v-for="(layer,index) in config.layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :layerIndex="layerIndex"
      :subLayerIndex="index"
      :config="layer"
      :style="{'outline': '2px solid #7190CC'}")
</template>

<script lang="ts">
import { ILayer, ITmp } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  created() {
    for (const [idx, layer] of (this.config as ITmp).layers.entries()) {
      if (layer.type === 'text') {
        layerUtils.updateSelectedLayerProps(this.pageIndex, idx, { editing: false })
      }
    }
  },
  computed: {
    ...mapGetters({
      getLayer: 'getLayer'
    })
  },
  methods: {
    styles() {
      return {
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-tmp {
  position: absolute;
}
</style>
