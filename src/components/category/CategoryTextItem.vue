<template lang="pug">
  div(class="category-text-item"
      :style="itemStyle"
      @click="addText")
    img(class="category-text-item__img"
      :src="src || fallbackSrc || `https://template.vivipic.com/text/${item.id}/prev?ver=${item.ver}`"
      @error="handleNotFound")
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import { mapGetters } from 'vuex'
import AssetUtils from '@/utils/assetUtils'
import textPropUtils from '@/utils/textPropUtils'
import DragUtils from '@/utils/dragUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  props: {
    src: String,
    item: Object
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
        width: generalUtils.isTouchDevice()
          ? (window.innerWidth - 68) / 3 - 10
          : 135
      }
      return {
        width: `${width}px`
      }
    }
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addText() {
      if (this.isInEditor) {
        AssetUtils.addAsset(this.item).then(() => {
          textPropUtils.updateTextPropsState()
        })
      } else {
        vivistickerUtils.startEditing('text', vivistickerUtils.getAssetInitiator(this.item), vivistickerUtils.getAssetCallback(this.item))
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.category-text-item {
  -webkit-touch-callout: none;
  user-select: none;
  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    vertical-align: middle;
    -webkit-touch-callout: none;
    user-select: none;
    pointer-events: none;
  }
}
</style>
