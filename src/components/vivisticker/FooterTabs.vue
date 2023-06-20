<template lang="pug">
div(class="footer-tabs" ref="tabs")
  div(class="footer-tabs__content")
    div(class="footer-tabs__container" :class="{main: !isInEditor}" :style="containerStyles()"
        @scroll.passive="updateContainerOverflow" ref="container")
      template(v-for="tab in editorTypeTemplate ? templateTabs : tabs" :key="tab.icon")
        div(v-if="!tab.hidden" :key="tab.icon"
            class="footer-tabs__item"
            :class="{'click-disabled': (tab.disabled || isLocked)}"
            @click="handleTabAction(tab)")
          color-btn(v-if="tab.icon === 'color'" size="22px"
                    class="click-disabled"
                    :color="globalSelectedColor")
          svg-icon(v-else class="click-disabled"
            :iconName="tab.icon"
            :iconColor="tabColor(tab)"
            :iconWidth="'24px'"
            :style="textIconStyle")
          span(class="no-wrap click-disabled"
            :class="`text-${tabColor(tab)}`") {{tab.text}}
    transition(name="panel-up")
      div(v-if="isSettingTabsOpen" class="footer-tabs__sub-tabs" :style="subTabStyles()")
        div(class="footer-tabs__unfold"
            @click="handleTabAction(mainMenu)")
          svg-icon(class="click-disabled"
            :iconName="mainMenu.icon"
            :iconColor="'black-4'"
            :iconWidth="'24px'"
            :style="textIconStyle")
        div(class="footer-tabs__container" :style="containerStyles(true)"
            @scroll.passive="updateContainerOverflow" ref="sub-container")
          template(v-for="(tab) in tabs")
            div(v-if="!tab.hidden" :key="tab.icon"
                class="footer-tabs__item"
                :class="{'click-disabled': (tab.disabled || isLocked)}"
                @click="handleTabAction(tab)")
              color-btn(v-if="tab.icon === 'color'" size="22px"
                        class="click-disabled"
                        :color="globalSelectedColor")
              svg-icon(v-else class="click-disabled"
                :iconName="tab.icon"
                :iconColor="tabColor(tab)"
                :iconWidth="'24px'"
                :style="textIconStyle")
              span(class="no-wrap click-disabled"
                :class="`text-${tabColor(tab)}`") {{tab.text}}
</template>
<script lang="ts">
import ColorBtn from '@/components/global/ColorBtn.vue'
import i18n from '@/i18n'
import { IFooterTab } from '@/interfaces/editor'
import { AllLayerTypes, IFrame, IGroup, IImage, ILayer, IShape } from '@/interfaces/layer'
import { ColorEventType, LayerType } from '@/store/types'
import assetUtils, { RESIZE_RATIO_IMAGE } from '@/utils/assetUtils'
import backgroundUtils from '@/utils/backgroundUtils'
import colorUtils from '@/utils/colorUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils from '@/utils/eventUtils'
import formatUtils from '@/utils/formatUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import mappingUtils from '@/utils/mappingUtils'
import mouseUtils from '@/utils/mouseUtils'
import pageUtils from '@/utils/pageUtils'
import shapeUtils from '@/utils/shapeUtils'
import shortcutUtils from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { notify } from '@kyvg/vue3-notification'
import { isEqual, startCase } from 'lodash'
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
  },
  data() {
    const mainMenu = { icon: 'vivisticker_unfold' }
    return {
      mainMenu,
      isFontsPanelOpened: false,
      disableTabScroll: false,
      leftOverflow: false,
      rightOverflow: false,
      clickedTab: '',
      clickedTabTimer: -1
    }
  },
  computed: {
    ...mapState({
      isTablet: 'isTablet'
    }),
    ...mapState('mobileEditor', { mobilePanel: 'currActivePanel' }),
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      InBgRemoveFirstStep: 'bgRemove/inFirstStep',
      InBgRemoveLastStep: 'bgRemove/inLastStep',
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      isHandleShadow: 'shadow/isHandling',
      isInEditor: 'vivisticker/getIsInEditor',
      editorType: 'vivisticker/getEditorType',
      editorTypeTextLike: 'vivisticker/getEditorTypeTextLike',
      editorTypeTemplate: 'vivisticker/getEditorTypeTemplate',
      isInMyDesign: 'vivisticker/getIsInMyDesign',
      controllerHidden: 'vivisticker/getControllerHidden',
      hasCopiedFormat: 'getHasCopiedFormat',
      debugMode: 'vivisticker/getDebugMode',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
    }),
    isSettingTabsOpen(): boolean {
      return this.editorTypeTemplate && this.tabs.length > 0
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
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
    groupTab(): IFooterTab {
      return {
        icon: this.isGroup ? 'ungroup' : 'group', text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`, hidden: !this.isGroup && this.selectedLayerNum === 1
      }
    },
    photoInGroupTabs(): Array<IFooterTab> {
      return [
        { icon: 'photo', text: `${this.$t('NN0490')}`, hidden: this.isInFrame },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop', hidden: !this.editorTypeTemplate }, // vivisticker can only crop frame besides template editor
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: !this.editorTypeTemplate },
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          hidden: !this.editorTypeTemplate || this.isInFrame,
          disabled: this.isHandleShadow && this.mobilePanel !== 'photo-shadow'
        },
        ...this.genearlLayerTabs,
        { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: !this.editorTypeTemplate || this.isInFrame }
      ]
    },
    photoTabs(): Array<IFooterTab> {
      console.log(this.inEffectEditingMode)
      const tabs = [
        { icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}`, hidden: !this.editorTypeTemplate },
        { icon: 'photo', text: `${this.$t('NN0490')}`, hidden: this.isSvgImage || this.inEffectEditingMode },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop', hidden: !(this.isInFrame || this.editorTypeTemplate) }, // vivisticker can only crop frame besides template editor
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          // hidden: this.isInFrame,
          // disabled: this.isHandleShadow && this.mobilePanel !== 'photo-shadow'
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: this.isSvgImage },
        ...(this.isInFrame ? [{ icon: 'set-as-frame', text: `${this.$t('NN0098')}` }] : []),
        ...this.genearlLayerTabs,
        { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: !this.editorTypeTemplate || this.isInFrame },
        ...this.copyPasteTabs,
        { icon: 'set-as-frame', text: `${this.$t('NN0706')}`, hidden: !this.editorTypeTemplate || this.isInFrame },
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
    homeTabs(): Array<IFooterTab> {
      return [
        { icon: 'objects', text: `${this.$tc('NN0003', 2)}`, panelType: 'object' },
        { icon: this.$i18n.locale === 'us' ? 'fonts' : 'text', text: `${this.$tc('NN0005', 3)}`, panelType: 'text' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, panelType: 'background' },
        { icon: 'template', text: `${this.$t('NN0001')}`, panelType: 'template' },
        // { icon: 'remove-bg', text: `${this.$t('NN0043')}`, panelType: 'remove-bg', hidden: !this.debugMode }
        { icon: 'remove-bg', text: `${this.$t('NN0043')}`, panelType: 'remove-bg', hidden: !this.debugMode }
      ]
    },
    homeTabsSize(): number {
      return this.homeTabs.filter(tab => !tab.hidden).length
    },
    fontTabs(): Array<IFooterTab> {
      return [
        { icon: 'edit', text: `${this.$t('NN0504')}`, hidden: this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer) },
        { icon: 'plus-square', text: `${this.$t('STK0006')}`, panelType: 'text' },
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
        ...this.editorTypeTemplate && this.genearlLayerTabs,
        ...this.copyPasteTabs
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
        { icon: 'multiple-select', text: `${this.$t('NN0807')}`, panelType: 'multiple-select', hidden: !this.editorTypeTemplate }
      ]
    },
    bgRemoveTabs(): Array<IFooterTab> {
      return [
        { icon: 'remove-bg', text: `${this.$t('NN0043')}`, panelType: 'remove-bg' }
      ]
    },
    templateTabs(): Array<IFooterTab> {
      return [
        { icon: 'template', text: `${this.$t('NN0001')}`, panelType: 'template-content' },
        { icon: 'camera', text: this.$t('STK0067') },
        { icon: 'objects', text: `${this.$tc('NN0003', 2)}`, panelType: 'object' },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}`, panelType: 'text' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, panelType: 'background' },
        { icon: 'photo', text: `${this.$t('STK0069')}`, panelType: 'photo' },
        { icon: 'paste', text: `${this.$t('NN0230')}` }
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
        ...this.copyPasteTabs
      ]
    },
    copyPasteTabs(): Array<IFooterTab> {
      return this.editorTypeTemplate ? [
        { icon: 'copy', text: `${this.$t('NN0032')}` },
        { icon: 'paste', text: `${this.$t('NN0230')}` }
      ] : []
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
        /** tmp layer treated as group */
        return this.multiPhotoTabs
      } else if (this.isGroupOrTmp && this.targetIs('image') && layerUtils.subLayerIdx !== -1) {
        return this.photoInGroupTabs
      // text + shape color
      } else if (this.isGroupOrTmp && this.targetIs('text') && this.showObjectColorAndFontTabs) {
        return [...this.multiObjectTabs, ...this.fontTabs]
      } else if (this.isGroupOrTmp && this.targetIs('text')) {
        return this.multiFontTabs
      } else if (this.isGroupOrTmp && this.targetIs('shape') && this.singleTargetType()) {
        return this.multiObjectTabs
      } else if ((this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer)) && !this.singleTargetType()) {
        return this.multiGeneralTabs
      // When deselect in object editor with frame
      } else if (this.showFrame) {
        return [...this.frameTabs, ...this.genearlLayerTabs]
      // When select empty frame in object editor
      } else if (this.showEmptyFrameTabs) {
        return this.emptyFrameTabs
      } else if ((this.showPhotoTabs || targetType === LayerType.image) && !controllerHidden) {
        return this.photoTabs
      } else if (this.showFontTabs) {
        const res = [
          ...(this.editorTypeTemplate ? [{ icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}` }] : []), // conditional insert to prevent duplicate key
          ...this.fontTabs
        ]
        res.splice(this.fontTabs.length - 2, 0, ...this.genearlLayerTabs, ...this.copyPasteTabs)
        return res
      } else if (this.showShapeSetting) {
        return [
          { icon: 'vivisticker_duplicate', text: `${this.$t('NN0251')}`, hidden: !this.editorTypeTemplate },
          ...this.objectTabs,
          ...this.genearlLayerTabs,
          ...this.copyPasteTabs
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
      } else if (!this.isInEditor) {
        return this.homeTabs
      } else if (this.editorTypeTextLike) {
        return [{ icon: 'plus-square', text: `${this.$t('STK0006')}`, panelType: 'text' }]
      } else {
        return []
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
    isSvgImage(): boolean {
      const layer = layerUtils.getCurrLayer
      const subLayerIdx = layerUtils.subLayerIdx
      if (subLayerIdx === -1) {
        return layer.type === LayerType.image && [14, 15].includes((layer as IImage).categoryType ?? -1)
      } else {
        const layers = (layer as IGroup).layers
        if (!layers) return false
        const subLayer = layers[subLayerIdx]
        return subLayer.type === LayerType.image && [14, 15].includes((subLayer as IImage).categoryType ?? -1)
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
    contentEditable(): boolean {
      return this.currSelectedInfo.layers[0]?.contentEditable
    },
    currLayer(): ILayer {
      return layerUtils.getCurrLayer
    },
    isLine(): boolean {
      return shapeUtils.isLine(this.currLayer as AllLayerTypes)
    },
    isBasicShape(): boolean {
      return shapeUtils.isBasicShape(this.currLayer as AllLayerTypes)
    },
    showShapeAdjust(): boolean {
      return this.isLine || this.isBasicShape
    },
    selectMultiple(): boolean {
      return this.selectedLayerNum > 1
    },
    backgroundImgControl(): boolean {
      return pageUtils.currFocusPage.backgroundImage.config?.imgControl ?? false
    },
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
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
        const elContainer = (this.isSettingTabsOpen ? this.$refs['sub-container'] : this.$refs.container) as HTMLElement
        if (elContainer) elContainer.scrollTo(0, 0)
        this.$nextTick(() => {
          this.updateContainerOverflow()
        })
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
      setBgImageControl: 'SET_backgroundImageControl'
    }),
    updateContainerOverflow() {
      const elContainer = (this.isSettingTabsOpen ? this.$refs['sub-container'] : this.$refs.container) as HTMLElement
      if (!elContainer) return
      const { scrollLeft, scrollWidth, offsetWidth } = elContainer
      this.leftOverflow = scrollLeft > 0
      this.rightOverflow = scrollLeft + 0.5 < (scrollWidth - offsetWidth) && scrollWidth > offsetWidth
    },
    handleTabAction(tab: IFooterTab) {
      if (tab.icon !== 'multiple-select' && this.inMultiSelectionMode) {
        editorUtils.setInMultiSelectionMode(!this.inMultiSelectionMode)
      }
      if (tab.icon !== 'crop' && this.isCropping) {
        imageUtils.setImgControlDefault()
      }

      switch (tab.icon) {
        case 'vivisticker_unfold': {
          groupUtils.deselect()
          this.$emit('switchTab', 'none')
          if (this.inBgSettingMode) editorUtils.setInBgSettingMode(false)
          if (this.isBgImgCtrl) pageUtils.setBackgroundImageControlDefault()
          break
        }
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
        case 'effect': {
          // Unreachable, becaues button is disabled
          // if (this.isHandleShadow && this.mobilePanel !== 'photo-shadow') {
          //   notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
          //   return
          // }
          break
        }
        case 'photo':
        case 'replace': {
          if (tab.panelType !== undefined) break
          const { pageIndex, layerIndex, subLayerIdx = 0, getCurrLayer: layer } = layerUtils
          vivistickerUtils.getIosImg()
            .then(async (images: Array<string>) => {
              if (images.length) {
                const isPrimaryLayerFrame = layer.type === LayerType.frame
                const srcObj = {
                  type: 'ios',
                  assetId: images[0],
                  userId: ''
                }
                const src = imageUtils.getSrc(srcObj)
                if (isPrimaryLayerFrame) {
                  // replace frame
                  const { imgX, imgY, imgWidth, imgHeight } = await imageUtils
                    .getClipImgDimension((layerUtils.getCurrLayer as IFrame).clips[subLayerIdx], src)
                  frameUtils.updateFrameLayerStyles(pageIndex, layerIndex, subLayerIdx, {
                    imgWidth,
                    imgHeight,
                    imgX,
                    imgY
                  })
                  frameUtils.updateFrameClipSrc(pageIndex, layerIndex, subLayerIdx, srcObj)
                } else {
                  // replace image
                  imageUtils.imgLoadHandler(src, (img: HTMLImageElement) => {
                    const { naturalWidth, naturalHeight } = img
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
                  })
                }
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
          vivistickerUtils.getIosImg()
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
        if (this.isInEditor) {
          this.$emit('switchTab', tab.panelType, tab.props)
        } else {
          this.$emit('switchMainTab', tab.panelType, tab.props)
          if (this.currTab === tab.panelType) {
            eventUtils.emit(`scrollPanel${startCase(this.currTab)}ToTop`)
          }
        }
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
        if (this.currSelectedInfo.types.has('frame') && type === 'image') {
          return this.isInFrame
        }
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
      if (this.currTab === 'color') {
        return this.currTab === tab.panelType &&
          ((colorUtils.currEvent === 'setTextColor' && tab.icon === 'text-color-mobile') ||
          (colorUtils.currEvent !== 'setTextColor' && tab.icon === 'color'))
      } else return this.currTab === tab.panelType || this.clickedTab === tab.icon
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
    handleLockedNotify() {
      notify({ group: 'copy', text: i18n.global.tc('NN0804') })
    },
    tabColor(tab: IFooterTab): string {
      return (tab.disabled || this.isLocked) ? 'gray-2' : this.tabActive(tab) ? 'white' : 'black-4'
    },
    containerStyles(isSubContainer = false): { [index: string]: string } {
      // Use mask-image implement fade scroll style, support Safari 14.3, https://stackoverflow.com/a/70971847
      return {
        transform: `translate(0,${this.contentEditable ? 100 : 0}%)`,
        opacity: `${this.contentEditable ? 0 : 1}`,
        ...(this.isSettingTabsOpen === isSubContainer && {
          maskImage: this.contentEditable ? 'none'
            : `linear-gradient(to right,
          transparent 0, black ${this.leftOverflow ? '56px' : 0},
          black calc(100% - ${this.rightOverflow ? '56px' : '0px'}), transparent 100%)`
        }),
        ...(this.isTablet && this.isInEditor && { height: '80px', justifyContent: 'center' }),
        ...(isSubContainer && { paddingLeft: '0px' })
      }
    },
    subTabStyles(): { [index: string]: string } {
      return {
        ...(this.isTablet && { justifyContent: 'center', gridTemplateColumns: 'auto auto' })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.footer-tabs {
  overflow: hidden;
  background-color: setColor(black-1);

  &__content {
    display: grid;
    transition: transform 0.3s, opacity 0.4s;
  }

  &__unfold {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0px 12px 0px 24px;
    background-color: setColor(black-1);
    z-index: 1;
  }

  &__container {
    height: 57px;
    overflow: scroll;
    display: grid;
    grid-template-rows: auto;
    grid-auto-flow: column;
    grid-auto-columns: 62px;
    background-color: setColor(black-1);
    padding: 0 12px;
    @include no-scrollbar;
    transition: transform 0.3s, opacity 0.4s;
    &.main {
      overflow: hidden;
      display: grid;
      grid-template-columns: repeat(v-bind(homeTabsSize), 1fr);
      align-items: center;
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0px 4px;
    & .color-btn {
      margin: 1px;
    }
    > span {
      transition: background-color 0.2s, color 0.2s;
      @include body-XXS;
      transform: scale(0.8);
      line-height: 20px;
    }
  }

  &__sub-tabs {
    width: 100%;
    position: absolute;
    display: grid;
    grid-template-columns: auto 1fr;
    background-color: setColor(black-1);
  }
}
</style>
