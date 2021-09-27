<template lang="pug">
  div(class="category-template-item")
    img(class="category-template-item__img pointer"
      draggable="true"
      :src="src || `https://template.vivipic.com/template/${item.id}/prev`"
      @error="handleNotFound"
      @dragstart="dragStart($event)"
      @click="addTemplate")
    div(class="category-template-item__id"
      @click="copyId") {{ item.id }}
</template>

<script lang="ts">
import Vue from 'vue'
import AssetUtils from '@/utils/assetUtils'
import GeneralUtils from '@/utils/generalUtils'

export default Vue.extend({
  props: {
    src: String,
    item: Object
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
      AssetUtils.addAsset(this.item)
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
      vertical-align: top;
      margin-bottom: 2px;
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
  }
</style>
