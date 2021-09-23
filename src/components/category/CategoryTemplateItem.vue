<template lang="pug">
  img(class="pointer"
    draggable="true"
    :src="src || `https://template.vivipic.com/template/${item.id}/prev`"
    @error="handleNotFound"
    @dragstart="dragStart($event)"
    @click="addTemplate")
</template>

<script lang="ts">
import Vue from 'vue'
import AssetUtils from '@/utils/assetUtils'

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
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
