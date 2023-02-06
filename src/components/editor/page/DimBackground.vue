<template lang="pug">
div(v-if="isImgCtrl" class="dim-background" @pointerdown="onBgClick")
  div(class="dim-background__backdrop")
  div(class="dim-background__content-area" :style="contentAreaStyles")
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
    div(class="page-control")
      nu-img-controller(:layerIndex="layerIndex"
                        :pageIndex="pageIndex"
                        :contentScaleRatio="contentScaleRatio"
                        :primaryLayer="primaryLayer"
                        :primaryLayerIndex="-1"
                        :config="image")
div(v-else-if="isBgImgCtrl" class="dim-background")
  div(class="background-control"
      :style="backgroundControlStyles")
    nu-image(:config="image" :inheritStyle="backgroundFlipStyles" :isBgImgControl="true"  :contentScaleRatio="contentScaleRatio" :forRender="true" :pageIndex="pageIndex" :layerIndex="layerIndex")
    div(class="dim-background__content-area hollow" :style="contentAreaStyles")
      component(v-for="(elm, idx) in getHalation"
        :key="idx"
        :is="elm.tag"
        v-bind="elm.attrs")
    nu-background-controller(:config="image"
      :pageIndex="pageIndex"
      :contentScaleRatio="contentScaleRatio")
  //- div(:style="backgroundContorlClipStyles")
  //-   nu-image(:config="image" :inheritStyle="backgroundFlipStyles" :isBgImgControl="true" :contentScaleRatio="contentScaleRatio")
  //- div(v-if="isAnyBackgroundImageControl && !isBackgroundImageControl"
  //-     class="dim-background"
  //-     :style="Object.assign(styles('control'), {'pointer-events': 'initial'})")

</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'
import NuBackgroundController from '@/components/editor/global/NuBackgroundController.vue'
import cssConverter from '@/utils/cssConverter'
import pageUtils from '@/utils/pageUtils'
import { IImage } from '@/interfaces/layer'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import imageUtils from '@/utils/imageUtils'
import editorUtils from '@/utils/editorUtils'

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
      let imgX = backgroundImage.styles.imgX
      let imgY = backgroundImage.styles.imgY
      if (this.config.isEnableBleed) {
        imgX += this.config.bleeds.left
        imgY += this.config.bleeds.top
      }
      return {
        width: `${backgroundImage.styles.imgWidth * this.contentScaleRatio}px`,
        height: `${backgroundImage.styles.imgHeight * this.contentScaleRatio}px`,
        left: `${imgX * this.contentScaleRatio}px`,
        top: `${imgY * this.contentScaleRatio}px`
      }
    },
    backgroundControlWindowStyles() {
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
      if (!adjust) return []
      const { width, height } = pageUtils.getPage(this.imgControlPageIdx)
      const position = {
        width: width / 2 * this.contentScaleRatio,
        x: (width / 2) * this.contentScaleRatio,
        y: (height / 2) * this.contentScaleRatio
      }
      return imageAdjustUtil.getHalation(adjust.halation, position)
    },
    contentAreaStyles() {
      if (!this.config.isEnableBleed) return {}
      return {
        top: this.config.bleeds.top * this.contentScaleRatio + 'px',
        bottom: this.config.bleeds.bottom * this.contentScaleRatio + 'px',
        left: this.config.bleeds.left * this.contentScaleRatio + 'px',
        right: this.config.bleeds.right * this.contentScaleRatio + 'px'
      }
    }
  },
  methods: {
    onBgClick(e: PointerEvent) {
      /**
       *  Use setTimeout bcz the page click would set the layer to non-active,
       *  setTimeout can make the click order ideally
       */
      setTimeout(() => {
        imageUtils.setImgControlDefault()
        editorUtils.setCurrActivePanel('none')
      }, 0)
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
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
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
  bottom: 0px;
  left: 0px;
  right: 0px;
  transform: rotate(0deg); // for .dim-background__content-area to respect to
  &__backdrop{
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.4);
    pointer-events: none;
    transform-style: preserve-3d;
  }

  &__content-area{
    position: fixed;
    pointer-events: none;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    &.hollow{
      outline: 9999px solid rgba(0,0,0,.6)
    }
  }
}

.background-control {
  position: absolute;

  color: white;
}
</style>
