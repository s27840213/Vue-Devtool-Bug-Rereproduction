<template lang="pug">
div(ref="main" class="full-page relative")
  template(v-if="fullPageConfig.type === 'video'")
    div(class="full-page__video" :class="fullPageConfig.params.mediaPos ? fullPageConfig.params.mediaPos : ''")
      video(autoplay playsinline muted
        :loop="fullPageConfig.params.delayedClose !== -1"
        :src="fullPageConfig.params.video"
        :poster="fullPageConfig.params.thumbnail"
        @ended="handleEnded"
        @canplay="handleVideoLoaded")
  payment(v-if="fullPageConfig.type === 'payment'" :target="fullPageConfig.params.target")
  welcome(v-if="fullPageConfig.type === 'welcome'")
  div(v-if="showCloseButton"
    class="full-page__close"
    @click.prevent.stop="handleClose")
    svg-icon(iconName="vivisticker_close"
            iconColor="white"
            iconWidth="24px")
</template>

<script lang="ts">
import { IFullPageConfig } from '@/interfaces/vivisticker'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import Payment from './Payment.vue'
import Welcome from './Welcome.vue'

export default defineComponent({
  components: {
    Payment,
    Welcome
  },
  data() {
    return {
      showCloseButton: false,
      showOnVideoFinish: false
    }
  },
  mounted() {
    this.initialize()
  },
  watch: {
    fullPageType() {
      this.$nextTick(() => {
        this.initialize()
      })
    }
  },
  computed: {
    ...(mapGetters({
      fullPageConfig: 'vivisticker/getFullPageConfig',
    }) as {
      fullPageConfig: () => IFullPageConfig
    })
  },
  methods: {
    ...mapMutations({
      clearFullPageConfig: 'vivisticker/UPDATE_clearFullPageConfig'
    }),
    initialize() {
      this.showCloseButton = false
      this.showOnVideoFinish = false
      switch (this.fullPageConfig.type) {
        case 'video':
          // eslint-disable-next-line no-case-declarations
          const delayedClose = this.fullPageConfig.params.delayedClose
          if (delayedClose !== undefined) {
            if (delayedClose >= 0) {
              window.setTimeout(() => {
                this.showCloseButton = true
              }, delayedClose)
            } else {
              this.showOnVideoFinish = true
            }
          } else {
            this.showCloseButton = true
          }
          break
        default:
          this.showCloseButton = true
      }
    },
    handleClose() {
      this.clearFullPageConfig()
    },
    handleVideoLoaded() {
      vivistickerUtils.sendAppLoaded()
    },
    handleEnded() {
      if (this.showOnVideoFinish) {
        this.showCloseButton = true
        this.showOnVideoFinish = false
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.full-page {
  @include size(100%);
  position: fixed;
  top: 0;
  left: 0;
  display: grid;
  grid-template-rows: 1fr auto;
  background: setColor(black-1);
  overflow: hidden;
  z-index: setZindex('popup');
  &__close {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 20px;
    right: 20px;
  }
  &__video {
    width: 100vw;
    overflow: hidden;
    background: transparent;
    &.top > video {
      object-position: top;
    }
    &.center > video {
      object-position: center;
    }
    &.bottom > video {
      object-position: bottom;
    }
    & > video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>
