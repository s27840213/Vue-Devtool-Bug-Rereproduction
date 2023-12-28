<template lang="pug">
div(ref="main" class="full-page relative" :class="{welcome: fullPageConfig.type === 'welcome'}")
  template(v-if="fullPageConfig.type === 'video'")
    div(class="full-page__video" :class="fullPageConfig.params.mediaPos ? fullPageConfig.params.mediaPos : ''")
      video(autoplay playsinline muted
        :loop="fullPageConfig.params.delayedClose !== -1"
        :src="fullPageConfig.params.video"
        :poster="fullPageConfig.params.thumbnail"
        @ended="handleEnded"
        @canplay="sendAppLoaded")
  payment(v-if="fullPageConfig.type === 'payment'"
          :target="fullPageConfig.params.target",
          :theme="fullPageConfig.params.theme",
          :defaultTrialToggled="fullPageConfig.params.defaultTrialToggled",
          :carouselItems="fullPageConfig.params.carouselItems",
          :cards="fullPageConfig.params.cards",
          :btnPlans="fullPageConfig.params.btnPlans",
          :comparisons="fullPageConfig.params.comparisons"
          :termsOfServiceUrl="fullPageConfig.params.termsOfServiceUrl"
          :privacyPolicyUrl="fullPageConfig.params.privacyPolicyUrl"
          :isPromote="fullPageConfig.params.isPromote"
          @canShow="sendAppLoaded")
  welcome(v-if="fullPageConfig.type === 'welcome'")
  div(v-if="showCloseButton"
    class="full-page__close"
    :class="{'full-page__close--semi-transparent': fullPageConfig.type === 'payment' && $isStk}"
    @click.prevent.stop="handleClose")
    svg-icon(:iconName="$isStk ? 'vivisticker_close' : 'x-mark'"
            :iconColor="$isStk ? 'white' : 'dark-1'"
            iconWidth="24px")
</template>

<script lang="ts">
import Payment from '@/components/fullPage/Payment.vue'
import Welcome from '@/components/fullPage/Welcome.vue'
import { IFullPageConfig } from '@/interfaces/fullPage'
import store from '@/store'
import stkWVUtils from '@/utils/stkWVUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

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
    'fullPageConfig.type'() {
      this.$nextTick(() => {
        this.initialize()
      })
    }
  },
  computed: {
    ...(mapGetters({
      fullPageConfig: 'getFullPageConfig',
    }) as {
      fullPageConfig: () => IFullPageConfig
      }),
    homeIndicatorHeight() {
      if(this.$isCm) return store.getters['cmWV/getUserInfo'].homeIndicatorHeight
      return 0
    }
  },
  methods: {
    ...mapMutations({
      clearFullPageConfig: 'UPDATE_clearFullPageConfig'
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
        case 'welcome':
          if (this.$isCm) this.showCloseButton = false
          break
        default:
          this.showCloseButton = true
      }
    },
    handleClose() {
      this.clearFullPageConfig()
    },
    sendAppLoaded() {
      if( this.$isStk) stkWVUtils.sendAppLoaded()
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
  @include stk {
    z-index: setZindex('popup');
  }
  @include cm {
    @apply z-popup;
    &.welcome {
      @apply bg-dark-4/70
    }
  }
  &__close {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 20px;
    &--semi-transparent {
      opacity: 0.5;
    }
    @include stk {
      right: 20px;
    }
    @include cm {
      top: v-bind("`${homeIndicatorHeight + 8}px`");
      left: 16px;
    }
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
