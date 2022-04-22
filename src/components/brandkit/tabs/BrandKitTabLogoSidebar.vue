<template lang="pug">
  recycle-scroller(class="brand-kit-tab-logo" :items="rows")
    template(v-slot="{ item }")
      observer-sentinel(v-if="item.sentinel"
        target=".brand-kit-tab-logo"
        @callback="handleLoadMore(item)")
      div(class="brand-kit-tab-logo__row")
        template(v-for="logo in item.list")
          div(v-if="checkUploading(logo)"
            class="brand-kit-tab-logo__item pointer relative"
            :style="imageStyle(logo.preview)"
            :key="logo.id")
            svg-icon(iconName="loading" iconWidth="24px" iconColor="gray-3")
          gallery-photo(v-else
            :style="imageStyle(logo.preview)"
            :photo="addPerviewUrl(logo)"
            vendor="logo"
            :inLogoPanel="true"
            :key="logo.id")
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
import GalleryUtils from '@/utils/galleryUtils'
import { IPhoto, IPhotoItem } from '@/interfaces/api'

export default Vue.extend({
  data() {
    return {
      rows: [] as any[],
      galleryUtils: new GalleryUtils(300, 100, 5)
    }
  },
  mounted() {
    brandkitUtils.fetchLogos(this.fetchLogos)
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    ObserverSentinel,
    GalleryPhoto: () => import('@/components/GalleryPhoto.vue')
  },
  watch: {
    logos() {
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
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
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
    addPerviewUrl(logo: IBrandLogo): any {
      const { isAdmin } = this
      return {
        id: isAdmin ? logo.id : undefined,
        assetIndex: logo.asset_index,
        type: isAdmin ? 'logo-public' : 'logo-private',
        ver: logo.ver,
        width: logo.width,
        height: logo.height,
        preview: logo.preview,
        urls: {
          prev: brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'prev'),
          full: brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'full'),
          larg: brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'larg'),
          original: brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'original'),
          midd: brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'midd'),
          smal: brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'smal'),
          tiny: brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'tiny')
        }
      }
    },
    handleLoadMore(item: any): void {
      item.sentinel = false
      this.$emit('loadMore')
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
</style>
