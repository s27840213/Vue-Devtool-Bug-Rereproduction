<template lang="pug">
  div(v-if="isImgControl")
    div(class="dim-background"
      :style="styles")
    div
      nu-layer(:style="'opacity: 0.45'"
        :layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :imgControl="true"
        :forRender="true"
        :contentScaleRatio="contentScaleRatio"
        :config="image")
    div
      nu-layer(:layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :forRender="true"
        :contentScaleRatio="contentScaleRatio"
        :config="image")
    div(class="page-control" :style="styles")
        nu-img-controller(:layerIndex="layerIndex"
                          :pageIndex="pageIndex"
                          :contentScaleRatio="contentScaleRatio"
                          :config="image")
                          //- :forRender="true"
</template>
<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters, mapState } from 'vuex'
import NuImage from '@/components/editor/global/NuImage.vue'
import NuBackgroundController from '@/components/editor/global/NuBackgroundController.vue'
import { IPage } from '@/interfaces/page'

export default Vue.extend({
  components: {
    NuImage,
    NuBackgroundController
  },
  data() {
    return {}
  },
  props: {
    config: Object,
    pageScaleRatio: Number,
    isAnyBackgroundImageControl: Boolean,
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  computed: {
    ...mapState('imgControl', ['image', 'layerInfo', 'primaryLayer']),
    ...mapGetters({
      isImgControl: 'imgControl/isImgControl'
    }),
    styles() {
      const config = this.config as IPage
      return {
        width: `${config.width}px`,
        height: `${config.height}px`
        // overflow: this.selectedLayerCount > 0 ? 'initial' : 'hidden'
      }
    },
    pageIndex(): number {
      return this.layerInfo.pageIndex
    },
    layerIndex(): number {
      return this.layerInfo.layerIndex
    },
    subLayerIdx(): number {
      return this.layerInfo.subLayerIdx
    }
    // getCurrLayer(): ILayer {
    //   return generalUtils.deepCopy(this.getLayer(this.pageIndex, this.currSelectedIndex))
    // },
    // getCurrSubSelectedLayerShown(): IImage | undefined {
    //   const layer = this.getCurrLayer
    //   if (layer.type === 'group') {
    //     const subLayer = generalUtils.deepCopy((this.getCurrLayer as IGroup).layers[this.currSubSelectedInfo.index]) as IImage
    //     const scale = subLayer.styles.scale
    //     subLayer.styles.scale = 1
    //     subLayer.styles.x *= layer.styles.scale
    //     subLayer.styles.y *= layer.styles.scale
    //     const mappedLayer = GroupUtils
    //       .mapLayersToPage([subLayer], this.getCurrLayer as ITmp)[0] as IImage
    //     mappedLayer.styles.scale = scale
    //     return Object.assign(mappedLayer, { forRender: true, pointerEvents: 'none' })
    //   } else if (layer.type === 'frame') {
    //     if (frameUtils.isImageFrame(layer as IFrame)) {
    //       const image = generalUtils.deepCopy((layer as IFrame).clips[0]) as IImage
    //       image.styles.x = layer.styles.x
    //       image.styles.y = layer.styles.y
    //       image.styles.scale = 1
    //       // image.styles.imgWidth *= layer.styles.scale
    //       // image.styles.imgHeight *= layer.styles.scale
    //       return Object.assign(image, { forRender: true })
    //     }
    //     const primaryLayer = this.getCurrLayer as IFrame
    //     const image = generalUtils.deepCopy(primaryLayer.clips[Math.max(this.currSubSelectedInfo.index, 0)]) as IImage
    //     image.styles.x *= primaryLayer.styles.scale
    //     image.styles.y *= primaryLayer.styles.scale
    //     if (primaryLayer.styles.horizontalFlip || primaryLayer.styles.verticalFlip) {
    //       const { imgX, imgY, imgWidth, imgHeight, width, height } = image.styles
    //       const [baselineX, baselineY] = [-(imgWidth - width) / 2, -(imgHeight - height) / 2]
    //       const [translateX, translateY] = [imgX - baselineX, imgY - baselineY]
    //       image.styles.imgX -= primaryLayer.styles.horizontalFlip ? translateX * 2 : 0
    //       image.styles.imgY -= primaryLayer.styles.verticalFlip ? translateY * 2 : 0
    //     }
    //     Object.assign(image, { forRender: true })
    //     return GroupUtils.mapLayersToPage([image], this.getCurrLayer as ITmp)[0] as IImage
    //   }
    //   return undefined
    // }
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setDropdown: 'popup/SET_STATE',
      _addPage: 'ADD_page',
      _deletePage: 'DELETE_page',
      setPanelType: 'SET_currFunctionPanelType',
      setSidebarType: 'SET_currSidebarPanelType',
      setCurrHoveredPageIndex: 'SET_currHoveredPageIndex'
    })
  }
})
</script>

<style lang="scss" scoped>
.page-highlighter {
  position: absolute;
  top: 0px;
  left: 0px;
  border: 2px solid setColor(blue-2);
  box-sizing: border-box;
  z-index: setZindex("page-highlighter");
  pointer-events: none;
}
.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  transform-style: preserve-3d;
  // this css property will prevent the page-control div from blocking all the event of page-content
  pointer-events: none;
  :focus {
    outline: none;
  }
}

.layer-img {
  background: red;
  opacity: 0.5;
  pointer-events: none;
}

.dim-background {
  position: absolute;
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  transform-style: preserve-3d;
}
</style>
