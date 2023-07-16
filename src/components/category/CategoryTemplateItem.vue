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
      if (this.groupItem && !vivistickerUtils.checkPro(this.groupItem, 'template')) return
      else if (!this.groupItem && !vivistickerUtils.checkPro(this.item, 'template')) return
      if (pageUtils.getPages.length + (this.groupItem ? this.groupItem.content_ids.length : 1) > vivistickerUtils.MAX_PAGE_NUM) return vivistickerUtils.showMaxPageNumModal()
      const currPageIndex = pageUtils.currFocusPageIndex
      const attrs = { pageIndex: this.isInEditor ? currPageIndex + 1 : currPageIndex, ...vivistickerUtils.getPageSize(this.igLayout) }
      const moduleKey = `templates/${this.igLayout}`
      const cb = this.groupItem ? async () => {
        await assetUtils.addGroupTemplate(this.groupItem as any, this.item.id, attrs, moduleKey, !this.isInEditor)
        return true
      } : vivistickerUtils.getAssetInitiator(this.item as IAsset, attrs, moduleKey)
      if (this.isInEditor) {
        cb()
      } else {
        vivistickerUtils.startEditing(
          this.igLayout, {
            plan: this.item.plan,
            assetId: this.item.id
          }, cb, vivistickerUtils.getAssetCallback(this.item as IAsset)
        )
      }
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
