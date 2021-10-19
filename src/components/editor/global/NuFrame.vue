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
import Vue from 'vue'
import { IListServiceContentDataItem } from '@/interfaces/api'
import { IFrame, IImage, ILayer, IShape } from '@/interfaces/layer'
import AssetUtils from '@/utils/assetUtils'
import ImageUtils from '@/utils/imageUtils'
import { mapGetters } from 'vuex'
import GeneralUtils from '@/utils/generalUtils'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  async created() {
    if (this.config.needFetch) {
      const config = this.config as IFrame
      const asset = {
        type: 8,
        id: config.designId,
        ver: this.getVerUni
      } as IListServiceContentDataItem

      const json = (await AssetUtils.get(asset)).jsonData as IFrame

      this.config.styles.initWidth = json.width
      this.config.styles.initHeight = json.height
      config.clips.forEach((img, idx) => {
        if (json.clips[idx]) {
          img.clipPath = json.clips[idx].clipPath
        }
      })
      if (config.decoration && json.decoration) {
        json.decoration.color = [...config.decoration.color]
        Object.assign(config.decoration, json.decoration)
      }
      if (config.decorationTop && json.decorationTop) {
        json.decorationTop.color = [...config.decorationTop.color]
        Object.assign(config.decoration, json.decorationTop)
      }
      delete config.needFetch
    }
  },
  computed: {
    ...mapGetters({
      getLayer: 'getLayer'
    }),
    ...mapGetters('user', ['getVerUni']),
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
        height: `${this.config.styles.height / this.config.styles.scale}px`,
        pointerEvents: ImageUtils.isImgControl ? 'none' : 'initial'
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
