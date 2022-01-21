<template lang="pug">
  img(class="pointer"
    draggable="true"
    :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`"
    @dragstart="dragStart($event)"
    @click="addSvg")
</template>

<script lang="ts">
import Vue from 'vue'
import generalUtils from '@/utils/generalUtils'
import dragUtils from '@/utils/dragUtils'
import assetUtils, { RESIZE_RATIO_SVG } from '@/utils/assetUtils'

export default Vue.extend({
  props: {
    src: String,
    item: Object
  },
  methods: {
    dragStart(e: DragEvent) {
      // const dataTransfer = event.dataTransfer as DataTransfer
      // dataTransfer.dropEffect = 'move'
      // dataTransfer.effectAllowed = 'move'
      // const image = new Image()
      // image.src = (e.target as HTMLImageElement).src
      // dataTransfer.setDragImage(image, -50, -50)
      // dataTransfer.setData('data', JSON.stringify(this.item))

      // const { pageIndex, styles = {} } = attrs
      // const targePageIndex = pageIndex || this.middlemostPageIndex
      // const { vSize = [] } = json
      // const currentPage = this.getPage(targePageIndex)
      // const resizeRatio = RESIZE_RATIO_SVG
      // const pageAspectRatio = currentPage.width / currentPage.height
      // const svgAspectRatio = vSize ? ((vSize as number[])[0] / (vSize as number[])[1]) : 1
      // const svgWidth = svgAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * svgAspectRatio
      // const svgHeight = svgAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / svgAspectRatio : currentPage.height * resizeRatio
      // json.ratio = 1
      // json.className = ShapeUtils.classGenerator()

      // const config = {
      //   ...json,
      //   styles: {
      //     x: currentPage.width / 2 - svgWidth / 2,
      //     y: currentPage.height / 2 - svgHeight / 2,
      //     width: svgWidth,
      //     height: svgHeight,
      //     initWidth: (vSize as number[])[0],
      //     initHeight: (vSize as number[])[1],
      //     scale: svgWidth / (vSize as number[])[0],
      //     color: json.color,
      //     vSize,
      //     ...styles
      //   }
      // }

      console.log(generalUtils.deepCopy(this.item))
      const type = assetUtils.getLayerType(this.item.type)?.includes('shape') ? 'shape' : assetUtils.getLayerType(this.item.type)
      // const category = assetUtils.getLayerType(this.item.type)?.substr('shape'.length)
      dragUtils.itemDragStart(e, type || '', {
        ...this.item
      }, {
        resizeRatio: RESIZE_RATIO_SVG
      })
    },
    addSvg() {
      assetUtils.addAsset(this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
