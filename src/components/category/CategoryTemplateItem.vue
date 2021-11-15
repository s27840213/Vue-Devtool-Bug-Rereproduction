<template lang="pug">
  div(class="category-template-item")
    div(class="relative")
      img(class="category-template-item__img pointer"
        draggable="true"
        :src="src || `https://template.vivipic.com/template/${item.id}/prev?ver=${item.ver}`"
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

export default Vue.extend({
  components: { ImageCarousel },
  props: {
    src: String,
    item: Object,
    showId: Boolean,
    groupItem: Object
  },
  computed: {
    previewImage (): string {
      const { match_cover: cover, ver, id } = this.item
      return `https://template.vivipic.com/template/${cover.id ?? id}/prev?ver=${ver}`
    }
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    dragStart(event: DragEvent) {
      const dataTransfer = event.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      dataTransfer.setDragImage((event.target as HTMLImageElement), 0, 0)
      dataTransfer.setData('data', JSON.stringify(this.item))
    },
    addTemplate() {
      this.groupItem ? AssetUtils.addGroupTemplate(this.groupItem, this.item.id) : AssetUtils.addAsset(this.item)
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
      transform: scale(.5);
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
