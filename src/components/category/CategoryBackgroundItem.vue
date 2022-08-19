<template lang="pug">
  div(class="category-background-item")
    img(class="pointer"
      :src="src || fallbackSrc || imageUtils.getSrc({ srcObj: { type: 'background', assetId: item.id, userId: '' }}, 'prev', item.ver)"
      draggable="false"
      @click="addBackground"
      @error="handleNotFound")
    div(class="category-background-item__download" @click.stop.prevent="handleDownload")
      svg-icon(iconName="download_flat" iconColor="white" iconWidth="16px" iconHeight="18px")
</template>

<script lang="ts">
import Vue from 'vue'
import AssetUtils from '@/utils/assetUtils'
import imageUtils from '@/utils/imageUtils'

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
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addBackground() {
      console.log('copy background', this.item)
    },
    handleDownload() {
      console.log('start downloading', this.item)
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
  }
  &__download {
    position: absolute;
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 4px;
    bottom: 4px;
    background: rgba(24, 25, 31, 0.5);
    border-radius: 5px;
  }
}
</style>
