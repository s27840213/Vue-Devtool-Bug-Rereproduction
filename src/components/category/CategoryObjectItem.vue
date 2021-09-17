<template lang="pug">
  img(class="pointer"
    draggable="true"
    :src="src"
    @dragstart="dragStart($event)"
    @click="addSvg")
</template>

<script lang="ts">
import Vue from 'vue'
import AssetUtils from '@/utils/assetUtils'

export default Vue.extend({
  props: {
    src: String,
    objectId: String
  },
  methods: {
    dragStart(event: DragEvent) {
      const dataTransfer = event.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      const image = new Image()
      image.src = (event.target as HTMLImageElement).src
      dataTransfer.setDragImage(image, -10, -10)
      const config = {
        type: 'svg',
        id: this.objectId
      }
      dataTransfer.setData('data', JSON.stringify(config))
    },
    addSvg() {
      AssetUtils.addSvg(this.objectId)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
