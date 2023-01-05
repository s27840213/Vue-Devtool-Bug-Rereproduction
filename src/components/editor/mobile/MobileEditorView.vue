<template lang="pug">
  div(class="editor-view" v-touch
      :class="isBackgroundImageControl ? 'dim-background' : 'bg-gray-5'"
      :style="editorViewStyle"
      @wheel="handleWheel"
      @scroll="!inBgRemoveMode ? scrollUpdate() : null"
      @pointerdown="selectStart"
      @mousewheel="handleWheel"
      @pinch="pinchHandler"
      ref="editorView")
    div(class="editor-view__abs-container"
        :style="absContainerStyle")
      div(class="editor-view__canvas"
          ref="canvas"
          @swipeup="swipeUpHandler"
          @swipedown="swipeDownHandler"
          :style="canvasStyle")
        div(v-for="(page,index) in pagesState"
            :key="`page-${index}`"
            class="editor-view__card"
            :style="cardStyle"
            @pointerdown.self.prevent="outerClick($event)"
            ref="card")
          nu-page(
            :ref="`page-${index}`"
            :pageIndex="index"
            :overflowContainer="editorView"
            :style="pageStyle(index)"
            :pageState="page"
            :index="index"
            :inScaling="isScaling"
            :isAnyBackgroundImageControl="isBackgroundImageControl")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import GroupUtils from '@/utils/groupUtils'
import StepsUtils from '@/utils/stepsUtils'
import ControlUtils from '@/utils/controlUtils'
import pageUtils from '@/utils/pageUtils'
import { IPage, IPageState } from '@/interfaces/page'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import imageUtils from '@/utils/imageUtils'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import tiptapUtils from '@/utils/tiptapUtils'
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'
import generalUtils from '@/utils/generalUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import layerUtils from '@/utils/layerUtils'
import editorUtils from '@/utils/editorUtils'
import backgroundUtils from '@/utils/backgroundUtils'
import modalUtils from '@/utils/modalUtils'
import uploadUtils from '@/utils/uploadUtils'
import { MovingUtils } from '@/utils/movingUtils'

export default Vue.extend({
  components: {
    EditorHeader,
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
    },
    /**
     * @param showMobilePanel - this param is a little different to showMobilePanel in vuex
     *    it's the state after the panel transition;i.e, if showMobilePanel is from true to false, the panel won't disapper immediately bcz transition
     *    this showMobilePanel props is the state after transition
     */
    showMobilePanel: {
      default: false,
      type: Boolean
    }
  },
  data() {
    return {
      initialAbsPos: { x: 0, y: 0 },
      initialRelPos: { x: 0, y: 0 },
      currentAbsPos: { x: 0, y: 0 },
      currentRelPos: { x: 0, y: 0 },
      editorView: null as unknown as HTMLElement,
      editorCanvas: null as unknown as HTMLElement,
      pageIndex: -1,
      backgroundControllingPageIndex: -1,
      pageUtils,
      from: -1,
      scrollHeight: 0,
      tmpScaleRatio: 0,
      mounted: false,
      cardHeight: 0,
      cardWidth: 0,
      editorViewResizeObserver: null as unknown as ResizeObserver,
      isSwiping: false,
      isScaling: false,
      uploadUtils: uploadUtils
    }
  },
  created() {
    // check and auto resize pages oversized on design loaded
    const unwatchPages = this.$watch('isGettingDesign', (newVal) => {
      if (!newVal) {
        if (this.pages.length > 0 && pageUtils.fixPageSize()) {
          pageUtils.fitPage()
          uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
          modalUtils.setModalInfo(
            `${this.$t('NN0788')}`,
            [`${this.$t('NN0789', { size: '6000 x 6000' })}`],
            {
              msg: `${this.$t('NN0358')}`,
              class: 'btn-blue-mid',
              action: () => { return false }
            }
          )
        }
        unwatchPages()
      }
    })
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

    StepsUtils.record()
    this.editorView = this.$refs.editorView as HTMLElement
    this.editorCanvas = this.$refs.canvas as HTMLElement
    this.cardHeight = this.editorView ? this.editorView.clientHeight : 0
    this.cardWidth = this.editorView ? this.editorView.clientWidth : 0

    pageUtils.fitPage(false, true)
    this.tmpScaleRatio = pageUtils.scaleRatio

    if (generalUtils.isTouchDevice()) {
      pageUtils.mobileMinScaleRatio = this.isDetailPage ? 20 : this.tmpScaleRatio
    }

    this.$nextTick(() => {
      pageUtils.findCentralPageIndexInfo()
    })
    this.scrollHeight = this.editorView.scrollHeight
    document.addEventListener('blur', this.detectBlur, true)

    this.editorViewResizeObserver = new (window as any).ResizeObserver(() => {
      this.cardHeight = this.editorView.clientHeight
    })

    this.editorViewResizeObserver.observe(this.editorView as HTMLElement)
  },
  beforeDestroy() {
    this.editorViewResizeObserver.disconnect()
  },
  watch: {
    pageScaleRatio() {
      if (this.isDetailPage) {
        generalUtils.scaleFromCenter(this.editorView)
      } else {
        const card = (this.$refs.card as HTMLElement[])[this.currCardIndex]
        generalUtils.scaleFromCenter(card)
      }
    },
    currFocusPageIndex(newVal) {
      this.setCurrCardIndex(newVal)
      if (backgroundUtils.inBgSettingMode) {
        editorUtils.setInBgSettingMode(false)
      }
    },
    currActivePanel(newVal) {
      this.$nextTick(() => {
        this.cardHeight = this.editorView?.clientHeight
      })
    }
  },

  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapState({
      mobileAllPageMode: 'mobileEditor/mobileAllPageMode'
    }),
    ...mapGetters({
      groupId: 'getGroupId',
      pagesState: 'getPagesState',
      getMiddlemostPageIndex: 'getMiddlemostPageIndex',
      geCurrActivePageIndex: 'getCurrActivePageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      getPageSize: 'getPageSize',
      pageScaleRatio: 'getPageScaleRatio',
      isShowPagePreview: 'page/getIsShowPagePreview',
      hasCopiedFormat: 'getHasCopiedFormat',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      currFocusPageIndex: 'getCurrFocusPageIndex',
      currCardIndex: 'mobileEditor/getCurrCardIndex',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      groupType: 'getGroupType'
    }),
    pages(): Array<IPage> {
      return this.pagesState.map((p: IPageState) => p.config)
    },
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
    pageSize(): { width: number, height: number } {
      return this.getPageSize(0)
    },
    minScaleRatio(): number {
      return pageUtils.mobileMinScaleRatio
    },
    isDetailPage(): boolean {
      return this.groupType === 1
    },
    editorViewStyle(): { [index: string]: string | number } {
      return {
        overflow: this.isDetailPage ? 'scroll' : 'initial'
      }
    },
    cardStyle(): { [index: string]: string | number } {
      return {
        width: `${this.cardWidth}px`,
        height: this.isDetailPage ? 'initial' : `${this.cardHeight}px`,
        padding: this.isDetailPage ? '0px' : '40px',
        flexDirection: this.isDetailPage ? 'column' : 'initial',
        'overflow-y': this.isDetailPage ? 'initial' : 'scroll',
        // overflow: this.isDetailPage ? 'initial' : 'scroll',
        minHeight: this.isDetailPage ? 'none' : '100%'
      }
    },
    canvasStyle(): { [index: string]: string | number } {
      return {
        padding: this.isDetailPage ? '40px 0px' : '0px'
      }
    },
    absContainerStyle(): { [index: string]: string | number } {
      const transformDuration = !this.showMobilePanel ? 0.3 : 0
      return {
        transform: this.isDetailPage ? 'initail' : `translate3d(0, -${this.currCardIndex * this.cardHeight}px,0)`,
        transition: `transform ${transformDuration}s`
      }
    },
    isGettingDesign(): boolean {
      return this.uploadUtils.isGettingDesign
    }
  },
  methods: {
    ...mapMutations({
      addLayer: 'ADD_selectedLayer',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setPageScaleRatio: 'SET_pageScaleRatio',
      _setAdminMode: 'user/SET_ADMIN_MODE',
      setInBgRemoveMode: 'SET_inBgRemoveMode',
      addPage: 'ADD_page',
      setCurrCardIndex: 'mobileEditor/SET_currCardIndex'
    }),
    ...mapActions('layouts',
      [
        'getCategories',
        'getRecently'
      ]
    ),
    setAdminMode() {
      this._setAdminMode(!this.adminMode)
    },
    outerClick(e: MouseEvent) {
      if (!this.inBgRemoveMode && !ControlUtils.isClickOnController(e)) {
        editorUtils.setInBgSettingMode(false)
        GroupUtils.deselect()
        this.setCurrActivePageIndex(-1)
        pageUtils.setBackgroundImageControlDefault()
        editorUtils.setInMultiSelectionMode(false)
        pageUtils.findCentralPageIndexInfo()
        if (imageUtils.isImgControl()) {
          ControlUtils.updateLayerProps(this.getMiddlemostPageIndex, this.lastSelectedLayerIndex, { imgControl: false })
        }
      }
    },
    selectStart(e: PointerEvent) {
      if (ControlUtils.isClickOnController(e)) {
        const movingUtils = new MovingUtils({
          _config: { config: layerUtils.getCurrLayer },
          snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
          body: document.getElementById(`nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`) as HTMLElement
        })
        movingUtils.moveStart(e)
      } else if (layerUtils.layerIndex === -1) {
        const movingUtils = new MovingUtils({
          _config: { config: {} as ILayer },
          snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
          body: this.$refs.editorView as HTMLElement
        })
        movingUtils.pageMoveStart(e)
      }
    },
    scrollUpdate() {
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
    handleWheel(e: WheelEvent) {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        const ratio = this.pageScaleRatio * (1 - e.deltaY * 0.005)
        this.setPageScaleRatio(Math.min(Math.max(Math.round(ratio), 10), 500))
      }
    },
    pinchHandler(event: AnyTouchEvent) {
      switch (event.phase) {
        /**
         * @Note the very first event won't fire start phase, it's very strange and need to pay attention
         */
        case 'start': {
          this.tmpScaleRatio = pageUtils.scaleRatio
          this.isScaling = true
          break
        }
        case 'move': {
          if (!this.isScaling) {
            this.isScaling = true
          }
          const limitMultiplier = 4
          if (pageUtils.mobileMinScaleRatio * limitMultiplier <= this.tmpScaleRatio * event.scale) {
            pageUtils.setScaleRatio(pageUtils.mobileMinScaleRatio * limitMultiplier)
            return
          }
          pageUtils.setScaleRatio(Math.min(this.tmpScaleRatio * event.scale, pageUtils.mobileMinScaleRatio * limitMultiplier))
          break
        }

        case 'end': {
          if (pageUtils.scaleRatio < this.minScaleRatio) {
            pageUtils.setScaleRatio(this.minScaleRatio)
          }

          this.isScaling = false
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
      if (!this.isDetailPage) {
        if (pageUtils.scaleRatio > pageUtils.mobileMinScaleRatio) {
          return
        }
        this.isSwiping = true
        e.stopImmediatePropagation()
        if (this.pageNum - 1 !== this.currCardIndex) {
          this.setCurrCardIndex(this.currCardIndex + 1)
          GroupUtils.deselect()
          this.setCurrActivePageIndex(this.currCardIndex)
          this.$nextTick(() => {
            setTimeout(() => {
              pageUtils.fitPage()
            }, 300)
          })
        } else {
          GroupUtils.deselect()
          this.addPage(pageUtils.newPage({}))
          this.$nextTick(() => {
            editorUtils.setCurrCardIndex(pageUtils.pageNum - 1)
            this.setCurrActivePageIndex(this.currCardIndex)
            setTimeout(() => {
              pageUtils.fitPage()
            }, 300)
          })
          StepsUtils.record()
        }
        this.isSwiping = false
      }
    },
    swipeDownHandler(e: AnyTouchEvent) {
      if (!this.isDetailPage) {
        if (pageUtils.scaleRatio > pageUtils.mobileMinScaleRatio) {
          return
        }
        this.isSwiping = true
        e.stopImmediatePropagation()
        if (this.currCardIndex !== 0) {
          this.setCurrCardIndex(this.currCardIndex - 1)
          GroupUtils.deselect()
          this.setCurrActivePageIndex(this.currCardIndex)
          this.$nextTick(() => {
            setTimeout(() => {
              pageUtils.fitPage()
            }, 300)
          })
        }
        this.isSwiping = false
      }
    },
    pageStyle(index: number) {
      return {
        'z-index': `${this.getPageZIndex(index)}`,
        margin: 'auto'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
$REULER_SIZE: 20px;

.editor-view {
  position: relative;
  z-index: setZindex("editor-view");
  @include size(100%, 100%);

  &__abs-container {
    @include size(100%, 100%);
    width: 100%;
    min-height: 100%;
    max-height: 100%;
    display: grid;
    top: 0px;
    left: 0px;
  }

  &__canvas {
    position: relative;
    @include size(100%, 100%);

    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    transform-style: preserve-3d;
    transform: scale(1);
    box-sizing: border-box;
  }

  &__card {
    width: 100%;
    touch-action: none;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    @include no-scrollbar;
    // https://stackoverflow.com/questions/33454533/cant-scroll-to-top-of-flex-item-that-is-overflowing-container
    // justify-content: center;
  }
}

.dim-background {
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
