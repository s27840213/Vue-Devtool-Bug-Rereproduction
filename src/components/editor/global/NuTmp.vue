<template lang="pug">
div(class="nu-tmp"
    :style="styles()")
  nu-layer(v-for="(layer,index) in config.layers"
    :key="`layer-${index}`"
    :pageIndex="pageIndex"
    :page="page"
    :layerIndex="layerIndex"
    :subLayerIndex="index"
    :contentScaleRatio="contentScaleRatio"
    :config="layer"
    :style="subLayerStyles(layer)"
    :isSubLayer="true"
    :inTmp="true"
    :primaryScale="config.styles.scale"
    :primaryLayer="config"
    :inPreview="inPreview")
</template>

<script lang="ts">
import { ILayer, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import textPropUtils from '@/utils/textPropUtils'
import { defineComponent, PropType } from 'vue'

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
    page: {
      type: Object as PropType<IPage>,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    inPreview: {
      default: false,
      type: Boolean
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
      // const pageScale = this.$store.state.pageScaleRatio * 0.01
      return {
        // width: `${this.config.styles.initWidth * this.contentScaleRatio * pageScale}px`,
        // height: `${this.config.styles.initHeight * this.contentScaleRatio * pageScale}px`,
        // transform: `scale(${1 / this.contentScaleRatio})`,
        // transformOrigin: 'top left',
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
