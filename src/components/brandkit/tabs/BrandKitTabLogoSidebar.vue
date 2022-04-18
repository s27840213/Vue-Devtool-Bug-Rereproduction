<template lang="pug">
  //- div(v-if="isLogosLoading" class="brand-kit-tab-logo-loading")
    svg-icon(iconName="loading"
            iconWidth="24px"
            iconColor="gray-3")
  recycle-scroller(class="brand-kit-tab-logo" :items="rows")
    template(v-slot="{ item }")
      observer-sentinel(v-if="item.sentinel"
        target=".brand-kit-tab-logo"
        @callback="handleLoadMore(item)")
      transition-group(class="brand-kit-tab-logo__row" name="logo-list" tag="div")
        div(v-for="logo in item.list"
          class="brand-kit-tab-logo__item  relative"
          :class="{hovered: checkMenuOpen(logo)}"
          :style="imageStyle(logo.preview)"
          :key="logo.id.replace('new_', '')")
          svg-icon(v-if="checkUploading(logo)" iconName="loading" iconWidth="24px" iconColor="gray-3")
          img(v-else :src="getUrl(logo)" class="brand-kit-tab-logo__item__img")
    template(#after)
      div(v-if="isLogosLoading" class="brand-kit-tab-logo-loading")
        svg-icon(iconName="loading"
                iconWidth="24px"
                iconColor="gray-3")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import vClickOutside from 'v-click-outside'
import { IBrand, IBrandLogo } from '@/interfaces/brandkit'
import uploadUtils from '@/utils/uploadUtils'
import GalleryUtils from '@/utils/galleryUtils'

export default Vue.extend({
  data() {
    return {
      menuOpenLogoId: '',
      rows: [] as any[],
      galleryUtils: new GalleryUtils(300, 100, 15)
    }
  },
  mounted() {
    brandkitUtils.fetchLogos(this.fetchLogos)
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    ObserverSentinel
  },
  watch: {
    logos() {
      this.menuOpenLogoId = ''
      this.logosUpdate()
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
    logos(): IBrandLogo[] {
      return (this.currentBrand as IBrand).logos
    }
  },
  methods: {
    ...mapActions('brandkit', {
      fetchLogos: 'fetchLogos',
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
    logosUpdate() {
      this.rows = this.galleryUtils
        .generateForLogo(this.logos)
        .map((row, idx) => ({
          list: row,
          id: `row_${idx}`,
          sentinel: false,
          index: idx,
          size: (row[0].preview?.height ?? 0) + this.galleryUtils.margin
        }))
    },
    imageStyle(preview: any) {
      return {
        width: `${preview.width}px`,
        height: `${preview.height}px`
      }
    },
    handleLoadMore(item: any): void {
      item.sentinel = false
      this.$emit('loadMore')
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
  height: 100%;
  line-height: 0;
  text-align: left;
  box-sizing: border-box;
  margin-right: -10px; // Push scrollbar to outside
  padding-right: 10px;
  @media not all and (min-resolution:.001dpcm){ // For safari only
    @supports (-webkit-appearance:none) {
      padding-right: 0;
    }
  }
  @include hide-scrollbar;
  &__row {
    display: flex;
    justify-content: space-between;
  }
  &__item {
    display: flex;
    align-items: center;
    justify-content: center;
    &__img {
      height: 100%;
      width: auto;
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
