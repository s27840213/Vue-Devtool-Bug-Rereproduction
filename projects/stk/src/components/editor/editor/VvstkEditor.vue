<template lang="pug">
div(class="vvstk-editor" ref="editorView" :style="copyingStyles()"
  @pointerdown="selectStart"
  @pointerup="selectEnd"
  @pinch="onPinch"
  @pointerleave="removePointer"
  v-touch)
  div(class="vvstk-editor__pages-container" :style="containerStyles()")
    transition-group(name="scale-in-fade-out" tag="div" class="vvstk-editor__pages" @before-leave="handleBeforePageLeave" :css="animated")
      page-card(v-for="(page, index) in pagesState" :key="`page-${page.config.id}`"
                :class="{'no-transition': currActivePageIndex < 0}"
                :pageIndex="index"
                :pageState="page"
                :cardWidth="cardWidth"
                :cardHeight="cardHeight"
                :marginTop="marginTop"
                :no-bg="!editorTypeTemplate"
                @click.self.prevent="outerClick")
      div(v-if="editorTypeTemplate" class="page-add" :id="`page-card-${pagesState.length}`" key="page-add")
        div(class="page-add__page body-SM flex-column flex-center")
          div(class="page-add__text text-white" v-html="$t('STK0075')")
          div(class="page-add__btn text-black-3 bg-white flex-center" @click="addPage")
            svg-icon(class="page-add__btn__icon" iconName="add-page" iconWidth="24px" iconColor="gray-2")
            div(class="page-add__btn__text") {{ $t('STK0076') }}
  div(v-if="editorTypeTemplate && !isDuringCopy" class="page-pill" @click="showPanelPageManagement")
    svg-icon(iconName="pages" iconWidth="20px" iconColor="black-5")
    span(class="page-pill__text body-XS text-black-5 no-wrap") {{ strPagePill }}
  page-preview(v-if="isInPagePreview" :pagesState="pagesState")
  share-template(v-if="isInTemplateShare" :isMultiPage="pagesState.length > 1")
  div(v-if="isInBgRemoveSection"
      class="vvstk-editor__bg-remove-container")
    panel-remove-bg(:need-calculate-mobile-panel-height="false")
      //- bg-remove-container(v-if="bgRemoveContainerRef"
      //-   :containerWH="containerWH"
      //-   :containerRef="bgRemoveContainerRef"
      //-   :previewSrc="bgRemovePreviewSrc")
</template>

<script lang="ts">
import PageCard from '@/components/editor/mobile/PageCard.vue'
import ShareTemplate from '@/components/editor/mobile/ShareTemplate.vue'
import { ICoordinate } from '@nu/vivi-lib/interfaces/frame'
import { ILayer, IText } from '@nu/vivi-lib/interfaces/layer'
import PagePreview from '@/components/editor/pagePreview/PagePreview.vue'
import PanelRemoveBg from '@/components/editor/panelMobile/PanelRemoveBg.vue'
import { IPageState } from '@nu/vivi-lib/interfaces/page'
import { ILayerInfo, LayerType } from '@nu/vivi-lib/store/types'
import SwipeDetector from '@nu/vivi-lib/utils/SwipeDetector'
import controlUtils from '@nu/vivi-lib/utils/controlUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import { MovingUtils } from '@nu/vivi-lib/utils/movingUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import PinchControlUtils from '@nu/vivi-lib/utils/pinchControlUtils'
import pointerEvtUtils from '@nu/vivi-lib/utils/pointerEvtUtils'
import resizeUtils from '@nu/vivi-lib/utils/resizeUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
import { AnyTouchEvent } from 'any-touch'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  components: {
    PageCard,
    PagePreview,
    ShareTemplate,
    PanelRemoveBg
  },
  props: {
    isInEditor: {
      type: Boolean,
      required: true
    },
    marginBottom: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      marginTop: 44,
      cardWidth: 0,
      cardHeight: 0,
      animated: false,
      swipeDetector: null as unknown as SwipeDetector,
      bgRemoveContainerRef: null as unknown as HTMLElement,
      isInPageAdd: false,
      isPinchInit: false,
      pinchControlUtils: null as null | PinchControlUtils,
      movingUtils: null as null | MovingUtils,
      mobilePanelHeight: 0,
      pointerEvent: {
        initPos: null as null | ICoordinate
      }
    }
  },
  mounted() {
    const editorView = this.$refs.editorView as HTMLElement
    this.bgRemoveContainerRef = this.$refs.bgRemoveContainer as HTMLElement
    this.swipeDetector = new SwipeDetector(editorView, { targetDirection: 'horizontal' }, this.handleSwipe)
  },
  beforeUnmount() {
    this.swipeDetector.unbind()
  },
  watch: {
    isProcessing(val) {
      if (val === true) {
        this.$nextTick(() => {
          this.bgRemoveContainerRef = this.$refs.bgRemoveContainer as HTMLElement
        })
      }
    },
    isInEditor(newVal, oldVal): void {
      if (newVal && !oldVal) {
        this.$nextTick(() => {
          this.handleResize()
          this.animated = true
        })
      } else {
        this.animated = false
      }
      // if (newVal && this.inEffectEditingMode) {
      //   this.$nextTick(() => {
      //     editorUtils.setCurrActivePanel('photo-shadow')

      //     if (this.inEffectEditingMode) {
      //       const data = (imageShadowUtils.getDefaultEffect(ShadowEffectType.frame) as any).frame
      //       /**
      //      * Prevent setEffect not work
      //      */
      //       setTimeout(() => {
      //         imageShadowUtils.setEffect(ShadowEffectType.frame, { frame: data, frameColor: '#EFCD56' })
      //       }, 300)
      //     }
      //   })
      // }
    },
    windowSize: {
      handler(): void {
        if (!this.isInEditor) return
        this.$nextTick(() => {
          this.handleResize()
        })
      },
      deep: true
    },
    currFocusPageIndex() {
      editorUtils.setInBgSettingMode(false)
    },
    currActivePageIndex(newVal) {
      if (newVal === -1) this.$nextTick(() => { stkWVUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 300) })
    },
    showMobilePanel(val) {
      if (val) {
        this.$nextTick(() => {
          // to prevent the problems that the mobile panel is not fully expanded
          setTimeout(() => {
            const panel = document.querySelector('.mobile-panel')
            if (panel && panel.clientHeight) {
              /**
               * @Note 60 is the size of footer tab
               */
              this.mobilePanelHeight = panel.clientHeight
            } else {
              this.mobilePanelHeight = 0
            }
          }, 500)
        })
      } else {
        this.mobilePanelHeight = 0
      }
    }
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize'
    }),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      getMiddlemostPageIndex: 'getMiddlemostPageIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      pagesState: 'getPagesState',
      getLayer: 'getLayer',
      editorBg: 'vivisticker/getEditorBg',
      editorType: 'vivisticker/getEditorType',
      editorTypeTemplate: 'vivisticker/getEditorTypeTemplate',
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      contentScaleRatio: 'getContentScaleRatio',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      isImgCtrl: 'imgControl/isImgCtrl',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
      isInTemplateShare: 'vivisticker/getIsInTemplateShare',
      isInPagePreview: 'vivisticker/getIsInPagePreview',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      isProcessing: 'bgRemove/getIsProcessing',
      isInBgRemoveSection: 'vivisticker/getIsInBgRemoveSection',
      controlState: 'getControlState',
    }),
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    },
    strPagePill(): string {
      return this.pagesState.length > 1 ? `${this.currFocusPageIndex + 1} / ${this.pagesState.length}` : this.$t('STK0070')
    },
    pageSize(): { width: number, height: number } {
      return {
        width: this.pagesState[this.pagesState.length - 1].config.width,
        height: this.pagesState[this.pagesState.length - 1].config.height
      }
    },
    isPageNumMax(): boolean {
      return this.pagesState.length >= stkWVUtils.MAX_PAGE_NUM
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
    }
  },
  methods: {
    ...mapMutations({
      setCurrActivePageIndex: 'SET_currActivePageIndex',
    }),
    copyingStyles() {
      return this.isDuringCopy ? { background: 'transparent' } : {}
    },
    containerStyles() {
      return this.isInEditor ? { transform: `translateY(-${this.marginBottom}px)` } : {}
    },
    outerClick() {
      editorUtils.setInBgSettingMode(false)
      pageUtils.setBackgroundImageControlDefault()
    },
    selectStart(e: PointerEvent) {
      this.recordPointer(e)
      if (this.inBgRemoveMode || this.isInBgRemoveSection) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const isClickOnController = controlUtils.isClickOnController(e)
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
      if (layerUtils.layerIndex !== -1) {
        // when there is an layer being active, the moving logic applied to the EditorView
        this.movingUtils = new MovingUtils({
          _config: { config: layerUtils.getCurrLayer },
          snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
          body: document.getElementById(`nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`) as HTMLElement
        })
        this.movingUtils.moveStart(e)
        this.pointerEvent.initPos = { x: e.x, y: e.y }
      }
    },
    // the reason to use pointerdown + pointerup to detect a click/tap for delecting layer,
    // is bcz the native click/tap event is triggered as the event happened in a-short-time even the layer has moved a little position,
    // this would lead to wrong UI/UX as moving-layer-feature no longer needs the touches above at the layer.
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
    recordPointer(e: PointerEvent) {
      pointerEvtUtils.addPointer(e)
    },
    removePointer(e: PointerEvent) {
      pointerEvtUtils.removePointer(e.pointerId)
    },
    onPinch(e: AnyTouchEvent) {
      // console.log('onPinch this.$store.getters.getControlState', this.$store.getters.getControlState.type, e.phase, pointerEvtUtils.pointerIds.length)
      if (e.phase === 'end' && this.isPinchInit) {
        // pinch end handling
        this.pinchHandler(e)
        this.isPinchInit = false
        this.pinchControlUtils = null
      } else {
        const touches = (e.nativeEvent as TouchEvent).touches
        if (touches.length !== 2 || layerUtils.layerIndex === -1) return
        if (!this.isPinchInit) {
          // first pinch initialization
          this.isPinchInit = true
          return this.pinchStart(e)
        } else {
          // pinch move handling
          this.pinchHandler(e)
        }
      }
    },
    pinchHandler(e: AnyTouchEvent) {
      this.pinchControlUtils?.pinch(e)
    },
    pinchStart(e: AnyTouchEvent) {
      if (this.$store.getters['imgControl/isImgCtrl'] || this.$store.getters['imgControl/isImgCtrl']) return

      const _config = { config: layerUtils.getLayer(layerUtils.pageIndex, layerUtils.layerIndex) } as unknown as { config: ILayer }

      if (_config.config.type === 'text') {
        if ((_config.config as IText).contentEditable) return
      }

      const  layerInfo = new Proxy({
        pageIndex: layerUtils.pageIndex,
        layerIndex: layerUtils.layerIndex
      }, {
        get(_, key) {
          if (key === 'pageIndex') return layerUtils.pageIndex
          else if (key === 'layerIndex') return layerUtils.layerIndex
        }
      }) as ILayerInfo
      const movingUtils = new MovingUtils({
        _config,
        layerInfo,
        snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
        body: document.getElementById(`nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`) as HTMLElement
      })
      const data = {
        layerInfo,
        config: undefined,
        movingUtils: movingUtils as MovingUtils
      }
      this.pinchControlUtils = new PinchControlUtils(data)
    },
    showPanelPageManagement() {
      editorUtils.setCurrActivePanel('page-management')
      editorUtils.setShowMobilePanel(true)
    },
    handleResize() {
      if (this.isInTemplateShare || this.isInPagePreview) return

      // resize all pages
      this.pagesState.forEach((pageState: IPageState, pageIndex: number) => {
        resizeUtils.resizePage(pageIndex, pageState.config, stkWVUtils.getPageSize(this.editorType))
      })

      // update margin-top
      const elTop = document.getElementsByClassName('vivisticker__top')[0]
      const headerHeight = 44
      const shortEdge = Math.min(elTop.clientWidth, elTop.clientHeight - headerHeight)
      this.marginTop = Math.round(shortEdge * 0.05)

      // update page card size
      const elEditor = this.$el as HTMLElement
      this.cardWidth = elEditor.clientWidth
      this.cardHeight = elEditor.clientHeight

      // reset initial step to prevent wrong size of page when undo
      if (stepsUtils.steps.length === 1) stepsUtils.reset()

      this.$nextTick(() => { stkWVUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 0) })
    },
    handleSwipe(dir: string) {
      if (this.hasSelectedLayer || this.isBgImgCtrl || this.isImgCtrl || this.isInTemplateShare) return
      if (dir === 'right') {
        if (!this.isInPageAdd) this.setCurrActivePageIndex(Math.max(0, this.currFocusPageIndex - 1))
        this.isInPageAdd = false
        this.$nextTick(() => { stkWVUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 300) })
      } else if (dir === 'left') {
        if (pageUtils.currFocusPageIndex === this.pagesState.length - 1) {
          if (!this.editorTypeTemplate || this.isPageNumMax) return
          this.isInPageAdd = true
          stkWVUtils.scrollIntoPage(this.pagesState.length, 300)
        } else {
          this.setCurrActivePageIndex(Math.min(this.currFocusPageIndex + 1, this.pagesState.length - 1))
          this.$nextTick(() => { stkWVUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 300) })
        }
      }
    },
    handleBeforePageLeave(el: Element) {
      const elTarget = el as HTMLElement
      const { margin, marginLeft, marginTop, width, height } = window.getComputedStyle(elTarget)

      // set absolute position
      elTarget.style.left = `${elTarget.offsetLeft - parseFloat(marginLeft)}px`
      elTarget.style.top = `${elTarget.offsetTop - parseFloat(marginTop)}px`

      // set computed size
      elTarget.style.width = width
      elTarget.style.height = height
      elTarget.style.margin = margin
    },
    addPage() {
      const lastPage = this.pagesState[this.pagesState.length - 1].config
      pageUtils.addPageToPos(pageUtils.newPage({
        width: lastPage.width,
        height: lastPage.height,
        physicalWidth: lastPage.physicalWidth,
        backgroundColor: lastPage.backgroundColor,
        physicalHeight: lastPage.physicalHeight,
        isEnableBleed: lastPage.isEnableBleed,
        bleeds: lastPage.bleeds,
        physicalBleeds: lastPage.physicalBleeds,
        unit: lastPage.unit
      }), this.pagesState.length)
      this.setCurrActivePageIndex(this.pagesState.length - 1)
      this.$nextTick(() => { stkWVUtils.scrollIntoPage(this.pagesState.length - 1, 500) })
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.vvstk-editor {
  @include size(100%);
  background: setColor(black-2);
  &__pages-container {
    @include size(100%);
    overflow: hidden;
    transition: transform 0.3s map-get($ease-functions, ease-in-out-quint);
  }
  &__pages {
    display: grid;
    grid-auto-flow: column;
    position: relative;
  }
  &__bg-remove-container {
    background-color: setColor(black-2);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100% - v-bind(mobilePanelHeight)* 1px);
    max-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__event-section {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.page-add {
  width: v-bind("`${cardWidth}px`");
  height: v-bind("`${cardHeight}px`");
  &__page {
    margin: 0 auto;
    width: v-bind("`${pageSize.width}px`");
    height: v-bind("`${pageSize.height}px`");
    margin-top: v-bind("`${marginTop}px`");
    background-color: setColor(black-3);
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    border-radius: 10px;
    row-gap: 20px;
  }
  &__text {
    white-space: pre-wrap;
  }
  &__btn {
    border-radius: 10px;
    padding: 9px 16px;
    column-gap: 8px;
  }
}

.page-pill {
  @include size(80px, 30px);
  padding: 4px 8px;
  box-sizing: border-box;
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  background-color: setColor(black-3);
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 4px;
}

.scale-in-fade-out {
  &-move {
    transition: v-bind("animated ? 'transform 500ms ease-in-out' : 'none'");
  }
  &-enter-active {
    transition: transform 500ms ease-in-out;
    transform: scale(1);
  }
  &-enter-from {
    transform: scale(0.75);
  }
  &-leave-active {
    transition: opacity 500ms ease-in-out;
    position: absolute;
  }
  &-leave-to {
    opacity: 0;
  }
}

.no-transition {
  transition: none !important;
}
</style>
