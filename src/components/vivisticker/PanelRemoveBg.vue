<template lang="pug">
div(class="panel-remove-bg" ref="panelRemoveBg" @pinch="pinchHandler")
  div(v-if="inBgRemoveMode || isProcessing" class="panel-remove-bg__rm-section" ref="rmSection")
    div(v-if="isProcessing" class="panel-remove-bg__preview-section")
      img(:src="previewImage.src")
      div(class="gray-mask")
      img(class="loading" :src="require('@/assets/img/gif/gray-loading.gif')")
    bg-remove-area(v-else :editorViewCanvas="panelRemoveBg"
      :teleportTarget="'.panel-remove-bg__rm-section'"
      :inVivisticker="true"
      :fitScaleRatio="bgRemoveScaleRatio")
  nubtn(v-else theme="primary" size="mid-center" @click="removeBg") {{ $t('NN0043') }}
  //- teleport(to="body")
  //-   div(class="panel-remove-bg__test-input")
  //-     mobile-slider(
  //-       :title="'scale'"
  //-       :borderTouchArea="true"
  //-       :name="'scale'"
  //-       :value="bgRemoveScaleRatio"
  //-       :min="minRatio"
  //-       :max="maxRatio"
  //-       :step="0.01"
  //-       @update="setScaleRatio")
</template>

<script lang="ts">
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import generalUtils from '@/utils/generalUtils'
import uploadUtils from '@/utils/uploadUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  components: {
    BgRemoveArea
  },
  data() {
    return {
      panelRemoveBg: null as unknown as HTMLElement,
      rmSection: null as unknown as HTMLElement,
      mobilePanelHeight: 0,
      bgRemoveScaleRatio: 1,
      panelRemoveBgAt: null as unknown as AnyTouch,
      tmpScaleRatio: 1,
      minRatio: 0.1,
      maxRatio: 5
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
        height: this.panelRemoveBg ? this.panelRemoveBg.offsetHeight - this.mobilePanelHeight : 0,
      }
    },
    fitScaleRatio(): number {
      const { width, height } = this.containerWH
      const { width: imgWidth, height: imgHeight } = this.previewImage
      if (width === 0 || height === 0 || imgWidth === 0 || imgHeight === 0) return 1
      const ratio = Math.min(width / imgWidth, height / imgHeight) * 0.9

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
      uploadUtils.chooseAssets('stk-bg-remove')
    },
    pinchHandler(event: AnyTouchEvent) {
      switch (event.phase) {
        /**
         * @Note the very first event won't fire start phase, it's very strange and need to pay attention
         */
        case 'start': {
          this.tmpScaleRatio = this.bgRemoveScaleRatio
          this.setInGestureMode(true)
          break
        }
        case 'move': {
          const ratio = this.tmpScaleRatio * event.scale
          console.log(`delta scale: ${event.deltaScale}`)
          if (ratio <= this.minRatio) {
            this.bgRemoveScaleRatio = this.minRatio
          } else if (ratio >= this.maxRatio) {
            this.bgRemoveScaleRatio = this.maxRatio
          } else {
            this.bgRemoveScaleRatio = ratio
          }

          break
        }

        case 'end': {
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
      }
    },
    showMobilePanel(val) {
      if (val) {
        this.$nextTick(() => {
          // to prevent the problems that the mobile panel is not fully expanded
          setTimeout(() => {
            this.mobilePanelHeight = document.querySelector('.mobile-panel')?.clientHeight || 0
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
        return
      }
      generalUtils.scaleFromCenter(this.rmSection)
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
