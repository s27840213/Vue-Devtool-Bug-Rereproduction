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
import TextUtils from '@/utils/textUtils'
import { IText } from '@/interfaces/layer'

export default Vue.extend({
  props: {
    src: String,
    objectId: String
  },
  components: {},
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      scaleRatio: 'getPageScaleRatio',
      getJson: 'getJson'
    })
  },
  mounted () {
    if (!this.getJson(this.objectId)) {
      this.$emit('init', this.objectId)
    }
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    dragStart(event: DragEvent) {
      const json = this.getJson(this.objectId)
      Object.assign(json.styles, { x: undefined, y: undefined })
      Object.assign(json, { editing: false })
      const dataTransfer = event.dataTransfer as DataTransfer
      const image = new Image()
      image.src = (event.target as HTMLImageElement).src
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (event.target as Element).getBoundingClientRect()
      const x = ((event.clientX - rect.x) / rect.width * image.width) * (this.scaleRatio / 100)
      const y = ((event.clientY - rect.y) / rect.height * image.height) * (this.scaleRatio / 100)

      dataTransfer.setDragImage(image, x, y)
      dataTransfer.setData('data', JSON.stringify(json))
    },
    addText() {
      const json = this.getJson(this.objectId) as IText
      Object.assign(json.styles, { x: undefined, y: undefined })
      Object.assign(json, { editing: false })
      switch (json.type) {
        case 'text':
          return TextUtils.addText(json)
        case 'group':
          return TextUtils.addGroup(json)
        default:
          return null
      }
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
