<template lang="pug">
  img(class="pointer"
    draggable="true"
    :src="src"
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
    objectId: String
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
      const config = {
        type: 'template',
        id: this.objectId
      }
      dataTransfer.setData('data', JSON.stringify(config))
    },
    addTemplate() {
      AssetUtils.addTemplate(this.objectId)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
