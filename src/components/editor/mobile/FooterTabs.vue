<template lang="pug">
  div(class="footer-tabs" ref="tabs")
    div(class="footer-tabs__container" :style="containerStyles"  ref="container")
      template(v-for="(tab, index) in tabs")
        div(v-if="!tab.hidden"
            class="footer-tabs__item"
            :class="{'click-disabled': (tab.disabled || isLocked)}"
            @click="handleTabAction(tab)")
          svg-icon(class="mb-5 click-disabled"
            :iconName="tab.icon"
            :iconColor="(tab.disabled || isLocked) ? 'gray-2' : currTab ===  tab.panelType ? 'blue-1' :'white'"
            :iconWidth="'24px'")
          span(class="text-body-4 no-wrap click-disabled"
          :class="(tab.disabled || isLocked) ? 'text-gray-2' :(currTab ===  tab.panelType ) ? 'text-blue-1' : 'text-white'") {{tab.text}}
</template>
<script lang="ts">
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import stepsUtils from '@/utils/stepsUtils'
import { ColorEventType, LayerType } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import frameUtils from '@/utils/frameUtils'
import { IFooterTab } from '@/interfaces/editor'
import groupUtils from '@/utils/groupUtils'
import pageUtils from '@/utils/pageUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import shapeUtils from '@/utils/shapeUtils'
import mappingUtils from '@/utils/mappingUtils'
import backgroundUtils from '@/utils/backgroundUtils'
import editorUtils from '@/utils/editorUtils'
import i18n from '@/i18n'
import brandkitUtils from '@/utils/brandkitUtils'

export default Vue.extend({
  components: {
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
  data() {
    const mainMenu = { icon: 'main-menu', text: `${this.$t('NN0489')}` }

    return {
      mainMenu,
      isFontsPanelOpened: false,
      disableTabScroll: false,
      homeTabs: [
        { icon: 'template', text: `${this.$tc('NN0001', 2)}`, panelType: 'template' },
        { icon: 'photo', text: `${this.$tc('NN0002', 2)}`, panelType: 'photo' },
        { icon: 'objects', text: `${this.$tc('NN0003', 2)}`, panelType: 'object' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, panelType: 'background' },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}`, panelType: 'text' },
        { icon: 'upload', text: `${this.$tc('NN0006', 2)}`, panelType: 'file' },
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
      isHandleShadow: 'shadow/isHandling'
    }),
    backgroundImgControl(): boolean {
      return pageUtils.currFocusPage.backgroundImage.config?.imgControl ?? false
    },
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
    },
    groupTab(): IFooterTab {
      return { icon: this.isGroup ? 'ungroup' : 'group', text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`, hidden: !this.isGroup && this.selectedLayerNum === 1 }
    },
    photoInGroupTabs(): Array<IFooterTab> {
      return [
        this.mainMenu,
        { icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace', hidden: this.isInFrame },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        { icon: 'adjust', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        { icon: 'effect', text: `${this.$t('NN0429')}`, panelType: 'photo-shadow', hidden: this.isInFrame },
        ...this.genearlLayerTabs,
        { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: this.isInFrame }
      ]
    },
    photoTabs(): Array<IFooterTab> {
      return [
        this.mainMenu,
        { icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace' },
        // { icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace', hidden: this.isInFrame },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        { icon: 'set-as-frame', text: `${this.$t(this.isInFrame ? 'NN0098' : 'NN0706')}` },
        { icon: 'removed-bg', text: `${this.$t('NN0043')}`, panelType: 'background', hidden: true },
        { icon: 'adjust', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        { icon: 'effect', text: `${this.$t('NN0429')}`, panelType: 'photo-shadow', hidden: this.isInFrame },
        ...this.genearlLayerTabs,
        { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: this.isInFrame }
        // { icon: 'copy-style', text: `${this.$t('NN0035')}`, panelType: 'text',hidden: true }
      ]
    },
    frameTabs(): Array<IFooterTab> {
      const frame = layerUtils.getCurrLayer as IFrame
      const showReplace = frame.clips.length === 1 || frame.clips.some(c => c.active)
      const replace = showReplace ? [{ icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace' }] : []
      return [
        this.mainMenu,
        ...replace,
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: shapeUtils.getDocumentColors.length === 0,
          props: {
            currColorEvent: ColorEventType.shape
          }
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object-adjust', hidden: !this.showShapeAdjust },
        ...this.genearlLayerTabs
      ]
    },
    fontTabs(): Array<IFooterTab> {
      return [
        { icon: 'edit', text: `${this.$t('NN0504')}`, hidden: this.selectMultiple || this.hasSubSelectedLayer || this.isGroup },
        { icon: 'font', text: generalUtils.capitalize(`${this.$tc('NN0353', 2)}`), panelType: 'fonts' },
        { icon: 'font-size', text: `${this.$t('NN0492')}`, panelType: 'font-size' },
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          props: {
            currColorEvent: ColorEventType.text
          }
        },
        { icon: 'effect', text: `${this.$t('NN0491')}`, panelType: 'text-effect' },
        { icon: 'spacing', text: `${this.$t('NN0109')}`, panelType: 'font-spacing' },
        { icon: 'text-format', text: `${this.$t('NN0498')}`, panelType: 'font-format' }
        // { icon: 'copy-style', text: `${this.$t('NN0035')}`, panelType: 'text',hidden: true }
      ]
    },
    bgSettingTab(): Array<IFooterTab> {
      const { hasBgImage } = backgroundUtils
      return [
        this.mainMenu,
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity', disabled: this.backgroundLocked },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop', hidden: !hasBgImage, disabled: this.backgroundLocked },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip', hidden: !hasBgImage, disabled: this.backgroundLocked },
        { icon: 'adjust', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: !hasBgImage, disabled: this.backgroundLocked },
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
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
        { icon: 'adjust', text: `${this.$t('NN0042')}`, panelType: 'adjust' }
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
          hidden: shapeUtils.getSingleColorObjNum === 0 && !this.hasSubSelectedLayer,
          props: {
            currColorEvent: ColorEventType.shape
          }
        }
      ]
    },
    objectTabs(): Array<IFooterTab> {
      return [
        this.mainMenu,
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: shapeUtils.getDocumentColors.length === 0,
          props: {
            currColorEvent: ColorEventType.shape
          }
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object-adjust', hidden: !this.showShapeAdjust }
      ]
    },
    pageTabs(): Array<IFooterTab> {
      return [
        this.mainMenu,
        { icon: 'add-page', text: `${this.$t('NN0139')}` },
        { icon: 'duplicate-page', text: `${this.$t('NN0140')}` },
        // { icon: 'select-page', text: `${this.$tc('NN0124', 2)}` },
        { icon: 'trash', text: `${this.$t('NN0141')}`, hidden: pageUtils.getPages.length <= 1 }
        // { icon: 'adjust-order', text: `${this.$t('NN0030')}`, panelType: 'opacity' }
      ]
    },
    genearlLayerTabs(): Array<IFooterTab> {
      return [
        { icon: this.isGroup ? 'ungroup' : 'group', text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`, disabled: !this.isGroup && this.selectedLayerNum === 1 },
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip' },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object', hidden: true },
        { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order' }
      ]
    },
    multiGeneralTabs(): Array<IFooterTab> {
      return [
        this.mainMenu,
        this.groupTab,
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order', hidden: this.hasSubSelectedLayer },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' }
      ]
    },
    tabs(): Array<IFooterTab> {
      if (this.inAllPagesMode) {
        return this.pageTabs
      } else if ((this.selectMultiple || this.isGroup) && this.targetIs('image') && (this.isWholeGroup || layerUtils.getCurrLayer.type === LayerType.tmp)) {
        /** tmp layer treated as group */
        return this.multiPhotoTabs
      } else if ((this.selectMultiple || this.isGroup) && this.targetIs('image') && layerUtils.subLayerIdx !== -1) {
        return this.photoInGroupTabs
      } else if ((this.selectMultiple || this.isGroup) && this.targetIs('text')) {
        return this.multiFontTabs
      } else if ((this.selectMultiple || this.isGroup) && this.targetIs('shape') && this.singleTargetType()) {
        return this.multiObjectTabs
      } else if ((this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer)) && !this.singleTargetType()) {
        return this.multiGeneralTabs
      } else if (this.showPhotoTabs) {
        return this.photoTabs
      } else if (this.showFontTabs) {
        return [this.mainMenu, ...this.fontTabs, ...this.genearlLayerTabs]
      } else if (this.showFrameTabs) {
        if (frameUtils.isImageFrame(layerUtils.getCurrLayer as IFrame)) {
          return this.photoTabs
        }
        return this.frameTabs
      } else if (this.showShapeSetting) {
        return this.objectTabs.concat(this.genearlLayerTabs)
      } else if (this.showGeneralTabs) {
        return [this.mainMenu, ...this.genearlLayerTabs]
      } else if (this.inBgSettingMode) {
        return this.bgSettingTab
      } else {
        return this.homeTabs
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
      return layerUtils.getTmpLayer().locked
    },
    isGroup(): boolean {
      return (layerUtils.getCurrLayer.type === LayerType.tmp || this.currSelectedInfo.types.has('group')) && this.currSelectedInfo.layers.length === 1
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer: IImage | IText | IShape | IGroup, index: number) => {
        return layer.type
      })
      return new Set(types)
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    isInFirstStep(): boolean {
      return stepsUtils.isInFirstStep
    },
    isInLastStep(): boolean {
      return stepsUtils.isInLastStep
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
    containerStyles(): { [index: string]: any } {
      return {
        transform: `translate(0,${this.contentEditable ? 100 : 0}%)`,
        opacity: `${this.contentEditable ? 0 : 1}`
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
      handler() {
        if (this.disableTabScroll) {
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
      _addPage: 'ADD_page',
      _addPageToPos: 'ADD_pageToPos',
      _deletePage: 'DELETE_page',
      _setmiddlemostPageIndex: 'SET_middlemostPageIndex',
      _setCurrActivePageIndex: 'SET_currActivePageIndex',
      _setIsDragged: 'page/SET_IsDragged',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview',
      setBgImageControl: 'SET_backgroundImageControl'
    }),
    handleTabAction(tab: IFooterTab) {
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
        case 'main-menu': {
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
          const { width, height } = pageUtils.getPageSize(pageUtils.currFocusPageIndex)
          pageUtils.addPageToPos(pageUtils.newPage({ width, height }), pageUtils.currActivePageIndex + 1)
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
          this._deletePage(tmpIndex)
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

            tiptapUtils.focus({ scrollIntoView: false })
          } else {
            /**
             * @Todo handle the sub controler
             */
          }
          break
        }
        case 'group':
        case 'ungroup': {
          this.disableTabScroll = true
          mappingUtils.mappingIconAction(tab.icon)
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
        case 'effect': {
          if (this.isHandleShadow && this.mobilePanel !== 'photo-shadow') {
            Vue.notify({ group: 'copy', text: `${i18n.t('NN0665')}` })
            return
          }
          break
        }
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
    handleLockedNotify() {
      this.$notify({ group: 'copy', text: '🔒背景已被鎖定，請解鎖後再進行操作' })
    }
  }
})
</script>

<style lang="scss" scoped>
.footer-tabs {
  overflow: hidden;
  background-color: setColor(gray-5);
  &__container {
    overflow: scroll;
    display: grid;
    grid-template-rows: auto;
    grid-auto-flow: column;
    grid-auto-columns: 65px;
    column-gap: 32px;
    background-color: setColor(nav);
    padding: 8px 12px;
    @include no-scrollbar;
    transition: transform 0.3s, opacity 0.4s;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0px 4px;
    > span {
      transform: scale(0.8);
      transition: background-color 0.2s, color 0.2s;
    }
  }
}
</style>
