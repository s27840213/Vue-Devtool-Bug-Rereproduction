<template lang="pug">
  div(class="editor-view"
      :class="isBackgroundImageControl ? 'dim-background' : 'bg-gray-5'"
      :style="brushCursorStyles()"
      @wheel="handleWheel"
      @scroll="!inBgRemoveMode ? scrollUpdate() : null"
      @mousewheel="handleWheel"
      @pinch="pinchHandler"
      ref="editorView")
    div(class="editor-view__canvas"
        ref="canvas"
        @swipeup="swipeUpHandler"
        @swipedown="swipeDownHandler"
        :style="canvasStyle")
      div(v-for="(page,index) in pages"
          :key="`page-${index}`"
          class="editor-view__card"
          :style="cardStyle(index)"
          @pointerdown.self.prevent="outerClick($event)"
          ref="card")
        nu-page(
          :ref="`page-${index}`"
          :pageIndex="index"
          :editorView="editorView"
          :style="{'z-index': `${getPageZIndex(index)}`}"
          :config="page" :index="index" :isAnyBackgroundImageControl="isBackgroundImageControl"
          @stepChange="handleStepChange")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
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
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'
import generalUtils from '@/utils/generalUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import layerUtils from '@/utils/layerUtils'

export default Vue.extend({
  components: {
    EditorHeader,
    RulerHr,
    RulerVr,
    BgRemoveArea
  },
  props: {
    isConfigPanelOpen: Boolean,
    inAllPagesMode: {
      type: Boolean,
      required: true
    },
    currActivePanel: {
      default: 'none',
      type: String
    }
  },
  data() {
    return {
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
      scrollHeight: 0,
      tmpScaleRatio: 0,
      initialDist: 0,
      mounted: false,
      cardSize: 0
    }
  },
  mounted() {
    this.$nextTick(() => {
      /**
       * @Note - make the transitoin being set after the mounted hook, or when switching between all pages mode, you will see a lovely page floating from the top to its normal posiiton
       */
      // const currFocusPageIndex = pageUtils.currFocusPageIndex
      // pageUtils.scrollIntoPage(currFocusPageIndex, 'auto')
      // this.currCardIndex = currFocusPageIndex
      this.mounted = true
    })
    this.getRecently()

    const editorViewAt = new AnyTouch(this.$refs.editorView as HTMLElement, { preventDefault: false })
    const canvasAt = new AnyTouch(this.$refs.canvas as HTMLElement, { preventDefault: false })
    //  销毁
    this.$on('hook:destroyed', () => {
      editorViewAt.destroy()
      canvasAt.destroy()
    })

    StepsUtils.record()
    this.editorView = this.$refs.editorView as HTMLElement
    this.guidelinesArea = this.$refs.guidelinesArea as HTMLElement
    this.canvasRect = (this.$refs.canvas as HTMLElement).getBoundingClientRect()

    this.cardSize = this.editorView ? this.editorView.clientHeight : 0

    pageUtils.fitPage()
    this.tmpScaleRatio = pageUtils.scaleRatio

    if (generalUtils.isTouchDevice()) {
      pageUtils.mobileMinScaleRatio = this.tmpScaleRatio
    }

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
      const card = (this.$refs.card as HTMLElement[])[this.currCardIndex]
      generalUtils.scaleFromCenter(card)
    },
    screenHeight() {
      pageUtils.findCentralPageIndexInfo(true)
    },
    currFocusPageIndex(newVal) {
      this.setCurrCardIndex(newVal)
    }
  },

  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapState({
      mobileAllPageMode: 'mobileAllPageMode'
    }),
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
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      currFocusPageIndex: 'getCurrFocusPageIndex',
      currCardIndex: 'getCurrCardIndex'
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
    },
    canvasStyle(): { [index: string]: string } {
      return {
        paddingBottom: this.currActivePanel !== 'none' ? '40%' : '0px'
      }
    },
    minScaleRatio(): number {
      return pageUtils.mobileMinScaleRatio
    }
  },
  methods: {
    ...mapMutations({
      addLayer: 'ADD_selectedLayer',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setPageScaleRatio: 'SET_pageScaleRatio',
      _setAdminMode: 'user/SET_ADMIN_MODE',
      setInBgRemoveMode: 'SET_inBgRemoveMode',
      setInMultiSelectionMode: 'SET_inMultiSelectionMode',
      addPage: 'ADD_page',
      setCurrCardIndex: 'SET_currCardIndex'
    }),
    ...mapActions('layouts',
      [
        'getCategories',
        'getRecently'
      ]
    ),
    brushCursorStyles() {
      const styles = {}
      if (this.isConfigPanelOpen) Object.assign(styles, { height: 'calc(100% - 200px)' })
      if (this.hasCopiedFormat) Object.assign(styles, { cursor: `url(${require('@/assets/img/svg/brush-paste-resized.svg')}) 2 2, pointer` })
      return styles
    },
    setAdminMode() {
      this._setAdminMode(!this.adminMode)
    },
    outerClick(e: MouseEvent) {
      if (!this.inBgRemoveMode) {
        GroupUtils.deselect()
        this.setCurrActivePageIndex(-1)
        pageUtils.setBackgroundImageControlDefault()
        this.setInMultiSelectionMode(false)
        pageUtils.findCentralPageIndexInfo()
        if (imageUtils.isImgControl()) {
          ControlUtils.updateLayerProps(this.getMiddlemostPageIndex, this.lastSelectedLayerIndex, { imgControl: false })
        }
      }
    },
    scrollUpdate() {
      if (RulerUtils.isDragging) {
        const event = new MouseEvent('mousemove', {
          clientX: this.currentAbsPos.x,
          clientY: this.currentAbsPos.y
        })
        document.documentElement.dispatchEvent(event)
      }
      /**
       * The following function sets focus on the page, which will break the functionality of a text editor (e.g. composition).
       * So prevent changing focus when a text editor is focused.
       */
      pageUtils.findCentralPageIndexInfo(tiptapUtils.editor?.view?.hasFocus?.())
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
    },
    pinchHandler(event: AnyTouchEvent) {
      switch (event.phase) {
        /**
         * @Note the very first event won't fire start phase, it's very strange and need to pay attention
         */
        case 'start': {
          this.tmpScaleRatio = pageUtils.scaleRatio
          break
        }
        case 'move': {
          pageUtils.setScaleRatio(this.tmpScaleRatio * event.scale)
          break
        }

        case 'end': {
          if (pageUtils.scaleRatio < this.minScaleRatio) {
            pageUtils.setScaleRatio(this.minScaleRatio)
          }
          break
        }
      }

      this.$nextTick(() => {
        // here is a workaround to fix the problem of selecting layer after pinching
        if (layerUtils.currSelectedInfo.layers.length > 0) {
          GroupUtils.deselect()
        }
      })
    },
    swipeUpHandler(e: AnyTouchEvent) {
      if (pageUtils.scaleRatio > pageUtils.mobileMinScaleRatio) {
        return
      }
      e.stopImmediatePropagation()
      if (this.pageNum - 1 !== this.currCardIndex) {
        pageUtils.mobileMinScaleRatio = pageUtils.scaleRatio
        this.setCurrCardIndex(this.currCardIndex + 1)
        GroupUtils.deselect()
        this.setCurrActivePageIndex(this.currCardIndex)
        this.$nextTick(() => {
          setTimeout(() => {
            pageUtils.fitPage()
            pageUtils.mobileMinScaleRatio = pageUtils.scaleRatio
          }, 300)
        })
      } else {
        this.addPage(pageUtils.newPage({}))
        pageUtils.fitPage()
        pageUtils.mobileMinScaleRatio = pageUtils.scaleRatio
        StepsUtils.record()
      }
    },
    swipeDownHandler(e: AnyTouchEvent) {
      if (pageUtils.scaleRatio > pageUtils.mobileMinScaleRatio) {
        return
      }
      e.stopImmediatePropagation()
      if (this.currCardIndex !== 0) {
        pageUtils.mobileMinScaleRatio = pageUtils.scaleRatio
        this.setCurrCardIndex(this.currCardIndex - 1)
        GroupUtils.deselect()
        this.setCurrActivePageIndex(this.currCardIndex)
        this.$nextTick(() => {
          setTimeout(() => {
            pageUtils.fitPage()
            pageUtils.mobileMinScaleRatio = pageUtils.scaleRatio
          }, 100)
        })
      }
    },
    cardStyle(index: number): { [index: string]: string | number } {
      return {
        width: '100%',
        height: this.editorView ? `${this.cardSize}px` : '100%',
        transform: this.editorView ? `translate3d(0,${index * this.cardSize - this.currCardIndex * this.cardSize}px,0)` : 'translate3d(0,0px,0)',
        transition: this.mounted ? 'transform 0.3s' : 'none'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
$REULER_SIZE: 20px;

.editor-view {
  overflow: hidden;
  position: relative;
  z-index: setZindex("editor-view");
  @include size(100%, 100%);

  &__canvas {
    position: absolute;
    min-width: 100%;
    min-height: 100%;
    grid-area: canvas;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transform-style: preserve-3d;
    transform: scale(1);
    box-sizing: border-box;
  }

  &__card {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    margin: 0 auto;
    // https://stackoverflow.com/questions/33454533/cant-scroll-to-top-of-flex-item-that-is-overflowing-container

    // justify-content: center;
    overflow: scroll;
    padding: 40px;
    @include no-scrollbar;
  }
}

.dim-background {
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
