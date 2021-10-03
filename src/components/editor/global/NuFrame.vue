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
import { IFrame } from '@/interfaces/layer'
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
      console.log('this.config-------------------')
      console.log(this.config)
      if ((this.config as IFrame).decoration) {
        return [(this.config as IFrame).decoration, ...(this.config as IFrame).clips]
      } else {
        console.log('there is no decoration')
        return [...(this.config as IFrame).clips]
      }
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
