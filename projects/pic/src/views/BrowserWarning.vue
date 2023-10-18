<template lang="pug">
div(class="browser-warning")
  div(class="browser-warning__logo")
    img(class="browser-warning__image"
        :src="require('@/assets/img/png/chrome.png')")
    img(class="browser-warning__image"
        :src="require('@/assets/img/png/edge.png')")
  div(class="text-H6")
    span {{  $t('NN0834') }}
  div(class="body-SM browser-warning__text")
    span {{  $t('NN0835') }}
  div(class="browser-warning__link")
    a(class="body-SM" href="https://www.google.com/chrome/" target="_blank")
      span {{  $t('NN0836') }}
    a(class="body-SM" href="https://www.microsoft.com/en-us/edge/download?form=MA13FJ" target="_blank")
      span {{  $t('NN0837') }}
  nubtn(size="mid" @click="goHome()") {{ $t('NN0838') }}
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
    goHome() {
      this.$router.replace({ name: 'Editor' })
      localStorage.setItem('hasShownBrowserWarning', '1')
    }
  }
})
</script>

<style lang="scss" scoped>
.browser-warning {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  &__logo {
    display: flex;
    gap: 36px;
  }

  &__text {
    max-width: 460px;
    box-sizing: border-box;
    padding: 0px 12px;
  }
  &__link {
    display: flex;
    gap: 48px;

    @media (max-width: 640px) {
      gap: 24px;
    }

    > a {
      color: setColor(blue-1);

      &::visited {
        color: setColor(blue-1);
      }
    }
  }
}
</style>
