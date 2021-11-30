<template lang="pug">
  div(class="mobile-warning")
    div(class="mobile-warning__content")
      div(class="mobile-warning__logo")
        div(class="mobile-warning__logo-wrapper")
          svg-icon(iconName="logo"
                  iconWidth="100%")
      img(class="mobile-warning__image"
          :src="require('@/assets/img/jpg/mobilewarning/mobile.jpg')")
      div(class="mobile-warning__title")
        span 目前暫時不支援您使用的裝置。
      div(class="mobile-warning__description")
        div(class="mobile-warning__description-line")
          span 請使用電腦版瀏覽器開啟 Vivipic 編輯器
        div(class="mobile-warning__description-line")
          span 以獲得最佳的設計體驗。
      div(class="mobile-warning__button-outter")
        div(class="mobile-warning__button-wrapper")
          div(class="mobile-warning__button"
              @click="goToHome")
            span 回到首頁
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'MobileWarning',
  methods: {
    goToHome() {
      this.$router.push({ name: 'Home' })
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-warning {
  @include size(100%, 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  &__content {
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    @media (min-aspect-ratio: 1/1) {
      width: 100vw;
    }
  }
  &__logo {
    width: 55%;
    @media (min-aspect-ratio: 1/1) {
      width: 40vh;
    }
  }
  &__logo-wrapper {
    position: relative;
    width: 100%;
    padding-top: 23%;
    > svg {
      transform: scaleY(0.9);
      transform-origin: bottom;
      position: absolute;
      top: 0;
      left: 0;
    }
  }
  &__image {
    margin-top: min(4.5vw, 50px);
    width: 100%;
    height: auto;
    @media (min-aspect-ratio: 1/1) {
      width: 60vh;
    }
  }
  &__title {
    margin-top: min(3vw, 25px);
    display: flex;
    align-items: center;
    justify-content: center;
    > span {
      font-family: NotoSansTC;
      font-weight: 700;
      font-size: min(4vw, 20px);
      display: block;
      letter-spacing: 0.165em;
      text-indent: 0.165em;
      color: black;
    }
    @media (min-aspect-ratio: 1/1) {
      margin-top: 3vh;
    }
  }
  &__description {
    margin-top: min(2vw, 15px);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    @media (min-aspect-ratio: 1/1) {
      margin-top: 2vh;
    }
  }
  &__description-line {
    display: flex;
    align-items: center;
    justify-content: center;
    > span {
      font-family: NotoSansTC;
      font-weight: 700;
      font-size: min(3vw, 14px);
      display: block;
      color: black;
    }
  }
  &__button-outter {
    margin-top: min(3vw, 25px);
    width: min(40%, 139px);
    background-color: setColor(blue-1);
    @media (min-aspect-ratio: 1/1) {
      margin-top: 3vh;
    }
  }
  &__button-wrapper {
    position: relative;
    width: 100%;
    padding-top: min(max(7%, 30px), 39px);
  }
  &__button {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    > span {
      font-family: NotoSansTC;
      font-weight: 700;
      font-size: 14px;
      display: block;
      letter-spacing: 0.355em;
      text-indent: 0.355em;
      color: white;
    }
  }
}
</style>
