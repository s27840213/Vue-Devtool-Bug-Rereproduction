<template lang="pug">
div(ref="page-wrapper" :style="pageRootStyles" :id="`nu-page-wrapper_${pageIndex}`")
  div(class="nu-page"
      :id="`nu-page_${pageIndex}`"
      :style="pageStyles"
      ref="page")
    div(v-if="!isDetailPage && !$isTouchDevice"
      class="page-title text-left pb-10"
      :style="{'width': `${config.width * (scaleRatio/100)}px`, 'transform': `translate3d(0, -100%, ${isAnyLayerActive ? 0 : 1}px)`}")
      //- span(class="pr-10") 第 {{pageIndex+1}} 頁
      span(class="pr-10") {{$t('NN0134', {num:`${pageIndex+1}`})}}
      input(
        type="text"
        v-model="pageName"
        :placeholder="`${$t('NN0081')}`"
        @focus="pageNameFocused()"
        @blur="stepRecord()")
      div(class="nu-page__icons"
        v-if="!isBackgroundImageControl")
        svg-icon(class="pointer btn-line-template mr-15"
          :pageIndex="pageIndex"
          :iconName="'line-template'" :iconWidth="`${18}px`" :iconColor="'gray-3'"
          @click.native="openLineTemplatePopup()"
          v-hint="$t('NN0138')"
        )
        //- svg-icon(class="pointer mr-5"
        //-   :iconName="'caret-up'" :iconWidth="`${8}px`" :iconColor="'gray-3'"
        //-   @click.native="")
        //- svg-icon(class="pointer mr-15"
        //-   :iconName="'caret-down'" :iconWidth="`${8}px`" :iconColor="'gray-3'"
        //-   @click.native="")
        svg-icon(class="pointer mr-10"
          :iconName="'add-page'" :iconWidth="`${18}px`" :iconColor="'gray-3'"
          @click.native="addPage()"
          v-hint="$t('NN0139')"
        )
        svg-icon(class="pointer"
          :class="[{'mr-10': getPageCount > 1}]"
          :iconName="'duplicate-page'" :iconWidth="`${18}px`" :iconColor="'gray-3'"
          @click.native="duplicatePage()"
          v-hint="$t('NN0140')"
        )
        svg-icon(class="pointer"
          v-if="getPageCount > 1" :iconName="'trash'" :iconWidth="`${18}px`" :iconColor="'gray-3'"
          @click.native="deletePage()"
          v-hint="$t('NN0141')"
        )
    div(v-if="isDetailPage && !$isTouchDevice" class="page-bar text-left mb-5" :style="{'height': `${config.height * (scaleRatio/100)}px`,}")
      div(class="page-bar__icons" v-if="!isBackgroundImageControl")
        div(class="body-2")
          span {{pageIndex + 1}}
        //- svg-icon(class="pointer mt-10"
        //-   :iconName="'caret-up'" :iconWidth="`${10}px`" :iconColor="'gray-2'"
        //-   @click.native="")
        //- svg-icon(class="pointer mt-10"
        //-   :iconName="'caret-down'" :iconWidth="`${10}px`" :iconColor="'gray-2'"
        //-   @click.native="")
        svg-icon(class="pointer mt-15"
          :iconName="'add-page'" :iconWidth="`${15}px`" :iconColor="'gray-2'"
          @click.native="addPage()")
        svg-icon(class="pointer mt-10"
          :iconName="'duplicate-page'" :iconWidth="`${15}px`" :iconColor="'gray-2'"
          @click.native="duplicatePage()")
        svg-icon(class="pointer mt-10"
          v-if="getPageCount > 1" :iconName="'trash'" :iconWidth="`${15}px`" :iconColor="'gray-2'"
          @click.native="deletePage()")
    template(v-if="!isOutOfBound || hasEditingText")
      div(class='pages-wrapper'
          :class="`nu-page-${pageIndex}`"
          :style="wrapperStyles"
          @keydown.self="handleSpecialCharacter"
          @keydown.delete.exact.self.prevent.stop="ShortcutUtils.del()"
          @keydown.ctrl.c.exact.self.prevent.stop="ShortcutUtils.copy()"
          @keydown.meta.c.exact.self.prevent.stop="ShortcutUtils.copy()"
          @keydown.ctrl.d.exact.self.prevent.stop="ShortcutUtils.deselect()"
          @keydown.meta.d.exact.self.prevent.stop="ShortcutUtils.deselect()"
          @keydown.ctrl.x.exact.self.prevent.stop="ShortcutUtils.cut()"
          @keydown.meta.x.exact.self.prevent.stop="ShortcutUtils.cut()"
          @keydown.ctrl.s.exact.self.prevent.stop="ShortcutUtils.save()"
          @keydown.meta.s.exact.self.prevent.stop="ShortcutUtils.save()"
          @keydown.ctrl.v.exact.self.prevent.stop="ShortcutUtils.paste($event)"
          @keydown.meta.v.exact.self.prevent.stop="ShortcutUtils.paste($event)"
          @keydown.ctrl.g.exact.self.prevent.stop="ShortcutUtils.group()"
          @keydown.meta.g.exact.self.prevent.stop="ShortcutUtils.group()"
          @keydown.ctrl.a.exact.self.prevent.stop="ShortcutUtils.selectAll()"
          @keydown.meta.a.exact.self.prevent.stop="ShortcutUtils.selectAll()"
          @keydown.ctrl.shift.g.exact.self.prevent.stop="ShortcutUtils.ungroup()"
          @keydown.meta.shift.g.exact.self.prevent.stop="ShortcutUtils.ungroup()"
          @keydown.ctrl.z.exact.self.prevent.stop="undo()"
          @keydown.meta.z.exact.self.prevent.stop="undo()"
          @keydown.ctrl.shift.z.exact.self.prevent.stop="redo()"
          @keydown.meta.shift.z.exact.self.prevent.stop="redo()"
          @keydown.ctrl.-.exact.self.prevent.stop="ShortcutUtils.zoomOut()"
          @keydown.meta.-.exact.self.prevent.stop="ShortcutUtils.zoomOut()"
          @keydown.ctrl.+.exact.self.prevent.stop="ShortcutUtils.zoomIn()"
          @keydown.meta.+.exact.self.prevent.stop="ShortcutUtils.zoomIn()"
          @keydown.left.exact.self.prevent.stop="ShortcutUtils.left()"
          @keydown.up.exact.self.prevent.stop="ShortcutUtils.up()"
          @keydown.right.exact.self.prevent.stop="ShortcutUtils.right()"
          @keydown.down.exact.self.prevent.stop="ShortcutUtils.down()"
          @keydown.shift.left.exact.self.prevent.stop="ShortcutUtils.left(true)"
          @keydown.shift.up.exact.self.prevent.stop="ShortcutUtils.up(true)"
          @keydown.shift.right.exact.self.prevent.stop="ShortcutUtils.right(true)"
          @keydown.shift.down.exact.self.prevent.stop="ShortcutUtils.down(true)"
          @mouseover="togglePageHighlighter(true)"
          @mouseleave="togglePageHighlighter(false)"
          tabindex="0")
        //- command/ctrl + 61/173 for Firefox keycode, http://www.javascripter.net/faq/keycodes.htm
        lazy-load(
            class="lazy-load"
            target=".editor-view"
            :rootMargin="'1500px 0px 1500px 0px'"
            v-bind="lazyloadSize"
            :threshold="[0,1]")
          div(:style="sizeStyles")
            div(class="scale-container relative"
                :style="scaleContainerStyles")
              page-content(:config="config" :pageIndex="pageIndex" :page="config" :contentScaleRatio="contentScaleRatio" :snapUtils="snapUtils")
              div(v-if="showAllAdminTool" class="layer-num") Layer數量: {{config.layers.length}}
              dim-background(v-if="imgControlPageIdx === pageIndex" :config="config" :contentScaleRatio="contentScaleRatio")
            div(v-if="imgControlPageIdx !== pageIndex" class="page-control" :style="styles('control')")
              nu-controller(v-if="currFocusPageIndex === pageIndex && currLayer.type" data-identifier="controller"
                :key="`controller-${currLayer.id}`"
                :layerIndex="currSelectedIndex"
                :pageIndex="pageIndex"
                :page="config"
                :config="currLayer"
                :snapUtils="snapUtils"
                :contentScaleRatio="contentScaleRatio"
                @setFocus="setFocus()"
                @isDragging="handleDraggingController")
      div(v-show="!isBgImgCtrl && (pageIsHover || currFocusPageIndex === pageIndex)"
        class="page-highlighter"
        :style="wrapperStyles")
      //- for ruler to get rectangle of page content (without bleeds)
      div(v-if="config.isEnableBleed" :class="`nu-page-bleed-${pageIndex}`" :style="bleedLineAreaStyles()")
      div(v-if="(currActivePageIndex === pageIndex && isDetailPage && !isImgCtrl && !isBgImgCtrl)"
          class="page-resizer"
          ref="pageResizer"
          @pointerdown.left.stop="pageResizeStart($event)"
          @touchstart="disableTouchEvent"
          @mouseenter="toggleResizerHint(true)"
          @mouseleave="toggleResizerHint(false)")
        svg-icon(class="page-resizer__resizer-bar"
          :iconName="'move-vertical'" :iconWidth="`${15}px`" :iconColor="'white'")
        div(class="page-resizer__resizer-bar")
        div(v-show="isShownResizerHint" class="page-resizer__hint no-wrap") {{resizerHint}}
      snap-line-area(
        :config="config"
        :pageIndex="pageIndex"
        :snapUtils="snapUtils"
      )
    template(v-else)
      div(class='pages-wrapper'
        :class="`nu-page-${pageIndex}`"
        :style="wrapperStyles")
</template>

<script lang="ts">
import NuBackgroundController from '@/components/editor/global/NuBackgroundController.vue'
import DimBackground from '@/components/editor/page/DimBackground.vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import SnapLineArea from '@/components/editor/page/SnapLineArea.vue'
import LazyLoad from '@/components/LazyLoad.vue'
import i18n from '@/i18n'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import { IPage, IPageState } from '@/interfaces/page'
import { FunctionPanelType, LayerType, SidebarPanelType } from '@/store/types'
import cssConverter from '@/utils/cssConverter'
import eventUtils from '@/utils/eventUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import imageShadowUtils from '@/utils/imageShadowUtils'
import ImageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import MouseUtils from '@/utils/mouseUtils'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import SnapUtils from '@/utils/snapUtils'
import StepsUtils from '@/utils/stepsUtils'
import unitUtils, { PRECISION } from '@/utils/unitUtils'
import { notify } from '@kyvg/vue3-notification'
import { floor, round } from 'lodash'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  components: {
    NuBackgroundController,
    PageContent,
    DimBackground,
    SnapLineArea,
    LazyLoad
  },
  created() {
    this.updateSnapUtilsIndex(this.pageIndex)
  },
  // updated() {
  //   console.warn('updated! ', this.pageIndex)
  // },
  data() {
    return {
      initialAbsPos: { x: 0, y: 0 },
      initialRelPos: { x: 0, y: 0 },
      currentAbsPos: { x: 0, y: 0 },
      currentRelPos: { x: 0, y: 0 },
      isShownScrollBar: false,
      tmpYDiff: 0,
      tmpToTop: false,
      initialPageHeight: 0,
      isShownResizerHint: false,
      isResizingPage: false,
      pageIsHover: false,
      ImageUtils,
      layerUtils,
      ShortcutUtils,
      // for test used
      coordinate: null as unknown as HTMLElement,
      coordinateWidth: 0,
      coordinateHeight: 0,
      // snapUtils: new SnapUtils(this.pageIndex),
      closestSnaplines: {
        v: [] as Array<number>,
        h: [] as Array<number>
      },
      generalUtils,
      pageUtils,
      currDraggingIndex: -1
    }
  },
  props: {
    pageState: {
      type: Object as PropType<IPageState>,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    isAnyBackgroundImageControl: {
      type: Boolean,
      required: true
    },
    overflowContainer: {
      type: HTMLElement
    },
    isScaling: {
      type: Boolean,
      default: false
    },
    /**
     * @param minContentScaleRatio - pre-calculated contentScaleRatio to prevent the size switch animation when doing swipe up/down gesture
     */
    minContentScaleRatio: {
      type: Number,
      default: 0
    }
  },
  emits: ['stepChange'],
  mounted() {
    this.initialPageHeight = (this.config as IPage).height
    this.$nextTick(() => {
      this.isShownScrollBar = !(this.overflowContainer?.scrollHeight === this.overflowContainer?.clientHeight)
      // const el = this.$refs.page as HTMLElement
      // const pz = new PinchZoom(el, {
      //   minZoom: (pageUtils.mobileMinScaleRatio * 0.01),
      //   onZoomStart: (pz, e) => {
      //     console.log('zoom start', pz)
      //   },
      //   onDoubleTap: (pz, e) => {
      //     console.log('onDoubleTap', pz, e)
      //   }
      // })
    })
  },
  watch: {
    pageIndex(val) {
      this.updateSnapUtilsIndex(val)
    },
    isOutOfBound(val) {
      if (val && this.currFunctionPanelType === FunctionPanelType.photoShadow && layerUtils.pageIndex === this.pageIndex) {
        GroupUtils.deselect()
        const { pageId, layerId, subLayerId } = this.handleId
        if (pageId === this.config.id) {
          const layer = (this.config.layers.find(l => l.id === layerId) as IGroup)
          const target = (layer.type === LayerType.group ? (layer as IGroup).layers.find(l => l.id === subLayerId) : layer) as IImage
          if (target) {
            const layerInfo = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
            imageShadowUtils.updateShadowSrc(layerInfo, target.styles.shadow.srcObj)
          }
        }
      }
    },
    contentScaleRatio(val) {
      console.warn(this.pageIndex, val)
    }
  },
  computed: {
    ...mapState(['isMoving', 'currDraggedPhoto']),
    ...mapState('shadow', ['handleId']),
    ...mapGetters({
      imgControlPageIdx: 'imgControl/imgControlPageIdx'
    }),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      pages: 'getPages',
      getPage: 'getPage',
      currPanel: 'getCurrSidebarPanelType',
      groupType: 'getGroupType',
      lockGuideline: 'getLockGuideline',
      currFunctionPanelType: 'getCurrFunctionPanelType',
      isProcessingShadow: 'shadow/isProcessing',
      _contentScaleRatio: 'getContentScaleRatio',
      pagesLength: 'getPagesLength',
      showAllAdminTool: 'user/showAllAdminTool',
      useMobileEditor: 'getUseMobileEditor',
      currCardIndex: 'mobileEditor/getCurrCardIndex',
      topBound: 'page/getTopBound',
      bottomBound: 'page/getBottomBound',
      isImgCtrl: 'imgControl/isImgCtrl',
      isBgImgCtrl: 'imgControl/isBgImgCtrl'
    }),
    contentScaleRatio(): number {
      // return this.pageState.config.contentScaleRatio
      // if (this.$isTouchDevice) {
      if (generalUtils.isTouchDevice()) {
        return this.pageState.config.contentScaleRatio
      } else {
        return 1
      }
    // contentScaleRatio():number {
    //   return this.minContentScaleRatio && this.useMobileEditor ? this.minContentScaleRatio : this._contentScaleRatio
    // },
    },
    config(): IPage {
      if (!this.pageState.config.isEnableBleed) return this.pageState.config
      return {
        ...this.pageState.config,
        ...pageUtils.getPageSizeWithBleeds(this.pageState.config)
      }
    },
    lazyloadSize(): unknown {
      if (generalUtils.isTouchDevice()) {
        return {
          minHeight: this.config.height * this.contentScaleRatio,
          maxHeight: this.config.height * this.contentScaleRatio
        }
      } else {
        return {
          minHeight: this.config.height * (this.scaleRatio / 100),
          maxHeight: this.config.height * (this.scaleRatio / 100)
        }
      }
    },
    scaleContainerStyles(): { [index: string]: string } {
      return {
        width: `${this.config.width * this.contentScaleRatio}px`,
        height: `${this.config.height * this.contentScaleRatio}px`,
        ...(!generalUtils.isTouchDevice() && { transform: `scale(${this.scaleRatio / 100 / this.contentScaleRatio})` }),
        willChange: this.isScaling ? 'transform' : ''
      }
    },
    snapUtils(): SnapUtils {
      return this.pageState.modules.snapUtils
    },
    currLayer(): ILayer {
      return layerUtils.getCurrLayer
    },
    getPageCount(): number {
      return this.pages.length
    },
    pageName: {
      get(): string {
        return this.config.name
      },
      set(value: string): void {
        this.$store.commit('UPDATE_pageProps', {
          pageIndex: this.pageIndex,
          props: {
            name: value
          }
        })
      }
    },
    isBackgroundImageControl(): boolean {
      return this.config.backgroundImage.config.imgControl
    },
    isAnyLayerActive(): boolean {
      return this.currSelectedIndex !== -1
    },
    guidelines(): { [index: string]: Array<number> } {
      return (this.config as IPage).guidelines
    },
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    },
    isDetailPage(): boolean {
      return this.groupType === 1
    },
    pageStyles(): any {
      return {
        // margin: this.isDetailPage ? '0px auto' : '25px auto',
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    },
    pageRootStyles(): { [index: string]: string | number } {
      const transform = ''
      let margin = ''
      let position = 'relative'
      if (this.$isTouchDevice) {
        position = 'absolute'
      } else {
        margin = this.isDetailPage ? '0px auto' : '25px auto'
      }
      return {
        position,
        transform,
        margin,
        ...this.sizeStyles
      }
    },
    isOutOfBound(): boolean {
      return this.$isTouchDevice && !this.isDetailPage ? (this.pageIndex <= this.currCardIndex - 2 || this.pageIndex >= this.currCardIndex + 2)
        : this.pageIndex <= (this.topBound - 4) || this.pageIndex >= (this.bottomBound + 4)
    },
    hasEditingText(): boolean {
      const page = this.config as IPage
      for (const layer of page.layers) {
        switch (layer.type) {
          case 'text':
            if ((layer as IText).contentEditable) return true
            break
          case 'group':
            for (const subLayer of (layer as IGroup).layers) {
              if (subLayer.type === 'text' && (subLayer as IText).contentEditable) return true
            }
            break
        }
      }
      return false
    },
    getHalation(): unknown[] {
      const { styles: { adjust } } = this.config.backgroundImage.config as IImage
      const { width, height } = this.config
      const { posX, posY } = this.config.backgroundImage
      const position = {
        width: width / 2 * this.contentScaleRatio,
        x: (-posX + width / 2) * this.contentScaleRatio,
        y: (-posY + height / 2) * this.contentScaleRatio
      }
      return imageAdjustUtil.getHalation(adjust.halation, position)
    },
    selectedLayerCount(): number {
      return this.currSelectedInfo.layers.length
    },
    resizerHint(): string {
      return !this.isResizingPage ? '拖曳調整畫布高度' : `${round(this.pageState.config.physicalHeight, PRECISION)}${this.config.unit}`
    },
    sizeStyles(): any {
      return {
        width: `${this.config.width * this.contentScaleRatio * this.scaleRatio * 0.01}px`,
        height: `${this.config.height * this.contentScaleRatio * this.scaleRatio * 0.01}px`
      }
    },
    wrapperStyles(): Record<string, string> {
      return {
        ...this.sizeStyles,
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    }
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setDropdown: 'popup/SET_STATE',
      setPanelType: 'SET_currFunctionPanelType',
      setSidebarType: 'SET_currSidebarPanelType',
      setCurrHoveredPageIndex: 'SET_currHoveredPageIndex',
      updateSnapUtilsIndex: 'UPDATE_snapUtilsIndex'
    }),
    styles(type: string): Record<string, string> {
      return type === 'content' ? {
        width: `${this.config.width * this.contentScaleRatio}px`,
        height: `${this.config.height * this.contentScaleRatio}px`,
        backgroundColor: this.config.backgroundColor,
        backgroundImage: `url(${ImageUtils.getSrc(this.config.backgroundImage.config)})`,
        backgroundPosition: this.config.backgroundImage.posX === -1 ? 'center center'
          : `${this.config.backgroundImage.posX}px ${this.config.backgroundImage.posY}px`,
        backgroundSize: `${this.config.backgroundImage.config.styles.imgWidth}px ${this.config.backgroundImage.config.styles.imgHeight}px`
      } : {
        ...this.sizeStyles,
        overflow: this.selectedLayerCount > 0 ? 'initial' : 'hidden',
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    },
    handleSpecialCharacter(e: KeyboardEvent) {
      // For those using keyCode in their codebase, we recommend converting them to their kebab-cased named equivalents.
      // The keys for some punctuation marks can just be included literally. e.g. For the , key:
      // Limitations of the syntax prevent certain characters from being matched, such as ", ', /, =, >, and .. For those characters you should check event.key inside the listener instead.
      if (e.key === '=' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        e.stopPropagation()
        ShortcutUtils.zoomIn()
      }
    },
    snapLineStyles(dir: string, pos: number, isGuideline?: string) {
      pos = pos * (this.scaleRatio / 100)
      return dir === 'v' ? {
        height: '100%',
        width: '1px',
        transform: `translate(${pos}px,0)`,
        'pointer-events': isGuideline && !this.isMoving ? 'auto' : 'none'
      } : {
        width: '100%',
        height: '1px',
        transform: `translate(0,${pos}px)`,
        'pointer-events': isGuideline && !this.isMoving ? 'auto' : 'none'
      }
    },
    bleedLineAreaStyles() {
      if (!this.config.isEnableBleed) {
        return {
          top: '0px',
          bottom: '0px',
          left: '0px',
          right: '0px'
        }
      }
      const scaleRatio = this.scaleRatio / 100
      return {
        top: this.config.bleeds.top * scaleRatio + 'px',
        bottom: this.config.bleeds.bottom * scaleRatio + 'px',
        left: this.config.bleeds.left * scaleRatio + 'px',
        right: this.config.bleeds.right * scaleRatio + 'px'
      }
    },
    addNewLayer(pageIndex: number, layer: IShape | IText | IImage | IGroup): void {
      this.ADD_newLayers({
        pageIndex: pageIndex,
        layers: [layer]
      })
    },
    togglePageHighlighter(isHover: boolean): void {
      this.pageIsHover = isHover
      this.setCurrHoveredPageIndex(isHover ? this.pageIndex : -1)
    },
    toggleResizerHint(isHover: boolean): void {
      this.isShownResizerHint = isHover
    },
    setFocus(): void {
      this.$nextTick(() => {
        const currPage = this.$refs.page as HTMLElement
        currPage.focus()
      })
    },
    addPage() {
      const { getCurrLayer: currLayer, layerIndex, pageIndex } = layerUtils
      layerUtils.updateLayerProps(pageIndex, layerIndex, { active: false, shown: false })
      if (currLayer) {
        switch (currLayer.type) {
          case 'tmp':
            GroupUtils.deselect()
            break
          case 'group':
            (currLayer as IGroup).layers
              .forEach((l, idx) => {
                if (l.active) {
                  layerUtils.updateSubLayerProps(pageIndex, layerIndex, idx, {
                    active: false,
                    shown: false,
                    ...(l.type === 'image' && { imgControl: false })
                  })
                }
              })
            break
          case 'frame':
            (currLayer as IFrame).clips
              .forEach((_, idx) => {
                frameUtils.updateFrameLayerProps(pageIndex, layerIndex, idx, { active: false, shown: false, imgControl: false })
              })
            break
        }
      }

      this.setPanelType(FunctionPanelType.none)
      this.setPanelType(SidebarPanelType.template)
      GroupUtils.reset()

      pageUtils.addPageToPos(pageUtils.newPage({
        width: this.pageState.config.width,
        height: this.pageState.config.height,
        backgroundColor: this.pageState.config.backgroundColor,
        physicalWidth: this.pageState.config.physicalWidth,
        physicalHeight: this.pageState.config.physicalHeight,
        isEnableBleed: this.pageState.config.isEnableBleed,
        bleeds: this.pageState.config.bleeds,
        physicalBleeds: this.pageState.config.physicalBleeds,
        unit: this.pageState.config.unit
      }), this.pageIndex + 1)
      this.setCurrActivePageIndex(this.pageIndex + 1)
      this.$nextTick(() => { pageUtils.scrollIntoPage(this.pageIndex + 1) })
      StepsUtils.record()
    },
    deletePage() {
      GroupUtils.deselect()
      if (this.pages.length - 1 === this.pageIndex) {
        this.setCurrActivePageIndex(this.pageIndex - 1)
      } else {
        this.setCurrActivePageIndex(this.pageIndex)
      }
      this.$nextTick(() => {
        pageUtils.deletePage(this.pageIndex)
        StepsUtils.record()
      })
    },
    duplicatePage() {
      if (this.isProcessingShadow) {
        notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
        return
      }
      GroupUtils.deselect()
      const page = generalUtils.deepCopy(this.pageState.config) as IPage
      page.layers.forEach(l => {
        l.id = generalUtils.generateRandomString(8)
        if (l.type === LayerType.frame) {
          (l as IFrame).clips.forEach(c => (c.id = generalUtils.generateRandomString(8)))
        } else if (l.type === LayerType.group) {
          (l as IGroup).layers.forEach(l => (l.id = generalUtils.generateRandomString(8)))
        }
      })
      page.designId = ''
      page.id = generalUtils.generateRandomString(8)
      pageUtils.addPageToPos(page, this.pageIndex + 1)
      this.setCurrActivePageIndex(this.pageIndex + 1)
      this.$nextTick(() => { pageUtils.scrollIntoPage(this.pageIndex + 1) })
      StepsUtils.record()
    },
    backgroundControlStyles() {
      const backgroundImage = this.config.backgroundImage
      return {
        width: `${backgroundImage.config.styles.imgWidth * this.contentScaleRatio}px`,
        height: `${backgroundImage.config.styles.imgHeight * this.contentScaleRatio}px`,
        left: `${backgroundImage.posX * this.contentScaleRatio}px`,
        top: `${backgroundImage.posY * this.contentScaleRatio}px`
      }
    },
    backgroundContorlClipStyles() {
      const { posX, posY } = this.config.backgroundImage
      return {
        clipPath: `path('M${-posX * this.contentScaleRatio},${-posY * this.contentScaleRatio}h${this.config.width * this.contentScaleRatio}v${this.config.height * this.contentScaleRatio}h${-this.config.width * this.contentScaleRatio}z`,
        'pointer-events': 'none'
      }
    },
    backgroundFlipStyles() {
      const { horizontalFlip, verticalFlip } = this.config.backgroundImage.config.styles
      return cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
    },
    openLineTemplatePopup() {
      popupUtils.openPopup('line-template', {
        target: `.btn-line-template[pageIndex="${this.pageIndex}"]`,
        posX: 'right'
      })
    },
    scrollUpdate() {
      const event = new PointerEvent('pointermove', {
        clientX: this.currentAbsPos.x,
        clientY: this.currentAbsPos.y
      })
      window.dispatchEvent(event)
    },
    pageResizeStart(e: PointerEvent) {
      this.initialPageHeight = this.pageState.config.height
      this.isResizingPage = true
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.overflowContainer as HTMLElement)
      this.initialAbsPos = this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      eventUtils.addPointerEvent('pointermove', this.pageResizing)
      if (this.overflowContainer) {
        this.overflowContainer.addEventListener('scroll', this.scrollUpdate, { capture: true })
      }
      eventUtils.addPointerEvent('pointerup', this.pageResizeEnd)
    },
    pageResizing(e: PointerEvent) {
      this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.overflowContainer as HTMLElement)
      const isShownScrollbar = (this.overflowContainer?.scrollHeight === this.overflowContainer?.clientHeight)

      if (isShownScrollbar === this.isShownScrollBar) {
        const multiplier = isShownScrollbar ? 2 : 1
        const yDiff = (this.currentRelPos.y - this.initialRelPos.y) * multiplier * (100 / this.scaleRatio)
        const minHeight = Math.max(pageUtils.MIN_SIZE, this.config.bleeds?.top ?? 0 + this.config.bleeds?.bottom ?? 0)
        const maxHeight = floor(pageUtils.MAX_AREA / this.config.width)
        const newHeight = Math.min(Math.max(Math.trunc(this.initialPageHeight + yDiff), minHeight), maxHeight)
        const dpi = pageUtils.getPageDPI(this.pageState.config)
        const newPhysicalHeight = unitUtils.convert(newHeight / dpi.height, 'in', this.config.unit)
        pageUtils.updatePageProps({
          height: newHeight,
          physicalHeight: newPhysicalHeight
        })
      } else {
        this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.overflowContainer as HTMLElement)
        this.initialAbsPos = this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
        this.initialPageHeight = this.pageState.config.height
      }
      this.isShownScrollBar = isShownScrollbar
    },
    pageResizeEnd(e: PointerEvent) {
      this.initialPageHeight = this.pageState.config.height
      this.isResizingPage = false
      const newHeight = Math.round(this.pageState.config.height)
      const dpi = pageUtils.getPageDPI(this.pageState.config)
      const newPhysicalHeight = unitUtils.convert(newHeight / dpi.height, 'in', this.config.unit)
      pageUtils.updatePageProps({
        height: newHeight,
        physicalHeight: newPhysicalHeight
      })
      StepsUtils.record()
      this.$nextTick(() => {
        eventUtils.removePointerEvent('pointermove', this.pageResizing)
        if (this.overflowContainer) {
          this.overflowContainer.removeEventListener('scroll', this.scrollUpdate, { capture: true })
        }
        eventUtils.removePointerEvent('pointerup', this.pageResizeEnd)
      })
      pageUtils.findCentralPageIndexInfo()
    },
    pageNameFocused() {
      ShortcutUtils.deselect()
    },
    stepRecord() {
      StepsUtils.record()
    },
    undo() {
      ShortcutUtils.undo()
      if (!StepsUtils.isInFirstStep) {
        this.$emit('stepChange')
      }
    },
    redo() {
      ShortcutUtils.redo()
      if (!StepsUtils.isInLastStep) {
        this.$emit('stepChange')
      }
    },
    disableTouchEvent(e: TouchEvent) {
      if (this.$isTouchDevice) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    handleDraggingController(index: number) {
      this.currDraggingIndex = index
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-page {
  position: relative;
  user-select: none;

  &__icons {
    display: flex;
    align-items: center;
  }
}

.page-title {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  white-space: nowrap;
  > span {
    font-size: 14px;
  }
  > input {
    min-width: 40px;
    background-color: transparent;
    text-overflow: ellipsis;

    ::placeholder {
      /* Chrome, Firefox, Opera, Safari 10.1+ */
      color: setColor(gray-3);
      opacity: 1; /* Firefox */
    }

    :-ms-input-placeholder {
      /* Internet Explorer 10-11 */
      color: setColor(gray-3);
    }

    ::-ms-input-placeholder {
      /* Microsoft Edge */
      color: setColor(gray-3);
    }
  }
}

.page-bar {
  position: absolute;
  right: 0;
  top: 0;
  transform: translate3d(calc(100% + 10px), 0, 2000px);
  &__icons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}
.pages-wrapper {
  position: relative;
  box-sizing: content-box;
  outline: none;
  // &:empty {
  //   background-color: setColor(gray-4);
  // }
}
.scale-container {
  width: 0px;
  height: 0px;
  position: relative;
  box-sizing: border-box;
  transform-origin: 0 0;
}

.page-highlighter {
  position: absolute;
  top: -2px;
  left: -2px;
  border: 2px solid setColor(blue-2);
  z-index: setZindex("page-highlighter");
  pointer-events: none;
}
.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  // this css property will prevent the page-control div from blocking all the event of page-content
  pointer-events: none;
  :focus {
    outline: none;
  }
}

.page-resizer {
  @include flexCenter();
  position: absolute;
  bottom: 0px;
  left: 0px;
  pointer-events: auto;
  background-color: setColor(blue-2);
  width: 100%;
  height: 1rem;
  cursor: row-resize;
  transform: translate3d(0, 0, 1000px);
  &__hint {
    position: absolute;
    top: calc(-100% - 15px);
    left: 50%;
    transform: translate(-50%, 0);
    color: setColor(white);
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 5px;
    box-sizing: border-box;
    background: setColor(gray-2);
  }
}

.layer-img {
  background: red;
  opacity: 0.5;
  pointer-events: none;
}

.skeleton {
  background-color: setColor(white);
}

.layer-num {
  position: absolute;
  bottom: -20px;
  left: 50%;
}

div[class*="nu-page-bleed"] {
  pointer-events: none;
  position: absolute;
  left: 0px;
  top: 0px;
}
</style>
