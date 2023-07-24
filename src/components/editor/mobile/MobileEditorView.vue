<template lang="pug">
div(class="editor-view" v-touch
    :class="isBackgroundImageControl ? 'editor-view__dim-background' : 'bg-gray-5'"
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
import { ICoordinate } from '@/interfaces/frame'
import { ILayer } from '@/interfaces/layer'
import { IPage, IPageState } from '@/interfaces/page'
import store from '@/store'
import { ILayerInfo } from '@/store/types'
import backgroundUtils from '@/utils/backgroundUtils'
import ControlUtils from '@/utils/controlUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils from '@/utils/eventUtils'
import formatUtils from '@/utils/formatUtils'
import GroupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import mathUtils from '@/utils/mathUtils'
import modalUtils from '@/utils/modalUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import StepsUtils from '@/utils/stepsUtils'
import SwipeDetector from '@/utils/SwipeDetector'
import tiptapUtils from '@/utils/tiptapUtils'
import uploadUtils from '@/utils/uploadUtils'
import { AnyTouchEvent } from 'any-touch'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

const MAX_SCALE = 300
const TRANSITION_TIME = 250

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
      swipeDetector: null as unknown as SwipeDetector,
      initPagePos: { x: 0, y: 0 },
      initPinchPos: null as ICoordinate | null,
      isHandlingEdgeReach: false,
      movingUtils: null as unknown as MovingUtils,
      translationRatio: null as null | ICoordinate,
      currPageEl: null as null | HTMLElement
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
    this.swipeDetector = new SwipeDetector(this.editorView, { targetDirection: 'vertical' }, this.handleSwipe)

    this.cardHeight = this.editorView ? this.editorView.clientHeight : 0
    this.cardWidth = this.editorView ? this.editorView.clientWidth : 0

    pageUtils.fitPage(false, true)
    this.tmpScaleRatio = pageUtils.scaleRatio

    if (this.$isTouchDevice()) {
      pageUtils.mobileMinScaleRatio = this.isDetailPage ? 20 : this.tmpScaleRatio
      pageUtils.originPageSize.width = pageUtils.getPages[0].width * pageUtils.mobileMinScaleRatio * 0.01
      pageUtils.originPageSize.height = pageUtils.getPages[0].height * pageUtils.mobileMinScaleRatio * 0.01

      const rect = this.editorView.getBoundingClientRect()
      editorUtils.setMobilePhysicalData({
        size: {
          width: rect.width,
          height: rect.height,
        },
        centerPos: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        },
        pos: {
          x: rect.left,
          y: rect.top
        }
      })
      editorUtils.handleContentScaleRatio(layerUtils.pageIndex)
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

    const layerInfo = {} as ILayerInfo
    Object.defineProperties(layerInfo, {
      pageIndex: {
        get() {
          return layerUtils.pageIndex
        }
      },
      layerIndex: {
        get() {
          return layerUtils.layerIndex
        }
      },
      subLayerIdx: {
        get() {
          return layerUtils.subLayerIdx
        }
      }
    })
    this.movingUtils = new MovingUtils({
      _config: { config: {} as ILayer },
      snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
      body: this.$refs.editorView as HTMLElement,
      layerInfo
    })
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
  },

  computed: {
    ...mapState({
      isGettingDesign: 'isGettingDesign'
    }),
    ...mapState('mobileEditor', {
      mobileAllPageMode: 'mobileAllPageMode',
      isPinchingEditor: 'isPinchingEditor'
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
      setCurrCardIndex: 'mobileEditor/SET_currCardIndex',
      setPinchScaleRatio: 'SET_pinchScaleRatio'
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
        console.warn('outerClick')
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
      if (!e.isPrimary) return
      e.stopPropagation()
      if (this.hasCopiedFormat) {
        formatUtils.clearCopiedFormat()
      }
      if (ControlUtils.isClickOnController(e)) {
        this.movingUtils.removeListener()
        this.movingUtils.updateProps({
          _config: { config: layerUtils.getCurrLayer },
          body: document.getElementById(`nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`) as HTMLElement
        })
        this.movingUtils.moveStart(e)
      } else {
        this.movingUtils.removeListener()
        this.movingUtils.pageMoveStart(e)
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
      console.log('to do')
    },
    EDGE_WIDTH(): {x : number, y: number} {
      return {
        x: (editorUtils.mobileSize.width - pageUtils.getCurrPage.width * this.$store.getters.getContentScaleRatio) * 0.5,
        y: (editorUtils.mobileSize.height - pageUtils.getCurrPage.height * this.$store.getters.getContentScaleRatio) * 0.5
      }
    },
    pageEdgeLimitHandler(page: IPage, pageScaleRatio: number) {
      const edgeLimit = this.getEdgeLimit(page, pageScaleRatio)
      return {
        isReachLeftEdge: page.x >= edgeLimit.left,
        isReachRightEdge: page.x <= edgeLimit.right,
        isReachTopEdge: page.y >= edgeLimit.top,
        isReachBottomEdge: page.y <= edgeLimit.bottom,
        edgeLimit
      }
    },
    getEdgeLimit(page: IPage, pageScaleRatio: number) {
      const contentScaleRatio = this.$store.getters.getContentScaleRatio
      const EDGE_WIDTH = this.EDGE_WIDTH()
      return {
        left: EDGE_WIDTH.x,
        right: editorUtils.mobileSize.width - page.width * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.x,
        top: EDGE_WIDTH.y,
        bottom: editorUtils.mobileSize.height - page.height * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.y
      }
    },
    pinchHandler(e: AnyTouchEvent) {
      if (this.isHandlingEdgeReach) return

      window.requestAnimationFrame(() => {
        const { getCurrPage: page, scaleRatio } = pageUtils
        const contentScaleRatio = this.$store.getters.getContentScaleRatio
        const evtScale = ((e.scale - 1) * 0.5 + 1)
        switch (e.phase) {
          case 'start': {
            if (this.isBgImgCtrl || this.isImgCtrl) return

            this.currPageEl = document.getElementById(`nu-page-wrapper_${layerUtils.pageIndex}`) as HTMLElement
            this.movingUtils.removeListener()
            this.initPagePos.x = page.x
            this.initPagePos.y = page.y
            this.initPinchPos = {
              x: e.x,
              y: e.y
            }
            this.tmpScaleRatio = scaleRatio
            store.commit('SET_isPageScaling', true)
            this.$store.commit('mobileEditor/SET_isPinchingEditor', true)
            break
          }

          case 'move': {
            if (this.isBgImgCtrl || this.isImgCtrl) return

            const newScaleRatio = evtScale * this.tmpScaleRatio
            if (!this.isPinchingEditor) {
              this.currPageEl = document.getElementById(`nu-page-wrapper_${layerUtils.pageIndex}`) as HTMLElement
              this.movingUtils.removeListener()
              this.initPagePos.x = page.x
              this.initPagePos.y = page.y
              this.initPinchPos = {
                x: e.x,
                y: e.y
              }
              this.tmpScaleRatio = scaleRatio
              store.commit('SET_isPageScaling', true)
              this.$store.commit('mobileEditor/SET_isPinchingEditor', true)
            }
            if (!this.initPinchPos) return
            if (!store.state.isPageScaling) {
              store.commit('SET_isPageScaling', true)
            }
            store.commit('mobileEditor/UPDATE_pinchScale', evtScale)

            if (!this.translationRatio) {
              const translationRatio_ori_pos = {
                x: ((page.mobilePhysicalSize.initPos.x - this.initPagePos.x) / (page.width * this.tmpScaleRatio * 0.01 * contentScaleRatio)),
                y: ((page.mobilePhysicalSize.initPos.y - this.initPagePos.y) / (page.height * this.tmpScaleRatio * 0.01 * contentScaleRatio))
              }

              this.translationRatio = {
                x: ((this.initPinchPos.x - editorUtils.mobileCenterPos.x) / (page.width * contentScaleRatio) + 0.5) / (this.tmpScaleRatio * 0.01) + translationRatio_ori_pos.x,
                y: ((this.initPinchPos.y - editorUtils.mobileCenterPos.y) / (page.height * contentScaleRatio) + 0.5) / (this.tmpScaleRatio * 0.01) + translationRatio_ori_pos.y
              }
            }

            const sizeDiff = {
              width: (newScaleRatio - this.tmpScaleRatio) * 0.01 * (page.width * contentScaleRatio),
              height: (newScaleRatio - this.tmpScaleRatio) * 0.01 * (page.height * contentScaleRatio)
            }
            const movingTraslate = {
              x: (e.x - this.initPinchPos.x),
              y: (e.y - this.initPinchPos.y)
            }
            pageUtils.updatePagePos(layerUtils.pageIndex, {
              x: this.initPagePos.x - sizeDiff.width * this.translationRatio.x + movingTraslate.x,
              y: this.initPagePos.y - sizeDiff.height * this.translationRatio.y + movingTraslate.y
            })
            break
          }
          case 'end': {
            if (!this.translationRatio) {
              console.error('translationRatio should not be null!')
              return
            }

            const newScaleRatio = this.$store.state.mobileEditor.pinchScale * this.tmpScaleRatio
            const { isReachLeftEdge, isReachRightEdge, isReachTopEdge, isReachBottomEdge } = this.pageEdgeLimitHandler(page, newScaleRatio * 0.01)
            if (newScaleRatio > MAX_SCALE) {
              this.currPageEl?.classList.add('editor-view__pinch-transition')
              this.isHandlingEdgeReach = true

              const sizeDiff = {
                width: (newScaleRatio - MAX_SCALE) * 0.01 * (page.width * contentScaleRatio),
                height: (newScaleRatio - MAX_SCALE) * 0.01 * (page.height * contentScaleRatio)
              }

              const xAtMaxScale = page.x + sizeDiff.width * this.translationRatio.x
              const yAtMaxScale = page.y + sizeDiff.height * this.translationRatio.y
              const edgeLimit = this.getEdgeLimit(page, MAX_SCALE * 0.01)
              pageUtils.updatePagePos(layerUtils.pageIndex, {
                x: mathUtils.clamp(xAtMaxScale, edgeLimit.right, edgeLimit.left),
                y: mathUtils.clamp(yAtMaxScale, edgeLimit.bottom, edgeLimit.top)
              })
              this.$store.commit('mobileEditor/UPDATE_pinchScale', MAX_SCALE / this.tmpScaleRatio)

              setTimeout(() => {
                this.$store.commit('mobileEditor/SET_isPinchingEditor', false)
                this.$store.commit('mobileEditor/UPDATE_pinchScale', 1)
                this.$store.commit('SET_pageScaleRatio', MAX_SCALE)
                this.isHandlingEdgeReach = false
                this.currPageEl?.classList.remove('editor-view__pinch-transition')
              }, TRANSITION_TIME)
            } else if (isReachLeftEdge || isReachRightEdge || isReachTopEdge || isReachBottomEdge) {
              this.isHandlingEdgeReach = true
              this.currPageEl?.classList.add('editor-view__pinch-transition')

              const pos = { x: page.x, y: page.y }
              const EDGE_WIDTH = this.EDGE_WIDTH()
              if (newScaleRatio < 100 || ((isReachLeftEdge && isReachRightEdge) || (isReachTopEdge && isReachBottomEdge))) {
                pos.x = EDGE_WIDTH.x
                pos.y = EDGE_WIDTH.y
                this.$store.commit('mobileEditor/UPDATE_pinchScale', 1)
                this.$store.commit('mobileEditor/SET_isPinchingEditor', false)
                setTimeout(() => {
                  this.$store.commit('SET_pageScaleRatio', 100)
                }, 0)
              } else {
                if (isReachLeftEdge) {
                  pos.x = EDGE_WIDTH.x
                }
                if (isReachRightEdge) {
                  pos.x = editorUtils.mobileSize.width - page.width * contentScaleRatio * newScaleRatio * 0.01 - EDGE_WIDTH.x
                }
                if (isReachTopEdge) {
                  pos.y = EDGE_WIDTH.y
                }
                if (isReachBottomEdge) {
                  pos.y = editorUtils.mobileSize.height - page.height * contentScaleRatio * newScaleRatio * 0.01 - EDGE_WIDTH.y
                }
                setTimeout(() => {
                  this.$store.commit('mobileEditor/SET_isPinchingEditor', false)
                  this.$store.commit('mobileEditor/UPDATE_pinchScale', 1)
                  this.$store.commit('SET_pageScaleRatio', newScaleRatio)
                }, TRANSITION_TIME)
              }
              pageUtils.updatePagePos(layerUtils.pageIndex, pos)

              setTimeout(() => {
                this.isHandlingEdgeReach = false
                this.currPageEl?.classList.remove('editor-view__pinch-transition')
              }, TRANSITION_TIME)
            } else {
              this.$store.commit('mobileEditor/SET_isPinchingEditor', false)
              this.$store.commit('mobileEditor/UPDATE_pinchScale', 1)
              this.$store.commit('SET_pageScaleRatio', newScaleRatio)
            }

            this.translationRatio = null
            this.initPinchPos = null

            store.commit('SET_isPageScaling', false)
            this.movingUtils.pageMoveStart(e as any)
          }
        }
      })
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
      if (this.isPinchingEditor) return
      if (dir === 'up') {
        this.swipeUpHandler()
      } else if (dir === 'down') {
        this.swipeDownHandler()
      }
    }
  }
})
</script>

<style lang="scss">
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
  &__dim-background {
    background-color: rgba(0, 0, 0, 0.4);
  }
  &__pinch-transition {
    transition: transform .25s, webkit-transform .25s;
  }
}

</style>
