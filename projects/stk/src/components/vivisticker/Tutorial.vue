<template lang="pug">
div(ref="main" class="tutorial relative" v-touch
    @swipeleft="handleSwipeLeft"
    @swiperight="handleSwipeRight")
  div(class="tutorial__video" :class="{ blue: isBlueVideo }")
    video(autoplay playsinline muted :src="videoSource" @ended="handleEnded" @canplay="handleVideoLoaded")
  div(class="tutorial__content")
    div(class="tutorial__content__container")
      div(v-for="(stepConfig, index) in stepConfigs"
          class="tutorial__content__step"
          :key="stepConfig.title"
          :style="transformStyles()")
        div(v-if="$i18n.locale !== 'us'" class="tutorial__content__title") {{ stepConfig.title }}
        div(v-if="$i18n.locale !== 'us'" class="tutorial__content__description") {{ stepConfig.description }}
        div(class="tutorial__content__button-container")
          div(class="tutorial__content__button"
              @click.prevent.stop="handleNextStep")
            span {{ buttonText(index) }}
            div(class="tutorial__content__button-icon")
              svg-icon(iconName="chevron-right"
                        iconColor="black-3"
                        iconWidth="32px")
    div(class="tutorial__content__indicators")
      div(v-for="(stepConfig, index) in stepConfigs"
          class="tutorial__content__indicator"
          :class="{current: index === step}"
          :key="stepConfig.title"
          @click.prevent.stop="step = index")
  div(class="tutorial__close"
      @click.prevent.stop="handleClose")
    svg-icon(iconName="vivisticker_close"
            iconColor="white"
            iconWidth="24px")
</template>

<script lang="ts">
import constantData from '@/utils/constantData'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { AnyTouchEvent } from 'any-touch'
import { defineComponent } from 'vue'
import { mapMutations } from 'vuex'

export default defineComponent({
  data() {
    return {
      step: 0,
      stepConfigs: constantData.stickerTutorialSteps(),
      basicWidth: window.outerWidth
    }
  },
  computed: {
    videoSource(): string {
      return this.stepConfigs[this.step].video
    },
    isBlueVideo(): boolean {
      return this.$i18n.locale === 'us'
    }
  },
  methods: {
    ...mapMutations({
      setShowTutorial: 'vivisticker/SET_showTutorial'
    }),
    transformStyles() {
      return {
        transform: `translateX(-${this.basicWidth * this.step}px)`
      }
    },
    buttonText(index: number): string {
      if (this.$i18n.locale === 'us') {
        return this.stepConfigs[index].btnText ?? ''
      } else {
        return index < this.stepConfigs.length - 1 ? `${this.$t('NN0744')}` : `${this.$t('NN0745')}`
      }
    },
    handleClose() {
      this.setShowTutorial(false)
    },
    handleNextStep() {
      if (this.step !== this.stepConfigs.length - 1) {
        this.step++
      } else {
        this.setShowTutorial(false)
      }
    },
    handleEnded() {
      this.handleNextStep()
    },
    handleVideoLoaded() {
      console.log('loaded')
      vivistickerUtils.sendAppLoaded()
    },
    handleSwipeLeft(e: AnyTouchEvent) {
      console.log('left')
      e.stopImmediatePropagation()
      if (this.step < this.stepConfigs.length - 1) this.step++
    },
    handleSwipeRight(e: AnyTouchEvent) {
      console.log('right')
      e.stopImmediatePropagation()
      if (this.step > 0) this.step--
    }
  }
})
</script>

<style lang="scss" scoped>
.tutorial {
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
    background: setColor(black-1);
    &.blue {
      background: setColor(blue-tutorial);
    }
    & > video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  &__content {
    width: 100vw;
    background: setColor(black-1);
    box-sizing: border-box;
    box-shadow: 0px 4px 10px 2px rgba(255, 255, 255, 0.25);
    z-index: 1;
    &__container {
      display: flex;
      overflow: hidden;
    }
    &__step {
      width: 100vw;
      padding: 24px 24px 0 24px;
      box-sizing: border-box;
      flex-shrink: 0;
      transition: transform 0.3s linear;
    }
    &__title {
      @include text-H5;
      color: setColor(white);
      text-align: left;
    }
    &__description {
      margin-top: 16px;
      margin-bottom: 24px;
      @include body-SM;
      color: setColor(white);
      text-align: left;
    }
    &__button-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: fit-content;
      height: 40px;
      padding-left: 24px;
      padding-right: 4px;
      box-sizing: border-box;
      @include text-H6;
      color: setColor(black-3);
      background: setColor(white);
      border-radius: 100px;
      &:active {
        background: setColor(white, 0.8);
      }
    }
    &__button-icon {
      @include size(32px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__indicators {
      margin-top: 28px;
      margin-bottom: 17px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    &__indicator {
      @include size(6px);
      background: setColor(white);
      border-radius: 50%;
      opacity: 0.3;
      transition: opacity 0.3s ease-in;
      &.current {
        opacity: 1;
      }
    }
  }
}
</style>
