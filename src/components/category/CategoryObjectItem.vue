<template lang="pug">
  img(class="pointer"
    draggable="true"
    :src="src"
    @dragstart="dragStart($event)"
    @click="addSvg")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import shapeUtils from '@/utils/shapeUtils'
import layerUtils from '@/utils/layerUtils'
import layerFactary from '@/utils/layerFactary'

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
      pageSize: 'getPageSize',
      getJson: 'getJson'
    })
  },
  mounted () {
    if (!this.getJson(this.objectId)) {
      this.$emit('init', this.objectId)
    }
  },
  methods: {
    dragStart(event: DragEvent) {
      const json = this.getJson(this.objectId)
      const dataTransfer = event.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      const image = new Image()
      image.src = (event.target as HTMLImageElement).src
      dataTransfer.setDragImage(image, -10, -10)
      const resizeRatio = 0.55
      const pageAspectRatio = this.pageSize.width / this.pageSize.height
      const svgAspectRatio = json.vSize[0] / json.vSize[1]
      const svgWidth = svgAspectRatio > pageAspectRatio ? this.pageSize.width * resizeRatio : (this.pageSize.height * resizeRatio) * svgAspectRatio
      const svgHeight = svgAspectRatio > pageAspectRatio ? (this.pageSize.width * resizeRatio) / svgAspectRatio : this.pageSize.height * resizeRatio

      json.ratio = 1
      json.className = shapeUtils.classGenerator()
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      const config = {
        type: 'shape',
        styles: {
          x: ((event.clientX - rect.x) / rect.width * svgWidth) * (this.scaleRatio / 100),
          y: ((event.clientY - rect.y) / rect.height * svgHeight) * (this.scaleRatio / 100),
          width: svgWidth,
          height: svgHeight,
          initWidth: json.vSize[0],
          initHeight: json.vSize[1],
          scale: svgWidth / json.vSize[0],
          color: json.color,
          vSize: json.vSize
        }
      }

      Object.assign(config, json)
      dataTransfer.setData('data', JSON.stringify(config))
    },
    addSvg() {
      const json = this.getJson(this.objectId)
      const resizeRatio = 0.55
      const pageAspectRatio = this.pageSize.width / this.pageSize.height
      const svgAspectRatio = json.vSize[0] / json.vSize[1]
      const svgWidth = svgAspectRatio > pageAspectRatio ? this.pageSize.width * resizeRatio : (this.pageSize.height * resizeRatio) * svgAspectRatio
      const svgHeight = svgAspectRatio > pageAspectRatio ? (this.pageSize.width * resizeRatio) / svgAspectRatio : this.pageSize.height * resizeRatio

      json.ratio = 1
      // svgData.ratio = (svgData.vSize[0] / svgWidth)
      json.className = shapeUtils.classGenerator()
      const config = {
        styles: {
          x: this.pageSize.width / 2 - svgWidth / 2,
          y: this.pageSize.height / 2 - svgHeight / 2,
          width: svgWidth,
          height: svgHeight,
          initWidth: json.vSize[0],
          initHeight: json.vSize[1],
          scale: svgWidth / json.vSize[0],
          color: json.color,
          vSize: json.vSize
        }
      }
      Object.assign(config, json)
      console.log(config)
      layerUtils.addLayers(this.lastSelectedPageIndex, layerFactary.newShape(config))
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
