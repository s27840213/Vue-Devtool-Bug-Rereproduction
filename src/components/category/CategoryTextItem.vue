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

export default Vue.extend({
  props: {
    src: String,
    objectId: String
  },
  components: {},
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
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
      const dataTransfer = event.dataTransfer as DataTransfer
      const image = new Image()
      image.src = (event.target as HTMLImageElement).src
      delete json.styles.x
      delete json.styles.y
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      dataTransfer.setDragImage(image, 0, 0)
      dataTransfer.setData('data', JSON.stringify(json))
    },
    addText() {
      const json = this.getJson(this.objectId)
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
