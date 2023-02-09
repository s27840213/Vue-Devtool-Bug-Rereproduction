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
          @pointerdown="selectStart"
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
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import { IPage, IPageState } from '@/interfaces/page'
import store from '@/store'
import backgroundUtils from '@/utils/backgroundUtils'
import ControlUtils from '@/utils/controlUtils'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import modalUtils from '@/utils/modalUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import StepsUtils from '@/utils/stepsUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import uploadUtils from '@/utils/uploadUtils'
import { AnyTouchEvent } from 'any-touch'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    EditorHeader,
    BgRemoveArea
  },
  props: {
    isConfigPanelOpen: {
      type: Boolean,
      required: true
    },
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
      hanleWheelTimer: -1,
      handleWheelTransition: false,
      oriX: 0,
      oriPageSize: 0
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
            [`${this.$t('NN0789', { size: `${pageUtils.MAX_WIDTH} x ${pageUtils.MAX_HEIGHT}` })}`],
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

    this.setContentScaleRatio(layerUtils.pageIndex)

    pageUtils.fitPage(false, true)
    this.tmpScaleRatio = pageUtils.scaleRatio

    if (this.$isTouchDevice) {
      pageUtils.mobileMinScaleRatio = this.isDetailPage ? 20 : this.tmpScaleRatio
      pageUtils.originPageSize.width = pageUtils.getPages[0].width * this.pageUtils.mobileMinScaleRatio * 0.01
      pageUtils.originPageSize.height = pageUtils.getPages[0].height * this.pageUtils.mobileMinScaleRatio * 0.01
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
  beforeUnmount() {
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
    },
    currCardIndex(newVal) {
      this.setContentScaleRatio(newVal)
    }
  },

  computed: {
    ...mapState({
      mobileAllPageMode: 'mobileEditor/mobileAllPageMode',
      isGettingDesign: 'isGettingDesign'
    }),
    ...mapGetters({
      groupId: 'getGroupId',
      pagesState: 'getPagesState',
      getMiddlemostPageIndex: 'getMiddlemostPageIndex',
      geCurrActivePageIndex: 'getCurrActivePageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
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
        padding: this.isDetailPage ? '0px' : `${pageUtils.MOBILE_CARD_PADDING}px`,
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
        transform: this.isDetailPage ? 'initial' : `translate(0, -${this.currCardIndex * this.cardHeight}px)`,
        transition: `transform ${transformDuration}s`
      }
    }
  },
  methods: {
    ...mapMutations({
      addLayer: 'ADD_selectedLayer',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setPageScaleRatio: 'SET_pageScaleRatio',
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
      if ((e.metaKey || e.ctrlKey) && !this.handleWheelTransition) {
        if (!store.state.isPageScaling) {
          store.commit('SET_isPageScaling', true)
        }
        clearTimeout(this.hanleWheelTimer)
        this.hanleWheelTimer = setTimeout(() => {
          store.commit('SET_isPageScaling', false)
          console.log('reach limit', pageUtils.mobileMinScaleRatio)
          if (newScaleRatio <= pageUtils.mobileMinScaleRatio) {
            const page = document.getElementById(`nu-page_${layerUtils.pageIndex}`) as HTMLElement
            page.style.transition = '0.3s linear'
            this.handleWheelTransition = true
            this.setPageScaleRatio(pageUtils.mobileMinScaleRatio)
            setTimeout(() => {
              page.style.transition = ''
              this.handleWheelTransition = false
            }, 500)
            pageUtils.updatePagePos(layerUtils.pageIndex, { x: 0, y: 0 })
          }
        }, 500)
        const ratio = this.pageScaleRatio * (1 - e.deltaY * 0.005)
        const newScaleRatio = Math.min(Math.max(Math.round(ratio), 10), 500)
        if (newScaleRatio >= pageUtils.mobileMinScaleRatio || e.deltaY < 0) {
          e.preventDefault()
          this.setPageScaleRatio(newScaleRatio)
        }
      }
    },
    pinchHandler(event: AnyTouchEvent) {
      switch (event.phase) {
        /**
         * @Note the very first event won't fire start phase, it's very strange and need to pay attention
         */
        case 'start': {
          this.oriX = pageUtils.getCurrPage.x
          this.oriPageSize = (pageUtils.getCurrPage.width * (pageUtils.scaleRatio / 100))
          this.tmpScaleRatio = pageUtils.scaleRatio
          this.isScaling = true
          store.commit('SET_isPageScaling', true)
          break
        }
        case 'move': {
          if (!this.isScaling) {
            this.isScaling = true
            store.commit('SET_isPageScaling', true)
          }
          window.requestAnimationFrame(() => {
            const limitMultiplier = 4
            if (pageUtils.mobileMinScaleRatio * limitMultiplier <= this.tmpScaleRatio * event.scale) {
              pageUtils.setScaleRatio(pageUtils.mobileMinScaleRatio * limitMultiplier)
              return
            }
            const newScaleRatio = Math.min(this.tmpScaleRatio * event.scale, pageUtils.mobileMinScaleRatio * limitMultiplier)
            if (newScaleRatio >= pageUtils.mobileMinScaleRatio * 0.8) {
              pageUtils.setScaleRatio(newScaleRatio)

              const baseX = (pageUtils.getCurrPage.width * (newScaleRatio / 100) - this.oriPageSize) * 0.5
              pageUtils.updatePagePos(0, {
                x: this.oriX - baseX
              })
            }
            clearTimeout(this.hanleWheelTimer)
            this.hanleWheelTimer = setTimeout(() => {
              if (newScaleRatio <= pageUtils.mobileMinScaleRatio) {
                const page = document.getElementById(`nu-page-wrapper_${layerUtils.pageIndex}`) as HTMLElement
                page.style.transition = '0.2s linear'
                this.handleWheelTransition = true
                pageUtils.updatePagePos(layerUtils.pageIndex, { x: 0, y: 0 })
                this.setPageScaleRatio(pageUtils.mobileMinScaleRatio)
                setTimeout(() => {
                  page.style.transition = ''
                  this.handleWheelTransition = false
                }, 500)
              }
            }, 500)
          })
          break
        }

        case 'end': {
          this.isScaling = false
          store.commit('SET_isPageScaling', false)
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
        // 'z-index': `${this.getPageZIndex(index)}`,
        // margin: 'auto'
      }
    },
    setContentScaleRatio(pageIndex: number) {
      const page = pageUtils.getPage(pageIndex)
      const contentScaleRatio = editorUtils.handleContentScaleCalc(page)
      editorUtils.setContentScaleRatio(contentScaleRatio)
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
    // transform-style: preserve-3d;
    transform: scale(1);
    box-sizing: border-box;
  }

  &__card {
    width: 100%;
    touch-action: none;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    @include no-scrollbar;
    // https://stackoverflow.com/questions/33454533/cant-scroll-to-top-of-flex-item-that-is-overflowing-container
    // justify-content: center;
  }
}

.dim-background {
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
