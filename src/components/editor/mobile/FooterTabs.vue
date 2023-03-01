<template lang="pug">
div(class="footer-tabs" ref="tabs" :style="rootStyles")
  div(class="footer-tabs__content"
      :style="containerStyles")
    div(v-if="useWhiteTheme"  class="footer-tabs__home-tab"
        :class="[useWhiteTheme ? 'bg-gray-6' : 'bg-nav']")
      div(class="footer-tabs__item"
          @click="handleTabAction(mainMenu)")
        svg-icon(class="mb-5 click-disabled"
          :iconName="mainMenu.icon"
          :iconColor="tabColor(mainMenu)"
          :iconWidth="'22px'"
          :style="textIconStyle")
        span(class="body-3 no-wrap click-disabled"
          :class="`text-${tabColor(mainMenu)}`") {{mainMenu.text}}
    div(class="footer-tabs__container"
        :class="[useWhiteTheme ? 'bg-gray-6' : 'bg-nav']"
        @scroll.passive="updateContainerOverflow" ref="container")
      template(v-for="(tab, index) in tabs")
        div(v-if="!tab.hidden" :key="tab.icon"
            class="footer-tabs__item"
            :class="{'click-disabled': (tab.disabled || isLocked)}"
            @click="handleTabAction(tab)")
          color-btn(v-if="tab.icon === 'color'" size="22px"
                    class="mb-5 click-disabled"
                    :color="globalSelectedColor")
          svg-icon(v-else class="mb-5 click-disabled"
            :iconName="tab.icon"
            :iconColor="tabColor(tab)"
            :iconWidth="'22px'"
            :style="textIconStyle")
          span(class="body-3 no-wrap click-disabled"
          :class="`text-${tabColor(tab)}`") {{tab.text}}
</template>

<script lang="ts">
import ColorBtn from '@/components/global/ColorBtn.vue'
import i18n from '@/i18n'
import { IFooterTab } from '@/interfaces/editor'
import { IFrame, IGroup, IImage, ILayer, IShape } from '@/interfaces/layer'
import { ColorEventType, LayerType } from '@/store/types'
import backgroundUtils from '@/utils/backgroundUtils'
import brandkitUtils from '@/utils/brandkitUtils'
import colorUtils from '@/utils/colorUtils'
import editorUtils from '@/utils/editorUtils'
import formatUtils from '@/utils/formatUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import mappingUtils from '@/utils/mappingUtils'
import pageUtils from '@/utils/pageUtils'
import shortcutUtils from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { notify } from '@kyvg/vue3-notification'
import { isEqual } from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  components: {
    ColorBtn
  },
  props: {
    currTab: {
      default: 'none',
      type: String
    },
    inAllPagesMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['switchTab', 'showAllPages'],
  data() {
    const mainMenu = { icon: 'insert', text: `${this.$t('STK0006')}` }

    return {
      mainMenu,
      isFontsPanelOpened: false,
      disableTabScroll: false,
      leftOverflow: false,
      rightOverflow: false,
      clickedTab: '',
      clickedTabTimer: -1,
      homeTabs: [
        { icon: 'template', text: `${this.$tc('NN0001', 2)}`, panelType: 'template' },
        { icon: 'photo', text: `${this.$tc('NN0002', 2)}`, panelType: 'photo' },
        { icon: 'objects', text: `${this.$tc('NN0003', 2)}`, panelType: 'object' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, panelType: 'background' },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}`, panelType: 'text' },
        { icon: 'upload', text: `${this.$tc('NN0006', 2)}`, panelType: 'file' },
        { icon: 'add-page', text: `${this.$t('NN0139')}` },
        { icon: 'paste', text: `${this.$t('NN0230')}` },
        ...brandkitUtils.isBrandkitAvailable ? [{ icon: 'brand', text: `${this.$t('NN0497')}`, panelType: 'brand' }] : []
      ] as Array<IFooterTab>
    }
  },
  computed: {
    ...mapState('mobileEditor', { mobilePanel: 'currActivePanel' }),
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      isShowPagePreview: 'page/getIsShowPagePreview',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      InBgRemoveFirstStep: 'bgRemove/inFirstStep',
      InBgRemoveLastStep: 'bgRemove/inLastStep',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      isHandleShadow: 'shadow/isHandling',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      hasCopiedFormat: 'getHasCopiedFormat'
    }),
    useWhiteTheme(): boolean {
      return this.hasSelectedLayer || this.inBgSettingMode || this.inAllPagesMode
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    subActiveLayerIndex(): number {
      return layerUtils.subLayerIdx
    },
    subActiveLayer(): any {
      if (this.subActiveLayerIndex !== -1) {
        return (layerUtils.getCurrLayer as IGroup).layers[this.subActiveLayerIndex]
      }
      return undefined
    },
    subActiveLayerType(): string {
      const currLayer = layerUtils.getCurrLayer
      if (currLayer.type === 'group' && this.subActiveLayerIndex !== -1) {
        return (currLayer as IGroup).layers[this.subActiveLayerIndex].type
      }
      return ''
    },
    isCopyFormatDisabled(): boolean {
      if (this.selectedLayerNum === 1) { // not tmp
        const types = this.currSelectedInfo.types
        const currLayer = layerUtils.getCurrLayer
        if (types.has('group')) {
          if (this.subActiveLayerIndex !== -1) {
            if (['text', 'image'].includes(this.subActiveLayerType)) {
              return this.isLocked
            }
            if (this.subActiveLayerType === 'frame') {
              const frame = this.subActiveLayer as IFrame
              if (frame.clips.length === 1) {
                return this.isLocked
              }
            }
          }
        } else if (types.has('frame')) {
          const frame = currLayer as IFrame
          if (frame.clips.length === 1) {
            return this.isLocked
          } else {
            if (this.subActiveLayerIndex !== -1 && frame.clips[this.subActiveLayerIndex].type === 'image') {
              return this.isLocked
            }
          }
        } else {
          if (types.has('text') || types.has('image')) {
            return this.isLocked
          }
        }
      }
      return true
    },
    backgroundImgControl(): boolean {
      return pageUtils.currFocusPage.backgroundImage.config?.imgControl ?? false
    },
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
    },
    groupTab(): IFooterTab {
      return {
        icon: this.isGroup ? 'ungroup' : 'group', text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`, hidden: !this.isGroup && this.selectedLayerNum === 1
      }
    },
    photoInGroupTabs(): Array<IFooterTab> {
      return [
        { icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace', hidden: this.isInFrame },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          hidden: this.isInFrame,
          disabled: this.isHandleShadow && this.mobilePanel !== 'photo-shadow'
        },
        ...this.genearlLayerTabs,
        { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: this.isInFrame }
      ]
    },
    photoTabs(): Array<IFooterTab> {
      return [
        { icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace' },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        ...(this.isInFrame ? [{ icon: 'set-as-frame', text: `${this.$t('NN0098')}` }] : []),
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          hidden: this.isInFrame,
          disabled: this.isHandleShadow && this.mobilePanel !== 'photo-shadow'
        },
        ...this.genearlLayerTabs,
        { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: this.isInFrame },
        ...this.copyPasteTabs,
        ...(!this.isInFrame ? [{ icon: 'set-as-frame', text: `${this.$t('NN0706')}` }] : []),
        { icon: 'copy-style', text: `${this.$t('NN0035')}`, panelType: 'copy-style' }
        // { icon: 'removed-bg', text: `${this.$t('NN0043')}`, panelType: 'background', hidden: true },
      ]
    },
    frameTabs(): Array<IFooterTab> {
      const frame = layerUtils.getCurrLayer
      if (frame.type !== 'frame') return []
      const showReplace = frame.clips.length === 1 || frame.clips.some(c => c.active)
      const replace = showReplace ? [{ icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace' }] : []
      return [
        ...replace,
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape
          }
        },
        ...this.genearlLayerTabs,
        ...this.copyPasteTabs
      ]
    },
    fontTabs(): Array<IFooterTab> {
      return [
        { icon: 'edit', text: `${this.$t('NN0504')}`, hidden: this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer) },
        { icon: 'font', text: generalUtils.capitalize(`${this.$tc('NN0353', 2)}`), panelType: 'fonts' },
        { icon: 'font-size', text: `${this.$t('NN0122')}`, panelType: 'font-size' },
        {
          icon: 'text-color-mobile',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          props: {
            currColorEvent: ColorEventType.text
          }
        },
        { icon: 'effect', text: `${this.$t('NN0491')}`, panelType: 'text-effect' },
        { icon: 'spacing', text: `${this.$t('NN0755')}`, panelType: 'font-spacing' },
        { icon: 'text-format', text: `${this.$t('NN0498')}`, panelType: 'font-format' },
        { icon: 'copy-style', text: `${this.$t('NN0035')}`, panelType: 'copy-style' }
      ]
    },
    bgSettingTab(): Array<IFooterTab> {
      const { hasBgImage } = backgroundUtils
      return [
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity', disabled: this.backgroundLocked },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop', hidden: !hasBgImage, disabled: this.backgroundLocked },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip', hidden: !hasBgImage, disabled: this.backgroundLocked },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: !hasBgImage, disabled: this.backgroundLocked },
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.background
          },
          disabled: this.backgroundLocked
        },
        { icon: 'bg-separate', text: `${this.$t('NN0708')}`, hidden: !hasBgImage, disabled: this.backgroundLocked }
      ]
    },
    multiPhotoTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs,
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' }
      ]
    },
    multiFontTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs,
        ...this.fontTabs
      ]
    },
    multiObjectTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs,
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape
          }
        }
      ]
    },
    objectTabs(): Array<IFooterTab> {
      return [
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape
          }
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object-adjust', hidden: !this.showShapeAdjust }
      ]
    },
    pageTabs(): Array<IFooterTab> {
      return [
        { icon: 'add-page', text: `${this.$t('NN0139')}` },
        { icon: 'duplicate-page', text: `${this.$t('NN0140')}` },
        // { icon: 'select-page', text: `${this.$tc('NN0124', 2)}` },
        { icon: 'trash', text: `${this.$t('NN0141')}`, hidden: pageUtils.getPages.length <= 1 }
        // { icon: 'adjust-order', text: `${this.$t('NN0030')}`, panelType: 'opacity' }
      ]
    },
    genearlLayerTabs(): Array<IFooterTab> {
      return [
        { icon: 'layers-alt', text: `${this.$t('NN0757')}`, panelType: 'order' },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        this.groupTab,
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip' },
        { icon: 'multiple-select', text: `${this.$t('NN0807')}` }
        // { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object', hidden: true }
      ]
    },
    multiGeneralTabs(): Array<IFooterTab> {
      return [
        { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order', hidden: this.hasSubSelectedLayer },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        this.groupTab,
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'multiple-select', text: `${this.$t('NN0807')}` },
        ...this.copyPasteTabs
      ]
    },
    copyPasteTabs(): Array<IFooterTab> {
      return [
        { icon: 'copy', text: `${this.$t('NN0032')}` },
        { icon: 'paste', text: `${this.$t('NN0230')}` }
      ]
    },
    tabs(): Array<IFooterTab> {
      if (this.inAllPagesMode) {
        return this.pageTabs
      // A group that only has images
      } else if (this.isGroupOrTmp && this.targetIs('image') && (this.isWholeGroup || layerUtils.getCurrLayer.type === LayerType.tmp)) {
        return this.multiPhotoTabs
      } else if (this.isGroupOrTmp && this.targetIs('image') && layerUtils.subLayerIdx !== -1) {
        return this.photoInGroupTabs
      // text + shape color
      } else if (this.isGroupOrTmp && this.targetIs('text') && this.showObjectColorAndFontTabs) {
        return [...this.multiObjectTabs, ...this.fontTabs]
      // only text
      } else if (this.isGroupOrTmp && this.targetIs('text')) {
        return this.multiFontTabs
      // only shape
      } else if (this.isGroupOrTmp && this.targetIs('shape') && this.singleTargetType()) {
        return this.multiObjectTabs
      } else if ((this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer)) && !this.singleTargetType()) {
        return this.multiGeneralTabs
      } else if (this.showPhotoTabs) {
        return this.photoTabs
      } else if (this.showFontTabs) {
        return [...this.fontTabs, ...this.genearlLayerTabs, ...this.copyPasteTabs]
      } else if (this.showFrameTabs) {
        if (frameUtils.isImageFrame(layerUtils.getCurrLayer as IFrame)) {
          return this.photoTabs
        }
        return this.frameTabs
      } else if (this.showShapeSetting) {
        return [...this.objectTabs, ...this.genearlLayerTabs, ...this.copyPasteTabs]
      } else if (this.inBgSettingMode) {
        return this.bgSettingTab
      } else {
        return this.homeTabs
      }
    },
    globalSelectedColor(): string {
      return colorUtils.globalSelectedColor.color
    },
    textIconStyle(): Record<string, string> {
      const textColor = colorUtils.globalSelectedColor.textColor
      return textColor === 'multi' ? {
        '--multi-text-color': '1' // For svg icon 'text-color-mobile.svg' rect fill multi-color
      } : {
        '--multi-text-color': '0',
        '--text-color': textColor // For svg icon 'text-color-mobile.svg' rect fill color
      }
    },
    isWholeGroup(): boolean {
      /**
       * Select whole group and no sub-layer selected
       */
      return this.isGroup && this.groupTypes.size === 1 && layerUtils.subLayerIdx === -1
    },
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return layerUtils.getSelectedLayer().locked
    },
    isGroup(): boolean {
      return layerUtils.getCurrLayer.type === LayerType.group
    },
    isGroupOrTmp(): boolean {
      return (layerUtils.getCurrLayer.type === LayerType.tmp ||
      layerUtils.getCurrLayer.type === LayerType.group)
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer) => {
        return layer.type
      })
      return new Set(types)
    },
    isInFrame(): boolean {
      const layer = layerUtils.getCurrLayer
      return layer.type === LayerType.frame && (layer as IFrame).clips[0].srcObj.assetId !== ''
    },
    isFrameImg(): boolean {
      return layerUtils.getCurrLayer.type === LayerType.frame && ((layerUtils.getCurrConfig as IImage).isFrameImg ?? false)
    },
    isSubLayerFrameImage(): boolean {
      const { index } = this.currSubSelectedInfo
      const { clips, type } = this.currSelectedInfo.layers[0].layers[index]
      return type === 'frame' && clips[0].srcObj.assetId
    },
    showPhotoTabs(): boolean {
      return (!this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.targetIs('image') && this.singleTargetType()) || this.hasFrameClipActive
    },
    showObjectColorAndFontTabs(): boolean {
      const { subLayerIdx } = layerUtils
      const currLayer = layerUtils.getCurrLayer
      if (!(currLayer.type === 'group' || currLayer.type === 'tmp') || subLayerIdx !== -1) return false
      const singleColorShapes = currLayer.layers.filter(l => l.type === 'shape' && l.color.length === 1) as IShape[]
      const multiColorShapes = currLayer.layers.filter(l => l.type === 'shape' && l.color.length !== 1) as IShape[]
      const hasImages = (currLayer.layers.filter(l => l.type === 'image') as IImage[]).length !== 0
      if (hasImages || (singleColorShapes.length === 0 && multiColorShapes.length !== 1)) return false
      else return true
    },
    hasFrameClipActive(): boolean {
      const layer = layerUtils.getCurrLayer
      if (layer.type === LayerType.frame) {
        return (layer as IFrame).clips.some(c => c.active)
      } else return false
    },
    showFontTabs(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.targetIs('text') && this.singleTargetType()
    },
    showGeneralTabs(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.selectedLayerNum !== 0
    },
    showShapeSetting(): boolean {
      const stateCondition = !this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked
      const typeConditon = (this.targetIs('shape') && this.singleTargetType())
      return stateCondition && typeConditon
    },
    showFrameTabs(): boolean {
      return this.targetIs('frame') && this.singleTargetType() && !(layerUtils.getCurrLayer as IFrame).clips.some(c => c.active)
    },
    layerType(): { [key: string]: string } {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      return {
        currLayerType: currLayer.type,
        targetLayerType: (() => {
          if (subLayerIdx !== -1) {
            return currLayer.type === LayerType.group
              ? (currLayer as IGroup).layers[subLayerIdx].type : LayerType.image
          }
          return currLayer.type
        })()
      }
    },
    contentEditable(): boolean {
      return this.currSelectedInfo.layers[0]?.contentEditable
    },
    rootStyles(): Record<string, string> {
      return {
        backgroundColor: '#EEEFF4'
      }
    },
    containerStyles(): { [index: string]: string } {
      // Use mask-image implement fade scroll style, support Safari 14.3, https://stackoverflow.com/a/70971847
      return {
        transform: `translate(0,${this.contentEditable ? 100 : 0}%)`,
        opacity: `${this.contentEditable ? 0 : 1}`,
        borderTop: !this.contentEditable && this.useWhiteTheme ? '0.5px solid #D9DBE1' : 'none',
        boxShadow: !this.contentEditable && this.useWhiteTheme ? '0px 0px 6px 0px  #3C3C3C0D' : 'none'
        // maskImage: this.contentEditable ? 'none'
        //   : `linear-gradient(to right,
        //   transparent 0, black ${this.leftOverflow ? '56px' : 0},
        //   black calc(100% - ${this.rightOverflow ? '56px' : '0px'}), transparent 100%)`
      }
    },
    currLayer(): ILayer {
      return layerUtils.getCurrLayer
    },
    isLine(): boolean {
      return this.currLayer.type === 'shape' && this.currLayer.category === 'D'
    },
    isBasicShape(): boolean {
      return this.currLayer.type === 'shape' && this.currLayer.category === 'E'
    },
    showShapeAdjust(): boolean {
      return this.isLine || this.isBasicShape
    },
    selectMultiple(): boolean {
      return this.selectedLayerNum > 1
    }
  },
  watch: {
    selectedLayerNum(newVal) {
      if (newVal === 0) {
        this.$emit('switchTab', 'none')
      }
    },
    tabs: {
      handler(newVal, oldVal) {
        if (this.disableTabScroll || isEqual(newVal, oldVal)) {
          this.disableTabScroll = false
          return
        }
        const container = this.$refs.container as HTMLElement
        container.scrollTo(0, 0)
      },
      deep: true
    },
    contentEditable(newVal) {
      if (newVal) {
        this.$emit('switchTab', 'none')
      }
    }
  },
  methods: {
    ...mapMutations({
      _setmiddlemostPageIndex: 'SET_middlemostPageIndex',
      _setCurrActivePageIndex: 'SET_currActivePageIndex',
      _setIsDragged: 'page/SET_IsDragged',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview',
      setBgImageControl: 'SET_backgroundImageControl'
    }),
    updateContainerOverflow() {
      const { scrollLeft, scrollWidth, offsetWidth } = this.$refs.container as HTMLElement
      this.leftOverflow = scrollLeft > 0
      this.rightOverflow = scrollLeft + 0.5 < (scrollWidth - offsetWidth) && scrollWidth > offsetWidth
    },
    handleTabAction(tab: IFooterTab) {
      console.log(tab)
      if (tab.icon !== 'multiple-select' && this.inMultiSelectionMode) {
        editorUtils.setInMultiSelectionMode(!this.inMultiSelectionMode)
      }
      switch (tab.icon) {
        case 'crop': {
          if (this.selectedLayerNum > 0) {
            if (this.isCropping) {
              imageUtils.setImgControlDefault()
            } else {
              let index
              switch (layerUtils.getCurrLayer.type) {
                case 'image':
                  layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true })
                  break
                case 'frame':
                  index = Math.max((layerUtils.getCurrLayer as IFrame).clips.findIndex(l => l.type === 'image' && l.active), 0)
                  frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, index, { imgControl: true })
                  break
                case 'group':
                  if (layerUtils.getCurrConfig.type === LayerType.image) {
                    layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true }, layerUtils.subLayerIdx)
                  }
                  break
              }
            }
          } else if (this.inBgSettingMode) {
            if (this.backgroundLocked) return this.handleLockedNotify()
            this.setBgImageControl({
              pageIndex: pageUtils.currFocusPageIndex,
              imgControl: !this.backgroundImgControl
            })
          }
          break
        }
        case 'set-as-frame': {
          if (layerUtils.getCurrLayer.type === LayerType.frame) {
            frameUtils.detachImage(layerUtils.layerIndex)
          } else {
            frameUtils.updateImgToFrame()
          }
          break
        }
        case 'insert': {
          groupUtils.deselect()
          this.$emit('switchTab', 'none')
          if (this.inAllPagesMode) {
            this.$emit('showAllPages')
          }

          if (this.inBgSettingMode) {
            editorUtils.setInBgSettingMode(false)
          }
          break
        }
        case 'add-page': {
          const page = pageUtils.getPage(pageUtils.currFocusPageIndex)
          const currPage = pageUtils.currFocusPage
          pageUtils.addPageToPos(pageUtils.newPage({
            width: page.width,
            height: page.height,
            bleeds: currPage.bleeds,
            physicalBleeds: currPage.physicalBleeds,
            isEnableBleed: currPage.isEnableBleed,
            unit: currPage.unit
          }), pageUtils.currFocusPageIndex + 1)
          this._setCurrActivePageIndex(pageUtils.currFocusPageIndex + 1)
          stepsUtils.record()
          break
        }
        case 'duplicate-page': {
          const { currFocusPageIndex } = pageUtils
          const page = generalUtils.deepCopy(pageUtils.getPage(currFocusPageIndex))
          page.designId = ''
          page.id = generalUtils.generateRandomString(8)
          pageUtils.addPageToPos(page, currFocusPageIndex + 1)
          this._setCurrActivePageIndex(currFocusPageIndex + 1)
          const targetPreviewPage = document.querySelector(`.page-preview_${currFocusPageIndex}`)

          // eslint-disable-next-line no-unused-expressions
          targetPreviewPage?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          })
          break
        }
        case 'trash': {
          groupUtils.deselect()
          const tmpIndex = pageUtils.currActivePageIndex
          this._setCurrActivePageIndex(pageUtils.isLastPage ? tmpIndex - 1 : tmpIndex)
          editorUtils.setCurrCardIndex(pageUtils.currActivePageIndex)
          pageUtils.deletePage(tmpIndex)
          stepsUtils.record()
          break
        }
        case 'text-format': {
          if (!this.selectMultiple && !this.isGroup) {
            tiptapUtils.agent(editor => editor.commands.selectAll())
          }
          break
        }
        case 'edit': {
          const { index, pageIndex } = layerUtils.currSelectedInfo
          const { getCurrLayer: currLayer } = layerUtils

          if (!this.hasSubSelectedLayer) {
            if (currLayer.type === 'text') {
              layerUtils.updateLayerProps(pageIndex, index, {
                contentEditable: true
              })
            }

            this.$nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, currLayer.isEdited ? 'end' : null)
            })
          } else {
            /**
             * @Todo handle the sub controler
             */
            const { subLayerIdx } = layerUtils
            const subLayer = (currLayer as IGroup).layers[subLayerIdx]
            if (subLayer.type === 'text') {
              layerUtils.updateLayerProps(pageIndex, index, {
                contentEditable: true
              }, subLayerIdx)
            }
            this.$nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, 'end')
            })
          }
          break
        }
        case 'group':
        case 'ungroup': {
          this.disableTabScroll = true
          mappingUtils.mappingIconAction(tab.icon)
          break
        }
        case 'multiple-select': {
          editorUtils.setInMultiSelectionMode(!this.inMultiSelectionMode)
          break
        }
        case 'bg-separate': {
          if (this.inBgSettingMode) {
            backgroundUtils.detachBgImage()
          } else {
            backgroundUtils.setBgImageSrc()
          }
          break
        }
        case 'copy': {
          shortcutUtils.copy()
          break
        }
        case 'paste': {
          shortcutUtils.paste()
          break
        }
        case 'copy-style': {
          if (this.hasCopiedFormat) {
            formatUtils.clearCopiedFormat()
          } else {
            this.handleCopyFormat()
          }
          break
        }
        case 'effect': {
          // Unreachable, becaues button is disabled
          // if (this.isHandleShadow && this.mobilePanel !== 'photo-shadow') {
          //   notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
          //   return
          // }
          break
        }
        case 'color':
        case 'text-color-mobile':
          colorUtils.setCurrEvent(tab?.props?.currColorEvent as string)
          break
        default: {
          break
        }
      }
      if (tab.icon !== 'crop') {
        if (this.isCropping) {
          imageUtils.setImgControlDefault()
        }
        if (backgroundUtils.backgroundImageControl) {
          backgroundUtils.setAllBackgroundImageControlDefault()
        }
      }
      if (tab.panelType !== undefined) {
        this.$emit('switchTab', tab.panelType, tab.props)
      }

      if (['copy', 'paste'].includes(tab.icon)) {
        this.clickedTab = tab.icon
        notify({ group: 'copy', text: tab.icon === 'copy' ? i18n.global.tc('NN0688') : i18n.global.tc('NN0813') })
        this.clickedTabTimer = window.setTimeout(() => {
          this.clickedTab = ''
        }, 800)
      }
    },
    targetIs(type: string): boolean {
      if (this.isGroup) {
        if (this.hasSubSelectedLayer) {
          return this.subLayerType === type
        } else {
          return this.groupTypes.has(type)
        }
      } else {
        // if (this.currSelectedInfo.types.has('frame') && type === 'image') {
        //   return this.isInFrame
        // }
        return this.currSelectedInfo.types.has(type)
      }
    },
    singleTargetType(): boolean {
      if (this.isGroup) {
        if (this.hasSubSelectedLayer) {
          return true
        } else {
          return this.groupTypes.size === 1
        }
      } else {
        return this.currSelectedInfo.types.size === 1
      }
    },
    tabActive(tab: IFooterTab): boolean {
      if ((this.inMultiSelectionMode && tab.icon === 'multiple-select')) {
        return true
      }
      if (this.currTab === 'color') {
        return this.currTab === tab.panelType &&
          ((colorUtils.currEvent === 'setTextColor' && tab.icon === 'text-color-mobile') ||
          (colorUtils.currEvent !== 'setTextColor' && tab.icon === 'color'))
      } else return this.currTab === tab.panelType || this.clickedTab === tab.icon
    },
    handleLockedNotify() {
      notify({ group: 'copy', text: i18n.global.tc('NN0804') })
    },
    handleCopyFormat() {
      if (this.isCopyFormatDisabled) return
      const types = this.currSelectedInfo.types
      const layer = this.currSelectedInfo.layers[0]
      if (types.has('group')) {
        const type = this.subActiveLayerType
        const subLayer = this.subActiveLayer
        if (type === 'text') {
          formatUtils.copyTextFormat(subLayer)
        }
        if (type === 'image') {
          formatUtils.copyImageFormat(subLayer)
        }
        if (type === 'frame') {
          formatUtils.copyImageFormat(subLayer.clips[0])
        }
      } else {
        if (types.has('text')) {
          formatUtils.copyTextFormat(layer)
        }
        if (types.has('image')) {
          formatUtils.copyImageFormat(layer)
        }
        if (types.has('frame')) {
          formatUtils.copyImageFormat(layer.clips[Math.max(0, this.subActiveLayerIndex)])
        }
      }
    },
    tabColor(icon: IFooterTab): string {
      return (icon.disabled || this.isLocked) ? 'gray-2' : this.tabActive(icon) ? 'blue-1' : this.useWhiteTheme ? 'gray-2' : 'white'
    }
  }
})
</script>

<style lang="scss" scoped>
.footer-tabs {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;

  &__content {
    display: grid;
    grid-template-columns: auto 1fr;
    transition: transform 0.3s, opacity 0.4s;
  }

  &__home-tab {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0px 18px;

    &::after {
      position: absolute;
      right: 0px;
      top: 50%;
      transform: translate(0, -50%);
      content: '';
      width: 2px;
      height: 40px;
      background-color:setColor(gray-4);
    }
  }

  &__container {
    overflow: scroll;
    display: grid;
    grid-template-rows: auto;
    grid-auto-flow: column;
    grid-auto-columns: 56px;
    column-gap: 16px;
    padding: 8px 12px;
    @include no-scrollbar;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0px 4px;
    > span {
      transition: background-color 0.2s, color 0.2s;
      transform: scale(calc(10 / 12));
    }
  }
}
</style>
