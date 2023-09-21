<template lang="pug">
div(v-if="logos.length === 0 && !isLogosLoading" class="hint" :style="minHeightStyles()")
  no-items-hint(type="logo" :mobile="true")
div(v-else class="brand-kit-tab-logo" :style="minHeightStyles()")
  recycle-scroller(:items="rows")
    template(v-slot="{ item }")
      observer-sentinel(v-if="item.sentinel"
        target=".brand-kit-tab-logo"
        @callback="handleLoadMore(item)")
      div(class="brand-kit-tab-logo__row"
          :style="settingmode ? ' margin-top: 11px; margin-right: 11px' : ''")
        template(v-for="logo in item.list" :key="logo.id")
          div(v-if="checkUploading(logo)"
            class="brand-kit-tab-logo__item pointer relative"
            :style="imageStyle(logo.preview)")
            svg-icon(iconName="loading" iconWidth="24px" iconColor="gray-3")
          gallery-photo(v-else
            :style="imageStyle(logo.preview)"
            :photo="addPerviewUrl(item.brandId, logo)"
            vendor="logo"
            :inLogoPanel="true"
            :deletable="settingmode")
    template(#after)
      div(v-if="isLogosLoading" class="brand-kit-tab-logo-loading")
        svg-icon(iconName="loading"
                iconWidth="24px"
                iconColor="gray-3")
</template>

<script lang="ts">
import NoItemsHint from '@/components/brandkit/NoItemsHint.vue'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import { IBrand, IBrandLogo } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import GalleryUtils from '@/utils/galleryUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  data() {
    return {
      rows: [] as any[],
      galleryUtils: new GalleryUtils(window.innerWidth - 34, 95, 16)
    }
  },
  props: {
    maxheight: {
      default: window.innerHeight * 0.9,
      type: Number
    },
    settingmode: {
      default: false,
      type: Boolean
    }
  },
  mounted() {
    if (this.isSettingsOpen) return
    brandkitUtils.fetchLogos(this.fetchLogos)
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    ObserverSentinel,
    GalleryPhoto,
    NoItemsHint
  },
  watch: {
    logos() {
      this.logosUpdate()
    },
    currentBrand() {
      if (this.isSettingsOpen) return
      brandkitUtils.fetchLogos(this.fetchLogos)
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      isLogosLoading: 'getIsLogosLoading',
      isSettingsOpen: 'getIsSettingsOpen'
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
      fetchMoreLogos: 'fetchMoreLogos',
      refreshLogoAsset: 'refreshLogoAsset'
    }),
    minHeightStyles() {
      return { minHeight: `${this.maxheight}px` }
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
          size: (row[0].preview?.height ?? 0) + this.galleryUtils.margin,
          brandId: this.currentBrand.id
        }))
      if (this.rows.length) {
        this.rows[Math.max(this.rows.length - 10, 0)].sentinel = true
      }
    },
    imageStyle(preview: any) {
      return {
        width: `${preview.width}px`,
        height: `${preview.height}px`
      }
    },
    addPerviewUrl(brandId: string, logo: IBrandLogo): any {
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
          prev: brandkitUtils.getLogoUrl(logo, brandId, 'prev'),
          full: brandkitUtils.getLogoUrl(logo, brandId, 'full'),
          larg: brandkitUtils.getLogoUrl(logo, brandId, 'larg'),
          original: brandkitUtils.getLogoUrl(logo, brandId, 'original'),
          midd: brandkitUtils.getLogoUrl(logo, brandId, 'midd'),
          smal: brandkitUtils.getLogoUrl(logo, brandId, 'smal'),
          tiny: brandkitUtils.getLogoUrl(logo, brandId, 'tiny')
        }
      }
    },
    handleLoadMore(item: any): void {
      if (this.isSettingsOpen) return
      item.sentinel = false
      brandkitUtils.fetchLogos(this.fetchMoreLogos, false)
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
  .vue-recycle-scroller {
    height: 100%;
  }
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

.hint {
  display: flex;
  justify-content: center;
}
</style>
