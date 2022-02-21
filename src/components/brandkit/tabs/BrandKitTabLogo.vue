<template lang="pug">
  div(class="brand-kit-tab-logo")
    div(class="brand-kit-tab-logo__item add pointer")
      svg-icon(iconName="plus-origin"
              iconWidth="26.67px"
              iconColor="gray-2")
    div(v-for="logo in logos" class="brand-kit-tab-logo__item relative"
      :class="{hovered: checkMenuOpen(logo)}")
      img(:src="logo.url" class="brand-kit-tab-logo__item__img")
      div(class="brand-kit-tab-logo__item__more pointer"
        @click="handleOpenMenu(logo)")
        div(class="brand-kit-tab-logo__item__more-container relative")
          svg-icon(iconName="more_vertical"
                  iconWidth="24px"
                  iconColor="gray-2")
          div(v-if="checkMenuOpen(logo)"
            class="brand-kit-tab-logo__item__menu"
            v-click-outside="() => { menuOpenLogoId = '' }")
            div(class="brand-kit-tab-logo__item__menu__name")
              span {{ logo.name }}
            div(class="brand-kit-tab-logo__item__menu__hr")
            div(class="brand-kit-tab-logo__item__menu__row pointer")
              svg-icon(iconName="download"
                      iconWidth="24px"
                      iconColor="gray-2")
              span {{ $t('NN0010') }}
            div(class="brand-kit-tab-logo__item__menu__row pointer")
              svg-icon(iconName="trash"
                      iconWidth="24px"
                      iconColor="gray-2")
              span {{ $t('NN0034') }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import vClickOutside from 'v-click-outside'
import { IBrand, IBrandLogo } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
      menuOpenLogoId: ''
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  watch: {
    logos() {
      this.menuOpenLogoId = ''
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand'
    }),
    logos(): IBrandLogo[] {
      return (this.currentBrand as IBrand).logos
    }
  },
  methods: {
    checkMenuOpen(logo: IBrandLogo): boolean {
      return this.menuOpenLogoId === logo.id
    },
    handleOpenMenu(logo: IBrandLogo) {
      if (this.checkMenuOpen(logo)) {
        this.menuOpenLogoId = ''
      } else {
        this.menuOpenLogoId = logo.id
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-logo {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  &__item {
    height: 100px;
    min-width: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid setColor(gray-4);
    box-sizing: border-box;
    border-radius: 4px;
    &.add {
      width: 100px;
      &:hover {
        background-color: setColor(gray-5);
        border: 1px solid setColor(gray-5);
      }
    }
    &__img {
      height: 100%;
      width: auto;
    }
    &:not(.add):hover, &.hovered {
      background-color: rgba(setColor(gray-4), 0.5);
      border: 1px solid setColor(gray-4);
      & > img {
        opacity: 0.5;
      }
      & > div {
        display: flex;
      }
    }
    &__more {
      position: absolute;
      top: 4px;
      right: 5px;
      display: none;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 2px;
      &-container {
        width: 24px;
        height: 24px;
      }
    }
    &__menu {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 8px 0px;
      top: calc(100% + 10px);
      left: 0;
      width: 216px;
      position: absolute;
      background: white;
      box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
      border-radius: 5px;
      z-index: 1;
      cursor: initial;
      &__name {
        height: 25px;
        padding: 0px 8px;
        display: flex;
        align-items: center;
        justify-content: start;
        & > span {
          @include caption-LG;
          text-align: left;
          display: block;
        }
      }
      &__hr {
        margin: auto;
        height: 1px;
        width: calc(100% - 16px);
        background-color: setColor(gray-4);
      }
      &__row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 0px 4px 10px;
        &:hover {
          background-color: setColor(gray-5);
        }
        & > span {
          @include body-SM;
          line-height: 25px;
          height: 25px;
          display: block;
          color: setColor(gray-1);
        }
      }
    }
  }
}
</style>
