<template lang="pug">
transition-group(class="brand-kit-tab-logo" name="logo-list" tag="div")
  template(v-for="logo in renderedLogos")
    div(v-if="logo === 'add'"
      class="brand-kit-tab-logo__item add pointer relative"
      key="add"
      @click="handleUploadLogo")
      span(class="primary") {{ $t('NN0411') }}
      i18n-t(class="secondary" keypath="NN0412" tag="span")
        template(#newline)
          br
      svg-icon(class="hover"
              iconName="plus-origin"
              iconWidth="16px"
              iconColor="gray-2")
    div(v-else-if="logo === 'loading'"
        class="brand-kit-tab-logo-loading no-trans"
        key="loading")
      svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
    observer-sentinel(v-else-if="logo === 'sentinel'"
                      class="no-trans"
                      key="sentinel"
                      :target="$route.name === 'Editor' ? '.popup-brand-settings__window' : undefined"
                      @callback="handleLoadMore")
    div(v-else-if="(typeof logo !== 'string')"
      class="brand-kit-tab-logo__item relative"
      :class="{hovered: checkMenuOpen(logo)}"
      :key="logo.id.replace('new_', '')")
      svg-icon(v-if="checkUploading(logo)" iconName="loading" iconWidth="24px" iconColor="gray-3")
      img(v-else :src="getUrl(logo)" class="brand-kit-tab-logo__item__img")
      div(v-if="!checkUploading(logo)" class="brand-kit-tab-logo__item__more pointer"
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
            div(class="brand-kit-tab-logo__item__menu__row pointer"
              @click="handleDownload(logo)")
              svg-icon(iconName="download"
                      iconWidth="24px"
                      iconColor="gray-2")
              span {{ $t('NN0010') }}
            div(class="brand-kit-tab-logo__item__menu__row pointer"
              @click="handleDeleteLogo(logo)")
              svg-icon(iconName="trash"
                      iconWidth="24px"
                      iconColor="gray-2")
              span {{ $t('NN0034') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import vClickOutside from 'click-outside-vue3'
import { IBrand, IBrandLogo } from '@/interfaces/brandkit'
import uploadUtils from '@/utils/uploadUtils'

export default defineComponent({
  emits: ['deleteItem'],
  data() {
    return {
      menuOpenLogoId: ''
    }
  },
  mounted() {
    brandkitUtils.fetchLogos(this.fetchLogos)
  },
  components: {
    ObserverSentinel
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  watch: {
    logos() {
      this.menuOpenLogoId = ''
    },
    currentBrand() {
      brandkitUtils.fetchLogos(this.fetchLogos)
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      isLogosLoading: 'getIsLogosLoading',
      logosPageIndex: 'getLogosPageIndex'
    }),
    logos(): IBrandLogo[] {
      return (this.currentBrand as IBrand).logos
    },
    renderedLogos(): (IBrandLogo | string)[] {
      const res = ['add', ...this.logos]
      if (this.isLogosLoading) {
        res.push('loading')
      } else if (this.logosPageIndex >= 0) {
        res.push('sentinel')
      }
      return res
    }
  },
  methods: {
    ...mapActions('brandkit', {
      fetchLogos: 'fetchLogos',
      fetchMoreLogos: 'fetchMoreLogos',
      refreshLogoAsset: 'refreshLogoAsset'
    }),
    getUrl(logo: IBrandLogo): string {
      return brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'tiny')
    },
    checkMenuOpen(logo: IBrandLogo): boolean {
      return this.menuOpenLogoId === logo.id
    },
    checkUploading(logo: IBrandLogo) {
      return logo.id.startsWith('new_')
    },
    handleOpenMenu(logo: IBrandLogo) {
      if (this.checkMenuOpen(logo)) {
        this.menuOpenLogoId = ''
      } else {
        this.menuOpenLogoId = logo.id
      }
    },
    handleUploadLogo() {
      uploadUtils.chooseAssets('logo')
    },
    handleDownload(logo: IBrandLogo) {
      const brand = this.currentBrand
      const logoName = logo.name
      const url = brandkitUtils.getLogoUrl(logo, brand.id, 'original')
      if (logo.signed_url) {
        const image = new Image()
        image.onload = () => { this.startDownloading(url, logoName) }
        image.onerror = () => {
          this.refreshLogoAsset({
            brand,
            logoAssetIndex: logo.asset_index
          }).then((urlMap) => {
            this.startDownloading(urlMap.original, logoName)
          })
        }
        image.src = url
      } else {
        this.startDownloading(url, logoName)
      }
    },
    handleDeleteLogo(logo: IBrandLogo) {
      this.menuOpenLogoId = ''
      this.$emit('deleteItem', {
        type: 'logo',
        content: logo
      })
    },
    handleLoadMore() {
      brandkitUtils.fetchLogos(this.fetchMoreLogos, false)
    },
    startDownloading(url: string, name: string) {
      const a = document.createElement('a')
      a.setAttribute('href', url)
      a.setAttribute('download', name)
      a.click()
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-logo-loading {
  display: flex;
  justify-content: center;
}
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
      // width: 100px;
      display: flex;
      flex-direction: column;
      padding: 25px 30px;
      border: 1px dashed setColor(gray-4);
      & > .hover {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: none;
        z-index: 1;
      }
      &:hover {
        background-color: setColor(blue-4);
        border: 1px solid setColor(blue-4);
        & > span.primary,
        & > span.secondary {
          color: setColor(blue-4);
        }
        & > .hover {
          display: block;
        }
      }
      & > span.primary {
        @include body-SM;
        color: setColor(gray-2);
      }
      & > span.secondary {
        @include body-XS;
        color: setColor(gray-3);
      }
    }
    &__img {
      height: 100%;
      width: auto;
    }
    &:not(.add):hover,
    &.hovered {
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
          background-color: setColor(blue-4);
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

.logo-list {
  &-enter-active,
  &-leave-active,
  &-move {
    &:not(.no-trans) {
      transition: 0.3s ease;
    }
  }

  &-leave-active {
    position: absolute;
  }

  &-enter-from,
  &-leave-to {
    &:not(.no-trans) {
      transform: translateY(-30%);
      opacity: 0;
    }
  }
}
</style>
