<template lang="pug">
div(class="category-background-item")
  img(class="category-background-item__image pointer"
    :src="src || fallbackSrc || imageUtils.getSrc({ srcObj: { type: 'background', assetId: item.id, userId: '' }}, 'smal', item.ver)"
    draggable="false"
    v-press="handleShare"
    @click="addBackground"
    @error="handleNotFound")
  pro-item(v-if="item.plan")
  div(class="category-background-item__share" @click.stop.prevent="handleShare")
    svg-icon(iconName="share" iconColor="white" iconWidth="16px")
</template>

<script lang="ts">
import ProItem from '@/components/payment/ProItem.vue'
import { IAsset } from '@/interfaces/module'
import AssetUtils from '@/utils/assetUtils'
import imageUtils from '@/utils/imageUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  components: {
    ProItem
  },
  emits: ['share'],
  props: {
    src: {
      type: String
    },
    item: {
      type: Object as PropType<IAsset>,
      required: true
    },
    locked: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      fallbackSrc: '',
      imageUtils
    }
  },
  computed: {
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    })
  },
  methods: {
    handleNotFound() {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addBackground() {
      if (!vivistickerUtils.checkPro(this.item, 'object')) return
      vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrl(this.item))
      AssetUtils.addAssetToRecentlyUsed(this.item, 'background')
    },
    handleShare() {
      if (!vivistickerUtils.checkPro(this.item, 'object')) return
      this.$emit('share', this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
.category-background-item {
  position: relative;
  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    vertical-align: middle;
    -webkit-touch-callout: none;
    user-select: none;
  }
  &__share {
    position: absolute;
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 4px;
    bottom: 4px;
    border-radius: 5px;
    background: rgba(24, 25, 31, 0.3);
    &:active {
      background: rgba(24, 25, 31, 0.6);
    }
    & > svg {
      opacity: 0.5;
    }
  }
}
</style>
