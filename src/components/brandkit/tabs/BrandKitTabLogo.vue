<template lang="pug">
image-list(:images="renderedLogos"
  :showMore="true"
  @addImage="handleUploadLogo"
  @handleDownload="handleDownload"
  @handleDeleteLogo="handleDeleteLogo"
  @handleOpenMenu="handleOpenMenu"
  @handleCloseMenu="handleCloseMenu"
  @loadMore="handleLoadMore")
</template>

<script lang="ts">
import ImageList, { IImageListItem, spItem } from '@/components/image-gallery/ImageList.vue'
import { IBrand, IBrandLogo } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import uploadUtils from '@/utils/uploadUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

interface IRenderedLogos extends IImageListItem {
  logo?: IBrandLogo
}

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
    ImageList,
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
    renderedLogos(): IRenderedLogos[] {
      const res = [spItem('add'), ...this.logos.map(logo => ({
        type: '' as const,
        key: logo.id,
        label: logo.name,
        src: brandkitUtils.getLogoUrl(logo, this.currentBrand.id, 'tiny'),
        uploading: logo.id.startsWith('new_'),
        menuopen: this.menuOpenLogoId === logo.id,
        logo,
      }))]
      if (this.isLogosLoading) {
        res.push(spItem('loading'))
      } else if (this.logosPageIndex >= 0) {
        res.push(spItem('sentinel'))
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
    checkMenuOpen(logo: IBrandLogo): boolean {
      return this.menuOpenLogoId === logo.id
    },
    handleOpenMenu({ logo }: IRenderedLogos) {
      if (!logo) return
      if (this.checkMenuOpen(logo)) {
        this.menuOpenLogoId = ''
      } else {
        this.menuOpenLogoId = logo.id
      }
    },
    handleCloseMenu() {
      this.menuOpenLogoId = ''
    },
    handleUploadLogo() {
      uploadUtils.chooseAssets('logo')
    },
    handleDownload({ logo }: IRenderedLogos) {
      if (!logo) return
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
    handleDeleteLogo({ logo }: IRenderedLogos) {
      if (!logo) return
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
</style>
