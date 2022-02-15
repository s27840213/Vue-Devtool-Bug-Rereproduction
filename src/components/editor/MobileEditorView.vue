<template lang="pug">
  div(class="scrollbar-gray editor-view"
      :class="isBackgroundImageControl ? 'dim-background' : 'bg-gray-5'"
      :style="brushCursorStyles()"
      @mousedown.left="!inBgRemoveMode ? selectStart($event) : null"
      @wheel="handleWheel"
      @scroll="!inBgRemoveMode ? scrollUpdate() : null"
      @mousewheel="handleWheel"
      ref="editorView")
    div(class="editor-view__grid")
      div(class="editor-view__canvas"
          ref="canvas"
          @mousedown.left.self="outerClick($event)")
        template(v-if="!inBgRemoveMode")
          nu-page(v-for="(page,index) in pages"
                  :ref="`page-${index}`"
                  :key="`page-${index}`"
                  :pageIndex="index"
                  :editorView="editorView"
                  :style="{'z-index': `${getPageZIndex(index)}`}"
                  :config="page" :index="index" :isAnyBackgroundImageControl="isBackgroundImageControl"
                  @stepChange="handleStepChange")
          div(v-show="isSelecting" class="selection-area" ref="selectionArea"
            :style="{'z-index': `${pageNum+1}`}")
        bg-remove-area(v-else :editorView="editorView")
      template(v-if="showRuler")
        ruler-hr(:canvasRect="canvasRect"
          :editorView="editorView"
          @mousedown.native.stop="dragStartH($event)")
        ruler-vr(:canvasRect="canvasRect"
          :editorView="editorView"
          @mousedown.native.stop="dragStartV($event)")
        div(class="corner-block")
    div(v-if="!inBgRemoveMode"
        class="editor-view__guidelines-area"
        ref="guidelinesArea")
      div(v-if="isShowGuidelineV" class="guideline guideline--v" ref="guidelineV"
        :style="{'cursor': `url(${require('@/assets/img/svg/ruler-v.svg')}) 16 16, pointer`}"
        @mousedown.stop="lockGuideline ? null: dragStartV($event)"
        @mouseout.stop="closeGuidelineV()"
        @click.right.stop.prevent="openGuidelinePopup($event)")
        div(class="guideline__pos guideline__pos--v" ref="guidelinePosV")
          span {{rulerVPos}}
      div(v-if="isShowGuidelineH" class="guideline guideline--h" ref="guidelineH"
        :style="{'cursor': `url(${require('@/assets/img/svg/ruler-h.svg')}) 16 16, pointer`}"
        @mousedown.stop="lockGuideline ? null : dragStartH($event)"
        @mouseout.stop="closeGuidelineH()"
        @click.right.stop.prevent="openGuidelinePopup($event)")
        div(class="guideline__pos guideline__pos--h" ref="guidelinePosH")
          span {{rulerHPos}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import StepsUtils from '@/utils/stepsUtils'
import ControlUtils from '@/utils/controlUtils'
import pageUtils from '@/utils/pageUtils'
import RulerUtils from '@/utils/rulerUtils'
import { IPage } from '@/interfaces/page'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import RulerHr from '@/components/editor/ruler/RulerHr.vue'
import RulerVr from '@/components/editor/ruler/RulerVr.vue'
import popupUtils from '@/utils/popupUtils'
import imageUtils from '@/utils/imageUtils'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import tiptapUtils from '@/utils/tiptapUtils'
import formatUtils from '@/utils/formatUtils'
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'

export default Vue.extend({
  components: {
    EditorHeader,
    RulerHr,
    RulerVr,
    BgRemoveArea
  },
  data() {
    return {
      isSelecting: false,
      isShowGuidelineV: false,
      isShowGuidelineH: false,
      initialAbsPos: { x: 0, y: 0 },
      initialRelPos: { x: 0, y: 0 },
      currentAbsPos: { x: 0, y: 0 },
      currentRelPos: { x: 0, y: 0 },
      editorView: null as unknown as HTMLElement,
      guidelinesArea: null as unknown as HTMLElement,
      pageIndex: -1,
      backgroundControllingPageIndex: -1,
      pageUtils,
      canvasRect: null as unknown as DOMRect,
      RulerUtils,
      rulerVPos: 0,
      rulerHPos: 0,
      scrollListener: null as unknown,
      from: -1,
      screenWidth: document.documentElement.clientWidth,
      screenHeight: document.documentElement.clientHeight,
      scrollHeight: 0
    }
  },
  mounted() {
    StepsUtils.record()
    this.editorView = this.$refs.editorView as HTMLElement
    this.guidelinesArea = this.$refs.guidelinesArea as HTMLElement
    this.canvasRect = (this.$refs.canvas as HTMLElement).getBoundingClientRect()
    pageUtils.fitPage()
    this.$nextTick(() => {
      pageUtils.findCentralPageIndexInfo()
    })
    this.scrollHeight = this.editorView.scrollHeight
    document.addEventListener('blur', this.detectBlur, true)
    window.onresize = () => {
      this.screenWidth = document.documentElement.clientWidth
      this.screenHeight = document.documentElement.clientHeight
    }
    RulerUtils.on('showGuideline', (pagePos: number, pos: number, type: string, from?: number) => {
      const guidelineAreaRect = (this.guidelinesArea as HTMLElement).getBoundingClientRect()
      if (from !== undefined) {
        this.from = from
      }
      switch (type) {
        case 'v': {
          this.isShowGuidelineV = true
          this.rulerVPos = Math.round(pagePos)
          this.$nextTick(() => {
            const guidelineV = this.$refs.guidelineV as HTMLElement
            guidelineV.style.transform = `translate(${pos - guidelineAreaRect.left}px,0px)`
          })
          break
        }
        case 'h': {
          this.isShowGuidelineH = true
          this.rulerHPos = Math.round(pagePos)
          this.$nextTick(() => {
            const guidelineH = this.$refs.guidelineH as HTMLElement
            guidelineH.style.transform = `translate(0px,${pos - guidelineAreaRect.top}px)`
          })
          break
        }
      }
    })
  },
  watch: {
    pageScaleRatio() {
      const editor = this.$refs.editorView as HTMLElement
      const scrollCenterX = (2 * editor.scrollLeft + editor.clientWidth)
      const scrollCenterY = (2 * editor.scrollTop + editor.clientHeight)
      const oldScrollWidth = editor.scrollWidth
      const oldScrollHeight = editor.scrollHeight
      this.$nextTick(() => {
        editor.scrollLeft = Math.round((scrollCenterX * editor.scrollWidth / oldScrollWidth - editor.clientWidth) / 2)
        editor.scrollTop = Math.round((scrollCenterY * editor.scrollHeight / oldScrollHeight - editor.clientHeight) / 2)
      })
    },
    screenHeight() {
      pageUtils.findCentralPageIndexInfo()
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapGetters({
      groupId: 'getGroupId',
      pages: 'getPages',
      getMiddlemostPageIndex: 'getMiddlemostPageIndex',
      geCurrActivePageIndex: 'getCurrActivePageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      getPageSize: 'getPageSize',
      pageScaleRatio: 'getPageScaleRatio',
      showRuler: 'getShowRuler',
      lockGuideline: 'getLockGuideline',
      isShowPagePreview: 'page/getIsShowPagePreview',
      hasCopiedFormat: 'getHasCopiedFormat',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode'
    }),
    isBackgroundImageControl(): boolean {
      const pages = this.pages as IPage[]
      let res = false
      pages.forEach((page, index) => {
        if (page.backgroundImage.config.imgControl) {
          res = true
          this.backgroundControllingPageIndex = index
        }
      })
      return res
    },
    pageNum(): number {
      return this.pages.length
    },
    isTyping(): boolean {
      return (this.currSelectedInfo.layers as Array<IGroup | IShape | IText | IFrame | IImage>)
        .some(l => l.type === 'text' && l.isTyping)
    },
    currFocusPage(): IPage {
      return this.pageUtils.currFocusPage
    },
    isDragging(): boolean {
      return RulerUtils.isDragging
    },
    pageSize(): { width: number, height: number } {
      return this.getPageSize(0)
    }
  },
  methods: {
    ...mapMutations({
      addLayer: 'ADD_selectedLayer',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setPageScaleRatio: 'SET_pageScaleRatio',
      _setAdminMode: 'user/SET_ADMIN_MODE',
      setInBgRemoveMode: 'SET_inBgRemoveMode'
    }),
    brushCursorStyles() {
      return this.hasCopiedFormat ? { cursor: `url(${require('@/assets/img/svg/brush-paste-resized.svg')}) 2 2, pointer` } : {}
    },
    setAdminMode() {
      this._setAdminMode(!this.adminMode)
    },
    outerClick(e: MouseEvent) {
      if (!this.inBgRemoveMode) {
        GroupUtils.deselect()
        this.setCurrActivePageIndex(-1)
        pageUtils.setBackgroundImageControlDefault()
        pageUtils.findCentralPageIndexInfo()
        if (imageUtils.isImgControl()) {
          ControlUtils.updateLayerProps(this.getMiddlemostPageIndex, this.lastSelectedLayerIndex, { imgControl: false })
        }
      }
    },
    selectStart(e: MouseEvent) {
      if (this.hasCopiedFormat) {
        formatUtils.clearCopiedFormat()
      }
      if (this.isTyping) return
      if (imageUtils.isImgControl()) {
        ControlUtils.updateLayerProps(this.getMiddlemostPageIndex, this.lastSelectedLayerIndex, { imgControl: false })
      }
      this.initialAbsPos = this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.$refs.canvas as HTMLElement)
      document.documentElement.addEventListener('mousemove', this.selecting)
      document.documentElement.addEventListener('scroll', this.scrollUpdate, { capture: true })
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
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.$refs.canvas as HTMLElement)
      this.renderSelectionArea(this.initialRelPos, this.currentRelPos)
    },
    scrollUpdate() {
      if (this.isSelecting || RulerUtils.isDragging) {
        const event = new MouseEvent('mousemove', {
          clientX: this.currentAbsPos.x,
          clientY: this.currentAbsPos.y
        })
        document.documentElement.dispatchEvent(event)
      }

      if (this.isShowGuidelineV && !RulerUtils.isDragging) {
        this.closeGuidelineV()
      }

      if (this.isShowGuidelineH && !RulerUtils.isDragging) {
        this.closeGuidelineH()
      }
      /**
       * The following function sets focus on the page, which will break the functionality of a text editor (e.g. composition).
       * So prevent changing focus when a text editor is focused.
       */
      // pageUtils.findCentralPageIndexInfo(tiptapUtils.editor?.view?.hasFocus?.())
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
        document.documentElement.removeEventListener('scroll', this.scrollUpdate, { capture: true })
        document.documentElement.removeEventListener('mouseup', this.selectEnd)
        if (this.isSelecting) {
          this.isSelecting = false
          const selectionArea = this.$refs.selectionArea as HTMLElement
          this.handleSelectionData(selectionArea.getBoundingClientRect())
        }
      })
    },
    handleSelectionData(selectionData: DOMRect) {
      const layers = [...document.querySelectorAll(`.nu-layer--p${pageUtils.currFocusPageIndex}`)]
      const layerIndexs: number[] = []
      layers.forEach((layer) => {
        const layerData = layer.getBoundingClientRect()
        if (((layerData.top <= selectionData.bottom) && (layerData.left <= selectionData.right) &&
          (layerData.bottom >= selectionData.top) && (layerData.right >= selectionData.left))) {
          layerIndexs.push(parseInt((layer as HTMLElement).dataset.index as string, 10))
        }
      })

      if (layerIndexs.length > 0) {
        // this.addSelectedLayer(layerIndexs as number[])
        GroupUtils.select(pageUtils.currFocusPageIndex, layerIndexs)
      }
    },
    mapSelectionRectToPage(selectionData: DOMRect): { x: number, y: number, width: number, height: number } {
      const targetPageIndex = pageUtils.currFocusPageIndex
      const targetPage: IPage = this.currFocusPage

      const pageRect = document.getElementsByClassName(`nu-page-${targetPageIndex}`)[0].getBoundingClientRect()

      return {
        x: (selectionData.left - pageRect.left) / (pageUtils.scaleRatio / 100),
        y: (selectionData.top - pageRect.top) / (pageUtils.scaleRatio / 100),
        width: (selectionData.right - selectionData.left) / (pageUtils.scaleRatio / 100),
        height: (selectionData.bottom - selectionData.top) / (pageUtils.scaleRatio / 100)
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
        if (this.inBgRemoveMode) {
          return
        }
        this.$nextTick(() => {
          if (document.activeElement?.tagName === 'BODY' && !this.isShowPagePreview) {
            this.geCurrActivePageIndex === -1 ? pageUtils.findCentralPageIndexInfo() : pageUtils.activeCurrActivePage()
          }
        })
      }, 0)
    },
    getPageZIndex(index: number) {
      if (this.isBackgroundImageControl) {
        return this.backgroundControllingPageIndex === index ? 1 : 0
      } else {
        /**
         * @Note if the page was focused, make it bring the highest z-index to prevent from being blocking by other page's layer
         */
        return pageUtils.currFocusPageIndex === index ? this.pageNum + 1 : this.pageNum - index
      }
    },
    dragStartV(e: MouseEvent) {
      RulerUtils.setIsDragging(true)
      this.isShowGuidelineV = true
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.guidelinesArea)
      document.documentElement.addEventListener('mousemove', this.draggingV)
      document.documentElement.addEventListener('scroll', this.scrollUpdate, { capture: true })
      document.documentElement.addEventListener('mouseup', this.dragEndV)
    },
    draggingV(e: MouseEvent) {
      this.rulerVPos = Math.trunc(this.mapGuidelineToPage('v').pos)
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.guidelinesArea)
      this.renderGuidelineV(this.currentRelPos)
    },
    dragEndV(e: MouseEvent) {
      RulerUtils.setIsDragging(false)
      if (this.mapGuidelineToPage('v').outOfPage) {
        this.isShowGuidelineV = false
      } else {
        StepsUtils.record()
      }
      this.$nextTick(() => {
        document.documentElement.removeEventListener('mousemove', this.draggingV)
        document.documentElement.removeEventListener('scroll', this.scrollUpdate)
        document.documentElement.removeEventListener('mouseup', this.dragEndV)
      })
    },
    renderGuidelineV(pos: { x: number, y: number }) {
      const guidelineV = this.$refs.guidelineV as HTMLElement
      guidelineV.style.transform = `translate(${pos.x}px,0px)`
    },
    closeGuidelineV() {
      if (!this.isDragging) {
        this.isShowGuidelineV = false
        if (this.from !== -1) {
          RulerUtils.addGuidelineToPage(this.mapGuidelineToPage('v').pos, 'v', this.from)
        } else {
          RulerUtils.addGuidelineToPage(this.mapGuidelineToPage('v').pos, 'v')
        }
        this.from = -1
      }
    },
    dragStartH(e: MouseEvent) {
      RulerUtils.setIsDragging(true)
      this.isShowGuidelineH = true
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.guidelinesArea)
      document.documentElement.addEventListener('mousemove', this.draggingH)
      document.documentElement.addEventListener('scroll', this.scrollUpdate, { capture: true })
      document.documentElement.addEventListener('mouseup', this.dragEndH)
    },
    draggingH(e: MouseEvent) {
      this.rulerHPos = Math.trunc(this.mapGuidelineToPage('h').pos)
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.guidelinesArea)
      this.renderGuidelineH(this.currentRelPos)
    },
    dragEndH(e: MouseEvent) {
      RulerUtils.setIsDragging(false)
      if (this.mapGuidelineToPage('h').outOfPage) {
        this.isShowGuidelineH = false
      } else {
        StepsUtils.record()
      }
      this.$nextTick(() => {
        document.documentElement.removeEventListener('mousemove', this.draggingH)
        document.documentElement.removeEventListener('scroll', this.scrollUpdate)
        document.documentElement.removeEventListener('mouseup', this.dragEndH)
      })
    },
    renderGuidelineH(pos: { x: number, y: number }) {
      const guidelineH = this.$refs.guidelineH as HTMLElement
      guidelineH.style.transform = `translate(0px,${pos.y}px)`
    },
    mapGuidelineToPage(type: string): { pos: number, outOfPage: boolean } {
      // just has two options: ['v','h']
      const guideline = type === 'v' ? this.$refs.guidelineV as HTMLElement : this.$refs.guidelineH as HTMLElement
      const result = RulerUtils.mapGuidelineToPage(guideline, type, this.from)
      return result
    },
    closeGuidelineH() {
      if (!this.isDragging) {
        this.isShowGuidelineH = false
        if (this.from !== -1) {
          RulerUtils.addGuidelineToPage(this.mapGuidelineToPage('h').pos, 'h', this.from)
        } else {
          RulerUtils.addGuidelineToPage(this.mapGuidelineToPage('h').pos, 'h')
        }
        this.from = -1
      }
    },
    setTranslateOfPos(event: MouseEvent, type: string) {
      const target = (type === 'v' ? this.$refs.guidelinePosV : this.$refs.guidelinePosH) as HTMLElement
      const guideline = type === 'v' ? this.$refs.guidelineV as HTMLElement : this.$refs.guidelineH as HTMLElement
      const pos = MouseUtils.getMouseRelPoint(event, guideline)
      target.style.transform = type === 'v' ? `translate(0px,${pos.y}px)` : `translate(${pos.x}px,0px)`
    },
    openGuidelinePopup(event: MouseEvent) {
      popupUtils.openPopup('guideline', { event })
    },
    handleWheel(e: WheelEvent) {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        const ratio = this.pageScaleRatio * (1 - e.deltaY * 0.005)
        this.setPageScaleRatio(Math.min(Math.max(Math.round(ratio), 10), 500))
      }
    },
    handleStepChange() {
      this.isShowGuidelineV = false
      this.isShowGuidelineH = false
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
  // height: calc(100% - 30px);
  height: 100%;
  // @include no-scrollbar;
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
    flex: 1;
    position: relative;
    flex-direction: column;
    justify-content: center;
    transform-style: preserve-3d;
    transform: scale(1);
    padding: 40px;
  }

  &__guidelines-area {
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
    overflow: hidden;
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

.guideline {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  &--v {
    border-right: 1px solid setColor(blue-1);
    width: 0px;
    height: 100%;
    cursor: url("/assets/icon/ruler/ruler-v.svg");
    &::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 5px;
      height: 100%;
    }
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
    }
  }

  &--h {
    border-top: 1px solid setColor(blue-1);
    width: 100%;
    height: 0px;
    cursor: "/assets/icon/ruler/ruler-v.svg";
    &::before {
      content: "";
      position: absolute;
      top: -5px;
      right: 0;
      width: 100%;
      height: 5px;
    }
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 5px;
    }
  }

  &__pos {
    position: absolute;
    background-color: setColor(blue-1);
    &--h {
      writing-mode: vertical-lr;
      transform: rotate(180deg);
      border-radius: 50px;
      color: setColor(white);
      padding: 0.2rem 0.4rem;
      font-size: 0.325rem;
      top: 5px;
      left: 0;
    }
    &--v {
      top: 0px;
      left: 5px;
      border-radius: 50px;
      color: setColor(white);
      padding: 0.2rem 0.4rem;
      font-size: 0.325rem;
    }
  }
}

.corner-block {
  position: sticky;
  top: 0;
  left: 0;
  grid-area: corner-block;
  width: $REULER_SIZE;
  height: $REULER_SIZE;
  background: #dfe1e7;
}

.dim-background {
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
