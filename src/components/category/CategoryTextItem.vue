<template lang="pug">
  img(class="pointer"
    :src="src || fallbackSrc || `https://template.vivipic.com/text/${item.id}/prev?ver=${item.ver}`"
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
    item: Object
  },
  data () {
    return {
      fallbackSrc: ''
    }
  },
  components: {},
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    })
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
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
      dataTransfer.setData('data', JSON.stringify(this.item))
    },
    addText() {
      AssetUtils.addAsset(this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
