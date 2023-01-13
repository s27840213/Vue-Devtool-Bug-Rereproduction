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
    :style="subLayerStyles(layer)"
    :isSubLayer="true"
    :inTmp="true"
    :primaryScale="config.styles.scale"
    :primaryLayer="config")
</template>

<script lang="ts">
import { ILayer, ITmp } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import textPropUtils from '@/utils/textPropUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

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
    }),
    transformStyle(): { [index: string]: string } {
      return {
        transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial'
      }
    },
    enalble3dTransform(): boolean {
      return this.pageIndex === pageUtils._3dEnabledPageIndex
    }
  },
  methods: {
    styles() {
      return {
        width: `${this.config.styles.initWidth * this.contentScaleRatio}px`,
        height: `${this.config.styles.initHeight * this.contentScaleRatio}px`,
        transform: `scale(${1 / this.contentScaleRatio})`,
        transformOrigin: 'top left',
        ...this.transformStyle

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
  position: absolute;
}
</style>
