<template lang="pug">
  div(class="nu-frame"
      :style="styles()")
    nu-layer(v-for="(layer,index) in config.layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :layerIndex="layerIndex"
      :subLayerIndex="index"
      :config="layer")
</template>

<script lang="ts">
import { IFrame } from '@/interfaces/layer'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  created() {
    this.config.layers = [(this.config as IFrame).decoration, ...(this.config as IFrame).clips]
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
.nu-frame {
  position: absolute;
  transform-style: flat;
}
</style>
