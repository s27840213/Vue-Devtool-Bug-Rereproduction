<template lang="pug">
div(class="panel-remove-bg" ref="panelRemoveBg")
  bg-remove-container(v-if="inBgRemoveMode || isProcessing" :containerWH="containerWH" :containerRef="panelRemoveBg" ref="bgRemoveContainer")
  div(v-else class="btn-section")
    div(class="btn" @click="removeBg")
      div(class="btn__content-section")
        img(class="img-object-cutout" :src="require('@/assets/img/png/bgRemove/object-cutout.png')")
      div(class="btn__text-section")
        span(class="text-H7") {{ $t('STK0060') }}
        span(class="text-black-5 body-XXS btn__description") {{ $t('STK0061') }}
    div(class="btn btn--bgf" @click="removeBgf")
      div(class="btn__content-section btn__content-section--bgf")
        img(:src="require('@/assets/img/png/bgRemove/face-cutout-body.png')")
        img(:src="require('@/assets/img/png/bgRemove/face-cutout.png')")
      div(class="btn__text-section")
        span(class="text-H7 no-wrap") {{ $t('STK0059') }}
        span(class="text-black-5 body-XXS btn__description") {{ $t('STK0062') }}
  //- used to debug
  teleport(v-if="false" to="body")
    div(class="panel-remove-bg__test-input")
      mobile-slider(
        :title="'scale'"
        :borderTouchArea="true"
        :name="'scale'"
        :value="bgRemoveScaleRatio"
        :min="minRatio"
        :max="maxRatio"
        :step="0.01"
        @update="setScaleRatio")
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import BgRemoveContainer from '@/components/vivisticker/BgRemoveContainer.vue'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import imageUtils from '@/utils/imageUtils'
import uploadUtils from '@/utils/uploadUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  components: {
    MobileSlider,
    BgRemoveContainer
  },
  data() {
    return {
      panelRemoveBg: null as unknown as HTMLElement,
      mobilePanelHeight: 0,
      bgRemoveScaleRatio: 1,
      minRatio: 0.1,
      maxRatio: 2,
      // eslint-disable-next-line vue/no-unused-properties
      initImgSize: { width: 0, height: 0 },
      debugMode: false,
      previewSrc: ''
    }
  },
  mounted() {
    this.panelRemoveBg = this.$refs.panelRemoveBg as HTMLElement
  },
  computed: {
    ...mapGetters({
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      isProcessing: 'bgRemove/getIsProcessing',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
    }),
    containerWH() {
      return {
        width: this.panelRemoveBg ? this.panelRemoveBg.offsetWidth : 0,
        /**
         * @Note 60 is the height of the footer
         */
        height: this.panelRemoveBg ? this.panelRemoveBg.offsetHeight - this.mobilePanelHeight : 0,
      }
    },
  },
  methods: {
    ...mapMutations({
      setIsProcessing: 'bgRemove/SET_isProcessing'
    }),
    removeBg() {
      if (this.debugMode) {
        bgRemoveUtils.removeBgStkDebug()
        return
      }

      this.handleIOSImage('stk-bg-remove')
      /**
       * @Note the below codes is for old version
       */
      // uploadUtils.chooseAssets('stk-bg-remove')
    },
    removeBgf() {
      if (this.debugMode) {
        bgRemoveUtils.removeBgStkDebug()
        return
      }
      /**
       * @Note the below codes is for old version
       */
      this.handleIOSImage('stk-bg-remove-face')
    },
    handleIOSImage(type: 'stk-bg-remove' | 'stk-bg-remove-face') {
      vivistickerUtils.getIosImg()
        .then(async (images: Array<string>) => {
          if (images.length) {
            const src = imageUtils.getSrc({
              type: 'ios',
              assetId: images[0],
              userId: ''
            })

            this.previewSrc = src

            this.toDataURL(src, (dataUrl: string) => {
              this.setIsProcessing(true)
              uploadUtils.uploadAsset(type, [dataUrl])
            })
          }
        })
    },
    toDataURL(src: string, callback: (dataUrl: string)=> void) {
      const image = new Image()
      image.crossOrigin = 'Anonymous'
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = image.naturalHeight
        canvas.width = image.naturalWidth
        context?.drawImage(image, 0, 0)
        const dataURL = canvas.toDataURL('image/png')
        callback(dataURL)
      }
      image.src = src
    },
    setScaleRatio(val: number) {
      this.bgRemoveScaleRatio = val
    },
  },
  watch: {
    showMobilePanel(val) {
      if (val) {
        this.$nextTick(() => {
          // to prevent the problems that the mobile panel is not fully expanded
          setTimeout(() => {
            const panel = document.querySelector('.mobile-panel')
            const footerTabs = document.querySelector('.footer-tabs') as HTMLElement
            if (panel && panel.clientHeight) {
              /**
               * @Note 60 is the size of footer tab
               */
              this.mobilePanelHeight = panel.clientHeight - footerTabs.clientHeight
            } else {
              this.mobilePanelHeight = 0
            }
          }, 500)
        })
      } else {
        this.mobilePanelHeight = 0
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-remove-bg {
  position: relative;
  width: 100%;
  height: calc(100% - v-bind(mobilePanelHeight)* 1px);
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 8px 16px;
}

.btn {
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr;
  width: 50%;
  height: 290px;
  border-radius: 8px;
  overflow: hidden;
  &__content-section {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    background-image: linear-gradient(
      45deg,
      setColor(black-3) 25%,
      rgba(0, 0, 0, 0) 25%,
      rgba(0, 0, 0, 0) 75%,
      setColor(black-3) 75%,
      setColor(black-3)
    ),
      linear-gradient(
        45deg,
        setColor(black-3) 25%,
        rgba(0, 0, 0, 0) 25%,
        rgba(0, 0, 0, 0) 75%,
        setColor(black-3) 75%,
        setColor(black-3)
      ),
      linear-gradient(
        45deg,
        setColor(black-3) 25%,
        rgba(0, 0, 0, 0) 25%,
        rgba(0, 0, 0, 0) 75%,
        setColor(black-3) 75%,
        setColor(black-3)
      );
    // background-repeat: no-repeat;
    background-color: #474747;
    background-position: 0px 0px, 11px 11px;
    background-size: 22px 22px;
    background-position: 0px 0px, 10px 10px;
    background-size: 20px 20px;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 50%;
      height: 100%;
      background-color: #F5D5A0;
    }
    > img {
      width: 110px;
      object-fit: contain;
      z-index: 10;
    }
    &--bgf {
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 50%;
        height: 100%;
        background-color: setColor(blue-3);
      }

      > img:nth-child(1) {
        position: absolute;
        right: 50%;
        bottom: 0;
      }

      > img:nth-child(2) {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 190px;
        transform: translate(-55%, 0%);
        object-fit: contain;
        z-index: 10;
      }
    }
  }
  &__text-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #474747;
    color: white;
    padding: 16px 4px;
  }

  &__description {
    height: 48px;
  }
}
</style>
