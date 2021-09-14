<template lang="pug">
  img(class="pointer"
    :src="src"
    draggable="true"
    style="object-fit: contain;"
    @dragstart="dragStart($event)"
    @click="addText"
    @error="handleNotFound")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import AssetUtils from '@/utils/assetUtils'

export default Vue.extend({
  props: {
    src: String,
    objectId: String
  },
  components: {},
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    })
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    dragStart(event: DragEvent) {
      const dataTransfer = event.dataTransfer as DataTransfer
      const image = new Image()
      image.src = (event.target as HTMLImageElement).src
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (event.target as Element).getBoundingClientRect()
      const x = ((event.clientX - rect.x) / rect.width * image.width) * (this.scaleRatio / 100)
      const y = ((event.clientY - rect.y) / rect.height * image.height) * (this.scaleRatio / 100)

      dataTransfer.setDragImage(image, x, y)
      const config = {
        type: 'text',
        id: this.objectId
      }
      dataTransfer.setData('data', JSON.stringify(config))
    },
    addText() {
      AssetUtils.addText(this.objectId)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
