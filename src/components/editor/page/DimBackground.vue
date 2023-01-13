<template lang="pug">
div(v-if="isImgCtrl")
  div(class="dim-background"
    :style="styles")
  div
    nu-layer(:style="'opacity: 0.45'"
      :layerIndex="layerIndex"
      :pageIndex="pageIndex"
      :primaryLayer="primaryLayer"
      :imgControl="true"
      :forRender="true"
      :contentScaleRatio="contentScaleRatio"
      :config="image")
  div
    nu-layer(:layerIndex="layerIndex"
      :pageIndex="pageIndex"
      :primaryLayer="primaryLayer"
      :forRender="true"
      :contentScaleRatio="contentScaleRatio"
      :config="image")
  div(class="page-control" :style="styles")
    nu-img-controller(:layerIndex="layerIndex"
                      :pageIndex="pageIndex"
                      :contentScaleRatio="contentScaleRatio"
                      :primaryLayer="primaryLayer"
                      :config="image")
div(v-else-if="isBgImgCtrl")
  div(class="background-control"
      :style="backgroundControlStyles")
    nu-image(:config="image" :inheritStyle="backgroundFlipStyles" :isBgImgControl="true"  :contentScaleRatio="contentScaleRatio" :forRender="true")
    nu-background-controller(:config="image"
      :pageIndex="pageIndex"
      :contentScaleRatio="contentScaleRatio")
  div(class="page-window")
    div(class="background-control"
    :style="backgroundControlStyles")
      nu-image(:config="image" :inheritStyle="backgroundFlipStyles" :isBgImgControl="true"  :contentScaleRatio="contentScaleRatio" :forRender="true")
    component(v-for="(elm, idx) in getHalation"
      :key="idx"
      :is="elm.tag"
      v-bind="elm.attrs")
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'
import NuBackgroundController from '@/components/editor/global/NuBackgroundController.vue'
import { IPage } from '@/interfaces/page'
import cssConverter from '@/utils/cssConverter'
import pageUtils from '@/utils/pageUtils'
import { IImage } from '@/interfaces/layer'
import imageAdjustUtil from '@/utils/imageAdjustUtil'

export default defineComponent({
  emits: [],
  components: {
    NuBackgroundController
  },
  data() {
    return {}
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    isAnyBackgroundImageControl: {
      type: Boolean,
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  computed: {
    ...mapState('imgControl', ['image', 'layerInfo', 'primaryLayer']),
    ...mapGetters({
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      isImgCtrl: 'imgControl/isImgCtrl',
      isBgImgCtrl: 'imgControl/isBgImgCtrl'
    }),
    styles() {
      const config = this.config as IPage
      return {
        width: `${config.width * this.contentScaleRatio}px`,
        height: `${config.height * this.contentScaleRatio}px`
      }
    },
    pageIndex(): number {
      return this.layerInfo.pageIndex
    },
    layerIndex(): number {
      return this.layerInfo.subLayerIdx !== -1 ? this.layerInfo.subLayerIdx : this.layerInfo.layerIndex
    },
    primaryLayerIndex(): number {
      return this.layerInfo.subLayerIdx !== -1 ? this.layerInfo.layerIndex : -1
    },
    backgroundControlStyles() {
      const backgroundImage = this.image
      return {
        width: `${backgroundImage.styles.imgWidth * this.contentScaleRatio}px`,
        height: `${backgroundImage.styles.imgHeight * this.contentScaleRatio}px`,
        left: `${backgroundImage.styles.imgX * this.contentScaleRatio}px`,
        top: `${backgroundImage.styles.imgY * this.contentScaleRatio}px`
      }
    },
    backgroundFlipStyles() {
      const { horizontalFlip, verticalFlip } = this.image.styles
      return cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
    },
    backgroundContorlClipStyles() {
      const { imgX: posX, imgY: posY } = this.image.styles
      const pageWidth = pageUtils.currFocusPage.width
      const pageHeight = pageUtils.currFocusPage.height
      return {
        clipPath: `path('M${-posX * this.contentScaleRatio},${-posY * this.contentScaleRatio}h${pageWidth * this.contentScaleRatio}v${pageHeight * this.contentScaleRatio}h${-pageWidth * this.contentScaleRatio}z`,
        'pointer-events': 'none'
      }
    },
    getHalation(): ReturnType<typeof imageAdjustUtil.getHalation> {
      const { styles: { adjust } } = this.config.backgroundImage.config as IImage
      const { width, height } = this.config
      const position = {
        width: width / 2 * this.contentScaleRatio,
        x: (width / 2) * this.contentScaleRatio,
        y: (height / 2) * this.contentScaleRatio
      }
      return imageAdjustUtil.getHalation(adjust.halation, position)
    }
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

.background-control {
  position: absolute;
  // z-index: 1000;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
}

.page-window {
  position: absolute;
  pointer-events: none;
  top:0;
  left:0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
