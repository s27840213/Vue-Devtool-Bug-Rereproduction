<template lang="pug">
transition(name="panel-up")
  div(ref="main" class="full-page relative")
    template(v-if="fullPageType === 'iOS16Video'")
      div(class="full-page__video")
        video(autoplay playsinline muted loop :src="videoSource" :poster="thumbnail")
    payment(v-if="fullPageType === 'payment'" :target="fullPageParams.target")
    template(v-if="fullPageType === 'welcome'")
      div(class="full-page__welcome")
        img(:src="require(`@/assets/img/png/pricing/${$i18n.locale}/vivisticker_welcome.png`)")
        div(class="full-page__welcome__text body-MD text-white") {{ $t('STK0054') }}
        div(class="full-page__welcome__btn-start" @click.prevent.stop="handleClose")
          span {{ $t('STK0055') }}
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

export default defineComponent({
  components: {
    Payment
  },
  data() {
    return {
      showCloseButton: false
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
    ...mapGetters({
      fullPageType: 'vivisticker/getFullPageType',
      fullPageParams: 'vivisticker/getFullPageParams'
    }),
    videoSource(): string {
      return `https://template.vivipic.com/static/video/${this.$i18n.locale.toUpperCase()}_IOS16.mp4`
    },
    thumbnail(): string {
      return `https://template.vivipic.com/static/video/${this.$i18n.locale.toUpperCase()}_IOS16_thumb.jpg`
    }
  },
  methods: {
    ...mapMutations({
      clearFullPageConfig: 'vivisticker/UPDATE_clearFullPageConfig'
    }),
    initialize() {
      this.showCloseButton = false
      switch (this.fullPageType) {
        case 'iOS16Video':
          // eslint-disable-next-line no-case-declarations
          const fromModal = this.fullPageParams.fromModal ?? false
          if (fromModal) {
            setTimeout(() => {
              this.showCloseButton = true
            }, 5000)
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
  &__welcome {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    >img {
      position: relative;
      top: 10%;
      width: 100%;
      max-height: 50%;
      object-fit: contain;
    }
    &__text {
      position: relative;
      top: 15%;
      margin: 0 24px;
    }
    &__btn-start {
      margin: 0 auto;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: 38px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 4px 16px;
      background: #FFFFFF;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      line-height: 24px;
    }
  }
}
</style>
