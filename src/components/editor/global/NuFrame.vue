<template lang="pug">
  div(class="nu-frame"
      :style="styles()")
    nu-layer(v-for="(layer,index) in layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :layerIndex="layerIndex"
      :subLayerIndex="index"
      :flip="flip"
      :config="layer"
      :style="layerStyles")
</template>

<script lang="ts">
import Vue from 'vue'
import { IListServiceContentDataItem } from '@/interfaces/api'
import { IFrame, IImage, IShape } from '@/interfaces/layer'
import AssetUtils from '@/utils/assetUtils'
import ImageUtils from '@/utils/imageUtils'
import { mapGetters } from 'vuex'
import layerFactary from '@/utils/layerFactary'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  data() {
    return {
      layerStyles: {
        transfrom: 'translateZ(0)'
      }
    }
  },
  async created() {
    if (this.config.needFetch && this.config.designId) {
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
        Object.assign(config.decorationTop, json.decorationTop)
      }
      config.needFetch = false
    }
  },
  watch: {
    'config.needFetch': function (newVal) {
      if (newVal && this.config.designId) {
        const asset = {
          type: 8,
          id: this.config.designId,
          ver: this.getVerUni
        } as IListServiceContentDataItem
        AssetUtils.get(asset).then((res) => {
          const json = res.jsonData as IFrame
          this.config.clips = generalUtils.deepCopy(this.config.clips)
          if (this.config.decoration && json.decoration) {
            json.decoration.color = [...this.config.decoration.color] as [string]
            this.config.decoration = layerFactary.newShape({
              ...json.decoration,
              vSize: [this.config.styles.initWidth, this.config.styles.initHeight],
              styles: {
                width: this.config.styles.initWidth,
                height: this.config.styles.initHeight,
                initWidth: this.config.styles.initWidth,
                initHeight: this.config.styles.initHeight
              }
            })
          }
          if (this.config.decorationTop && json.decorationTop) {
            json.decorationTop.color = [...this.config.decorationTop.color] as [string]
            this.config.decorationTop = layerFactary.newShape({
              ...json.decorationTop,
              vSize: [this.config.styles.initWidth, this.config.styles.initHeight],
              styles: {
                width: this.config.styles.initWidth,
                height: this.config.styles.initHeight,
                initWidth: this.config.styles.initWidth,
                initHeight: this.config.styles.initHeight
              }
            })
          }
          this.config.needFetch = false
        })
      }
    }
  },
  computed: {
    ...mapGetters({
      getLayer: 'getLayer'
    }),
    ...mapGetters('user', ['getVerUni']),
    flip() {
      return {
        horizontalFlip: this.config.styles.horizontalFlip,
        verticalFlip: this.config.styles.verticalFlip
      }
    },
    layers() {
      const config = this.config as IFrame
      let layers: Array<IImage | IShape> = []
      if (config.decoration && config.decoration.svg && !config.clips[0].isFrameImg) {
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
        width: `${this.config.styles.width / this.config.styles.scale}px`,
        height: `${this.config.styles.height / this.config.styles.scale}px`,
        pointerEvents: ImageUtils.isImgControl(this.pageIndex) ? 'none' : 'initial'
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
