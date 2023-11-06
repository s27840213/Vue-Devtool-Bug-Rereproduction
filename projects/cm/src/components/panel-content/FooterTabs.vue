<template lang="pug">
div(class="flex gap-24 pt-8 pl-24 pr-24 pb-8")
  div(class="flex items-center justify-center h-44")
    div(class="flex items-center justify-center bg-primary-white/[.65] rounded-full w-22 h-22")
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
        svg-icon(
          :iconName="tab.icon"
          :iconColor="settingTabColor(tab)"
          :iconWidth="'24px'"
          :style="textIconStyle")
        //- v-else class="click-disabled"
        span(class="no-wrap click-disabled transition ease-linear delay-200 typo-body-sm"
          :class="`text-${settingTabColor(tab)}`") {{tab.text}}
        //- pro-item(v-if="tab.forPro" :theme="'top-right-corner'" draggable="false")
</template>

<script lang="ts">
import FooterTabs from '@nu/vivi-lib/components/editor/mobile/FooterTabs.vue'
import type { IFooterTab } from '@nu/vivi-lib/interfaces/editor'
import type { IFrame, IGroup, IImage, IShape } from '@nu/vivi-lib/interfaces/layer'
import { ColorEventType, LayerType } from '@nu/vivi-lib/store/types'
import backgroundUtils from '@nu/vivi-lib/utils/backgroundUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import { mapGetters } from 'vuex'

export default defineComponent({
  extends: FooterTabs,
  computed: {
    ...mapGetters({
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      isProcessing: 'bgRemove/getIsProcessing',
      controllerHidden: 'webView/getControllerHidden'
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
    // eslint-disable-next-line vue/no-unused-properties
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
  },
  methods: {
    settingTabColor(tab: IFooterTab): string {
      return (tab.disabled || this.isLocked) ? 'app-tab-disable' : this.tabActive(tab) ? 'app-tab-active' : 'app-tab-default'
    },
  }
})
</script>

<style lang="scss" scoped>
.no-scrollbar {
  @include no-scrollbar;
}
</style>
