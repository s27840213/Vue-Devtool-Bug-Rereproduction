<template lang="pug">
div(class="panel-remove-bg__rm-section" id="rmSection" ref="rmSection"
  :class="!isPinchInitialized ? 'flex-center' :  ''"
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
import { TRANSITION_TIME } from '@/components/editor/mobile/MobileEditorView.vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import BgRemoveArea from '@/components/vivisticker/BgRemoveArea.vue'
import { ICoordinate } from '@/interfaces/frame'
import { IBgRemoveInfo } from '@/interfaces/image'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import mathUtils from '@/utils/mathUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
export const RM_SECTION_PADDING = 20
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
      initPinchSize: null as null | { width: number, height: number },
      initBgPos: { x: 0, y: 0 },
      translationRatio: null as null | ICoordinate,
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
      movingMode: 'bgRemove/getMovingMode',
      isPinching: 'bgRemove/getIsPinching',
      pinch: 'bgRemove/getPinchState',
      bgCurrSize:'bgRemove/getBgCurrSize',
      bgContainerSize :'bgRemove/getContainerSize'
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
      setIsProcessing: 'bgRemove/SET_isProcessing',
      updatePinchState: 'bgRemove/UPDATE_pinchState'
    }),
    setScaleRatio(val: number) {
      this.bgRemoveScaleRatio = val
    },
    pinchHandler(event: AnyTouchEvent) {
      window.requestAnimationFrame(() => this._pinchHandler(event))
    },
    _pinchHandler(event: AnyTouchEvent) {
      if (this.pinch.isTransitioning) return
      if (!this.movingMode) return
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
          console.warn('pinch start')
          this.updatePinchState({ isPinching: true })
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

          // pinch init state setting
          this.initBgPos = { x: this.pinch.x, y: this.pinch.y }
          this.initPinchPos = { x: event.x, y: event.y }
          this.initPinchSize = { width: this.bgCurrSize.width, height: this.bgCurrSize.height }
          break
        }
        case 'move': {
          this.updatePinchState({ isPinching: true })
          this.isPanning = true
          if (!this.initPinchPos || !this.initPinchSize) {
            this.tmpScaleRatio = this.bgRemoveScaleRatio
            this.initPinchPos = { x: event.x, y: event.y }
            this.initPinchSize = { width: this.bgCurrSize.width, height: this.bgCurrSize.height }
            this.initBgPos = { x: this.pinch.x, y: this.pinch.y }
            return
          }

          if (event.pointLength === 2) {
            // const ratio = this.tmpScaleRatio * event.scale
            // if (ratio <= this.minRatio) {
            //   this.bgRemoveScaleRatio = this.minRatio
            // } else if (ratio >= this.maxRatio) {
            //   this.bgRemoveScaleRatio = this.maxRatio
            // } else {
            //   this.bgRemoveScaleRatio = ratio
            // }
            this.bgRemoveScaleRatio = this.tmpScaleRatio * event.scale

            // pinch moving translation compensation
            if (!this.translationRatio) {
              this.translationRatio = { x: -1, y: -1 }
              // padding size of the rmSection
              const padding = 20
              const actualEvtX = event.x - this.pinch.physicalTopLeftPos.left - padding
              const actualEvtY = event.y - this.pinch.physicalTopLeftPos.top - padding
              if (this.pinch.x >= 0) {
                this.translationRatio.x = (Math.max(actualEvtX - this.pinch.x, 0) / this.initPinchSize.width)
              } else {
                this.translationRatio.x = (Math.max(actualEvtX, 0) + Math.abs(this.pinch.x)) / this.initPinchSize.width
              }

              if (this.pinch.y >= 0) {
                this.translationRatio.y = (Math.max(actualEvtY - this.pinch.y, 0) / this.initPinchSize.height)
              } else {
                this.translationRatio.y = (Math.max(actualEvtY, 0) + Math.abs(this.pinch.y)) / this.initPinchSize.height
              }
              console.warn('this.translationRatio', this.translationRatio)
            }

            // size difference via pinching
            const scalingRatioDiff = this.bgRemoveScaleRatio / this.tmpScaleRatio - 1
            const sizeDiff = {
              width: scalingRatioDiff * this.initPinchSize.width,
              height: scalingRatioDiff * this.initPinchSize.height
            }

            // pos difference via moving as pinching
            const movingTraslate = {
              x: event.x - this.initPinchPos.x,
              y: event.y - this.initPinchPos.y
            }
            this.updatePinchState({
              scale: this.bgRemoveScaleRatio,
              x: this.initBgPos.x - sizeDiff.width * this.translationRatio.x + movingTraslate.x,
              y: this.initBgPos.y - sizeDiff.height * this.translationRatio.y + movingTraslate.y
            })
          }
          break
        }

        case 'end': {
          console.warn('pinch end')
          const bgRemoveArea = document.getElementById('bgRemoveArea') as HTMLElement
          const bgRemoveScaleArea = document.getElementById('bgRemoveScaleArea') as HTMLElement

          // const { isReachLeftEdge, isReachRightEdge, isReachTopEdge, isReachBottomEdge } = this.pageEdgeLimitHandler(page, newScaleRatio * 0.01)
          const { isReachLeftEdge, isReachRightEdge, isReachTopEdge, isReachBottomEdge } = this.edgingHandler()
          console.log(isReachLeftEdge, isReachRightEdge, isReachTopEdge, isReachBottomEdge)

          // case 1 scale exceed max scale range
          if (this.pinch.scale > this.maxRatio) {
            bgRemoveArea.classList.add('editor-view__pinch-transition')
            bgRemoveScaleArea.classList.add('editor-view__pinch-transition')
            console.warn('scale exceed max scale range')
            const scaleRatioDiff = 1 - this.maxRatio / this.pinch.scale
            const sizeDiff = {
              width: this.bgCurrSize.width * scaleRatioDiff,
              height: this.bgCurrSize.height * scaleRatioDiff
            }
            const [xMin, xMax] = [this.pinch.initPos.x * 2 - ((this.bgCurrSize.width - sizeDiff.width) - this.pinch.initSize.width), 0]
            const [yMin, yMax] = [this.pinch.initPos.y * 2 - ((this.bgCurrSize.height - sizeDiff.height) - this.pinch.initSize.height), 0]
            console.log('this.pinch.x + sizeDiff.width * (this.translationRatio?.x ?? 0)', this.pinch.x + sizeDiff.width * (this.translationRatio?.x ?? 0), this.pinch.y + sizeDiff.height * (this.translationRatio?.y ?? 0))
            console.log('xMin, xMax', xMin, xMax, yMin, yMax)
            const x = mathUtils.clamp(this.pinch.x + sizeDiff.width * (this.translationRatio?.x ?? 0), xMin, xMax)
            const y = mathUtils.clamp(this.pinch.y + sizeDiff.height * (this.translationRatio?.y ?? 0), yMin, yMax)
            this.bgRemoveScaleRatio = this.maxRatio
            this.updatePinchState({
              isTransitioning: true,
              scale: this.maxRatio,
              x,
              y
            })
            setTimeout(() => {
              bgRemoveArea.classList.remove('editor-view__pinch-transition')
              bgRemoveScaleArea.classList.remove('editor-view__pinch-transition')
              this.updatePinchState({
                isTransitioning: false
              })
            }, TRANSITION_TIME)
          // case 2 exceed edge
          } else if (isReachLeftEdge || isReachRightEdge || isReachTopEdge || isReachBottomEdge) {
            console.warn('exceed edge ', isReachTopEdge, isReachBottomEdge, isReachLeftEdge, isReachRightEdge)
            // sub-case 1: scale ratio smaller than initScale --> reset/initialization
            bgRemoveArea.classList.add('editor-view__pinch-transition')
            bgRemoveScaleArea.classList.add('editor-view__pinch-transition')
            if (this.pinch.scale < this.pinch.initScale || ((isReachLeftEdge && isReachRightEdge) || (isReachTopEdge && isReachBottomEdge))) {
              this.bgRemoveScaleRatio = this.pinch.initScale
              this.updatePinchState({
                isTransitioning: true,
                scale: this.pinch.initScale,
                x: this.pinch.initPos.x,
                y: this.pinch.initPos.y
              })
              setTimeout(() => {
                bgRemoveArea.classList.remove('editor-view__pinch-transition')
                bgRemoveScaleArea.classList.remove('editor-view__pinch-transition')
                this.updatePinchState({
                  isTransitioning: false
                })
              }, TRANSITION_TIME)
            } else {
              // sub-case 2: only some edge is reached --> align the reached edge
              const pos = { x: this.pinch.x, y: this.pinch.y }
              if (isReachTopEdge || isReachBottomEdge) {
                const isCoverContainer = this.bgCurrSize.height >= this.bgContainerSize.height
                if (isReachTopEdge) {
                  pos.y = isCoverContainer ? 0 : (this.bgContainerSize.height - this.bgCurrSize.height) * 0.5
                } else if (isReachBottomEdge) {
                  const _y = this.pinch.initPos.y * 2 - (this.bgCurrSize.height - this.pinch.initSize.height)
                  pos.y = isCoverContainer ? _y : _y - (this.bgContainerSize.height - this.bgCurrSize.height) * 0.5
                }
              }
              if (isReachLeftEdge || isReachRightEdge) {
                const isCoverContainer = this.bgCurrSize.width >= this.bgContainerSize.width
                if (isReachLeftEdge) {
                  pos.x = isCoverContainer ? 0 : (this.bgContainerSize.width - this.bgCurrSize.width) * 0.5
                } else if (isReachRightEdge) {
                  const _x = this.pinch.initPos.x * 2 - (this.bgCurrSize.width - this.pinch.initSize.width)
                  pos.x = isCoverContainer ? _x : _x - (this.bgContainerSize.width - this.bgCurrSize.width) * 0.5
                }
              }
              this.updatePinchState({
                isTransitioning: true,
                ...pos
              })
              setTimeout(() => {
                bgRemoveArea.classList.remove('editor-view__pinch-transition')
                bgRemoveScaleArea.classList.remove('editor-view__pinch-transition')
                this.updatePinchState({
                  isTransitioning: false
                })
              }, TRANSITION_TIME)
            }
          } else {
            console.warn('else')
          }
          this.updatePinchState({ isPinching: false })
          this.isPanning = false
          this.initPinchPos = null
          this.initPinchSize = null
          this.translationRatio = null
          this.rmSection = null
          this.setInGestureMode(false)
          break
        }
      }
    },
    edgingHandler() {
      return {
        isReachTopEdge: this.pinch.y > 0,
        isReachBottomEdge: this.pinch.y < 0 && (this.bgCurrSize.height - this.pinch.initSize.height) - this.pinch.initPos.y < this.pinch.initPos.y - this.pinch.y,
        isReachLeftEdge: this.pinch.x > 0,
        isReachRightEdge: this.pinch.x < 0 && (this.bgCurrSize.width - this.pinch.initSize.width) - this.pinch.initPos.x < this.pinch.initPos.x - this.pinch.x,
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
