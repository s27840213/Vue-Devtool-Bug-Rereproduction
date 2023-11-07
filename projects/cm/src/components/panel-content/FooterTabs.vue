<template lang="pug">
div(class="flex flex-col gap-16 pt-8 pl-24 pr-24 pb-8")
  div(v-if="currActivePanel !== 'none'")
    mobile-panel(:currPage="currPage" :currActivePanel="currActivePanel")
  div(v-if="!hideTabs" class="flex gap-24")
    div(class="flex items-center justify-center h-44")
      div(class="flex items-center justify-center bg-primary-white/[.65] rounded-full w-22 h-22"
          @click="handleBack")
        svg-icon(iconName="chevron-down" iconWidth="14px" iconColor="app-tab-bg")
    div(class="flex gap-24 overflow-scroll no-scrollbar")
      template(v-for="tab in settingTabs")
        div(v-if="!tab.hidden" :key="tab.icon"
            class="flex flex-col items-center justify-center h-44 gap-4 px-4"
            :class="{'click-disabled': (tab.disabled || isLocked || extraDisableCondition(tab))}"
            @click="handleTabAction(tab)")
          color-btn(v-if="tab.icon === 'color'" size="22px"
                    class="click-disabled"
                    :color="globalSelectedColor")
          svg-icon(v-else class="click-disabled"
            :iconName="tab.icon"
            :iconColor="settingTabColor(tab)"
            :iconWidth="'24px'"
            :style="textIconStyle")
          span(class="no-wrap click-disabled transition ease-linear delay-200 typo-body-sm"
            :class="`text-${settingTabColor(tab)}`") {{tab.text}}
          //- pro-item(v-if="tab.forPro" :theme="'top-right-corner'" draggable="false")
</template>

<script lang="ts">
import FooterTabs from '@nu/vivi-lib/components/editor/mobile/FooterTabs.vue'
import type { IFooterTab } from '@nu/vivi-lib/interfaces/editor'
import type { IFrame, IGroup, IImage, IShape } from '@nu/vivi-lib/interfaces/layer'
import type { IPage } from '@nu/vivi-lib/interfaces/page'
import { ColorEventType, LayerType } from '@nu/vivi-lib/store/types'
import assetUtils, { RESIZE_RATIO_IMAGE } from '@nu/vivi-lib/utils/assetUtils'
import backgroundUtils from '@nu/vivi-lib/utils/backgroundUtils'
import colorUtils from '@nu/vivi-lib/utils/colorUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import formatUtils from '@nu/vivi-lib/utils/formatUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerFactary from '@nu/vivi-lib/utils/layerFactary'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import mappingUtils from '@nu/vivi-lib/utils/mappingUtils'
import mouseUtils from '@nu/vivi-lib/utils/mouseUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import paymentUtils from '@nu/vivi-lib/utils/paymentUtils'
import shortcutUtils from '@nu/vivi-lib/utils/shortcutUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
import tiptapUtils from '@nu/vivi-lib/utils/tiptapUtils'
import { mapGetters } from 'vuex'

export default defineComponent({
  extends: FooterTabs,
  data() {
    return {
      hideTabsPanels: [] as string[],
    }
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    },
    currActivePanel: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters({
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      isProcessing: 'bgRemove/getIsProcessing',
      controllerHidden: 'webView/getControllerHidden',
    }),
    groupTab(): IFooterTab {
      return {
        icon: this.isGroup ? 'ungroup' : 'group', text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`, hidden: !this.isGroup && this.selectedLayerNum === 1
      }
    },
    editorType(): string {
      return 'template' // adapting stk logic, charmix is always in template mode
    },
    inImageEditor(): boolean {
      return this.editorType === 'image'
    },
    editorTypeTemplate(): boolean {
      return this.editorType === 'template'
    },
    photoInGroupTabs(): Array<IFooterTab> {
      return [
        { icon: 'photo', text: `${this.$t('NN0490')}`, hidden: this.isInFrame },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop', hidden: !this.editorTypeTemplate },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: !this.editorTypeTemplate },
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          hidden: !this.editorTypeTemplate || this.isInFrame,
          disabled: (this.isHandleShadow || this.isUploadShadow) && this.mobilePanel !== 'photo-shadow'
        },
        ...this.genearlLayerTabs,
      ]
    },
    photoTabs(): Array<IFooterTab> {
      const genearlTabsNoFlip = [...this.genearlLayerTabs]
      const flipIndex = genearlTabsNoFlip.findIndex(t => t.icon === 'flip')
      genearlTabsNoFlip.splice(flipIndex, 1)
      const tabs:Array<IFooterTab> = [
        { icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}`, hidden: !this.editorTypeTemplate },
        { icon: 'photo', text: `${this.$t('NN0490')}`, hidden: this.isSvgImage || this.inEffectEditingMode || this.inImageEditor },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop', hidden: !(this.isInFrame || this.editorTypeTemplate) }, // vivisticker can only crop frame besides template editor
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          hidden: layerUtils.getCurrLayer.type === LayerType.frame,
          // disabled: this.isHandleShadow && this.mobilePanel !== 'photo-shadow'
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: this.isSvgImage },
        ...genearlTabsNoFlip,
        { icon: 'remove-bg', text: `${this.$t('NN0043')}`, panelType: 'remove-bg', forPro: true, plan: 'bg-remove', hidden: this.inEffectEditingMode || this.isInFrame || this.inImageEditor, disabled: this.isProcessing },
        { icon: 'brush', text: `${this.$t('NN0035')}`, panelType: 'copy-style', hidden: !this.editorTypeTemplate },
      ]
      if (layerUtils.getCurrLayer.type === LayerType.frame) {
        tabs.unshift({
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape
          }
        })
      }
      return tabs
    },
    fontTabs(): Array<IFooterTab> {
      return [
        { icon: 'edit', text: `${this.$t('NN0504')}`, hidden: this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer) },
        { icon: 'font', text: generalUtils.capitalize(`${this.$tc('NN0353', 2)}`), panelType: 'fonts' },
        { icon: 'font-size', text: `${this.$t('NN0492')}`, panelType: 'font-size' },
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
        { icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}`, hidden: this.editorTypeTemplate },
        { icon: 'brush', text: `${this.$t('NN0035')}`, panelType: 'copy-style' }
      ]
    },
    bgSettingTab(): Array<IFooterTab> {
      const { hasBgImage } = backgroundUtils
      return [
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity', disabled: this.backgroundLocked },
        { icon: 'photo', text: `${this.$t('NN0490')}`, hidden: !hasBgImage, disabled: this.backgroundLocked },
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
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: !this.editorTypeTemplate }
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
    frameTabs(): Array<IFooterTab> {
      const targetLayer = layerUtils.getCurrConfig as IFrame
      if (targetLayer.type !== 'frame') return []
      const showAdjust = targetLayer.clips.some(i => !['frame', 'svg'].includes(i.srcObj.type))
      const showReplace = targetLayer.clips.length === 1 || targetLayer.clips.some(c => c.active)
      return [
        { icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}`, hidden: !this.editorTypeTemplate },
        { icon: 'photo', text: `${this.$t('NN0490')}`, hidden: !this.editorTypeTemplate || !showReplace },
        { icon: 'set-as-frame', text: `${this.$t('NN0098')}`, hidden: !this.editorTypeTemplate || targetLayer.clips.length !== 1 },
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape
          }
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: this.editorTypeTemplate || !showAdjust || this.isSvgImage },
        ...(this.editorTypeTemplate ? this.genearlLayerTabs : []),
      ]
    },
    showEmptyFrameTabs(): boolean {
      const currLayer = layerUtils.getCurrLayer as IFrame
      return !this.controllerHidden && this.editorType === 'object' && currLayer.type === LayerType.frame &&
        currLayer.clips.some(i => i.active && i.srcObj.type === 'frame')
    },
    emptyFrameTabs(): Array<IFooterTab> {
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
        { icon: 'photo', text: `${this.$t('NN0490')}` }
      ] as Array<IFooterTab>
    },
    genearlLayerTabs(): Array<IFooterTab> {
      return [
        { icon: 'layers-alt', text: `${this.$t('NN0757')}`, panelType: 'order', hidden: !this.editorTypeTemplate },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        this.groupTab,
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position', hidden: !this.editorTypeTemplate },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip', hidden: !this.editorTypeTemplate },
        { icon: 'nudge', text: `${this.$t('NN0872')}`, panelType: 'nudge', hidden: !this.editorTypeTemplate },
        { icon: 'multiple-select', text: `${this.$t('NN0807')}`, panelType: 'multiple-select', hidden: !this.editorTypeTemplate }
      ]
    },
    bgRemoveTabs(): Array<IFooterTab> {
      return [
        { icon: 'remove-bg', text: `${this.$t('NN0043')}`, panelType: 'remove-bg' }
      ]
    },
    multiGeneralTabs(): Array<IFooterTab> {
      return [
        { icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}`, hidden: !this.editorTypeTemplate },
        { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order', hidden: !this.editorTypeTemplate || this.hasSubSelectedLayer },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        this.groupTab,
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position', hidden: !this.editorTypeTemplate },
        { icon: 'multiple-select', text: `${this.$t('NN0807')}`, panelType: 'multiple-select', hidden: !this.editorTypeTemplate },
      ]
    },
    // copyPasteTabs(): Array<IFooterTab> {
    //   return this.editorTypeTemplate ? [
    //     { icon: 'copy', text: `${this.$t('NN0032')}` },
    //     { icon: 'paste', text: `${this.$t('NN0230')}` }
    //   ] : []
    // },
    settingTabs(): Array<IFooterTab> {
      return this.tabs
    },
    tabs(): Array<IFooterTab> {
      const { subLayerIdx, getCurrLayer: currLayer } = layerUtils
      const { controllerHidden } = this
      let targetType = ''
      if (subLayerIdx !== -1) {
        // targetType = currLayer.type === LayerType.group ? (currLayer as IGroup).layers[subLayerIdx] : (currLayer as IFrame).clips[subLayerIdx]
        if (currLayer.type === LayerType.group && (currLayer as IGroup).layers[subLayerIdx].type === LayerType.image) {
          targetType = LayerType.image
        }
        if (currLayer.type === LayerType.frame && (currLayer as IFrame).clips[subLayerIdx].srcObj.type !== 'frame') {
          targetType = LayerType.image
        }
      }
      if (this.inBgRemoveMode) {
        return this.bgRemoveTabs
      } else if (this.isGroupOrTmp && this.targetIs('image') && (this.isWholeGroup || layerUtils.getCurrLayer.type === LayerType.tmp)) {
        console.warn(1)
        /** tmp layer treated as group */
        return this.multiPhotoTabs
      } else if (this.isGroupOrTmp && this.targetIs('image') && layerUtils.subLayerIdx !== -1) {
        console.warn(2)
        return this.photoInGroupTabs
      // text + shape color
      } else if (this.isGroupOrTmp && this.targetIs('text') && this.showObjectColorAndFontTabs) {
        console.warn(3)
        return [...this.multiObjectTabs, ...this.fontTabs]
      } else if (this.isGroupOrTmp && this.targetIs('text')) {
        console.warn(4)
        return this.multiFontTabs
      } else if (this.isGroupOrTmp && this.targetIs('shape') && this.singleTargetType()) {
        console.warn(5)
        return this.multiObjectTabs
      } else if ((this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer)) && !this.singleTargetType()) {
        console.warn(6)
        return this.multiGeneralTabs
      // When deselect in object editor with frame
      } else if (this.showFrame) {
        console.warn(7)
        return [...this.frameTabs, ...this.genearlLayerTabs]
      // When select empty frame in object editor
      } else if (this.showEmptyFrameTabs) {
        console.warn(8)
        return this.emptyFrameTabs
      } else if ((this.showPhotoTabs || targetType === LayerType.image) && !controllerHidden) {
        console.warn(9)
        return this.photoTabs
      } else if (this.showFontTabs) {
        const res = [
          ...(this.editorTypeTemplate ? [{ icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}` }] : []), // conditional insert to prevent duplicate key
          ...this.fontTabs
        ]
        res.splice(this.fontTabs.length - 2, 0, ...this.genearlLayerTabs)
        return res
      } else if (this.showShapeSetting) {
        return [
          { icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}`, hidden: !this.editorTypeTemplate },
          ...this.objectTabs,
          ...this.genearlLayerTabs,
        ]
      } else if (this.inBgSettingMode) {
        return this.bgSettingTab
      } else if (this.showInGroupFrame) {
        return [...this.frameTabs, ...this.genearlLayerTabs]
      } else if (this.editorTypeTemplate ? this.isGroupOrTmp : this.showGeneralTabs) {
        return [...this.genearlLayerTabs]
      } else if (this.showFrameTabs) {
        if (frameUtils.isImageFrame(layerUtils.getCurrLayer as IFrame)) {
          return this.photoTabs
        }
        return this.frameTabs
      } else {
        return []
      }
    },
    showPhotoTabs(): boolean {
      if (this.inBgRemoveMode) return false
      return (!this.isFontsPanelOpened && this.targetIs('image') && this.singleTargetType()) || (this.editorTypeTemplate && this.hasFrameClipActive)
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
    showFrame(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.selectedLayerNum !== 0 && this.editorType === 'object' && layerUtils.getCurrLayer.type === LayerType.frame &&
        (layerUtils.subLayerIdx === -1 || this.controllerHidden)
    },
    showInGroupFrame(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.selectedLayerNum !== 0 && layerUtils.getCurrLayer.type === LayerType.group && layerUtils.getCurrConfig.type === LayerType.frame &&
        (layerUtils.subLayerIdx !== -1 || this.controllerHidden)
    },
    showShapeSetting(): boolean {
      const { getCurrConfig } = layerUtils
      const stateCondition = !this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked
      const typeConditon = (this.targetIs('shape') && this.singleTargetType()) ||
        (getCurrConfig.type === LayerType.frame && (getCurrConfig as IFrame).clips.length !== 1)
      return stateCondition && typeConditon
    },
    showFrameTabs(): boolean {
      return this.targetIs('frame') && this.singleTargetType() && !(layerUtils.getCurrLayer as IFrame).clips.some(c => c.active)
    },
    showShapeAdjust(): boolean {
      return this.isLine || this.isBasicShape
    },
    hideTabs(): boolean {
      return this.hideTabsPanels.includes(this.currActivePanel)
    }
  },
  methods: {
    settingTabColor(tab: IFooterTab): string {
      return (tab.disabled || this.isLocked) ? 'app-tab-disable' : this.tabActive(tab) ? 'app-tab-active' : 'app-tab-default'
    },
    handleBack() {
      groupUtils.deselect()
      this.$emit('switchTab', 'none')
      if (this.inBgSettingMode) editorUtils.setInBgSettingMode(false)
      if (this.isBgImgCtrl) pageUtils.setBackgroundImageControlDefault()
    },
    handleTabAction(tab: IFooterTab) {
      // if (!paymentUtils.checkProApp({ plan: tab.forPro ? 1 : 0 }, undefined, tab.plan)) return
      if (!paymentUtils.checkProApp({ plan: 0 }, undefined, tab.plan)) return // cm currently disables all pro-items
      if (tab.icon !== 'multiple-select' && this.inMultiSelectionMode) {
        editorUtils.setInMultiSelectionMode(!this.inMultiSelectionMode)
      }
      // If current state is in cropping, the layerIndex sould be stored
      // bcz after we disable the cropping, the current active index would be lost
      const { pageIndex, layerIndex, subLayerIdx } = layerUtils
      if (tab.icon !== 'crop' && this.isCropping) {
        imageUtils.setImgControlDefault()
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
                  index = (layerUtils.getCurrLayer as IFrame).clips.findIndex(l => l.type === 'image' && l.active)
                  if (index >= 0) {
                    frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, index, { imgControl: true })
                  }
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
        case 'vivisticker_duplicate': {
          shortcutUtils.copy().then(() => {
            shortcutUtils.paste()
          })
          break
        }
        case 'brush': {
          if (this.hasCopiedFormat) {
            formatUtils.clearCopiedFormat()
          } else {
            this.handleCopyFormat()
          }
          break
        }
        case 'remove-bg': {
          if (this.isInEditor) {
            // TODO: need cm version of beRemoveSection
            // this.setIsInBgRemoveSection(!this.isInBgRemoveSection)
            this.$emit('switchTab', 'none')
            return
          }
          // if (!this.inBgRemoveMode && !this.isProcessing) {
          //   this.setIsProcessing(true)

          //   // first step: get the image src

          //   // second step: upload the src to backend, and then call the bg remove API

          //   // after finish bg removing, update the srcObj
          //   const { index, pageIndex } = this.currSelectedInfo as ICurrSelectedInfo
          //   const src = imageUtils.getSrc(layerUtils.getCurrLayer as IImage, 'larg')

          //   generalUtils.toDataURL(src, (dataUrl: string) => {
          //     uploadUtils.uploadAsset('stk-bg-remove', [dataUrl])
          //   })

          //   return
          // }
          break
        }
        case 'photo':
        case 'replace': {
          if (tab.panelType !== undefined) break
          const { getCurrLayer: layer } = layerUtils
          stkWVUtils.getIosImg()
            .then(async (images: Array<string>) => {
              if (images.length) {
                const srcObj = {
                  type: 'ios',
                  assetId: images[0],
                  userId: ''
                }
                const src = imageUtils.getSrc(srcObj)
                await imageUtils.imgLoadHandler(src, async (img: HTMLImageElement) => {
                  const { naturalWidth, naturalHeight } = img
                  if (this.inBgSettingMode) {
                    // replace background
                    backgroundUtils.setBgImage({
                      pageIndex: pageUtils.currFocusPageIndex,
                      config: layerFactary.newImage({
                        srcObj,
                        styles: {
                          width: naturalWidth,
                          height: naturalHeight
                        }
                      })
                    })
                    backgroundUtils.fitPageBackground(pageUtils.currFocusPageIndex)
                  } else {
                    switch (layer.type) {
                      case 'image': {
                        // replace image
                        const resizeRatio = RESIZE_RATIO_IMAGE
                        const pageSize = pageUtils.getPageSize(pageIndex)
                        const pageAspectRatio = pageSize.width / pageSize.height
                        const photoAspectRatio = naturalWidth / naturalHeight
                        const photoWidth = photoAspectRatio > pageAspectRatio ? pageSize.width * resizeRatio : (pageSize.height * resizeRatio) * photoAspectRatio
                        const photoHeight = photoAspectRatio > pageAspectRatio ? (pageSize.width * resizeRatio) / photoAspectRatio : pageSize.height * resizeRatio
                        const config = layerUtils.getCurrConfig as IImage
                        const { imgWidth, imgHeight } = config.styles
                        const path = `path('M0,0h${imgWidth}v${imgHeight}h${-imgWidth}z`
                        const styles = {
                          ...config.styles,
                          ...mouseUtils.clipperHandler({
                            styles: {
                              width: photoWidth,
                              height: photoHeight
                            }
                          } as unknown as IImage, path, config.styles).styles,
                          ...{
                            initWidth: config.styles.initWidth,
                            initHeight: config.styles.initHeight
                          }
                        }
                        layerUtils.updateLayerStyles(pageIndex, layerIndex, styles, subLayerIdx)
                        layerUtils.updateLayerProps(pageIndex, layerIndex, { srcObj }, subLayerIdx)
                        break
                      }
                      case 'frame': {
                        // replace frame
                        const clipIndex = Math.max(subLayerIdx, 0)
                        const { imgX, imgY, imgWidth, imgHeight } = await imageUtils
                          .getClipImgDimension((layerUtils.getCurrLayer as IFrame).clips[clipIndex], src)
                        frameUtils.updateFrameLayerStyles(pageIndex, layerIndex, clipIndex, {
                          imgX, imgY, imgWidth, imgHeight
                        })
                        frameUtils.updateFrameClipSrc(pageIndex, layerIndex, clipIndex, srcObj)
                        break
                      }
                      case 'group': {
                        const target = layerUtils.getCurrConfig
                        if (target.type === LayerType.image) {
                          const { imgX, imgY, imgWidth, imgHeight } = await imageUtils
                            .getClipImgDimension(target, src)
                          layerUtils.updateLayerStyles(pageIndex, layerIndex, { imgX, imgY, imgWidth, imgHeight }, subLayerIdx)
                          layerUtils.updateLayerProps(pageIndex, layerIndex, { srcObj }, subLayerIdx)
                        } else if (target.type === LayerType.frame && target.clips.length === 1) {
                          const { imgX, imgY, imgWidth, imgHeight } = await imageUtils
                            .getClipImgDimension(target.clips[0], src)
                          frameUtils.updateFrameLayerProps(pageIndex, subLayerIdx, 0, { srcObj }, layerIndex)
                          frameUtils.updateSubFrameLayerStyles(pageIndex, layerIndex, subLayerIdx, 0, { imgX, imgY, imgWidth, imgHeight })
                        }
                      }
                    }
                  }
                })
                stepsUtils.record()
              }
            })
          break
        }
        case 'color':
        case 'text-color-mobile':
          colorUtils.setCurrEvent(tab?.props?.currColorEvent as string)
          break
        case 'camera': {
          stkWVUtils.getIosImg()
            .then(async (images: Array<string>) => {
              if (images.length) {
                const src = imageUtils.getSrc({
                  type: 'ios',
                  assetId: images[0],
                  userId: ''
                })
                imageUtils.imgLoadHandler(src, (img: HTMLImageElement) => {
                  const { naturalWidth, naturalHeight } = img
                  const photoAspectRatio = naturalWidth / naturalHeight
                  assetUtils.addImage(
                    src,
                    photoAspectRatio
                  )
                })
              }
              this.$emit('switchTab', 'none')
            })
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
      }

      if (tab.panelType !== undefined) {
        this.$emit('switchTab', tab.panelType, tab.props)
      }

      // if (['copy', 'paste'].includes(tab.icon)) {
      //   this.clickedTab = tab.icon
      //   notify({ group: 'copy', text: tab.icon === 'copy' ? i18n.global.tc('NN0688') : i18n.global.tc('NN0813') })
      //   this.clickedTabTimer = window.setTimeout(() => {
      //     this.clickedTab = ''
      //   }, 800)
      // }
    },
  }
})
</script>

<style lang="scss" scoped>
.no-scrollbar {
  @include no-scrollbar;
}
</style>
