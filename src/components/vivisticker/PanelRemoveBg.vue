<template lang="pug">
div(class="panel-remove-bg" ref="panelRemoveBg" @pinch="pinchHandler")
  div(v-if="inBgRemoveMode || isProcessing" class="panel-remove-bg__rm-section" ref="rmSection")
    div(v-if="isProcessing" class="panel-remove-bg__preview-section")
      img(:src="previewImage.src ? previewImage.src  : require('@/assets/img/svg/image-preview.svg')")
      div(class="gray-mask")
      img(class="loading" :src="require('@/assets/img/gif/gray-loading.gif')")
    bg-remove-area(v-else :editorViewCanvas="panelRemoveBg"
      :teleportTarget="'.panel-remove-bg__rm-section'"
      :inVivisticker="true"
      :fitScaleRatio="bgRemoveScaleRatio")
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
import BgRemoveArea from '@/components/vivisticker/BgRemoveArea.vue'
import { IBgRemoveInfo } from '@/interfaces/image'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import uploadUtils from '@/utils/uploadUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
export default defineComponent({
  components: {
    BgRemoveArea,
    MobileSlider
  },
  data() {
    return {
      panelRemoveBg: null as unknown as HTMLElement,
      rmSection: null as unknown as HTMLElement | null,
      mobilePanelHeight: 0,
      bgRemoveScaleRatio: 1,
      panelRemoveBgAt: null as unknown as AnyTouch,
      tmpScaleRatio: 1,
      minRatio: 0.1,
      maxRatio: 2,
      isPanning: false,
      initPinchPos: null as null | { x: number, y: number },
      // eslint-disable-next-line vue/no-unused-properties
      initImgSize: { width: 0, height: 0 },
      imgAspectRatio: 1,
      distanceBetweenFingers: -1,
      debugMode: false
      // p1StartClientY: 0,
      // p1StartClientX: 0,
      // p2StartClientY: 0,
      // p2StartClientX: 0,
      // distanceBetweenFingers: 0
    }
  },
  mounted() {
    this.panelRemoveBg = this.$refs.panelRemoveBg as HTMLElement
    this.rmSection = this.$refs.rmSection as HTMLElement

    this.panelRemoveBgAt = new AnyTouch(this.$refs.panelRemoveBg as HTMLElement, { preventDefault: false })
  },
  unmounted() {
    bgRemoveUtils.setInBgRemoveMode(false)
    this.panelRemoveBgAt.destroy()
  },
  computed: {
    ...mapGetters({
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      isProcessing: 'bgRemove/getIsProcessing',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      previewImage: 'bgRemove/getPreviewImage',
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
    fitScaleRatio(): number {
      const { width, height } = this.containerWH
      const { width: imgWidth, height: imgHeight } = this.previewImage
      const aspectRatio = imgWidth / imgHeight
      if (width === 0 || height === 0 || imgWidth === 0 || imgHeight === 0) return 1

      const newWidth = aspectRatio > 1 ? 1600 : 1600 * aspectRatio
      const newHeight = aspectRatio > 1 ? 1600 / aspectRatio : 1600
      const ratio = Math.min(width / newWidth, height / newHeight) * 0.9

      return ratio
    },
    // eslint-disable-next-line vue/no-unused-properties
    alignPos(): string {
      return this.inBgRemoveMode || this.isProcessing ? 'flex-start' : 'center'
    }
  },
  methods: {
    ...mapMutations({
      setInGestureMode: 'SET_inGestureMode'
    }),
    removeBg() {
      if (this.debugMode) {
        bgRemoveUtils.removeBgStkDebug()
        return
      }
      uploadUtils.chooseAssets('stk-bg-remove')
    },
    removeBgf() {
      if (this.debugMode) {
        bgRemoveUtils.removeBgStkDebug()
        return
      }
      uploadUtils.chooseAssets('stk-bg-remove-face')
    },
    setScaleRatio(val: number) {
      this.bgRemoveScaleRatio = val
    },
    pinchHandler(event: AnyTouchEvent) {
      if (!this.inBgRemoveMode) return
      let deltaDistance = 0
      if (event.pointLength === 2) {
        // calculate the distance between two fingers
        const tmpDistance = this.distanceBetweenFingers
        this.distanceBetweenFingers = Math.sqrt(
          Math.pow(event.points[0].clientX - event.points[1].clientX, 2) +
          Math.pow(event.points[0].clientY - event.points[1].clientY, 2)
        )

        deltaDistance = Math.abs(this.distanceBetweenFingers - tmpDistance)
      }

      switch (event.phase) {
        /**
         * @Note the very first event won't fire start phase, it's very strange and need to pay attention
         */
        case 'start': {
          this.tmpScaleRatio = this.bgRemoveScaleRatio
          this.setInGestureMode(true)

          this.isPanning = true

          const { width, height } = (this.autoRemoveResult as IBgRemoveInfo)
          this.imgAspectRatio = width / height

          const imgHeight = 1600 / this.imgAspectRatio

          this.initImgSize = {
            width: 1600 * this.bgRemoveScaleRatio,
            height: imgHeight * this.bgRemoveScaleRatio
          }
          break
        }
        case 'move': {
          this.isPanning = true

          if (!this.initPinchPos) {
            this.initPinchPos = { x: event.x, y: event.y }
          }

          // const sizeDiff = {
          //   width: this.bgRemoveScaleRatio * (this.initImgSize.width) * (event.scale - 1) * 0.5,
          //   height: this.bgRemoveScaleRatio * (this.initImgSize.height) * (event.scale - 1) * 0.5
          // }
          if (event.pointLength === 2) {
            if (deltaDistance > 1) {
              const ratio = this.tmpScaleRatio * event.scale

              if (ratio <= this.minRatio) {
                this.bgRemoveScaleRatio = this.minRatio
              } else if (ratio >= this.maxRatio) {
                this.bgRemoveScaleRatio = this.maxRatio
              } else {
                this.bgRemoveScaleRatio = ratio
              }

              /**
               * for center scroll caculation
               */

              if (this.rmSection) {
                const scrollCenterX = (2 * this.rmSection.scrollLeft + this.rmSection.clientWidth)
                const scrollCenterY = (2 * this.rmSection.scrollTop + this.rmSection.clientHeight)
                const oldScrollWidth = this.rmSection.scrollWidth
                const oldScrollHeight = this.rmSection.scrollHeight
                this.$nextTick(() => {
                  if (this.rmSection) {
                    const rmSecton = this.$refs.rmSection as HTMLElement
                    rmSecton.scrollLeft = (scrollCenterX * rmSecton.scrollWidth / oldScrollWidth - rmSecton.clientWidth) / 2
                    rmSecton.scrollTop = (scrollCenterY * rmSecton.scrollHeight / oldScrollHeight - rmSecton.clientHeight) / 2
                  }
                })
              }
            } else {
              const sizeDiff = {
                width: (this.initImgSize.width - 1600 * this.bgRemoveScaleRatio) * 0.5,
                height: (this.initImgSize.height - (1600 * this.imgAspectRatio) * this.bgRemoveScaleRatio) * 0.5
              }

              this.$nextTick(() => {
                if (this.rmSection) {
                  this.rmSection.scrollLeft = this.rmSection.scrollLeft - event.deltaX * 2
                  this.rmSection.scrollTop = this.rmSection.scrollTop - event.deltaY * 2
                }
              })
            }
          }
          break
        }

        case 'end': {
          this.isPanning = false
          this.initPinchPos = null
          this.rmSection = null
          this.setInGestureMode(false)
          break
        }
      }
    },
  },
  watch: {
    inBgRemoveMode(val) {
      if (val) {
        this.$nextTick(() => {
          this.$emit('setBgRemoveMode', false)
        })
      } else {
        this.rmSection = null
      }
    },
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
    },
    fitScaleRatio(val) {
      this.bgRemoveScaleRatio = val
      this.tmpScaleRatio = val
    },
    bgRemoveScaleRatio(val) {
      if (!this.rmSection) {
        this.rmSection = this.$refs.rmSection as HTMLElement
      }
      // generalUtils.scaleFromCenter(this.rmSection)
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

  &__rm-section {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: overlay;
    display: flex;
    padding: 20px;
  }

  &__preview-section {
    position: relative;
    margin: auto;
    width: 100%;
    > img:nth-of-type(1) {
      width: 100%;
    }
  }

  &__test-input {
    position: absolute;
    width: 100%;
    top: 10%;
    left: 0;
    z-index: 999;
  }
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

.gray-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.2);
  z-index: 1;
}

.loading {
  width: 30%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
