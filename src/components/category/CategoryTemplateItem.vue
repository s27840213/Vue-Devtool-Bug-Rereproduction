<template lang="pug">
  div(class="category-template-item" :style="itemStyle")
    div(class="relative pointer"
        @click="addTemplate"
        @dragstart="dragStart($event)")
      img(class="category-template-item__img"
        draggable="true"
        :src="src || fallbackSrc || `https://template.vivipic.com/template/${item.id}/prev_2x?ver=${item.ver}`"
        :style="previewStyle"
        @error="handleNotFound")
      pro-item(v-if="item.plan")
    div(v-if="showId"
      class="category-template-item__id"
      @click="copyId") {{ item.id }}
</template>

<script lang="ts">
import Vue from 'vue'
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import ProItem from '@/components/payment/ProItem.vue'
import AssetUtils from '@/utils/assetUtils'
import GeneralUtils from '@/utils/generalUtils'
import modalUtils from '@/utils/modalUtils'
import pageUtils from '@/utils/pageUtils'
import paymentUtils from '@/utils/paymentUtils'

export default Vue.extend({
  components: {
    ImageCarousel,
    ProItem
  },
  props: {
    src: String,
    item: Object,
    showId: Boolean,
    groupItem: Object
  },
  data() {
    return {
      fallbackSrc: ''
    }
  },
  computed: {
    previewImage(): string {
      const { match_cover: cover, ver, id } = this.item
      return `https://template.vivipic.com/template/${cover.id ?? id}/prev?ver=${ver}`
    },
    designGroupType(): number {
      return this.$store.state.groupType
    },
    isDetailPage(): boolean {
      return this.designGroupType === 1 || this.groupItem?.group_type === 1
    },
    previewStyle(): any {
      const { width, height } = this.item.preview || { width: GeneralUtils.getListRowItemSize(), height: GeneralUtils.getListRowItemSize() }
      return { width: `${width}px`, height: `${height}px` }
    },
    itemStyle(): any {
      const { width } = this.item.preview || { width: GeneralUtils.getListRowItemSize() }
      return { width: `${width}px` }
    }
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    dragStart(event: DragEvent) {
      if (this.groupItem && !paymentUtils.checkProGroupTemplate(this.groupItem, this.item)) return
      else if (!this.groupItem && !paymentUtils.checkProTemplate(this.item)) return
      const dataTransfer = event.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      dataTransfer.setDragImage((event.target as HTMLImageElement), 0, 0)
      dataTransfer.setData('data', JSON.stringify(this.groupItem
        ? Object.assign(this.groupItem, { groupChildId: this.item.id })
        : this.item))
    },
    addTemplate() {
      if (this.groupItem && !paymentUtils.checkProGroupTemplate(this.groupItem, this.item)) return
      else if (!this.groupItem && !paymentUtils.checkProTemplate(this.item)) return
      const { match_cover: matchCover = {} } = this.item
      let { height, width } = this.item

      // in some cases (single page group template), there is no item.width/item.height (unknown reason), then we get them by match_cover
      if (width === undefined) {
        width = this.item.match_cover.width
        height = this.item.match_cover.height
      }
      /*
      const theme = themeUtils
        .getThemesBySize(matchCover.width || width, matchCover.height || height)
        .map(theme => theme.id).join(',')
      const isSameTheme = themeUtils.compareThemesWithPage(theme)
      */
      const currPage = pageUtils.getPage(pageUtils.currFocusPageIndex)
      const isSameSize = currPage.width === width && currPage.height === height
      const cb = this.groupItem
        ? (resize?: any) => {
          AssetUtils.addGroupTemplate(this.groupItem, this.item.id, resize)
        }
        : (resize?: any) => {
          AssetUtils.addAsset(this.item, resize)
          GeneralUtils.fbq('track', 'AddToWishlist', {
            content_ids: [this.item.id]
          })
        }

      /**
       * @todo show the modal if the width,height are not the same in detailed page mode
       */
      if (this.isDetailPage) {
        const { width: pageWidth = 1000 } = pageUtils.getPageWidth()
        const ratio = pageWidth / (matchCover.width || width)
        const resize = { width: pageWidth, height: (matchCover.height || height) * ratio }
        return cb(resize)
      }

      if (!isSameSize) {
        let btnWidth = '120px'
        if (this.$i18n.locale === 'tw') {
          btnWidth = '120px'
        } else if (this.$i18n.locale === 'us') {
          btnWidth = '160px'
        } else if (this.$i18n.locale === 'jp') {
          btnWidth = '180px'
        }
        modalUtils.setModalInfo(
          this.$t('NN0695') as string,
          [`${this.$t('NN0209', { tsize: `${width}x${height}`, psize: `${Math.round(currPage.width)}x${Math.round(currPage.height)}` })}`],
          {
            msg: `${this.$t('NN0021')}`,
            class: 'btn-light-mid',
            style: { border: '1px solid #4EABE6' },
            action: () => {
              const resize = { width: currPage.width, height: currPage.height }
              cb(resize)
            }
          },
          {
            msg: `${this.$t('NN0208')}`,
            action: cb
          }
        )
      } else {
        const resize = { width: currPage.width, height: currPage.height }
        cb(resize)
      }
    },
    copyId() {
      GeneralUtils.copyText(this.item.id)
        .then(() => {
          this.$notify({ group: 'copy', text: `${this.item.id} 已複製` })
        })
    }
  }
})
</script>

<style lang="scss" scoped>
.category-template-item {
  &__img {
    object-fit: contain;
    height: 145px;
    width: 145px;
    vertical-align: top;
  }
  &__id {
    color: #ffffff;
    font-size: 20px;
    line-height: 40px;
    text-align: left;
    transform: scale(0.5);
    transform-origin: left top;
    cursor: pointer;
  }
  &__index {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 20px;
    color: #ffffff;
    padding: 4px 8px;
    width: 70px;
    border-radius: 20px;
    box-sizing: border-box;
    background: rgba(24, 25, 31, 0.7);
    transform: scale(0.4);
    transform-origin: bottom right;
  }
}
</style>
