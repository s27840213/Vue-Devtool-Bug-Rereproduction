<template lang="pug">
  div(class="editor-view bg-gray-5"
      @mousedown.left="selectStart($event)" @scroll="scrollUpdate($event)")
    div(class="editor-canvas")
      div(class="page-container"
          ref="container"
          @click.left.self="outerClick($event)")
        nu-page(v-for="(page,index) in pages"
          :ref="`page-${index}`"
          :key="`page-${index}`"
          :pageIndex="index"
          :config="page" :index="index"
          :isSelecting="isSelecting"
          @mousedown.native.left="setCurrPage(index)")
        div(v-show="isSelecting" class="selection-area" ref="selectionArea")
    //- template(v-if="(typeof getLastLayer) !== 'undefined' && isImgControl")
    //-   div(class="editor-background")
      //- nu-layer(:data-index="`${getLastSelectedLayerIndex}`"
      //-         :data-pindex="`${getLastSelectedPageIndex}`"
      //-         :layerIndex="getLastSelectedLayerIndex"
      //-         :pageIndex="getLastSelectedPageIndex"
      //-         :config="getLastLayer")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import StepsUtils from '@/utils/stepsUtils'
import ControlUtils from '@/utils/controlUtils'
import PageUtils from '@/utils/pageUtils'

export default Vue.extend({
  data() {
    return {
      isSelecting: false,
      initialAbsPos: { x: 0, y: 0 },
      initialRelPos: { x: 0, y: 0 },
      currentAbsPos: { x: 0, y: 0 },
      currentRelPos: { x: 0, y: 0 },
      editorView: null as unknown as HTMLElement,
      pageIndex: -1,
      currActivePageIndex: -1
    }
  },
  mounted() {
    StepsUtils.record()
    this.editorView = document.querySelector('.editor-view') as HTMLElement
    const editorViewBox = this.$el as HTMLElement
    const resizeRatio = Math.min(editorViewBox.clientWidth / this.pageSize.width, editorViewBox.clientHeight / this.pageSize.height) * 0.8
    this.setPageScaleRatio(Math.round(this.pageScaleRatio * resizeRatio))
    this.$nextTick(() => {
      this.currActivePageIndex = PageUtils.activeMostCentralPage()
    })
    document.addEventListener('blur', this.detectBlur, true)
  },
  computed: {
    ...mapGetters({
      pages: 'getPages',
      getLastSelectedPageIndex: 'getLastSelectedPageIndex',
      geCurrActivePageIndex: 'getCurrActivePageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      pageSize: 'getPageSize',
      pageScaleRatio: 'getPageScaleRatio'
    })
    // getLastLayer(): ILayer {
    //   const page = this.$refs[`page-${this.getLastSelectedPageIndex}`] as [Vue]
    //   let layer = this.getLayer(this.getLastSelectedPageIndex, this.getLastSelectedLayerIndex)
    //   if (layer) {
    //     layer = JSON.parse(JSON.stringify(this.getLayer(this.getLastSelectedPageIndex, this.getLastSelectedLayerIndex)))
    //   }
    //   let pagePos = { x: 0, y: 0 }
    //   if (page) {
    //     const container = this.$refs.container as HTMLElement
    //     pagePos = {
    //       x: page[0].$el.getBoundingClientRect().x,
    //       y: page[0].$el.getBoundingClientRect().y
    //     }
    //     console.log(window.scrollY)
    //     console.log(container.scrollTop)
    //     // layer.styles.x += (pagePos.x - container.getBoundingClientRect().x)
    //     // layer.styles.y += (pagePos.y - container.getBoundingClientRect().y)
    //   }
    //   return layer
    // },
    // isImgControl(): boolean {
    //   console.log(this.getLastLayer.imgControl as boolean)
    //   return this.getLastLayer.imgControl as boolean
    // }
  },
  methods: {
    ...mapMutations({
      addLayer: 'ADD_selectedLayer',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setPageScaleRatio: 'SET_pageScaleRatio'
    }),
    outerClick(e: MouseEvent) {
      this.setCurrActivePageIndex(-1)
      PageUtils.activeMostCentralPage()
    },
    selectStart(e: MouseEvent) {
      if (this.lastSelectedLayerIndex >= 0 && this.currSelectedInfo.layers.length === 1 && this.currSelectedInfo.types.has('image')) {
        ControlUtils.updateImgControl(this.pageIndex, this.lastSelectedLayerIndex, false)
      }
      this.initialAbsPos = this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.editorView)
      this.renderSelectionArea({ x: 0, y: 0 }, { x: 0, y: 0 })
      document.documentElement.addEventListener('mousemove', this.selecting)
      document.documentElement.addEventListener('scroll', this.scrollUpdate)
      document.documentElement.addEventListener('mouseup', this.selectEnd)
      this.isSelecting = true
    },
    selecting(e: MouseEvent) {
      this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.editorView)
      this.renderSelectionArea(this.initialRelPos, this.currentRelPos)
    },
    scrollUpdate() {
      const event = new MouseEvent('mousemove', {
        clientX: this.currentAbsPos.x,
        clientY: this.currentAbsPos.y
      })
      document.documentElement.dispatchEvent(event)

      if (this.geCurrActivePageIndex === -1) {
        PageUtils.activeMostCentralPage()
      }
      // console.log(document.activeElement?.tagName, document.activeElement?.tagName === 'BODY')
    },
    selectEnd() {
      GroupUtils.deselect()
      this.setLastSelectedPageIndex(this.pageIndex)
      /**
       * Use nextTick to trigger the following function after DOM updatingP
       */
      this.$nextTick(() => {
        this.isSelecting = false
        document.documentElement.removeEventListener('mousemove', this.selecting)
        document.documentElement.removeEventListener('scroll', this.scrollUpdate)
        document.documentElement.removeEventListener('mouseup', this.selectEnd)
        const selectionArea = this.$refs.selectionArea as HTMLElement
        this.handleSelectionData(selectionArea.getBoundingClientRect())
      })
    },
    handleSelectionData(selectionData: DOMRect) {
      const layers = [...document.querySelectorAll(`.nu-layer--p${this.pageIndex}`)]
      const layerIndexs: number[] = []
      layers.forEach((layer) => {
        const layerData = layer.getBoundingClientRect()
        if (((layerData.top <= selectionData.bottom) && (layerData.left <= selectionData.right) &&
          (layerData.bottom >= selectionData.top) && (layerData.right >= selectionData.left))) {
          layerIndexs.push(parseInt((layer as HTMLElement).dataset.index as string, 10))
        }
      })
      if (layerIndexs.length > 0) {
        console.log(`Overlap num: ${layerIndexs.length}`)
        // this.addSelectedLayer(layerIndexs as number[])
        GroupUtils.select(this.pageIndex, layerIndexs)
      }
    },
    renderSelectionArea(initPoint: { x: number, y: number }, endPoint: { x: number, y: number }) {
      const minX = Math.min(initPoint.x, endPoint.x)
      const maxX = Math.max(initPoint.x, endPoint.x)
      const minY = Math.min(initPoint.y, endPoint.y)
      const maxY = Math.max(initPoint.y, endPoint.y)
      const selectionArea = this.$refs.selectionArea as HTMLElement
      selectionArea.style.transform = `translate(${Math.round(minX)}px,${Math.round(minY)}px)`
      selectionArea.style.width = `${Math.round((maxX - minX))}px`
      selectionArea.style.height = `${Math.round((maxY - minY))}px`
    },
    setCurrPage(index: number) {
      this.pageIndex = index
    },
    addSelectedLayer(layerIndexs: Array<number>) {
      this.addLayer({
        pageIndex: this.pageIndex,
        layerIndexs: [...layerIndexs]
      })
    },
    detectBlur(event: Event) {
      // The reason why I used setTimeout event here is to make the callback function being executed after the activeElement has been changed
      // or we just put the function in this callback function, the activeElement will always get 'BODY'
      setTimeout(() => {
        this.$nextTick(() => {
          if (document.activeElement?.tagName === 'BODY') {
            this.geCurrActivePageIndex === -1 ? PageUtils.activeMostCentralPage() : PageUtils.activeCurrActivePage()
          }
        })
      }, 0)
    }
  }
})
</script>

<style lang="scss" scoped>
.editor-view {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: scroll;
  position: relative;
  z-index: setZindex("editor-view");
}
.editor-canvas {
  display: flex;
  position: absolute;
  min-width: 100%;
  min-height: 100%;
}

.editor-background {
  display: flex;
  position: fixed;
  min-width: 100%;
  min-height: 100%;
  background: rgba(53, 71, 90, 0.2);
  pointer-events: none;
}

.page-container {
  display: flex;
  width: 100%;
  position: relative;
  padding: 20px;
  flex-direction: column;
  justify-content: center;
}

.selection-area {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid #03a9f4;
  background-color: rgba(3, 169, 244, 0.08);
}
</style>
