<template lang="pug">
div(v-if="isImgCtrl" class="dim-background")
  div(class="dim-background__backdrop")
  div(class="dim-background__content-area" :style="contentAreaStyles")
    div
      nu-layer(:style="'opacity: 0.45'"
        :layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :page="config"
        :primaryLayer="primaryLayer"
        :imgControl="true"
        :forRender="true"
        :contentScaleRatio="contentScaleRatio"
        :config="image")
    div
      nu-layer(:layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :page="config"
        :primaryLayer="primaryLayer"
        :forRender="true"
        :contentScaleRatio="contentScaleRatio"
        :config="image")
    div(class="page-control")
      nu-img-controller(:layerIndex="layerIndex"
                        :pageIndex="pageIndex"
                        :page="config"
                        :contentScaleRatio="contentScaleRatio"
                        :primaryLayer="primaryLayer"
                        :primaryLayerIndex="-1"
                        :config="image")
div(v-else-if="isBgImgCtrl" class="dim-background")
  div(class="background-control"
      :style="backgroundControlStyles")
    nu-image(:config="image"
      :inheritStyle="backgroundFlipStyles"
      :isBgImgControl="true"
      :contentScaleRatio="contentScaleRatio"
      :forRender="true"
      :pageIndex="pageIndex"
      :page="config"
      @onload="bgImgOnload"
      :layerIndex="layerIndex")
    div(class="dim-background__content-area hollow" :style="contentAreaStyles")
      component(v-for="(elm, idx) in getHalation"
        :key="idx"
        :is="elm.tag"
        v-bind="elm.attrs")
    nu-background-controller(:config="image"
      :pageIndex="pageIndex"
      :page="config"
      :contentScaleRatio="contentScaleRatio")
</template>

<script lang="ts">
import NuBackgroundController from '@/components/editor/global/NuBackgroundController.vue'
import { IImage } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import cssConverter from '@/utils/cssConverter'
import generalUtils from '@/utils/generalUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import pageUtils from '@/utils/pageUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapState } from 'vuex'

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
      type: Object as PropType<IPage>,
      required: true
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
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      pageScaleRatio: 'getPageScaleRatio'
    }),
    pageIndex(): number {
      return this.layerInfo.pageIndex
    },
    layerIndex(): number {
      return this.layerInfo.subLayerIdx !== -1 ? this.layerInfo.subLayerIdx : this.layerInfo.layerIndex
    },
    backgroundControlStyles() {
      const backgroundImage = this.image
      let imgX = backgroundImage.styles.imgX
      let imgY = backgroundImage.styles.imgY
      if (this.config.isEnableBleed) {
        imgX += this.config.bleeds.left
        imgY += this.config.bleeds.top
      }

      const _f = this.contentScaleRatio * (generalUtils.isTouchDevice() ? this.pageScaleRatio * 0.01 : 1)
      return {
        width: `${backgroundImage.styles.imgWidth * _f}px`,
        height: `${backgroundImage.styles.imgHeight * _f}px`,
        left: `${imgX * _f}px`,
        top: `${imgY * _f}px`
      }
    },
    backgroundFlipStyles() {
      const { horizontalFlip, verticalFlip } = this.image.styles
      return cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
    },
    getHalation(): ReturnType<typeof imageAdjustUtil.getHalation> {
      const { styles: { adjust } } = this.config.backgroundImage.config as IImage
      if (!adjust) return []
      const { width, height } = pageUtils.removeBleedsFromPageSize(pageUtils.getPage(this.imgControlPageIdx))
      const position = {
        width: width / 2 * this.contentScaleRatio,
        x: width / 2 * this.contentScaleRatio,
        y: height / 2 * this.contentScaleRatio
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
    bgImgOnload() {
      this.$store.commit('imgControl/SET_IsBgCtrlImgLoaded', true)
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
  pointer-events: none;
  position: absolute;
  top: 0px;
  bottom: -1px; // To prevent sub-pixel, push bottom/right 1px out.
  left: 0px;
  right: -1px;
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
