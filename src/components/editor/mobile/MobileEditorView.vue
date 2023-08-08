<template lang="pug">
div(class="editor-view" v-touch
    :class="isBackgroundImageControl ? 'dim-background' : 'bg-gray-5'"
    :style="editorViewStyle"
    @wheel="handleWheel"
    @scroll="!inBgRemoveMode ? scrollUpdate() : null"
    @pointerdown="selectStart"
    @mousewheel="handleWheel"
    ref="editorView")
  //- @pinch="pinchHandler"
  div(class="editor-view__abs-container"
      :style="absContainerStyle")
    div(class="editor-view__canvas"
        ref="canvas"
        :style="canvasStyle")
      template(v-if="!inBgRemoveMode")
        page-card(v-for="(page,index) in pagesState"
            :key="`page-${page.config.id}`"
            :config="page"
            :cardWidth="cardWidth"
            :cardHeight="cardHeight"
            :pageIndex="index"
            :editorView="editorView"
            :isAnyBackgroundImageControl="isBackgroundImageControl"
            @pointerdown="selectStart"
            @click.self.prevent="outerClick($event)")
      div(v-else class="editor-view__bg-remove-area")
        bg-remove-area(:editorViewCanvas="editorCanvas")
  page-number(v-if="!hasSelectedLayer"
    :pageNum="pageNum"
    :currCardIndex="currCardIndex")
</template>

<script lang="ts">
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'
import PageCard from '@/components/editor/mobile/PageCard.vue'
import PageNumber from '@/components/editor/PageNumber.vue'
import { ILayer } from '@/interfaces/layer'
import { IPage, IPageState } from '@/interfaces/page'
import store from '@/store'
import backgroundUtils from '@/utils/backgroundUtils'
import ControlUtils from '@/utils/controlUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils from '@/utils/eventUtils'
import formatUtils from '@/utils/formatUtils'
import GroupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import logUtils from '@/utils/logUtils'
import modalUtils from '@/utils/modalUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import StepsUtils from '@/utils/stepsUtils'
import SwipeDetector from '@/utils/SwipeDetector'
import tiptapUtils from '@/utils/tiptapUtils'
import uploadUtils from '@/utils/uploadUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    BgRemoveArea,
    PageNumber,
    PageCard
  },
  props: {
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
      editorView: null as unknown as HTMLElement,
      editorCanvas: null as unknown as HTMLElement,
      backgroundControllingPageIndex: -1,
      scrollHeight: 0,
      tmpScaleRatio: 0,
      mounted: false,
      cardHeight: 0,
      cardWidth: 0,
      editorViewResizeObserver: null as unknown as ResizeObserver,
      isSwiping: false,
      hanleWheelTimer: -1,
      handleWheelTransition: false,
      swipeDetector: null as unknown as SwipeDetector
    }
  },
  created() {
    // check and auto resize pages oversized on design loaded
    const unwatchPages = this.$watch('isGettingDesign', (newVal) => {
      if (!newVal) {
        logUtils.setLog('mobileEditorView created and got design')
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
    this.swipeDetector = new SwipeDetector(this.editorView, { targetDirection: 'vertical' }, this.handleSwipe)

    const rect = this.editorView.getBoundingClientRect()
    pageUtils.originEditorSize.width = rect.width
    pageUtils.originEditorSize.height = rect.height

    this.cardHeight = this.editorView ? this.editorView.clientHeight : 0
    this.cardWidth = this.editorView ? this.editorView.clientWidth : 0

    pageUtils.fitPage(false, true)
    this.tmpScaleRatio = pageUtils.scaleRatio

    if (this.$isTouchDevice()) {
      pageUtils.mobileMinScaleRatio = this.isDetailPage ? 20 : this.tmpScaleRatio
      pageUtils.originPageSize.width = pageUtils.getPages[0].width * pageUtils.mobileMinScaleRatio * 0.01
      pageUtils.originPageSize.height = pageUtils.getPages[0].height * pageUtils.mobileMinScaleRatio * 0.01
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
    this.swipeDetector.unbind()
  },
  watch: {
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
    // currCardIndex(newVal) {
    //   editorUtils.handleContentScaleRatio(newVal)
    // }
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
      groupType: 'getGroupType',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      isImgCtrl: 'imgControl/isImgCtrl'
    }),
    pages(): Array<IPage> {
      return this.pagesState.map((p: IPageState) => p.config)
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
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
    isDetailPage(): boolean {
      return this.groupType === 1
    },
    editorViewStyle(): { [index: string]: string | number } {
      return {
        overflow: this.isDetailPage ? 'scroll' : 'initial'
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
        transform: this.isDetailPage || this.inBgRemoveMode ? 'initial' : `translate(0, -${this.currCardIndex * this.cardHeight}px)`,
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
      if (eventUtils.checkIsMultiTouch(e)) {
        return
      }
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
      e.stopPropagation()
      if (this.hasCopiedFormat) {
        formatUtils.clearCopiedFormat()
      }
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
    handleWheel(e: WheelEvent) {
      if ((e.metaKey || e.ctrlKey) && !this.handleWheelTransition) {
        if (!store.state.isPageScaling) {
          store.commit('SET_isPageScaling', true)
        }
        clearTimeout(this.hanleWheelTimer)
        this.hanleWheelTimer = window.setTimeout(() => {
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
    swipeUpHandler() {
      if (!this.isDetailPage && !this.hasSelectedLayer && !this.isBgImgCtrl && !this.isImgCtrl) {
        if (pageUtils.scaleRatio > pageUtils.mobileMinScaleRatio) {
          return
        }
        this.isSwiping = true
        // e.stopImmediatePropagation()
        if (this.pageNum - 1 !== this.currCardIndex) {
          this.setCurrCardIndex(this.currCardIndex + 1)
          GroupUtils.deselect()
          this.setCurrActivePageIndex(this.currCardIndex)
          this.$nextTick(() => {
            pageUtils.fitPage()
            // setTimeout(() => {
            //   pageUtils.fitPage()
            // }, 300)
          })
        } else {
          GroupUtils.deselect()
          const lastPage = pageUtils.pageNum > 0 ? pageUtils.getPages[pageUtils.pageNum - 1] : undefined
          this.addPage(pageUtils.newPage({
            width: lastPage?.width,
            height: lastPage?.height,
            backgroundColor: lastPage?.backgroundColor,
            physicalWidth: lastPage?.physicalWidth,
            physicalHeight: lastPage?.physicalHeight,
            isEnableBleed: lastPage?.isEnableBleed,
            bleeds: lastPage?.bleeds,
            physicalBleeds: lastPage?.physicalBleeds,
            unit: lastPage?.unit
          }))
          this.$nextTick(() => {
            editorUtils.setCurrCardIndex(pageUtils.pageNum - 1)
            this.setCurrActivePageIndex(this.currCardIndex)
            pageUtils.fitPage()
            // setTimeout(() => {
            //   pageUtils.fitPage()
            // }, 300)
          })
          StepsUtils.record()
        }
        this.isSwiping = false
      }
    },
    swipeDownHandler() {
      if (!this.isDetailPage && !this.hasSelectedLayer && !this.isBgImgCtrl && !this.isImgCtrl) {
        if (pageUtils.scaleRatio > pageUtils.mobileMinScaleRatio) {
          return
        }
        this.isSwiping = true
        // e.stopImmediatePropagation()
        if (this.currCardIndex !== 0) {
          this.setCurrCardIndex(this.currCardIndex - 1)
          GroupUtils.deselect()
          this.setCurrActivePageIndex(this.currCardIndex)
          this.$nextTick(() => {
            pageUtils.fitPage()
            // setTimeout(() => {
            //   pageUtils.fitPage()
            // }, 300)
          })
        }
        this.isSwiping = false
      }
    },
    handleSwipe(dir: string) {
      if (dir === 'up') {
        this.swipeUpHandler()
      } else if (dir === 'down') {
        this.swipeDownHandler()
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
    display: grid;
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    // transform-style: preserve-3d;
    transform: scale(1);
    box-sizing: border-box;
  }

  &__bg-remove-area {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.dim-background {
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
