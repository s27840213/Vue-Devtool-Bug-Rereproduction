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
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
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

const MAX_SCALE_RATIO = 2.5

export default defineComponent({
  emits: [],
  components: {
    BgRemoveArea,
    PageNumber,
    PageCard
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
      oriPageSize: 0,
      swipeDetector: null as unknown as SwipeDetector,
      initPagePos: { x: 0, y: 0 },
      initPageSize: { width: 0, height: 0 },
      initPinchPos: null as ICoordinate | null,
      tmpPinchScaleRatio: 100,
      handlePinchTimer: -1,
      isPinching: false,
      isHandlingEdgeReach: false
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
      pageUtils.originPageSize.width = pageUtils.getPages[0].width * this.pageUtils.mobileMinScaleRatio * 0.01
      pageUtils.originPageSize.height = pageUtils.getPages[0].height * this.pageUtils.mobileMinScaleRatio * 0.01

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

      // const editorView = this.$refs.editorView as HTMLElement
      // const rect = editorView.getBoundingClientRect()
      // pageUtils.originEditorSize.width = rect.width
      // pageUtils.originEditorSize.height = rect.height

      // pageUtils.pageCenterPos = {
      //   x: rect.width * 0.5,
      //   y: rect.height * 0.5
      // }

      // let card = this.$refs.card as HTMLElement | HTMLElement[]
      // if (Array.isArray(card)) card = card[0]
      // const cardRect = card.getBoundingClientRect()
      // const padding = +card.style.padding.slice(0, -2)
      // pageUtils.pageEventPosOffset.x = cardRect.x + padding
      // pageUtils.pageEventPosOffset.y = cardRect.y + padding

      // pageUtils.originPageY = (pageUtils.originEditorSize.height - (pageUtils.getCurrPage.width * (pageUtils.scaleRatio * 0.01))) * 0.5 - padding
      // pageUtils.getPages.forEach((_, i) => {
      //   pageUtils.updatePagePos(i, {
      //     x: 0,
      //     y: pageUtils.originPageY
      //   })
      // })
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
      // if ((e.metaKey || e.ctrlKey) && !this.handleWheelTransition) {
      //   if (!store.state.isPageScaling) {
      //     store.commit('SET_isPageScaling', true)
      //   }
      //   clearTimeout(this.hanleWheelTimer)
      //   this.hanleWheelTimer = window.setTimeout(() => {
      //     store.commit('SET_isPageScaling', false)
      //     if (newScaleRatio <= pageUtils.mobileMinScaleRatio) {
      //       const page = document.getElementById(`nu-page_${layerUtils.pageIndex}`) as HTMLElement
      //       page.style.transition = '0.3s linear'
      //       this.handleWheelTransition = true
      //       this.setPageScaleRatio(pageUtils.mobileMinScaleRatio)
      //       setTimeout(() => {
      //         page.style.transition = ''
      //         this.handleWheelTransition = false
      //       }, 500)
      //       // pageUtils.updatePagePos(layerUtils.pageIndex, { x: 0, y: pageUtils.originPageY })
      //     }
      //   }, 500)
      //   const ratio = this.pageScaleRatio * (1 - e.deltaY * 0.005)
      //   const newScaleRatio = Math.min(Math.max(Math.round(ratio), 10), 500)
      //   if (newScaleRatio >= pageUtils.mobileMinScaleRatio || e.deltaY < 0) {
      //     e.preventDefault()
      //     this.setPageScaleRatio(newScaleRatio)
      //   }
      // }
    },
    EDGE_WIDTH(): {x : number, y: number} {
      return {
        x: (editorUtils.mobileSize.width - pageUtils.getCurrPage.width * this.$store.state.contentScaleRatio) * 0.5,
        y: (editorUtils.mobileSize.height - pageUtils.getCurrPage.height * this.$store.state.contentScaleRatio) * 0.5
      }
    },
    pageEdgeLimitHandler(page: IPage) {
      const contentScaleRatio = this.$store.state.contentScaleRatio
      const pageScaleRatio = this.pageScaleRatio * 0.01
      const EDGE_WIDTH = this.EDGE_WIDTH()
      const isReachLeftEdge = page.x >= EDGE_WIDTH.x
      const isReachRightEdge = page.x <= editorUtils.mobileSize.width - page.width * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.x
      const isReachTopEdge = page.y >= EDGE_WIDTH.y
      const isReachBottomEdge = page.y <= editorUtils.mobileSize.height - page.height * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.y

      return {
        isReachLeftEdge,
        isReachRightEdge,
        isReachTopEdge,
        isReachBottomEdge
      }
    },
    pinchHandler(e: AnyTouchEvent) {
      const { getCurrPage: page, scaleRatio } = pageUtils
      const contentScaleRatio = this.$store.state.contentScaleRatio
      const pageScaleRatio = this.pageScaleRatio * 0.01
      switch (e.phase) {
        case 'start': {
          console.log('start')
          this.initPagePos.x = page.x
          this.initPagePos.y = page.y
          this.initPinchPos = {
            x: e.x,
            y: e.y
          }
          this.tmpScaleRatio = scaleRatio
          this.isScaling = true
          store.commit('SET_isPageScaling', true)
          break
        }
        case 'move': {
          if (!this.initPinchPos) {
            this.initPinchPos = {
              x: e.x,
              y: e.y
            }
          }
          this.isPinching = true
          // const pinchScaleRatio = Math.min((e.scale + 1) / 2 * 100, MAX_SCALE_RATIO)
          const newScaleRatio = e.scale * this.tmpScaleRatio
          if (!store.state.isPageScaling) {
            store.commit('SET_isPageScaling', true)
          }
          store.commit('SET_pageScaleRatio', newScaleRatio)

          const translationRatio = {
            x: (this.initPinchPos.x - page.mobilePhysicalSize.pageCenterPos.x) / (page.mobilePhysicalSize.originSize.width) + 0.5,
            y: (this.initPinchPos.y - page.mobilePhysicalSize.pageCenterPos.y) / (page.mobilePhysicalSize.originSize.height) + 0.5
          }

          const sizeDiff = {
            width: (newScaleRatio - this.tmpScaleRatio) * 0.01 * (page.width * contentScaleRatio),
            height: (newScaleRatio - this.tmpScaleRatio) * 0.01 * (page.height * contentScaleRatio)
          }
          console.log(translationRatio.x, translationRatio.y)

          pageUtils.updatePagePos(0, {
            x: this.initPagePos.x - sizeDiff.width * translationRatio.x,
            y: this.initPagePos.y - sizeDiff.height * translationRatio.y
          })

          break
        }
        case 'end': {
          this.isPinching = false
          const { isReachLeftEdge, isReachRightEdge, isReachTopEdge, isReachBottomEdge } = this.pageEdgeLimitHandler(page)
          if (isReachLeftEdge || isReachRightEdge || isReachTopEdge || isReachBottomEdge) {
            this.isHandlingEdgeReach = true
            const pageEl = document.getElementById(`nu-page-wrapper_${layerUtils.pageIndex}`) as HTMLElement
            // pageEl.style.transition = 'width 2s, height 2s'
            pageEl.style.transition = 'transform .4s, webkit-transform .4s, width .4s, height .4s'

            const pos = { x: page.x, y: page.y }
            const EDGE_WIDTH = this.EDGE_WIDTH()
            if (pageScaleRatio < 1 || (isReachLeftEdge && isReachRightEdge) || (isReachTopEdge && isReachBottomEdge)) {
              pos.x = EDGE_WIDTH.x
              pos.y = EDGE_WIDTH.y
              pageUtils.setScaleRatio(100)
              console.warn(1)
            } else {
              if (isReachLeftEdge) {
                console.warn(2)
                pos.x = EDGE_WIDTH.x
              }
              if (isReachRightEdge) {
                console.warn(3)
                pos.x = editorUtils.mobileSize.width - page.width * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.x
              }
              if (isReachTopEdge) {
                console.warn(4)
                pos.y = EDGE_WIDTH.y
              }
              if (isReachBottomEdge) {
                console.warn(5)
                pos.y = editorUtils.mobileSize.height - page.height * contentScaleRatio * pageScaleRatio - EDGE_WIDTH.y
              }
            }
            pageUtils.updatePagePos(layerUtils.pageIndex, pos)

            setTimeout(() => {
              this.isHandlingEdgeReach = false
              pageEl.style.transition = ''
              pageEl.style.transformOrigin = ''
            }, 500)
          }
          store.commit('SET_isPageScaling', false)
          console.log('end')
        }
      }
      // switch (event.phase) {
      //   /**
      //    * @Note the very first event won't fire start phase, it's very strange and need to pay attention
      //    */
      //   case 'start': {
      //     this.initPagePos.x = pageUtils.getCurrPage.x
      //     this.initPagePos.y = pageUtils.getCurrPage.y
      //     this.initPageSize.width = pageUtils.getCurrPage.width * (pageUtils.scaleRatio * 0.01)
      //     this.initPageSize.height = pageUtils.getCurrPage.height * (pageUtils.scaleRatio * 0.01)
      //     this.tmpScaleRatio = pageUtils.scaleRatio
      //     this.isScaling = true
      //     store.commit('SET_isPageScaling', true)
      //     break
      //   }
      //   case 'move': {
      //     if (!this.isScaling) {
      //       this.isScaling = true
      //       store.commit('SET_isPageScaling', true)
      //     }
      //     window.requestAnimationFrame(() => {
      //       if (!this.initPinchPos) {
      //         this.initPinchPos = { x: event.x - pageUtils.pageEventPosOffset.x, y: event.y - pageUtils.pageEventPosOffset.x }
      //       }
      //       const limitMultiplier = 4
      //       // if (pageUtils.mobileMinScaleRatio * limitMultiplier <= this.tmpScaleRatio * event.scale) {
      //       //   // pageUtils.setScaleRatio(pageUtils.mobileMinScaleRatio * limitMultiplier)
      //       //   this.setPinchScaleRatio(pageUtils.mobileMinScaleRatio * limitMultiplier)
      //       //   return
      //       // }
      //       console.log(event.scale)
      //       const pinchScaleRatio = Math.min(event.scale * 100, MAX_SCALE_RATIO)
      //       if (pinchScaleRatio) {
      //         this.setPinchScaleRatio(pinchScaleRatio)

      //         const sizeDiff = {
      //           // width: pageUtils.getCurrPage.width * (newScaleRatio * 0.01) - this.initPageSize.width,
      //           // height: pageUtils.getCurrPage.height * (newScaleRatio * 0.01) - this.initPageSize.height
      //           width: (pinchScaleRatio * 0.01 - 1) * this.initPageSize.width,
      //           height: (pinchScaleRatio * 0.01 - 1) * this.initPageSize.height
      //         }

      //         const translationRatio = {
      //           x: (this.initPinchPos.x - pageUtils.pageCenterPos.x) / pageUtils.originPageSize.width + 0.5,
      //           y: (this.initPinchPos.y - pageUtils.pageCenterPos.y) / pageUtils.originPageSize.height + 0.5
      //         }

      //         pageUtils.updatePagePos(0, {
      //           x: this.initPagePos.x - sizeDiff.width * translationRatio.x,
      //           y: this.initPagePos.y - sizeDiff.height * translationRatio.y
      //         })
      //       }
      //     })
      //     break
      //   }

      //   case 'end': {
      //     this.initPinchPos = null
      //     this.isScaling = false
      //     const newScaleRatio = Math.min(this.tmpScaleRatio * event.scale, MAX_SCALE_RATIO)
      //     const needResizeToDefault = newScaleRatio <= pageUtils.mobileMinScaleRatio
      //     this.setPinchScaleRatio(100)
      //     this.setPageScaleRatio(newScaleRatio)
      //     store.commit('SET_isPageScaling', false)

      //     const page = document.getElementById(`nu-page-wrapper_${layerUtils.pageIndex}`) as HTMLElement
      //     setTimeout(() => {
      //       page.style.transition = 'transform .2s, webkit-transform .2s'
      //       page.style.transformOrigin = 'center'
      //     }, 0)

      //     clearTimeout(this.handlePinchTimer)
      //     this.handlePinchTimer = window.setTimeout(() => {
      //       if (needResizeToDefault) {
      //         this.handleWheelTransition = true
      //         pageUtils.updatePagePos(layerUtils.pageIndex, { x: 0, y: pageUtils.originPageY })
      //         this.setPageScaleRatio(pageUtils.mobileMinScaleRatio)
      //         setTimeout(() => {
      //           page.style.transition = ''
      //           this.handleWheelTransition = false
      //         }, 500)
      //       } else {
      //         page.style.transition = ''
      //       }
      //       page.style.transformOrigin = 'top left'
      //     }, 500)
      //     break
      //   }
      // }

      // this.$nextTick(() => {
      //   // here is a workaround to fix the problem of selecting layer after pinching
      //   if (layerUtils.currSelectedInfo.layers.length > 0) {
      //     GroupUtils.deselect()
      //   }
      // })
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
      if (this.isPinching) return
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
