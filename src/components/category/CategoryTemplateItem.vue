<template lang="pug">
div(class="category-template-item")
  div(class="relative pointer"
      draggable="true"
      @click="addTemplate"
      @dragstart="dragStart($event)")
    img(class="category-template-item__img"
      ref="img"
      :src="src || fallbackSrc || `https://template.vivipic.com/template/${item.id}/prev_2x?ver=${item.ver}`"
      @error="handleNotFound")
    pro-item(v-if="item.plan" draggable="false")
</template>

<script lang="ts">
import ProItem from '@/components/payment/ProItem.vue'
import { IAsset } from '@/interfaces/module'
import assetUtils from '@/utils/assetUtils'
import DragUtils from '@/utils/dragUtils'
import GeneralUtils from '@/utils/generalUtils'
import modalUtils from '@/utils/modalUtils'
import pageUtils from '@/utils/pageUtils'
import paymentUtils from '@/utils/paymentUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

/**
 * @Todo - fix the any type problems -> TingAn
 */

export default defineComponent({
  emits: [],
  components: {
    ProItem
  },
  props: {
    src: {
      type: String
    },
    item: {
      type: Object,
      required: true
    },
    groupItem: {
      type: Object
    }
  },
  data() {
    return {
      fallbackSrc: '',
      dragUtils: new DragUtils()
    }
  },
  computed: {
    ...mapState('templates', {
      igLayout: 'igLayout'
    }),
    ...mapGetters({
      useMobileEditor: 'getUseMobileEditor',
      isInEditor: 'vivisticker/getIsInEditor'
    }),
    designGroupType(): number {
      return this.$store.state.groupType
    },
    isDetailPage(): boolean {
      return this.designGroupType === 1 || this.groupItem?.group_type === 1
    },
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    dragStart(event: DragEvent) {
      if (this.groupItem && !paymentUtils.checkProGroupTemplate(this.groupItem as any, this.item as any)) return
      else if (!this.groupItem && !paymentUtils.checkProTemplate(this.item as any)) return
      const img = this.$refs.img as HTMLImageElement
      const type = assetUtils.getLayerType(this.item.type)
      this.dragUtils.itemDragStart(event, type || '', {
        ...(this.groupItem ? Object.assign(this.groupItem, { groupChildId: this.item.id }) : this.item)
      }, img.src, {
        aspectRatio: img.naturalWidth / img.naturalHeight
      })
    },
    addTemplate() {
      if (this.isDetailPage && this.useMobileEditor) {
        modalUtils.setModalInfo(
            `${this.$t('NN0808')}`,
            [],
            {
              msg: `${this.$t('NN0358')}`,
              class: 'btn-blue-mid',
              action: () => { return false }
            }
        )
        return
      }
      // if (this.groupItem && !paymentUtils.checkProGroupTemplate(this.groupItem as any, this.item as any)) return
      // else if (!this.groupItem && !paymentUtils.checkProTemplate(this.item as any)) return
      const { match_cover: matchCover = {} } = this.item
      let { height, width, unit } = this.item

      // in some cases (single page group template), there is no item.width/item.height (unknown reason), then we get them by match_cover
      if (width === undefined || height === undefined || unit === undefined) {
        width = this.item.match_cover.width
        height = this.item.match_cover.height
        unit = this.item.match_cover.unit
      }
      /*
      const theme = themeUtils
        .getThemesBySize(matchCover.width || width, matchCover.height || height)
        .map(theme => theme.id).join(',')
      const isSameTheme = themeUtils.compareThemesWithPage(theme)
      */
      const pageSize = pageUtils.currFocusPageSize
      const isSameSize = pageSize.physicalWidth === width && pageSize.physicalHeight === height && pageSize.unit === unit
      const cb = this.groupItem ? (resize?: any) => {
        assetUtils.addGroupTemplate(this.groupItem as any, this.item.id, resize)
      } : (resize?: any) => {
        assetUtils.addAsset(this.item as any, resize)
        GeneralUtils.fbq('track', 'AddToWishlist', {
          content_ids: [this.item.id]
        })
      }

      /**
       * @todo show the modal if the width,height are not the same in detailed page mode
       */
      if (this.isDetailPage) {
        const { width: pageWidth = 1000 } = pageSize
        const ratio = pageWidth / (matchCover.width || width)
        const resize = { width: pageWidth, height: (matchCover.height || height) * ratio }
        return cb(resize)
      }

      // for vivisticker
      if (this.isInEditor) {
        cb(pageSize)
      } else {
        cb()
        vivistickerUtils.startEditing(
          this.igLayout, {
            plan: this.item.plan,
            assetId: this.item.id
          }, vivistickerUtils.getAssetInitiator(this.item as IAsset), vivistickerUtils.getAssetCallback(this.item as IAsset)
        )
      }
      // size check skiped in vivisticker
      // if (!isSameSize) {
      //   let btnWidth = '120px'
      //   if (this.$i18n.locale === 'tw') {
      //     btnWidth = '120px'
      //   } else if (this.$i18n.locale === 'us') {
      //     btnWidth = '160px'
      //   } else if (this.$i18n.locale === 'jp') {
      //     btnWidth = '180px'
      //   }
      //   modalUtils.setModalInfo(
      //     this.$t('NN0695') as string,
      //     [`${this.$t('NN0209', { tsize: `${width}x${height} ${unit}`, psize: `${round(pageSize.physicalWidth, PRECISION)}x${round(pageSize.physicalHeight, PRECISION)} ${pageSize.unit}` })}`],
      //     {
      //       msg: `${this.$t('NN0021')}`,
      //       class: 'btn-light-mid',
      //       style: { border: '1px solid #4EABE6' },
      //       action: () => {
      //         cb(pageSize)
      //       }
      //     },
      //     {
      //       msg: `${this.$t('NN0208')}`,
      //       action: cb
      //     }
      //   )
      // } else {
      //   cb()
      // }
    }
  }
})
</script>

<style lang="scss" scoped>
.category-template-item {
  &__img {
    @include size(100%);
    object-fit: contain;
    vertical-align: top;
    border-radius: 5px;
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
