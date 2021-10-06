<template lang="pug">
  img(class="pointer"
    draggable="true"
    :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`"
    @dragstart="dragStart($event)"
    @click="addSvg")
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
    dragStart(event: DragEvent) {
      const dataTransfer = event.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      const image = new Image()
      image.src = (event.target as HTMLImageElement).src
      dataTransfer.setDragImage(image, -10, -10)
      dataTransfer.setData('data', JSON.stringify(this.item))
    },
    addSvg() {
      AssetUtils.addAsset(this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
