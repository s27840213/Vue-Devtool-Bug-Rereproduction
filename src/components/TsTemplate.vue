<template lang="pug">
  div(class="editor-view"
      :class="isBackgroundImageControl ? 'dim-background' : 'bg-gray-5'"
      @mousedown.left="selectStart($event)" @scroll="scrollUpdate($event)")
    div(class="editor-view__grid")
      div(class="editor-view__canvas"
          ref="container"
          @mousedown.left.self="outerClick($event)")
        nu-page(v-for="(page,index) in filterByBackgroundImageControl(pages)"
                :ref="`page-${nonFilteredIndex(index)}`"
                :key="`page-${nonFilteredIndex(index)}`"
                :pageIndex="nonFilteredIndex(index)"
                :style="{'z-index': `${pageNum-nonFilteredIndex(index)}`}"
                :config="page" :index="nonFilteredIndex(index)")
        div(v-show="isSelecting" class="selection-area" ref="selectionArea"
          :style="{'z-index': `${pageNum+1}`}")
      div(class="scale-bar scale-bar--vr")
      div(class="scale-bar scale-bar--hr")
      div(class="corner-block")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import StepsUtils from '@/utils/stepsUtils'
import ControlUtils from '@/utils/controlUtils'
import PageUtils from '@/utils/pageUtils'
import { IPage } from '@/interfaces/page'

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
      currActivePageIndex: -1,
      backgroundControllingPageIndex: -1,
      PageUtils
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
    }),
    isBackgroundImageControl(): boolean {
      return (this.pages as IPage[]).some(page => page.backgroundImage.config.imgControl)
    },
    pageNum(): number {
      return this.pages.length
    },
    currFocusPage(): IPage {
      return this.PageUtils.currFocusPage
    }
  },
  methods: {
    ...mapMutations({
      addLayer: 'ADD_selectedLayer',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setPageScaleRatio: 'SET_pageScaleRatio'
    }),
    outerClick(e: MouseEvent) {
      GroupUtils.deselect()
      this.setCurrActivePageIndex(-1)
      PageUtils.setBackgroundImageControlDefault()
      PageUtils.activeMostCentralPage()
    },
    selectStart(e: MouseEvent) {
      if (this.lastSelectedLayerIndex >= 0 && this.currSelectedInfo.layers.length === 1 && this.currSelectedInfo.types.has('image')) {
        ControlUtils.updateLayerProps(this.getLastSelectedPageIndex, this.lastSelectedLayerIndex, { imgControl: false })
      }
      this.initialAbsPos = this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.editorView)
      document.documentElement.addEventListener('mousemove', this.selecting)
      document.getElementsByClassName('editor-view')[0].addEventListener('scroll', this.scrollUpdate)
      document.documentElement.addEventListener('mouseup', this.selectEnd)
    },
    selecting(e: MouseEvent) {
      if (!this.isSelecting) {
        if (this.currSelectedInfo.layers.length === 1 && this.currSelectedInfo.layers[0].locked) {
          GroupUtils.deselect()
        }
        this.isSelecting = true
        this.renderSelectionArea({ x: 0, y: 0 }, { x: 0, y: 0 })
        return
      }
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
      console.log('update')
      if (this.geCurrActivePageIndex === -1) {
        PageUtils.activeMostCentralPage()
      }
      // console.log(document.activeElement?.tagName, document.activeElement?.tagName === 'BODY')
    },
    selectEnd() {
      if (this.isSelecting) {
        GroupUtils.deselect()
      }
      /**
       * Use nextTick to trigger the following function after DOM updating
       */
      this.$nextTick(() => {
        document.documentElement.removeEventListener('mousemove', this.selecting)
        document.getElementsByClassName('editor-view')[0].removeEventListener('scroll', this.scrollUpdate)
        document.documentElement.removeEventListener('mouseup', this.selectEnd)
        if (this.isSelecting) {
          this.isSelecting = false
          const selectionArea = this.$refs.selectionArea as HTMLElement
          this.handleSelectionData(selectionArea.getBoundingClientRect())
        }
      })
    },
    handleSelectionData(selectionData: DOMRect) {
      const layers = [...document.querySelectorAll(`.nu-layer--p${this.getLastSelectedPageIndex}`)]
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
        GroupUtils.select(this.getLastSelectedPageIndex, layerIndexs)
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
    },
    filterByBackgroundImageControl(pages: IPage[]): IPage[] {
      if (this.isBackgroundImageControl) {
        let res: IPage | undefined
        pages.forEach((page, index) => {
          if (page.backgroundImage.config.imgControl) {
            res = page
            this.backgroundControllingPageIndex = index
          }
        })
        if (res) {
          return [res]
        } else {
          return []
        }
      } else {
        return pages
      }
    },
    nonFilteredIndex(index: number): number {
      return this.isBackgroundImageControl ? this.backgroundControllingPageIndex : index
    }
  }
})
</script>

<style lang="scss" scoped>
$REULER_SIZE: 20px;

.editor-view {
  overflow: scroll;
  position: relative;
  z-index: setZindex("editor-view");
  &__grid {
    position: absolute;
    min-width: 100%;
    min-height: 100%;
    display: grid;
    grid-template-rows: $REULER_SIZE 1fr;
    grid-template-columns: $REULER_SIZE 1fr;
    grid-template-areas:
      "corner-block hr-rulers"
      "vr-rulers canvas";
  }
  &__canvas {
    grid-area: canvas;
    display: flex;
    width: 100%;
    position: relative;
    flex-direction: column;
    justify-content: center;
    transform-style: preserve-3d;
  }
}

.editor-background {
  display: flex;
  position: fixed;
  min-width: 100%;
  min-height: 100%;
  background: rgba(53, 71, 90, 0.2);
  pointer-events: none;
}

.selection-area {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid #03a9f4;
  background-color: rgba(3, 169, 244, 0.08);
}

.scale-bar {
  display: flex;
  position: sticky;

  &--vr {
    grid-area: vr-rulers;
    top: 0px;
    left: 0;
    background-color: setColor(gray-3);
    overflow: hidden;
  }

  &--hr {
    grid-area: hr-rulers;
    top: 0px;
    left: 0px;
    background-color: setColor(gray-3);
    overflow: hidden;
  }
}

.corner-block {
  position: sticky;
  top: 0;
  left: 0;
  grid-area: corner-block;
  width: $REULER_SIZE;
  height: $REULER_SIZE;
  background: red;
}

.dim-background {
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
