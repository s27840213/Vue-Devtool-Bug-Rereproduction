<template lang="pug">
  div(class="nu-page"
      :style="pageRootStyles"
      ref="page")
    div(v-if="!isOutOfBound && !isDetailPage && !isMobile && !isShowPagePreview"
      class="page-title text-left pb-10"
      :style="{'transform': `translate3d(0, -100%, ${isAnyLayerActive ? 0 : 1}px)`}")
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
    div(v-if="!isOutOfBound && isDetailPage && !isMobile && !isShowPagePreview" class="page-bar text-left mb-5" :style="{'height': `${config.height * (scaleRatio/100)}px`,}")
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
    lazy-load(
        target=".editor-view"
        :rootMargin="'1500px 0px 1500px 0px'"
        :minHeight="config.height * (scaleRatio / 100)"
        :maxHeight="config.height * (scaleRatio / 100)"
        :threshold="[0]"
        :pageIndex="pageIndex"
        :forceRender="hasEditingText"
        @loaded="handleLoaded")
      template(v-if="!isShowPagePreview || (hasEditingText)")
        div(class='pages-wrapper'
            :class="`nu-page-${pageIndex}`"
            :style="wrapperStyles()"
            @keydown.delete.exact.self.prevent.stop="ShortcutUtils.del()"
            @keydown.ctrl.67.exact.stop.prevent.self="ShortcutUtils.copy()"
            @keydown.meta.67.exact.stop.prevent.self="ShortcutUtils.copy()"
            @keydown.ctrl.68.exact.stop.prevent.self="ShortcutUtils.deselect()"
            @keydown.meta.68.exact.stop.prevent.self="ShortcutUtils.deselect()"
            @keydown.ctrl.88.exact.stop.prevent.self="ShortcutUtils.cut()"
            @keydown.meta.88.exact.stop.prevent.self="ShortcutUtils.cut()"
            @keydown.ctrl.83.exact.stop.prevent.self="ShortcutUtils.save()"
            @keydown.meta.83.exact.stop.prevent.self="ShortcutUtils.save()"
            @keydown.ctrl.86.exact.stop.prevent.self="ShortcutUtils.paste($event)"
            @keydown.meta.86.exact.stop.prevent.self="ShortcutUtils.paste($event)"
            @keydown.ctrl.71.exact.stop.prevent.self="ShortcutUtils.group()"
            @keydown.meta.71.exact.stop.prevent.self="ShortcutUtils.group()"
            @keydown.ctrl.65.exact.stop.prevent.self="ShortcutUtils.selectAll()"
            @keydown.meta.65.exact.stop.prevent.self="ShortcutUtils.selectAll()"
            @keydown.ctrl.shift.71.exact.stop.prevent.self="ShortcutUtils.ungroup()"
            @keydown.meta.shift.71.exact.stop.prevent.self="ShortcutUtils.ungroup()"
            @keydown.ctrl.90.exact.stop.prevent.self="undo()"
            @keydown.meta.90.exact.stop.prevent.self="undo()"
            @keydown.ctrl.shift.90.exact.stop.prevent.self="redo()"
            @keydown.meta.shift.90.exact.stop.prevent.self="redo()"
            @keydown.ctrl.187.exact.stop.prevent.self="ShortcutUtils.zoomIn()"
            @keydown.meta.187.exact.stop.prevent.self="ShortcutUtils.zoomIn()"
            @keydown.ctrl.61.exact.stop.prevent.self="ShortcutUtils.zoomIn()"
            @keydown.meta.61.exact.stop.prevent.self="ShortcutUtils.zoomIn()"
            @keydown.ctrl.189.exact.stop.prevent.self="ShortcutUtils.zoomOut()"
            @keydown.meta.189.exact.stop.prevent.self="ShortcutUtils.zoomOut()"
            @keydown.ctrl.107.exact.stop.prevent.self="ShortcutUtils.zoomIn()"
            @keydown.meta.107.exact.stop.prevent.self="ShortcutUtils.zoomIn()"
            @keydown.ctrl.109.exact.stop.prevent.self="ShortcutUtils.zoomOut()"
            @keydown.meta.109.exact.stop.prevent.self="ShortcutUtils.zoomOut()"
            @keydown.ctrl.173.exact.stop.prevent.self="ShortcutUtils.zoomOut()"
            @keydown.meta.173.exact.stop.prevent.self="ShortcutUtils.zoomOut()"
            @keydown.37.exact.stop.prevent.self="ShortcutUtils.left()"
            @keydown.38.exact.stop.prevent.self="ShortcutUtils.up()"
            @keydown.39.exact.stop.prevent.self="ShortcutUtils.right()"
            @keydown.40.exact.stop.prevent.self="ShortcutUtils.down()"
            @keydown.shift.37.exact.self.prevent.stop="ShortcutUtils.left(true)"
            @keydown.shift.38.exact.self.prevent.stop="ShortcutUtils.up(true)"
            @keydown.shift.39.exact.self.prevent.stop="ShortcutUtils.right(true)"
            @keydown.shift.40.exact.self.prevent.stop="ShortcutUtils.down(true)"
            @mouseover="togglePageHighlighter(true)"
            @mouseleave="togglePageHighlighter(false)"
            tabindex="0")
          //- command/ctrl + 61/173 for Firefox keycode, http://www.javascripter.net/faq/keycodes.htm
          div(class="scale-container relative"
              :style="scaleContainerStyles")
            page-content(:config="config"
              :pageIndex="pageIndex"
              :contentScaleRatio="contentScaleRatio"
              :snapUtils="snapUtils"
              :lazyLoadTarget="'.editor-view'"
              :forceRender="hasEditingText")
            div(v-if="isAdmin" class="layer-num") Layer數量: {{config.layers.length}} (Admin User 才看得到）
            div(v-if="currSelectedIndex !== -1" class="page-control" :style="styles('control')")
              nu-controller(v-if="currFocusPageIndex === pageIndex" data-identifier="controller"
                :key="`controller-${currLayer.id}`"
                :layerIndex="currSelectedIndex"
                :pageIndex="pageIndex"
                :config="currLayer"
                :snapUtils="snapUtils"
                :contentScaleRatio="contentScaleRatio")
            //- div(class="page-control" :style="styles('control')")
            //-   template(v-for="(layer, index) in config.layers")
            //-     nu-controller(v-if="(currDraggingIndex === -1 || currDraggingIndex === index || layer.type === 'frame') && (layer.type !== 'image' || !layer.imgControl) "
            //-       data-identifier="controller"
            //-       :key="`controller-${(layer.id === undefined) ? index : layer.id}`"
            //-       :layerIndex="index"
            //-       :pageIndex="pageIndex"
            //-       :config="layer"
            //-       :snapUtils="snapUtils"
            //-       :contentScaleRatio="contentScaleRatio"
            //-       @setFocus="setFocus()"
            //-       @isDragging="handleDraggingController")
            dim-background(v-if="imgControlPageIdx === pageIndex" :config="config" :pageScaleRatio="pageScaleRatio" :contentScaleRatio="contentScaleRatio")
        //- div(v-show="pageIsHover || currFocusPageIndex === pageIndex"
        //-   class="page-highlighter"
        //-   :style="wrapperStyles()")
      template(#placeholder)
        div(class='pages-wrapper'
          :class="`nu-page-${pageIndex}`"
          :style="wrapperStyles(true)"
          :key="'placeholder'")
    div(v-if="(currActivePageIndex === pageIndex && isDetailPage)"
        class="page-resizer"
        ref="pageResizer"
        @pointerdown.left.stop="pageResizeStart($event)"
        @touchstart="disableTouchEvent"
        @mouseenter="toggleResizerHint(true)"
        @mouseleave="toggleResizerHint(false)")
      svg-icon(class="page-resizer__resizer-bar"
        :iconName="'move-vertical'" :iconWidth="`${15}px`" :iconColor="'white'")
      div(class="page-resizer__resizer-bar")
      div(v-show="isShownResizerHint" class="page-resizer__hint no-wrap") {{!isResizingPage ? '拖曳調整畫布高度' : `${Math.trunc(config.height)}px`}}
    snap-line-area(
      :config="config"
      :pageIndex="pageIndex"
      :pageScaleRatio="pageScaleRatio"
      :snapUtils="snapUtils")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters, mapState } from 'vuex'
import { IShape, IText, IImage, IGroup, ILayer, ITmp, IFrame, IImageStyle } from '@/interfaces/layer'
import PageContent from '@/components/editor/page/PageContent.vue'
import LazyLoad from '@/components/LazyLoad.vue'
import MouseUtils from '@/utils/mouseUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GroupUtils from '@/utils/groupUtils'
import SnapUtils from '@/utils/snapUtils'
import { ISnapline } from '@/interfaces/snap'
import ImageUtils from '@/utils/imageUtils'
import popupUtils from '@/utils/popupUtils'
import layerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import NuImage from '@/components/editor/global/NuImage.vue'
import DimBackground from '@/components/editor/page/DimBackground.vue'
import SnapLineArea from '@/components/editor/page/SnapLineArea.vue'
import NuBackgroundController from '@/components/editor/global/NuBackgroundController.vue'
import rulerUtils from '@/utils/rulerUtils'
import { IPage } from '@/interfaces/page'
import { FunctionPanelType, LayerType, SidebarPanelType } from '@/store/types'
import frameUtils from '@/utils/frameUtils'
import pageUtils from '@/utils/pageUtils'
import cssConverter from '@/utils/cssConverter'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import i18n from '@/i18n'
import generalUtils from '@/utils/generalUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import eventUtils from '@/utils/eventUtils'

export default Vue.extend({
  inheritAttrs: false,
  components: {
    NuImage,
    NuBackgroundController,
    PageContent,
    DimBackground,
    SnapLineArea,
    LazyLoad
  },
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
      snapUtils: new SnapUtils(this.pageIndex),
      closestSnaplines: {
        v: [] as Array<number>,
        h: [] as Array<number>
      },
      generalUtils,
      pageUtils,
      currDraggingIndex: -1,
      isFocusedPage: false,
      isOutOfBound: false
    }
  },
  props: {
    config: Object as () => IPage,
    pageIndex: Number,
    pageScaleRatio: Number,
    isAnyBackgroundImageControl: Boolean,
    overflowContainer: HTMLElement,
    isScaling: Boolean
  },
  mounted() {
    this.initialPageHeight = (this.config as IPage).height
    this.$nextTick(() => {
      this.isShownScrollBar = !(this.overflowContainer?.scrollHeight === this.overflowContainer?.clientHeight)
    })
  },
  watch: {
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
    currFocusPageIndex(val) {
      if (val === this.pageIndex && !this.isFocusedPage) {
        this.isFocusedPage = true
      }

      if (val !== this.pageIndex && this.isFocusedPage) {
        this.isFocusedPage = false
      }
    }
  },
  computed: {
    ...mapState(['isMoving', 'currDraggedPhoto']),
    ...mapState('shadow', ['handleId']),
    ...mapGetters({
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      isImgCtrl: 'imgContorl/isImgCtrl',
      isShowPagePreview: 'page/getIsShowPagePreview',
      useMobileEditor: 'getUseMobileEditor'
    }),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currFocusPageIndex: 'getCurrFocusPageIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      pages: 'getPages',
      getPage: 'getPage',
      getLayer: 'getLayer',
      currPanel: 'getCurrSidebarPanelType',
      groupType: 'getGroupType',
      lockGuideline: 'getLockGuideline',
      currFunctionPanelType: 'getCurrFunctionPanelType',
      isProcessingShadow: 'shadow/isProcessing',
      contentScaleRatio: 'getContentScaleRatio',
      isAdmin: 'user/isAdmin'
    }),
    scaleContainerStyles(): { [index: string]: string } {
      return {
        // transform: `scale(${1})`
        width: `${this.config.width * this.contentScaleRatio}px`,
        height: `${this.config.height * this.contentScaleRatio}px`,
        transform: `scale(${this.scaleRatio / 100 / this.contentScaleRatio})`,
        willChange: this.isScaling ? 'transform' : ''
      }
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
    isDetailPage(): boolean {
      return this.groupType === 1
    },
    pageRootStyles(): { [index: string]: string } {
      return {
        margin: this.isDetailPage ? '0px auto' : '25px auto',
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
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
    isMobile(): boolean {
      return generalUtils.isTouchDevice()
    },
    selectedLayerCount(): number {
      return this.currSelectedInfo.layers.length
    }
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setDropdown: 'popup/SET_STATE',
      _addPage: 'ADD_page',
      _deletePage: 'DELETE_page',
      setPanelType: 'SET_currFunctionPanelType',
      setSidebarType: 'SET_currSidebarPanelType',
      setCurrHoveredPageIndex: 'SET_currHoveredPageIndex'
    }),
    styles(type: string) {
      return type === 'content' ? {
        width: `${this.config.width * this.contentScaleRatio}px`,
        height: `${this.config.height * this.contentScaleRatio}px`,
        backgroundColor: this.config.backgroundColor,
        backgroundImage: `url(${ImageUtils.getSrc(this.config.backgroundImage.config)})`,
        backgroundPosition: this.config.backgroundImage.posX === -1 ? 'center center'
          : `${this.config.backgroundImage.posX}px ${this.config.backgroundImage.posY}px`,
        backgroundSize: `${this.config.backgroundImage.config.styles.imgWidth}px ${this.config.backgroundImage.config.styles.imgHeight}px`
      } : {
        width: `${this.config.width * this.contentScaleRatio}px`,
        height: `${this.config.height * this.contentScaleRatio}px`,
        overflow: this.selectedLayerCount > 0 ? 'initial' : 'hidden',
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    },
    wrapperStyles(isPlaceHolder?: boolean) {
      return {
        width: `${this.config.width * (this.scaleRatio / 100)}px`,
        height: `${this.config.height * (this.scaleRatio / 100)}px`,
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial',
        // border: `2px solid ${this.pageIsHover || this.currFocusPageIndex === this.pageIndex ? '#7190CC' : 'transparent'}`
        border: `2px solid ${(this.pageIsHover || this.isFocusedPage) && !isPlaceHolder ? '#7190CC' : 'transparent'}`
      }
    },
    snapLineStyles(dir: string, pos: number, isGuideline?: string) {
      pos = pos * (this.scaleRatio / 100)
      return dir === 'v' ? {
        height: '100%',
        width: '1px',
        transform: `translate(${pos}px,0)`,
        'pointer-events': isGuideline && !this.isMoving ? 'auto' : 'none'
      }
        : {
          width: '100%',
          height: '1px',
          transform: `translate(0,${pos}px)`,
          'pointer-events': isGuideline && !this.isMoving ? 'auto' : 'none'
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
    pageClickHandler(): void {
      // const sel = window.getSelection()
      // if (sel) {
      //   sel.empty()
      //   sel.removeAllRanges()
      // }
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

      pageUtils.addPageToPos(pageUtils.newPage({ width: this.config.width, height: this.config.height }), this.pageIndex + 1)
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
      this._deletePage(this.pageIndex)
      StepsUtils.record()
    },
    duplicatePage() {
      if (this.isProcessingShadow) {
        Vue.notify({ group: 'copy', text: `${i18n.t('NN0665')}` })
        return
      }
      GroupUtils.deselect()
      const page = generalUtils.deepCopy(this.getPage(this.pageIndex)) as IPage
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
      this.pageClickHandler()
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
      this.initialPageHeight = (this.config as IPage).height
      this.isResizingPage = true
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.overflowContainer as HTMLElement)
      this.initialAbsPos = this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      eventUtils.addPointerEvent('pointermove', this.pageResizing)
      this.overflowContainer.addEventListener('scroll', this.scrollUpdate, { capture: true })
      eventUtils.addPointerEvent('pointerup', this.pageResizeEnd)
    },
    pageResizing(e: PointerEvent) {
      this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.overflowContainer as HTMLElement)
      const isShownScrollbar = (this.overflowContainer.scrollHeight === this.overflowContainer.clientHeight)

      if (isShownScrollbar === this.isShownScrollBar) {
        const multiplier = isShownScrollbar ? 2 : 1
        const yDiff = (this.currentRelPos.y - this.initialRelPos.y) * multiplier * (100 / this.scaleRatio)
        pageUtils.updatePageProps({
          height: Math.max(Math.trunc(this.initialPageHeight + yDiff), 20)
        })
      } else {
        this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.overflowContainer as HTMLElement)
        this.initialAbsPos = this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
        this.initialPageHeight = (this.config as IPage).height
      }
      this.isShownScrollBar = isShownScrollbar
    },
    pageResizeEnd(e: PointerEvent) {
      this.initialPageHeight = (this.config as IPage).height
      this.isResizingPage = false
      pageUtils.updatePageProps({
        height: Math.round(this.config.height)
      })
      StepsUtils.record()
      this.$nextTick(() => {
        eventUtils.removePointerEvent('pointermove', this.pageResizing)
        this.overflowContainer.removeEventListener('scroll', this.scrollUpdate, { capture: true })
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
      if (generalUtils.isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    handleDraggingController(index: number) {
      this.currDraggingIndex = index
    },
    handleLoaded(bool: boolean, entries: Array<IntersectionObserverEntry>) {
      // this.isOutOfBound = !bool
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
  width: 100%;
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
  top: 0px;
  left: 0px;
  border: 2px solid setColor(blue-2);
  box-sizing: border-box;
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

.dim-background {
  position: absolute;
  transform: translateZ(1000px);
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  transform-style: preserve-3d;
}

.background-control {
  position: absolute;
  // transform: translateZ(1000px);
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
}

.skeleton {
  background-color: setColor(white);
}

.layer-num {
  position: absolute;
  bottom: -20px;
  left: 50%;
}
</style>
