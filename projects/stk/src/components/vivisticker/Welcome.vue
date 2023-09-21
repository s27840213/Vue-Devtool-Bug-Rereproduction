<template lang="pug">
div(v-show="imgLoaded" class="welcome")
  div(class="welcome__img")
    img(:src="require(`@/assets/img/png/pricing/vivisticker_welcome.png`)" :load="imgLoaded = true")
    div(class="welcome__img__overlay")
  div(class="welcome__text body-MD text-white") {{ $t('STK0054') }}
  div(class="welcome__btn-start text-H6" @click.prevent.stop="handleClose")
    span {{ $t('STK0055') }}
</template>

<script lang="ts">
import { round } from 'lodash'
import { defineComponent } from 'vue'
import { mapMutations, mapState } from 'vuex'

export default defineComponent({
  data() {
    return {
      imgLoaded: false
    }
  },
  methods: {
    ...mapMutations({
      clearFullPageConfig: 'vivisticker/UPDATE_clearFullPageConfig'
    }),
    handleClose() {
      this.clearFullPageConfig()
    }
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize',
      isTablet: 'isTablet',
      isLandscape: 'isLandscape'
    }),
    containerWidth() {
      return this.isTablet && this.isLandscape ? round(this.windowSize.width * 0.44) : this.windowSize.width // round to prevent subpixel problem
    },
  }
})
</script>

<style lang="scss" scoped>
.welcome {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  width: v-bind("containerWidth + 'px'");
  margin: 0 auto;
  position: relative;
  &__img {
    position: relative;
    width: 100%;
    max-height: calc(100vh - 320px);
    >img {
      @include size(100%);
      object-fit: cover;
      object-position: bottom;
    }
    &__overlay {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: calc(100% + 1px); // prevent subpixel problem
      background: linear-gradient(0deg, rgba(setColor(black-1),1) 0%, rgba(setColor(black-1),0) 25%);
    }
  }
  &__text {
    position: relative;
    margin: 24px 24px 0;
  }
  &__btn-start {
    box-sizing: border-box;
    position: absolute;
    height: 40px;
    left: 24px;
    right: 24px;
    bottom: 40px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 4px 16px;
    background: #FFFFFF;
    border-radius: 100px;
  }
}
</style>
