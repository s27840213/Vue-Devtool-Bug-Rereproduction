<template lang="pug">
  div(class="category-background-item")
    img(class="pointer"
      :src="src || fallbackSrc || imageUtils.getSrc({ srcObj: { type: 'background', assetId: item.id, userId: '' }}, 'smal', item.ver)"
      draggable="false"
      v-press="handleShare"
      @click="addBackground"
      @error="handleNotFound")
    div(class="category-background-item__share" @click.stop.prevent="handleShare")
      svg-icon(iconName="share" iconColor="white" iconWidth="16px")
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import { mapGetters } from 'vuex'
import AssetUtils from '@/utils/assetUtils'
import imageUtils from '@/utils/imageUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  props: {
    src: String,
    item: Object,
    locked: Boolean
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
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addBackground() {
      vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrl(this.item))
      AssetUtils.addAssetToRecentlyUsed(this.item, 'background')
    },
    handleShare() {
      this.$emit('share', this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
.category-background-item {
  position: relative;
  & > img {
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
