<template lang="pug">
div(class="mobile-warning")
  div(class="mobile-warning__content")
    div(class="mobile-warning__logo")
      div(class="mobile-warning__logo-wrapper")
        svg-icon(iconName="logo"
                iconWidth="100%")
    img(class="mobile-warning__image"
        :src="'src/assets/img/jpg/mobilewarning/mobile.jpg'")
    div(class="mobile-warning__title")
      span(:style="titleStyles()") {{$t('NN0259')}}
    div(class="mobile-warning__description")
      div(class="mobile-warning__description-line")
        span {{$t('NN0260')}}
      div(class="mobile-warning__description-line")
        span {{`${$t('NN0261')} (${width})`}}
    div(class="mobile-warning__button-outter")
      div(class="mobile-warning__button-wrapper")
        div(class="mobile-warning__button"
            @click="goToHome")
          span(:style="buttonStyles()") {{$t('NN0262')}}
    div(class="mobile-warning__button-outter secondary")
      div(class="mobile-warning__button-wrapper secondary")
        div(class="mobile-warning__button secondary"
            @click="continueToUrl")
          span(:style="buttonStyles()") {{$t('NN0362')}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  name: 'MobileWarning',
  data() {
    return {
      width: 0,
      url: ''
    }
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search)
    const url = urlParams.get('url')
    if (url) {
      this.url = url
    }
    this.width = window.screen.width
  },
  methods: {
    titleStyles() {
      return this.$i18n.locale === 'tw' ? {
        letterSpacing: '0.165em',
        textIndent: '0.165em'
      } : {}
    },
    buttonStyles() {
      return this.$i18n.locale === 'tw' ? {
        letterSpacing: '0.355em',
        textIndent: '0.355em'
      } : {}
    },
    goToHome() {
      this.$router.push({ name: 'Home' })
    },
    continueToUrl() {
      localStorage.setItem('not-mobile', 'true')
      window.location.href = this.url
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
      font-weight: 700;
      font-size: min(4vw, 20px);
      display: block;
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
      font-weight: 400;
      font-size: min(3vw, 14px);
      display: block;
      color: black;
    }
  }
  &__button-outter {
    margin-top: min(3vw, 25px);
    width: min(40%, 139px);
    background-color: setColor(blue-1);
    border-radius: 1px;
    @media (min-aspect-ratio: 1/1) {
      margin-top: 3vh;
    }
    &.secondary {
      margin-top: min(2vw, 20px);
      background-color: white;
      border: 1px solid setColor(blue-1);
      box-sizing: border-box;
      @media (min-aspect-ratio: 1/1) {
        margin-top: 2vh;
      }
      &:hover {
        background-color: setColor(blue-1);
      }
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
      font-weight: 700;
      font-size: 14px;
      display: block;
      color: white;
    }
    &.secondary{
      & > span {
        color: setColor(blue-1);
      }
      &:hover > span {
        color: white;
      }
    }
  }
}
</style>
