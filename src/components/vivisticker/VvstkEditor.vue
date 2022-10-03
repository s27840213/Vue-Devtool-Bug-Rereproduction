<template lang="pug">
  div(class="vvstk-editor" :style="copyingStyles()")
    div(class="vvstk-editor__pseudo-page" :style="styles('page')")
      div(class="vvstk-editor__scale-container" :style="styles('scale')")
        page-content(id="vvstk-editor" :config="config" :pageIndex="pageIndex" :noBg="true" :contentScaleRatio="contentScaleRatio")
        div(class="page-control" :style="styles('control')")
          template(v-for="(layer, index) in config.layers")
            nu-controller(v-if="layer.type !== 'image' || !layer.imgControl"
              data-identifier="controller"
              :key="`controller-${(layer.id === undefined) ? index : layer.id}`"
              :layerIndex="index"
              :pageIndex="pageIndex"
              :config="layer"
              :snapUtils="snapUtils"
              :contentScaleRatio="contentScaleRatio"
              @getClosestSnaplines="getClosestSnaplines"
              @clearSnap="clearSnap")
        dim-background(v-if="imgControlPageIdx === pageIndex" :config="config" :contentScaleRatio="contentScaleRatio")
</template>

<script lang="ts">
import Vue from 'vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import DimBackground from '@/components/editor/page/DimBackground.vue'
import { IPage } from '@/interfaces/page'
import { mapGetters } from 'vuex'
import { IFrame, IGroup, IImage, ILayer, ITmp } from '@/interfaces/layer'
import imageUtils from '@/utils/imageUtils'
import SnapUtils from '@/utils/snapUtils'
import generalUtils from '@/utils/generalUtils'
import { ISnapline } from '@/interfaces/snap'
import groupUtils from '@/utils/groupUtils'
import frameUtils from '@/utils/frameUtils'

export default Vue.extend({
  data() {
    return {
      pageIndex: 0,
      snapUtils: new SnapUtils(0),
      closestSnaplines: {
        v: [] as Array<number>,
        h: [] as Array<number>
      },
      imageUtils
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      pages: 'getPages',
      getLayer: 'getLayer',
      editorBg: 'vivisticker/getEditorBg',
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      contentScaleRatio: 'getContentScaleRatio',
      isDuringCopy: 'vivisticker/getIsDuringCopy'
    }),
    config(): IPage {
      return this.pages[this.pageIndex]
    },
    getCurrLayer(): ILayer {
      return generalUtils.deepCopy(this.getLayer(this.pageIndex, this.currSelectedIndex))
    },
    getCurrSubSelectedLayerShown(): IImage | undefined {
      const layer = this.getCurrLayer
      if (layer.type === 'group') {
        const subLayer = generalUtils.deepCopy((this.getCurrLayer as IGroup).layers[this.currSubSelectedInfo.index]) as IImage
        const scale = subLayer.styles.scale
        subLayer.styles.scale = 1
        subLayer.styles.x *= layer.styles.scale
        subLayer.styles.y *= layer.styles.scale
        const mappedLayer = groupUtils
          .mapLayersToPage([subLayer], this.getCurrLayer as ITmp)[0] as IImage
        mappedLayer.styles.scale = scale
        return Object.assign(mappedLayer, { forRender: true, pointerEvents: 'none' })
      } else if (layer.type === 'frame') {
        if (frameUtils.isImageFrame(layer as IFrame)) {
          const image = generalUtils.deepCopy((layer as IFrame).clips[0]) as IImage
          image.styles.x = layer.styles.x
          image.styles.y = layer.styles.y
          image.styles.scale = 1
          // image.styles.imgWidth *= layer.styles.scale
          // image.styles.imgHeight *= layer.styles.scale
          return Object.assign(image, { forRender: true })
        }
        const primaryLayer = this.getCurrLayer as IFrame
        const image = generalUtils.deepCopy(primaryLayer.clips[Math.max(this.currSubSelectedInfo.index, 0)]) as IImage
        image.styles.x *= primaryLayer.styles.scale
        image.styles.y *= primaryLayer.styles.scale
        if (primaryLayer.styles.horizontalFlip || primaryLayer.styles.verticalFlip) {
          const { imgX, imgY, imgWidth, imgHeight, width, height } = image.styles
          const [baselineX, baselineY] = [-(imgWidth - width) / 2, -(imgHeight - height) / 2]
          const [translateX, translateY] = [imgX - baselineX, imgY - baselineY]
          image.styles.imgX -= primaryLayer.styles.horizontalFlip ? translateX * 2 : 0
          image.styles.imgY -= primaryLayer.styles.verticalFlip ? translateY * 2 : 0
        }
        Object.assign(image, { forRender: true })
        return groupUtils.mapLayersToPage([image], this.getCurrLayer as ITmp)[0] as IImage
      }
      return undefined
    },
    selectedLayerCount(): number {
      return this.currSelectedInfo.layers.length
    }
  },
  components: {
    PageContent,
    DimBackground
  },
  methods: {
    styles(type: string) {
      switch (type) {
        case 'control':
          return {
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            overflow: this.selectedLayerCount > 0 ? 'initial' : 'hidden'
          }
        case 'page':
          return {
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            backgroundColor: this.isDuringCopy ? 'transparent' : this.editorBg,
            ...(this.isDuringCopy ? { boxShadow: '0 0 0 2000px #1f1f1f' } : {})
          }
        case 'scale':
          return {
            transform: `scale(${1 / this.contentScaleRatio})`
          }
      }
    },
    copyingStyles() {
      return this.isDuringCopy ? { background: 'transparent' } : {}
    },
    getClosestSnaplines() {
      this.closestSnaplines.v = [...this.snapUtils.closestSnaplines.v.map((snapline: ISnapline) => snapline.pos)]
      this.closestSnaplines.h = [...this.snapUtils.closestSnaplines.h.map((snapline: ISnapline) => snapline.pos)]
    },
    clearSnap(): void {
      this.snapUtils.clear()
      this.closestSnaplines.v = []
      this.closestSnaplines.h = []
    }
  }
})
</script>

<style lang="scss" scoped>
.vvstk-editor {
  @include size(100%);
  background: setColor(black-2);
  overflow: hidden;
  &__pseudo-page {
    position: relative;
    transform-style: preserve-3d;
    user-select: none;
    margin: 16px auto 0 auto;
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    border-radius: 10px;
  }
  &__scale-container {
    width: 0px;
    height: 0px;
    position: relative;
    box-sizing: border-box;
    transform-origin: 0 0;
  }
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
</style>
