<template lang="pug">
  div(class="category-template-item" :style="itemStyle")
    div(class="relative")
      img(class="category-template-item__img pointer"
        draggable="true"
        :src="src || fallbackSrc || `https://template.vivipic.com/template/${item.id}/prev?ver=${item.ver}`"
        :style="previewStyle"
        @error="handleNotFound"
        @dragstart="dragStart($event)"
        @click="addTemplate")
    div(v-if="showId"
      class="category-template-item__id"
      @click="copyId") {{ item.id }}
</template>

<script lang="ts">
import Vue from 'vue'
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import AssetUtils from '@/utils/assetUtils'
import GeneralUtils from '@/utils/generalUtils'
import themeUtils from '@/utils/themeUtils'
import modalUtils from '@/utils/modalUtils'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  components: { ImageCarousel },
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
      const { width, height } = this.item.preview || {}
      return { width: `${width}px`, height: `${height}px` }
    },
    itemStyle(): any {
      const { width } = this.item.preview || {}
      return { width: `${width || 145}px` }
    }
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    dragStart(event: DragEvent) {
      const dataTransfer = event.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      dataTransfer.setDragImage((event.target as HTMLImageElement), 0, 0)
      dataTransfer.setData('data', JSON.stringify(this.item))
    },
    addTemplate() {
      const { match_cover: matchCover = {}, height, width } = this.item
      const theme = themeUtils
        .getThemesBySize(matchCover.width || width, matchCover.height || height)
        .map(theme => theme.id).join(',')
      const isSameTheme = themeUtils.compareThemesWithPage(theme)
      const currLayer = pageUtils.getPage(pageUtils.currFocusPageIndex)
      const cb = this.groupItem
        ? (resize?: any) => AssetUtils.addGroupTemplate(this.groupItem, this.item.id, resize)
        : (resize?: any) => AssetUtils.addAsset(this.item, resize)

      if (this.isDetailPage) {
        const { width: pageWidth = 1000 } = pageUtils.getPageWidth()
        const ratio = (matchCover.width || width) / pageWidth
        const resize = { width: pageWidth, height: (matchCover.height || height) * ratio }
        return cb(resize)
      }

      if (!isSameTheme) {
        let btnWidth = '120px'
        if (this.$i18n.locale === 'tw') {
          btnWidth = '120px'
        } else if (this.$i18n.locale === 'us') {
          btnWidth = '150px'
        } else if (this.$i18n.locale === 'jp') {
          btnWidth = '180px'
        }
        modalUtils.setIsModalOpen(true)
        modalUtils.setModalInfo(
          `${this.$t('NN0209')}`,
          [],
          {
            msg: `${this.$t('NN0208')}`,
            style: { width: btnWidth, height: '32px' },
            action: cb
          },
          {
            msg: `${this.$t('NN0021')}`,
            class: 'border-blue-1 btn-light-mid',
            style: { width: btnWidth, height: '32px' },
            action: () => {
              const resize = { width: currLayer.width, height: currLayer.height }
              cb(resize)
            }
          }
        )
      } else {
        const resize = { width: currLayer.width, height: currLayer.height }
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
