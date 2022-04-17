<template lang="pug">
  div(v-if="isLogosLoading" class="brand-kit-tab-logo-loading")
    svg-icon(iconName="loading"
            iconWidth="50px"
            iconColor="gray-3")
  transition-group(v-else class="brand-kit-tab-logo" name="logo-list" tag="div")
    template(v-for="logo in logos")
      div(v-if="logo === 'add'"
        class="brand-kit-tab-logo__item add pointer relative"
        key="add"
        @click="handleUploadLogo")
        span(class="primary") {{ $t('NN0411') }}
        i18n(class="secondary" path="NN0412" tag="span")
          template(#newline)
            br
        svg-icon(class="hover"
                iconName="plus-origin"
                iconWidth="16px"
                iconColor="gray-2")
      div(v-else
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
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import vClickOutside from 'v-click-outside'
import { IBrand, IBrandLogo } from '@/interfaces/brandkit'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  data() {
    return {
      menuOpenLogoId: ''
    }
  },
  mounted() {
    brandkitUtils.fetchLogos(this.fetchLogos)
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
      isLogosLoading: 'getIsLogosLoading'
    }),
    logos(): (IBrandLogo | string)[] {
      return ['add', ...(this.currentBrand as IBrand).logos]
    }
  },
  methods: {
    ...mapActions('brandkit', {
      fetchLogos: 'fetchLogos',
      refreshLogoAsset: 'refreshLogoAsset'
    }),
    getUrl(logo: IBrandLogo): string {
      return logo.signed_url ? logo.signed_url.tiny : `https://template.vivipic.com/admin/${logo.team_id}/asset/logo/${this.currentBrand.id}/${logo.id}/tiny`
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
      const url = brandkitUtils.getDownloadUrl(logo, brand.id)
      if (logo.signed_url) {
        fetch(url).then(() => {
          this.startDownloading(url, logoName)
        }).catch(() => {
          this.refreshLogoAsset({
            brand,
            logoAssetIndex: logo.asset_index
          }).then((urlMap) => {
            this.startDownloading(urlMap.original, logoName)
          })
        })
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
        & > span.primary, & > span.secondary {
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
  &-leave-active {
    transition: 0.3s ease;
  }

  &-enter,
  &-leave-to {
    transform: translateY(-30%);
    opacity: 0;
  }
}
</style>
