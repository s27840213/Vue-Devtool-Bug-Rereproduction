<template lang="pug">
div(ref="main" class="full-page relative")
  template(v-if="fullPageType === 'video'")
    div(class="full-page__video")
      video(autoplay playsinline muted loop
        :src="(fullPageParams as IFullPageVideoConfigParams).video"
        :poster="(fullPageParams as IFullPageVideoConfigParams).thumbnail"
        @ended="handleEnded")
  payment(v-if="fullPageType === 'payment'" :target="(fullPageParams as IFullPagePaymentConfigParams).target")
  welcome(v-if="fullPageType === 'welcome'")
  div(v-if="showCloseButton"
    class="full-page__close"
    @click.prevent.stop="handleClose")
    svg-icon(iconName="vivisticker_close"
            iconColor="white"
            iconWidth="24px")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import Payment from './Payment.vue'
import Welcome from './Welcome.vue'
import { IFullPageConfig, IFullPagePaymentConfigParams, IFullPageVideoConfigParams } from '@/interfaces/vivisticker'

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
    })),
    fullPageType(): IFullPageConfig['type'] {
      return this.fullPageConfig.type
    },
    fullPageParams(): IFullPageConfig['params'] {
      return this.fullPageConfig.params
    }
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
    & > video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>
