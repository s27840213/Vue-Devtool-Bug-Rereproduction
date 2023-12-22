<template lang="pug">
div(class="editor-view" v-touch
    :class="isBackgroundImageControl ? 'editor-view__dim-background' : 'bg-gray-5'"
    :style="editorViewStyle"
    @wheel="handleWheel"
    @scroll="!inBgRemoveMode ? scrollUpdate() : null"
    @pointerdown="selectStart"
    @pointerleave="removePointer"
    @pointerup="selectEnd"
    @mousewheel="handleWheel"
    @pinch="!inBgRemoveMode ? pinchUtils.pinchHandler($event) : null"
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
import PageNumber from '@/components/editor/PageNumber.vue'
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'
import PageCard from '@/components/editor/mobile/PageCard.vue'
import { ICoordinate } from '@nu/vivi-lib/interfaces/frame'
import { IGroup, IImage, ILayer } from '@nu/vivi-lib/interfaces/layer'
import { IPage, IPageState } from '@nu/vivi-lib/interfaces/page'
import { ILayerInfo, LayerType } from '@nu/vivi-lib/store/types'
import SwipeDetector from '@nu/vivi-lib/utils/SwipeDetector'
import backgroundUtils from '@nu/vivi-lib/utils/backgroundUtils'
import constantData from '@nu/vivi-lib/utils/constantData'
import controlUtils from '@nu/vivi-lib/utils/controlUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import eventUtils from '@nu/vivi-lib/utils/eventUtils'
import formatUtils from '@nu/vivi-lib/utils/formatUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import { MovingUtils } from '@nu/vivi-lib/utils/movingUtils'
import PagePinchUtils from '@nu/vivi-lib/utils/pagePinchUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import pointerEvtUtils from '@nu/vivi-lib/utils/pointerEvtUtils'
import StepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import tiptapUtils from '@nu/vivi-lib/utils/tiptapUtils'
import uploadUtils from '@nu/vivi-lib/utils/uploadUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

const MAX_SCALE = 300
const TRANSITION_TIME = constantData.pinchTransitionTime

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
      movingUtils: null as unknown as MovingUtils,
      pinchUtils: null as unknown as PagePinchUtils,
      pointerEvent: {
        initPos: null as null | ICoordinate
      }
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
      this.mounted = true
    })
    this.getRecently()

    StepsUtils.record()
    this.editorView = this.$refs.editorView as HTMLElement
    this.editorCanvas = this.$refs.canvas as HTMLElement
    this.swipeDetector = new SwipeDetector(this.editorView, { targetDirection: 'vertical' }, this.handleSwipe)

    this.cardHeight = this.editorView ? this.editorView.clientHeight : 0
    this.cardWidth = this.editorView ? this.editorView.clientWidth : 0

    pageUtils.fitPage()
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
    this.pinchUtils = new PagePinchUtils(this.$refs.editorView as HTMLElement)
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
      isPinchingEditor: 'isPinchingEditor',
      isDisableSwipe: 'isDisableSwipe'
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
      if (!this.inBgRemoveMode && !controlUtils.isClickOnController(e)) {
        editorUtils.setInBgSettingMode(false)
        groupUtils.deselect()
        this.setCurrActivePageIndex(-1)
        pageUtils.setBackgroundImageControlDefault()
        editorUtils.setInMultiSelectionMode(false)
        pageUtils.findCentralPageIndexInfo()
      }
      if (imageUtils.isImgControl()) {
        controlUtils.updateLayerProps(this.getMiddlemostPageIndex, this.lastSelectedLayerIndex, { imgControl: false })
      }
    },
    selectStart(e: PointerEvent) {
      pointerEvtUtils.addPointer(e)
      if (pointerEvtUtils.pointerIds.length >= 3) {
        return this.pinchUtils.pinchEnd(e as any)
      }
      if (!e.isPrimary) return
      if (this.inBgRemoveMode) return

      e.stopPropagation()
      if (this.hasCopiedFormat) {
        formatUtils.clearCopiedFormat()
      }

      const layer = ['group', 'frame'].includes(layerUtils.getCurrLayer.type) && layerUtils.subLayerIdx !== -1
        ? groupUtils.mapLayersToPage(
          [layerUtils.getCurrConfig as IImage],
          layerUtils.getCurrLayer as IGroup,
        )[0]
      : layerUtils.getCurrLayer
      const isClickOnController = controlUtils.isClickOnController(e, layer)

      if (this.isImgCtrl && !isClickOnController) {
        const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
        switch (currLayer.type) {
          case LayerType.image:
          case LayerType.group:
            layerUtils.updateLayerProps(pageIndex, layerIndex, { imgControl: false }, subLayerIdx)
            break
          case LayerType.frame:
            frameUtils.updateFrameLayerProps(pageIndex, layerIndex, subLayerIdx, { imgControl: false })
            break
        }
        return
      }

      if (isClickOnController) {
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
      this.pointerEvent.initPos = { x: e.x, y: e.y }
    },
    selectEnd(e: PointerEvent) {
      if (this.pointerEvent.initPos) {
        const isSingleTouch = pointerEvtUtils.pointers.length === 1
        const isConsiderNotMoved = Math.abs(e.x - this.pointerEvent.initPos.x) < 5 && Math.abs(e.y - this.pointerEvent.initPos.y) < 5
        if (isSingleTouch && isConsiderNotMoved && !this.$store.getters['imgControl/isImgCtrl']) {
          // the moveingEnd would consider the layer to be selected,
          // however in this case the layer should be consider as deselected, bcz the position is thought as not moved.
          // following code remove the moveEnd event.
          if (this.$store.getters.getControlState.type === 'move') {
            this.$store.commit('SET_STATE', { controlState: { type: '' } })
          }
          const layer = layerUtils.getCurrLayer
          if (!controlUtils.isClickOnController(e, layer)) {
            groupUtils.deselect()
            this.movingUtils?.removeListener()
          }
        }
        this.pointerEvent.initPos = null
      }
      pointerEvtUtils.removePointer(e.pointerId)
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
    swipeUpHandler() {
      if (!this.isDetailPage && !this.hasSelectedLayer && !this.isBgImgCtrl && !this.isImgCtrl) {
        if (pageUtils.scaleRatio > pageUtils.mobileMinScaleRatio) {
          return
        }
        this.isSwiping = true
        // e.stopImmediatePropagation()
        if (this.pageNum - 1 !== this.currCardIndex) {
          this.setCurrCardIndex(this.currCardIndex + 1)
          groupUtils.deselect()
          this.setCurrActivePageIndex(this.currCardIndex)
          this.$nextTick(() => {
            pageUtils.fitPage()
          })
        } else {
          groupUtils.deselect()
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
          groupUtils.deselect()
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
      if (this.isDisableSwipe || this.isPinchingEditor) return
      if (dir === 'up') {
        this.swipeUpHandler()
      } else if (dir === 'down') {
        this.swipeDownHandler()
      }
    },
    removePointer(e: PointerEvent) {
      pointerEvtUtils.removePointer(e.pointerId)
    },
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
