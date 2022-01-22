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
import textPropUtils from '@/utils/textPropUtils'
import DragUtils from '@/utils/dragUtils'

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
    dragStart(e: DragEvent) {
      // const dataTransfer = event.dataTransfer as DataTransfer
      // const image = new Image()
      // image.src = (event.target as HTMLImageElement).src
      // dataTransfer.dropEffect = 'move'
      // dataTransfer.effectAllowed = 'move'

      // const rect = (event.target as Element).getBoundingClientRect()
      // const x = ((event.clientX - rect.x) / rect.width * image.width) * (this.scaleRatio / 100)
      // const y = ((event.clientY - rect.y) / rect.height * image.height) * (this.scaleRatio / 100)

      // dataTransfer.setDragImage(image, x, y)
      // console.log(this.item)
      // dataTransfer.setData('data', JSON.stringify(this.item))
      new DragUtils().itemDragStart(e, 'group', {
        ...this.item
      })
    },
    addText() {
      AssetUtils.addAsset(this.item)
        .then(() => {
          textPropUtils.updateTextPropsState()
        })
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
