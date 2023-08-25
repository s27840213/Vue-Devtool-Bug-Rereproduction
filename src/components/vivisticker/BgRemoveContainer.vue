<template lang="pug">
div(class="panel-remove-bg__rm-section" id="rmSection" ref="rmSection"
  :class="!isPinchInitialized ? 'flex-center' :  ''"
  @pointerdown="moveStart"
  @pinch="pinchHandler")
  div(v-if="isProcessing" class="flex-center full-size")
    div(class="panel-remove-bg__preview-section")
      img(:src="previewImage.src ? previewImage.src  : previewSrc")
      div(class="gray-mask")
      img(class="loading" :src="require('@/assets/img/gif/gray-loading.gif')")
  bg-remove-area(v-else :cotainerRef="containerRef"
    :teleportTarget="'.panel-remove-bg__rm-section'"
    :inVivisticker="true"
    :fitScaleRatio="bgRemoveScaleRatio")
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
/* eslint-disable */
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import BgRemoveArea from '@/components/vivisticker/BgRemoveArea.vue'
import { IBgRemoveInfo } from '@/interfaces/image'
import { bgRemoveMoveHandler } from '@/store/module/bgRemove'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
export default defineComponent({
  components: {
    BgRemoveArea,
    MobileSlider
  },
  props: {
    containerWH: {
      type: Object as PropType<{width: number, height: number}>,
      default: () => {
        return { width: '0', height: '0' }
      }
    },
    containerRef: {
      type: HTMLElement,
      default: null
    },
    previewSrc: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      rmSection: null as unknown as HTMLElement | null,
      mobilePanelHeight: 0,
      bgRemoveScaleRatio: 1,
      anyTouchInstance: null as unknown as AnyTouch,
      tmpScaleRatio: 1,
      minRatio: 0.1,
      maxRatio: 2,
      isPanning: false,
      initPinchPos: null as null | { x: number, y: number },
      // eslint-disable-next-line vue/no-unused-properties
      initImgSize: { width: 0, height: 0 },
      imgAspectRatio: 1,
      distanceBetweenFingers: -1,
      containerHeight: -1
      // p1StartClientY: 0,
      // p1StartClientX: 0,
      // p2StartClientY: 0,
      // p2StartClientX: 0,
      // distanceBetweenFingers: 0
    }
  },
  mounted() {
    this.rmSection = this.$refs.rmSection as HTMLElement
    this.anyTouchInstance = new AnyTouch(this.rmSection as HTMLElement, { preventDefault: false })
    this.containerHeight = this.rmSection.clientHeight
  },
  unmounted() {
    bgRemoveUtils.setInBgRemoveMode(false)
    this.anyTouchInstance.destroy()
  },
  computed: {
    ...mapGetters({
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      isProcessing: 'bgRemove/getIsProcessing',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      isPinchInitialized: 'bgRemove/getIsPinchInitialized',
      previewImage: 'bgRemove/getPreviewImage',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
    }),
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
  },
  watch: {
    inBgRemoveMode(val) {
      if (val) {
        this.$nextTick(() => {
          this.$emit('setBgRemoveMode', false)
        })
      } else {
        bgRemoveUtils.setPreviewImage({ src: '', width: 0, height: 0 })
        this.rmSection = null
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
    }
  },
  methods: {
    ...mapMutations({
      setInGestureMode: 'SET_inGestureMode',
      setIsProcessing: 'bgRemove/SET_isProcessing'
    }),
    setScaleRatio(val: number) {
      this.bgRemoveScaleRatio = val
    },
    moveStart(evt: PointerEvent) {
      bgRemoveMoveHandler.moveStart(evt)
    },
    pinchHandler(event: AnyTouchEvent) {
      if (!this.inBgRemoveMode) return
      let deltaDistance = 0
      if (event.pointLength === 2) {
        // calculate the delta distance between two fingers
        // use to determine the action we do
        // if smaller than 1 -> pan
        // if bigger than 1 -> pinch
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
          this.setIsPinchIng(true)
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
          this.setIsPinchIng(true)
          this.isPanning = true
          if (!this.initPinchPos) {
            this.initPinchPos = { x: event.x, y: event.y }
          }

          if (event.pointLength === 2) {
            if (deltaDistance > 1) {
              // pinching
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
              // panning
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
          this.setIsPinchIng(false)
          this.isPanning = false
          this.initPinchPos = null
          this.rmSection = null
          this.setInGestureMode(false)
          break
        }
      }
    },
    setIsPinchIng(bool: boolean) {
      console.log('setIsPinchIng', bool)
      this.$store.commit('bgRemove/UPDATE_pinchState', { isPinchIng: bool })
    },
    updatePinchPos(pos: { x: number, y: number }) {
      this.$store.commit('bgRemove/UPDATE_pincState', { x: pos.x, y: pos.y })
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
    // display: flex;
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
