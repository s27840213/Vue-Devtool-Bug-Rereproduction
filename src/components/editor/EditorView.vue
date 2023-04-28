<template lang="pug">
div(class="editor-view bg-gray-5"
    :style="cursorStyles()"
    @pointerdown="!inBgRemoveMode ? !getInGestureMode ? selectStart($event) : dragEditorViewStart($event) : null"
    @wheel="handleWheel"
    @scroll.passive="!inBgRemoveMode ? scrollUpdate() : null"
    @mousewheel="handleWheel"
    @contextmenu.prevent
    ref="editorView")
  disk-warning(class="editor-view__warning" size="large")
  div(class="editor-view__grid")
    div(class="editor-view__canvas"
        ref="canvas"
        @pointerdown.left.self="outerClick($event)")
      //- @mousedown.left.self="outerClick($event)")
      template(v-if="!inBgRemoveMode")
        nu-page(v-for="(page,index) in pagesState"
                :key="`page-${page.config.id}`"
                :pageIndex="index"
                :overflowContainer="editorView"
                :style="{'z-index': `${getPageZIndex(index)}`}"
                :pageState="page" :index="index" :isAnyBackgroundImageControl="isBackgroundImageControl"
                @stepChange="handleStepChange")
        div(v-show="isSelecting" class="selection-area" ref="selectionArea"
          :style="{zIndex: pageNum+3}")
      bg-remove-area(v-else :editorViewCanvas="editorViewCanvas")
    template(v-if="showRuler && !isShowPagePreview")
      ruler-hr(:canvasRect="canvasRect"
        :editorView="editorView"
        @pointerdown.stop="dragStartH($event)")
      ruler-vr(:canvasRect="canvasRect"
        :editorView="editorView"
        @pointerdown.stop="dragStartV($event)")
      div(class="corner-block")
  div(v-if="!inBgRemoveMode"
      class="editor-view__guidelines-area"
      ref="guidelinesArea")
    div(v-if="isShowGuidelineV" class="guideline guideline--v" ref="guidelineV"
        :style="{'cursor': `url(${require('@/assets/img/svg/ruler-v.svg')}) 16 16, pointer`}"
        @pointerdown.left.stop="lockGuideline ? null: dragStartV($event)"
        @mouseout.stop="closeGuidelineV()"
        @pointerup.right.stop.prevent="openGuidelinePopup($event)")
      div(class="guideline__pos guideline__pos--v" ref="guidelinePosV")
        span {{rulerVPos}}
    div(v-if="isShowGuidelineH" class="guideline guideline--h" ref="guidelineH"
        :style="{'cursor': `url(${require('@/assets/img/svg/ruler-h.svg')}) 16 16, pointer`}"
        @pointerdown.left.stop="lockGuideline ? null : dragStartH($event)"
        @mouseout.stop="closeGuidelineH()"
        @pointerup.right.stop.prevent="openGuidelinePopup($event)")
      div(class="guideline__pos guideline__pos--h" ref="guidelinePosH")
        span {{rulerHPos}}
</template>

<script lang="ts">
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'
import RulerHr from '@/components/editor/ruler/RulerHr.vue'
import RulerVr from '@/components/editor/ruler/RulerVr.vue'
import DiskWarning from '@/components/payment/DiskWarning.vue'
import i18n from '@/i18n'
import { IPage, IPageState } from '@/interfaces/page'
import app from '@/main'
import ControlUtils from '@/utils/controlUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils from '@/utils/eventUtils'
import formatUtils from '@/utils/formatUtils'
import generalUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import mathUtils from '@/utils/mathUtils'
import modalUtils from '@/utils/modalUtils'
import MouseUtils from '@/utils/mouseUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import RulerUtils from '@/utils/rulerUtils'
import shapeUtils from '@/utils/shapeUtils'
import StepsUtils from '@/utils/stepsUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import unitUtils, { PRECISION } from '@/utils/unitUtils'
import uploadUtils from '@/utils/uploadUtils'
import { notify } from '@kyvg/vue3-notification'
import { round } from 'lodash'
import { PropType, defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    RulerHr,
    RulerVr,
    BgRemoveArea,
    DiskWarning
  },
  data() {
    return {
      isSelecting: false,
      isShowGuidelineV: false,
      isShowGuidelineH: false,
      initialRelPos: { x: 0, y: 0 },
      currentAbsPos: { x: 0, y: 0 },
      currentRelPos: { x: 0, y: 0 },
      editorView: null as unknown as HTMLElement,
      editorViewCanvas: null as unknown as HTMLElement,
      guidelinesArea: null as unknown as HTMLElement,
      backgroundControllingPageIndex: -1,
      canvasRect: null as unknown as DOMRect,
      rulerVPos: 0,
      rulerHPos: 0,
      lastMappedVPos: 0,
      lastMappedHPos: 0,
      from: -1,
      screenWidth: document.documentElement.clientWidth,
      screenHeight: document.documentElement.clientHeight,
      scrollHeight: 0
    }
  },
  created() {
    app.mixin({
      data() {
        return {
          // Access by self.timeStart
          // eslint-disable-next-line vue/no-unused-properties
          timeStart: 0
        }
      },
      beforeUpdate() {
        const self = this as any
        if (!editorUtils.enalbleComponentLog) return
        self.timeStart = performance.now()
      },
      updated() {
        // tiny workaround for typescript errors
        if (!editorUtils.enalbleComponentLog) return
        const self = this as any
        const timeSpent = performance.now() - self.timeStart
        const omitTarget = ['ComponentLog', 'ComponentLogItem', 'DesktopEditor', 'LazyLoad']
        if (omitTarget.includes(self.$options.name)) return

        const tmpArr = String(self.$options.__file).split('/')
        const componentName = tmpArr[tmpArr.length - 1]

        // undefined means it's Vue built-in component
        if (componentName === 'undefined') return

        window.requestAnimationFrame(() => {
          self.$eventBus.emit('on-re-rendering', {
            component: componentName,
            name: self.$options.name,
            __name: self.$options.__name,
            parent: self.$options.parent?._name ?? 'no parent',
            time: timeSpent,
            propsData: {
              index: self.$options.propsData?.index,
              pageIndex: self.$options.propsData?.pageIndex,
              layerIndex: self.$options.propsData?.layerIndex
            }
          })
        })
      }
    })

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
    // window.addEventListener('keydown', this.handleKeydown)
    // window.addEventListener('keyup', this.handleKeydown)
    this.getRecently()

    StepsUtils.record()
    this.editorView = this.$refs.editorView as HTMLElement
    this.editorViewCanvas = this.$refs.canvas as HTMLElement
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
          if (this.isShowGuidelineV) {
            this.closeGuidelineV()
          }

          this.isShowGuidelineV = true
          this.lastMappedVPos = pagePos
          this.rulerVPos = round(unitUtils.convert(Math.round(this.lastMappedVPos), 'px', this.currPage.unit, pageUtils.getPageDPI().width), PRECISION)
          this.$nextTick(() => {
            const guidelineV = this.$refs.guidelineV as HTMLElement
            guidelineV.style.transform = `translate(${pos - guidelineAreaRect.left}px,0px)`
          })
          break
        }
        case 'h': {
          if (this.isShowGuidelineH) {
            this.closeGuidelineH()
          }
          this.isShowGuidelineH = true
          this.lastMappedHPos = pagePos
          this.rulerHPos = round(unitUtils.convert(Math.round(this.lastMappedHPos), 'px', this.currPage.unit, pageUtils.getPageDPI().height), PRECISION)

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
      if (!this.inBgRemoveMode && this.prevScrollPos.top !== -1) {
        const { top, left } = this.prevScrollPos
        // Restore original scroll position
        this.$nextTick(() => {
          editor.scrollLeft = left
          editor.scrollTop = top
          this.clearBgRemoveState()
        })
      } else {
        generalUtils.scaleFromCenter(editor)
      }
    },
    screenHeight() {
      pageUtils.findCentralPageIndexInfo()
    },
    isSidebarPanelOpen() {
      this.$nextTick(() => {
        this.canvasRect = (this.$refs.canvas as HTMLElement).getBoundingClientRect()
      })
    },
    showPagePanel() {
      this.$nextTick(() => {
        this.canvasRect = (this.$refs.canvas as HTMLElement).getBoundingClientRect()
      })
    }
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    },
    isSidebarPanelOpen: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    ...mapState({
      cursor: 'cursor',
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
      _showRuler: 'getShowRuler',
      lockGuideline: 'getLockGuideline',
      isShowPagePreview: 'page/getIsShowPagePreview',
      hasCopiedFormat: 'getHasCopiedFormat',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      prevScrollPos: 'bgRemove/getPrevScrollPos',
      getInGestureMode: 'getInGestureToolMode',
      isProcessImgShadow: 'shadow/isProcessing',
      isUploadImgShadow: 'shadow/isUploading',
      isSettingScaleRatio: 'getIsSettingScaleRatio',
      enableComponentLog: 'getEnalbleComponentLog',
      pagesLength: 'getPagesLength',
      isImgCtrl: 'imgControl/isImgCtrl',
      showPagePanel: 'page/getShowPagePanel',
      scaleRatio: 'getPageScaleRatio',
    }),
    pages(): Array<IPage> {
      return (this.pagesState as Array<IPageState>).map(p => p.config)
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
    isDragging(): boolean {
      return RulerUtils.isDragging
    },
    isHandleShadow(): boolean {
      return this.isProcessImgShadow || this.isUploadImgShadow
    },
    showRuler(): boolean {
      return this._showRuler && !this.inBgRemoveMode
    }
  },
  methods: {
    ...mapMutations({
      addLayer: 'ADD_selectedLayer',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setPageScaleRatio: 'SET_pageScaleRatio',
      setPrevScrollPos: 'bgRemove/SET_prevScrollPos',
      clearBgRemoveState: 'bgRemove/CLEAR_bgRemoveState',
      setInGestureMode: 'SET_inGestureMode'
    }),
    ...mapActions('layouts',
      [
        'getCategories',
        'getRecently'
      ]
    ),
    cursorStyles() {
      const { cursor } = this
      return cursor ? { cursor } : {}
    },
    outerClick(e: MouseEvent) {
      if (!this.inBgRemoveMode && !ControlUtils.isClickOnController(e)) {
        !this.isHandleShadow && GroupUtils.deselect()
        GroupUtils.deselect()
        this.setCurrActivePageIndex(-1)
        pageUtils.setBackgroundImageControlDefault()
        pageUtils.findCentralPageIndexInfo()
        if (imageUtils.isImgControl()) {
          ControlUtils.updateLayerProps(this.getMiddlemostPageIndex, this.lastSelectedLayerIndex, { imgControl: false })
        }
      }
    },
    selectStart(e: PointerEvent) {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (this.isImgCtrl || this.getInGestureMode) return
      if (layerUtils.layerIndex !== -1) {
        /**
         * when the user click the control-region outsize the page,
         * the moving logic should be applied to the EditorView.
         */
        if (ControlUtils.isClickOnController(e)) {
          const movingUtils = new MovingUtils({
            _config: { config: layerUtils.getCurrLayer },
            snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
            body: document.getElementById(`nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`) as HTMLElement
          })
          movingUtils.moveStart(e)
          return
        }
      }
      if (this.hasCopiedFormat) {
        formatUtils.clearCopiedFormat()
      }
      if (imageUtils.isImgControl()) {
        ControlUtils.updateLayerProps(this.getMiddlemostPageIndex, this.lastSelectedLayerIndex, { imgControl: false })
      }
      this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.$refs.canvas as HTMLElement)
      eventUtils.addPointerEvent('pointermove', this.selecting)
      eventUtils.addPointerEvent('pointerup', this.selectEnd)
      window.addEventListener('scroll', this.scrollUpdate, { capture: true })
    },
    selecting(e: MouseEvent) {
      if (!this.isSelecting) {
        if (this.currSelectedInfo.layers.length === 1 && this.currSelectedInfo.layers[0].locked) {
          // TODO
          // GroupUtils.deselect()
          // imageUtils.setImgControlDefault(false)
          if (!this.isHandleShadow) {
            GroupUtils.deselect()
          } else {
            imageUtils.setImgControlDefault(false)
          }
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
        const event = new PointerEvent('pointermove', {
          clientX: this.currentAbsPos.x,
          clientY: this.currentAbsPos.y
        })
        window.dispatchEvent(event)
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
      pageUtils.findCentralPageIndexInfo(tiptapUtils.editor?.view?.hasFocus?.() || this.isSettingScaleRatio)
    },
    selectEnd() {
      if (this.isSelecting) {
        if (!this.isHandleShadow) {
          GroupUtils.deselect()
        } else {
          notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
          imageUtils.setImgControlDefault(false)
        }
      }
      /**
       * Use nextTick to trigger the following function after DOM updating
       */
      this.$nextTick(() => {
        eventUtils.removePointerEvent('pointermove', this.selecting)
        window.removeEventListener('scroll', this.scrollUpdate, { capture: true })
        eventUtils.removePointerEvent('pointerup', this.selectEnd)
        if (this.isSelecting) {
          this.isSelecting = false
          const selectionArea = this.$refs.selectionArea as HTMLElement
          if (!this.isHandleShadow) {
            this.handleSelectionData(selectionArea.getBoundingClientRect())
          } else {
            imageUtils.setImgControlDefault(false)
          }
        }
      })
    },
    handleSelectionData(selectionData: DOMRect) {
      const page = (this.pagesState as IPageState[])[pageUtils.currFocusPageIndex].config
      const layers = page.layers

      const pageEle = document.querySelector(`.nu-page-content-${pageUtils.currFocusPageIndex}`) as HTMLElement
      const pageData = pageEle.getBoundingClientRect()
      const selectionPolygonConfig = selectionData.toJSON()
      selectionPolygonConfig.x = (selectionPolygonConfig.x - pageData.x) / this.scaleRatio * 100
      selectionPolygonConfig.y = (selectionPolygonConfig.y - pageData.y) / this.scaleRatio * 100
      selectionPolygonConfig.width = selectionPolygonConfig.width / this.scaleRatio * 100
      selectionPolygonConfig.height = selectionPolygonConfig.height / this.scaleRatio * 100

      const layerIndexs: number[] = []
      if (layers.length > 0) {
        layers.forEach((layer, index) => {
          let layerPolygonConfig
          if (shapeUtils.isLine(layer)) {
            const { x, y, width, height, rotate } = ControlUtils.getControllerStyleParameters(layer.point ?? [], layer.styles, true, layer.size?.[0])
            layerPolygonConfig = {
              x,
              y,
              width,
              height,
              rotate
            }
          } else {
            layerPolygonConfig = {
              x: layer.styles.x,
              y: layer.styles.y,
              width: layer.styles.width,
              height: layer.styles.height,
              rotate: layer.styles.rotate
            }
          }
          if (!layer.locked && mathUtils.calculateIfIntersect(selectionPolygonConfig, layerPolygonConfig)) {
            layerIndexs.push(index)
          }
        })
      }
      if (layerIndexs.length > 0) {
        GroupUtils.select(pageUtils.currFocusPageIndex, layerIndexs)
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
        if (pageUtils.currFocusPageIndex === index) return this.pageNum + 2

        // if the page was hovered, make it bring the 2nd highest z-index to prevent highlighter from being blocking by other pages
        if (pageUtils.currHoveredPageIndex === index) return this.pageNum + 1
        return this.pageNum - index
      }
    },
    dragStartV(e: PointerEvent) {
      RulerUtils.setIsDragging(true)
      this.isShowGuidelineV = true
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.guidelinesArea)
      eventUtils.addPointerEvent('pointermove', this.draggingV)
      window.addEventListener('scroll', this.scrollUpdate, { capture: true })
      eventUtils.addPointerEvent('pointerup', this.dragEndV)
    },
    draggingV(e: PointerEvent) {
      this.lastMappedVPos = this.mapGuidelineToPage('v').pos
      this.rulerVPos = round(unitUtils.convert(Math.round(this.lastMappedVPos), 'px', this.currPage.unit, pageUtils.getPageDPI().width), PRECISION)
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.guidelinesArea)
      this.renderGuidelineV(this.currentRelPos)
    },
    dragEndV(e: PointerEvent) {
      RulerUtils.setIsDragging(false)
      if (this.from === -1) {
        const mouseOverPageIndex = RulerUtils.getMouseOverPageIndex(e)
        if (mouseOverPageIndex === -1) { // if no page contains mouse
          const mostlyOverlappedPageIndex = RulerUtils.getMostlyOverlappedPageIndex(e)
          if (mostlyOverlappedPageIndex === -1) {
            this.isShowGuidelineV = false
            StepsUtils.record()
          } else {
            this.from = mostlyOverlappedPageIndex
            if (pageUtils.currFocusPageIndex !== mostlyOverlappedPageIndex) {
              GroupUtils.deselect()
            }
            this.setCurrActivePageIndex(mostlyOverlappedPageIndex)
            this.closeGuidelineV(true)
          }
        } else {
          this.from = mouseOverPageIndex
          if (pageUtils.currFocusPageIndex !== mouseOverPageIndex) {
            GroupUtils.deselect()
          }
          this.setCurrActivePageIndex(mouseOverPageIndex)
          this.closeGuidelineV(true)
        }
      } else {
        if (this.mapGuidelineToPage('v').outOfPage) {
          this.isShowGuidelineV = false
          StepsUtils.record()
        } else {
          this.closeGuidelineV(true)
        }
      }
      this.$nextTick(() => {
        eventUtils.removePointerEvent('pointermove', this.draggingV)
        window.removeEventListener('scroll', this.scrollUpdate)
        eventUtils.removePointerEvent('pointerup', this.dragEndV)
      })
    },
    renderGuidelineV(pos: { x: number, y: number }) {
      const guidelineV = this.$refs.guidelineV as HTMLElement
      guidelineV.style.transform = `translate(${pos.x}px,0px)`
    },
    closeGuidelineV(need2Record = false) {
      if (!this.isDragging) {
        const pos = this.lastMappedVPos
        this.isShowGuidelineV = false
        if (this.from !== -1) {
          RulerUtils.addGuidelineToPage(pos, 'v', this.from)
        } else {
          RulerUtils.addGuidelineToPage(pos, 'v')
        }
        this.from = -1
        if (need2Record) {
          StepsUtils.record()
        }
      }
    },
    dragEditorViewStart(e: MouseEvent) {
      this.initialRelPos = MouseUtils.getMouseRelPoint(e, this.$refs.editorView as HTMLElement)
      window.addEventListener('mousemove', this.draggingEditorViewPage)
      // window.addEventListener('scroll', this.scrollUpdate, { capture: true })
      window.addEventListener('mouseup', this.dragditorViewPageEnd)
    },
    draggingEditorViewPage(e: MouseEvent) {
      const editor = this.$refs.editorView as HTMLElement
      const { x, y } = MouseUtils.getMouseRelPoint(e, editor)

      this.$nextTick(() => {
        // const scrollbarSize = generalUtils.getScrollbarSize(editor)
        const deltaX = x - this.initialRelPos.x
        const deltaY = y - this.initialRelPos.y
        editor.scrollLeft += deltaX * 0.8
        editor.scrollTop += deltaY * 0.8
        this.initialRelPos = { x, y }
      })
    },
    dragditorViewPageEnd() {
      this.$nextTick(() => {
        window.removeEventListener('mousemove', this.draggingEditorViewPage)
        // window.removeEventListener('scroll', this.scrollUpdate)
        window.removeEventListener('mouseup', this.dragditorViewPageEnd)
      })
    },
    dragStartH(e: MouseEvent) {
      RulerUtils.setIsDragging(true)
      this.isShowGuidelineH = true
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.guidelinesArea)
      window.addEventListener('mousemove', this.draggingH)
      window.addEventListener('scroll', this.scrollUpdate, { capture: true })
      window.addEventListener('mouseup', this.dragEndH)
    },
    draggingH(e: MouseEvent) {
      this.lastMappedHPos = this.mapGuidelineToPage('h').pos
      this.rulerHPos = round(unitUtils.convert(Math.round(this.lastMappedHPos), 'px', this.currPage.unit, pageUtils.getPageDPI().height), PRECISION)
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.guidelinesArea)
      this.renderGuidelineH(this.currentRelPos)
    },
    dragEndH(e: MouseEvent) {
      RulerUtils.setIsDragging(false)
      if (this.from === -1) {
        const guideline = this.$refs.guidelineH as HTMLElement
        const overlappedPageIndex = RulerUtils.getOverlappedPageIndex(guideline, 'h')
        if (overlappedPageIndex === -1) {
          this.isShowGuidelineH = false
          StepsUtils.record()
        } else {
          this.from = overlappedPageIndex
          if (pageUtils.currFocusPageIndex !== overlappedPageIndex) {
            GroupUtils.deselect()
          }
          this.setCurrActivePageIndex(overlappedPageIndex)
          this.closeGuidelineH(true)
        }
      } else {
        if (this.mapGuidelineToPage('h').outOfPage) {
          this.isShowGuidelineH = false
          StepsUtils.record()
        } else {
          // close EditorView guideline then put it into page
          // or the record point will have some trouble
          this.closeGuidelineH(true)
        }
      }
      this.$nextTick(() => {
        window.removeEventListener('mousemove', this.draggingH)
        window.removeEventListener('scroll', this.scrollUpdate)
        window.removeEventListener('mouseup', this.dragEndH)
      })
    },
    renderGuidelineH(pos: { x: number, y: number }) {
      const guidelineH = this.$refs.guidelineH as HTMLElement
      guidelineH.style.transform = `translate(0px,${pos.y}px)`
    },
    mapGuidelineToPage(type: string): { pos: number, outOfPage: boolean } {
      // just has two options: ['v','h']
      const guideline = type === 'v' ? this.$refs.guidelineV as HTMLElement : this.$refs.guidelineH as HTMLElement
      const from = type === 'v' ? this.from : RulerUtils.getOverlappedPageIndex(guideline, 'h')
      const result = RulerUtils.mapGuidelineToPage(guideline, type, from)
      return result
    },
    closeGuidelineH(need2Record = false) {
      console.log('close guideline H')
      if (!this.isDragging) {
        console.log('not dragging')
        this.isShowGuidelineH = false
        const pos = this.lastMappedHPos
        if (this.from !== -1) {
          RulerUtils.addGuidelineToPage(pos, 'h', this.from)
        } else {
          RulerUtils.addGuidelineToPage(pos, 'h')
        }
        this.from = -1
        if (need2Record) {
          StepsUtils.record()
        }
      }
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
    // handleKeydown(e: KeyboardEvent) {
    //   if (e.key === ' ') {
    //     e.preventDefault()
    //     if (!e.repeat) {
    //       this.setInGestureMode(!this.getInGestureMode)
    //     }
    //   }
    // }
  }
})
</script>

<style lang="scss" scoped>
$REULER_SIZE: 20px;

.editor-view {
  @include hover-scrollbar($showX: true);
  overflow: overlay;
  &::-webkit-scrollbar-thumb {
    border: none;
  }
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  position: relative;
  z-index: setZindex("editor-view");

  &__warning {
    width: 90%;
    margin: 54px auto 0 auto;
  }
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
    // cursor: url("/assets/icon/ruler-v.svg");
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
    // cursor: "/assets/icon/ruler/ruler-v.svg";
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
      padding: 3.2px 6.4px;
      font-size: 12px;
      top: 5px;
      left: 0;
    }
    &--v {
      top: 0px;
      left: 5px;
      border-radius: 50px;
      color: setColor(white);
      padding: 3.2px 6.4px;
      font-size: 12px;
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
</style>
