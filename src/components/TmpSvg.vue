
<template lang="pug">
div(class="temp__content")
  div(class="temp__item pointer" v-for="svg in contents",
      ref="body"
      draggable="true",
      @dragstart="dragStart($event, svg)"
      @click="addSvg(svg)")
</template>

<script lang="ts">
/**
 * This components is temporarily used for text section, and it will be remove in the future
 */
import { defineComponent } from 'vue'
import layerFactary from '@/utils/layerFactary'
import layerUtils from '@/utils/layerUtils'
import shapeUtils from '@/utils/shapeUtils'
import { mapGetters } from 'vuex'
import { ISvg } from '@/interfaces/shape'
import pageUtils from '@/utils/pageUtils'

export default defineComponent({
  data() {
    return {
      styleTextContent: [] as string[],
      transTextContent: [] as string[]
    }
  },
  async mounted() {
    const body = this.$refs.body as [HTMLElement]
    for (let i = 0; i < this.contents.length; i++) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', `0 0 ${this.contents[i].vSize[0]} ${this.contents[i].vSize[1]}`)

      const className = shapeUtils.classGenerator()
      const styleText = shapeUtils.styleFormatter(className, this.contents[i].styleArray, this.contents[i].color, this.contents[i].size ?? [], this.contents[i].point)
      this.updateStyleNode(styleText)

      if (this.contents[i].category === 'C') {
        const transText = shapeUtils.transFormatter(className, this.contents[i].transArray ?? [], {
          cSize: this.contents[i].cSize,
          pSize: this.contents[i].pSize,
          pDiff: [0, 0],
          pOfst: 10
        })
        this.updateTransNode(transText)
      } else if (this.contents[i].category === 'D') {
        const transText = shapeUtils.markerTransFormatter(className, this.contents[i].markerTransArray ?? [], this.contents[i].size ?? [], this.contents[i].point ?? [], this.contents[i].markerWidth ?? [4, 4])
        this.updateTransNode(transText)
      }
      svg.innerHTML = shapeUtils.svgFormatter(this.contents[i].svg, className, this.styleTextContent, this.transTextContent, this.contents[i].point)
      body[i].appendChild(svg)
    }
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getPageSize: 'getPageSize'
    }),
    contents(): ISvg[] {
      // return (tmpJSON as ISvg[]).concat(tmpJSON2).concat(tmpJSON3).concat(tmpJSON4).concat(tmpJSON5).concat(tmpJSON6)
      return []
    },
    pageSize(): { width: number, height: number } {
      return this.getPageSize(pageUtils.currFocusPageIndex)
    }
  },
  methods: {
    styles(svg: any) {
      return {
        fill: svg.color
      }
    },
    dragStart(e: DragEvent, svgData: any) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const resizeRatio = 0.55
      const pageAspectRatio = this.pageSize.width / this.pageSize.height
      const svgAspectRatio = svgData.vSize[0] / svgData.vSize[1]
      const svgWidth = svgAspectRatio > pageAspectRatio ? this.pageSize.width * resizeRatio : (this.pageSize.height * resizeRatio) * svgAspectRatio
      const svgHeight = svgAspectRatio > pageAspectRatio ? (this.pageSize.width * resizeRatio) / svgAspectRatio : this.pageSize.height * resizeRatio

      svgData.ratio = 1
      svgData.className = shapeUtils.classGenerator()
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const config = {
        type: 'shape',
        styles: {
          x: ((e.clientX - rect.x) / rect.width * svgWidth) * (this.scaleRatio / 100),
          y: ((e.clientY - rect.y) / rect.height * svgHeight) * (this.scaleRatio / 100),
          width: svgWidth,
          height: svgHeight,
          initWidth: svgData.vSize[0],
          initHeight: svgData.vSize[1],
          scale: svgWidth / svgData.vSize[0],
          color: svgData.color,
          vSize: svgData.vSize
        }
      }

      Object.assign(config, svgData)
      dataTransfer.setData('data', JSON.stringify(config))
    },
    addSvg(svgData: any) {
      const resizeRatio = 0.55
      const pageAspectRatio = this.pageSize.width / this.pageSize.height
      const svgAspectRatio = svgData.vSize[0] / svgData.vSize[1]
      const svgWidth = svgAspectRatio > pageAspectRatio ? this.pageSize.width * resizeRatio : (this.pageSize.height * resizeRatio) * svgAspectRatio
      const svgHeight = svgAspectRatio > pageAspectRatio ? (this.pageSize.width * resizeRatio) / svgAspectRatio : this.pageSize.height * resizeRatio

      svgData.ratio = 1
      // svgData.ratio = (svgData.vSize[0] / svgWidth)
      svgData.className = shapeUtils.classGenerator()
      const config = {
        styles: {
          x: this.pageSize.width / 2 - svgWidth / 2,
          y: this.pageSize.height / 2 - svgHeight / 2,
          width: svgWidth,
          height: svgHeight,
          initWidth: svgData.vSize[0],
          initHeight: svgData.vSize[1],
          scale: svgWidth / svgData.vSize[0],
          color: svgData.color,
          vSize: svgData.vSize
        }
      }
      Object.assign(config, svgData)
      layerUtils.addLayers(pageUtils.currFocusPageIndex, [layerFactary.newShape(config)])
    },
    updateStyleNode(styleTextContent: string[]) {
      this.styleTextContent = styleTextContent
    },
    updateTransNode(transTextContent: string[]) {
      this.transTextContent = transTextContent
    }
  }
})
</script>

<style lang="scss" scoped>
.temp {
  &__content {
    height: auto;
    display: grid;
    grid-auto-rows: auto;
    // grid-template-columns: repeat(2, 1fr);
    grid-template-columns: repeat(6, 1fr);
    row-gap: 20px;
    column-gap: 10px;
    padding-top: 20px;
    box-sizing: border-box;
    overflow-y: scroll;
    width: auto;
    @include no-scrollbar;
  }
  &__item {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__svg {
    // width: auto;
    margin: auto;
  }
}
</style>
