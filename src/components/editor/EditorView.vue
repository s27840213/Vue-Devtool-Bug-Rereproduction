<template lang="pug">
  div(class="editor-view bg-gray-5"  @mousedown.left="selectStart($event)" @scroll="scrollUpdate($event)")
    nu-page(v-for="(page,index) in pages"
      :key="`page-${index}`"
      :pageIndex="index"
      :config="page" :index="index"
      :isSelecting="isSelecting"
      @mousedown.native.left="setCurrPage(index)")
    div(v-show="isSelecting" class="selection-area" ref="selectionArea")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'

export default Vue.extend({
  data() {
    return {
      isSelecting: false,
      initialAbsPos: { x: 0, y: 0 },
      initialRelPos: { x: 0, y: 0 },
      currentAbsPos: { x: 0, y: 0 },
      currentRelPos: { x: 0, y: 0 },
      editorView: null as unknown as HTMLElement,
      pageIndex: -1
    }
  },
  mounted() {
    this.editorView = document.querySelector('.editor-view') as HTMLElement
  },
  computed: {
    ...mapGetters({
      pages: 'getPages'
    })
  },
  methods: {
    ...mapMutations({
      addLayer: 'ADD_selectedLayer',
      clearSelectedInfo: 'CLEAR_currSelectedInfo'
    }),
    selectStart(e: MouseEvent) {
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
    },
    selectEnd() {
      this.isSelecting = false
      this.clearSelectedInfo()
      document.documentElement.removeEventListener('mousemove', this.selecting)
      document.documentElement.removeEventListener('scroll', this.scrollUpdate)
      document.documentElement.removeEventListener('mouseup', this.selectEnd)
      const selectionArea = this.$refs.selectionArea as HTMLElement
      this.handleSelectionData(selectionArea.getBoundingClientRect())
    },
    handleSelectionData(selectionData: any) {
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
        this.addSelectedLayer(layerIndexs as number[])
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
        layerIndexs: [...layerIndexs],
        pageIndex: this.pageIndex
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.editor-view {
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: setZindex("editor-view");
  overflow: scroll;
}
.selection-area {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid #03a9f4;
  background-color: rgba(3, 169, 244, 0.08);
}
</style>
