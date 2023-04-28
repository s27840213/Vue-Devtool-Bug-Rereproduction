<template lang="pug">
div(class="panel-text__item"
    :style="itemStyle"
    @click="addText")
  img(class="panel-text__img"
    :src="src || fallbackSrc || `https://template.vivipic.com/text/${item.id}/prev?ver=${item.ver}`"
    @error="handleNotFound")
  pro-item(v-if="item.plan" draggable="false")
</template>

<script lang="ts">
import ProItem from '@/components/payment/ProItem.vue'
import AssetUtils from '@/utils/assetUtils'
import textPropUtils from '@/utils/textPropUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

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
      type: Object as PropType<any>,
      required: true
    },
    itemWidth: {
      type: Number,
      default: NaN
    }
  },
  data() {
    return {
      fallbackSrc: ''
    }
  },
  computed: {
    ...mapGetters({
      isInEditor: 'vivisticker/getIsInEditor'
    }),
    itemStyle(): any {
      const { width } = this.item.preview || {
        width: !isNaN(this.itemWidth) ? this.itemWidth
          : this.$isTouchDevice() ? (window.outerWidth - 68) / 3 - 10
            : 135
      }
      return {
        width: `${width}px`
      }
    },
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addText() {
      // if (!vivistickerUtils.checkPro(this.item, 'text')) return
      if (this.isInEditor) {
        AssetUtils.addAsset(this.item).then(() => {
          textPropUtils.updateTextPropsState()
        })
      } else {
        vivistickerUtils.startEditing('text', {
          plan: this.item.plan,
          assetId: this.item.id
        }, vivistickerUtils.getAssetInitiator(this.item), vivistickerUtils.getAssetCallback(this.item))
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-text {
  &__item {
    position: relative;
    cursor: pointer;
    -webkit-touch-callout: none;
    user-select: none;
  }
  &__img {
    // width: 80px;
    // height: 80px;
    width: 100%;
    height: 100%;
    // margin: 0 5px;
    object-fit: contain;
    vertical-align: middle;
    -webkit-touch-callout: none;
    user-select: none;
    pointer-events: none;
  }
}
</style>
