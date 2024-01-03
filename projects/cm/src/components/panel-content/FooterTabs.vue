<template lang="pug">
div(class="cm-footer-tabs flex flex-col pt-8" :class="{ 'px-24': currActivePanel !== 'cm_remove-bg' }")
  transition(
    name="panel-up"
    @after-leave="afterLeave")
    div(v-show="showMobilePanel")
      brush-options(v-if="currActivePanel === 'cm_remove-bg'")
      mobile-panel(
        v-else
        ref="mobile-panel"
        class="mb-16"
        :currPage="currPage"
        :currActivePanel="currActivePanel")
  div(
    class="flex flex-col gap-24 bg-dark-3 shadow-[0_100px_0_100px_black] shadow-dark-3 z-[1]"
    ref="footerTabsRef")
    div(
      v-if="!hideTabs"
      ref="footerTabs"
      class="footer-tabs-row flex gap-24")
      div(v-if="showBackBtn" class="cm-footer-tabs flex-center h-47")
        div(class="flex-center bg-white/[.65] rounded-full w-22 h-22" @click="handleBack")
          svg-icon(
            iconName="chevron-down"
            iconWidth="14px"
            iconColor="dark-3")
      div(class="cm-footer-tabs flex gap-24 overflow-scroll no-scrollbar mx-auto")
        template(v-for="tab in settingTabs")
          div(
            v-if="!tab.hidden"
            :key="tab.icon"
            class="cm-footer-tabs flex-center flex-col h-47 gap-4 px-4 relative"
            :class="{ 'click-disabled': tab.disabled || isLocked || extraDisableCondition(tab) }"
            @click="handleTabAction(tab)")
            color-btn(
              v-if="tab.icon === 'color'"
              size="22px"
              class="click-disabled"
              :color="globalSelectedColor")
            div(v-else class="relative flex-center")
              svg-icon(
                class="click-disabled"
                :iconName="tab.icon"
                :iconColor="settingTabColor(tab)"
                :iconWidth="'24px'"
                :style="{ ...textIconStyle, transition: 'background-color 0.2s, color 0.2s, stroke 0.2s' }")
              svg-icon(
                v-if="tab.forPro"
                class="absolute -bottom-7 -right-11"
                iconName="crown"
                iconColor="yellow-cm"
                iconWidth="14px")
            span(
              class="no-wrap click-disabled transition ease-linear delay-100 typo-body-sm"
              :class="`text-${settingTabColor(tab)}`") {{ tab.text }}
            //- pro-item(v-if="tab.forPro" :theme="'top-right-corner'" draggable="false")
    footer-bar(
      v-if="hasBottomTitle"
      class="footer-tabs-row"
      :title="bottomTitle"
      @cancel="handleBottomCancel"
      @apply="handleBottomApply")
//- className cm-footer-tabs is for v-click-outside middleware
</template>

<script lang="ts">
import FooterBar from '@/components/panel-content/FooterBar.vue'
import useBiColorEditor from '@/composable/useBiColorEditor'
import { useEditorStore } from '@/stores/editor'
import { useImgSelectorStore } from '@/stores/imgSelector'
import { notify } from '@kyvg/vue3-notification'
import FooterTabs from '@nu/vivi-lib/components/editor/mobile/FooterTabs.vue'
import i18n from '@nu/vivi-lib/i18n'
import type { IFooterTab } from '@nu/vivi-lib/interfaces/editor'
import type { IFrame, IGroup, IImage, IShape } from '@nu/vivi-lib/interfaces/layer'
import type { IPage } from '@nu/vivi-lib/interfaces/page'
import { ColorEventType, LayerType } from '@nu/vivi-lib/store/types'
import backgroundUtils from '@nu/vivi-lib/utils/backgroundUtils'
import colorUtils from '@nu/vivi-lib/utils/colorUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import formatUtils from '@nu/vivi-lib/utils/formatUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageAdjustUtil from '@nu/vivi-lib/utils/imageAdjustUtil'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import mappingUtils from '@nu/vivi-lib/utils/mappingUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import paymentUtils from '@nu/vivi-lib/utils/paymentUtils'
import shortcutUtils from '@nu/vivi-lib/utils/shortcutUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import tiptapUtils from '@nu/vivi-lib/utils/tiptapUtils'
import uploadUtils from '@nu/vivi-lib/utils/uploadUtils'
import { cloneDeep, pick } from 'lodash'
import { mapGetters, mapMutations } from 'vuex'
import { CMobilePanel } from './MobilePanel.vue'

export default defineComponent({
  extends: FooterTabs,
  setup() {
    const { isBiColorEditor } = useBiColorEditor()
    const { openImgSelecotr } = useImgSelectorStore()
    return {
      isBiColorEditor,
      openImgSelecotr,
    }
  },
  data() {
    return {
      hideTabsPanels: [
        'crop-flip',
        'adjust',
        'fonts',
        'color',
        'text-effect',
        'photo-shadow',
        'cm_remove-bg',
      ],
      bottomTitlePanels: ['crop-flip', 'adjust'],
    }
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true,
    },
    currActivePanel: {
      type: String,
      required: true,
    },
  },
  components: {
    FooterBar,
  },
  computed: {
    ...mapGetters({
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      isProcessing: 'bgRemove/getIsProcessing',
      controllerHidden: 'webView/getControllerHidden',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
    }),
    hideTabs(): boolean {
      return this.hideTabsPanels.includes(this.currActivePanel)
    },
    hasBottomTitle(): boolean {
      return this.bottomTitlePanels.includes(this.currActivePanel) || this.inMultiSelectionMode
    },
    bottomTitle(): string {
      switch (this.currActivePanel) {
        case 'crop-flip':
          return this.$t('NN0036')
        case 'adjust':
          return this.$t('NN0042')
      }
      if (this.inMultiSelectionMode) {
        return this.$t('NN0807')
      }
      return ''
    },
    layerNum(): number {
      return this.currPage.layers.length
    },
    groupTab(): IFooterTab {
      return {
        icon: this.isGroup ? 'cm_ungroup' : 'cm_group',
        text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`,
        hidden: !this.isGroup && this.selectedLayerNum === 1,
      }
    },
    photoInGroupTabs(): Array<IFooterTab> {
      const genearlTabsNoFlip = [...this.genearlLayerTabs]
      const flipIndex = genearlTabsNoFlip.findIndex((t) => t.icon === 'cm_flip-h')
      const flipTab = genearlTabsNoFlip[flipIndex]
      genearlTabsNoFlip.splice(flipIndex, 1)
      return [
        { icon: 'crop-flip', text: `${this.$t('NN0036')}`, panelType: 'crop-flip' },
        flipTab,
        { icon: 'photo', text: `${this.$t('NN0490')}`, hidden: this.isInFrame },
        // charmix disabled for now
        // {
        //   icon: 'effect',
        //   text: `${this.$t('NN0429')}`,
        //   panelType: 'photo-shadow',
        //   hidden: this.isInFrame,
        //   disabled: (this.isHandleShadow || this.isUploadShadow) && this.mobilePanel !== 'photo-shadow'
        // },
        { icon: 'cm_sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        ...genearlTabsNoFlip,
        {
          icon: 'copy-edits',
          text: `${this.$t('NN0035')}`,
          hidden: this.isCopyFormatDisabled,
        },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
      ]
    },
    photoTabs(): Array<IFooterTab> {
      const genearlTabsNoFlip = [...this.genearlLayerTabs]
      const flipIndex = genearlTabsNoFlip.findIndex((t) => t.icon === 'cm_flip-h')
      const flipTab = genearlTabsNoFlip[flipIndex]
      genearlTabsNoFlip.splice(flipIndex, 1)
      const tabs: Array<IFooterTab> = [
        { icon: 'duplicate2', text: `${this.$t('NN0251')}` },
        { icon: 'invert', text: `${this.$t('CM0080')}`, hidden: !this.isBiColorEditor },
        { icon: 'crop-flip', text: `${this.$t('NN0036')}`, panelType: 'crop-flip' }, // vivisticker can only crop frame besides template editor
        flipTab,
        {
          icon: 'photo',
          text: `${this.$t('NN0490')}`,
          hidden: this.isSvgImage || this.inEffectEditingMode,
        },
        {
          icon: 'cm_remove-bg',
          text: `${this.$t('NN0043')}`,
          panelType: 'cm_remove-bg',
          forPro: false,
          plan: 'bg-remove',
          hidden: this.inEffectEditingMode || this.isInFrame,
          disabled: this.isProcessing,
        },
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          hidden: layerUtils.getCurrLayer.type === LayerType.frame || this.isBiColorEditor,
          disabled: this.isHandleShadow && this.mobilePanel !== 'photo-shadow',
        },
        {
          icon: 'cm_sliders',
          text: `${this.$t('NN0042')}`,
          panelType: 'adjust',
          hidden: this.isSvgImage,
        },
        ...genearlTabsNoFlip,
        {
          icon: 'copy-edits',
          text: `${this.$t('NN0035')}`,
          hidden: this.isCopyFormatDisabled,
        },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
      ]
      if (layerUtils.getCurrLayer.type === LayerType.frame) {
        tabs.unshift({
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none' || this.isBiColorEditor,
          props: {
            currColorEvent: ColorEventType.shape,
          },
        })
      }
      return tabs
    },
    fontTabs(): Array<IFooterTab> {
      return [
        {
          icon: 'edit',
          text: `${this.$t('NN0504')}`,
          hidden: this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer),
        },
        {
          icon: 'font',
          text: generalUtils.capitalize(`${this.$tc('NN0353', 2)}`),
          panelType: 'fonts',
        },
        { icon: 'font-size', text: `${this.$t('NN0492')}`, panelType: 'font-size' },
        { icon: 'text-format', text: `${this.$t('NN0498')}`, panelType: 'font-format' },
        {
          icon: 'font-curve',
          text: `${this.$t('NN0118')}`,
          panelType: 'font-curve',
          hidden: !this.isBiColorEditor,
        },
        {
          icon: 'text-color-mobile',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          props: {
            currColorEvent: ColorEventType.text,
          },
          hidden: this.isBiColorEditor,
        },
        {
          icon: 'effect',
          text: `${this.$t('NN0491')}`,
          panelType: 'text-effect',
          hidden: this.isBiColorEditor,
        },
        { icon: 'spacing', text: `${this.$t('NN0755')}`, panelType: 'font-spacing' },
        {
          icon: 'copy-edits',
          text: `${this.$t('NN0035')}`,
          hidden: this.isCopyFormatDisabled,
        },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
      ]
    },
    bgSettingTab(): Array<IFooterTab> {
      const { hasBgImage } = backgroundUtils
      return [
        {
          icon: 'cm_opacity',
          text: `${this.$t('NN0030')}`,
          panelType: 'opacity',
          disabled: this.backgroundLocked,
        },
        {
          icon: 'photo',
          text: `${this.$t('NN0490')}`,
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
        {
          icon: 'crop-flip',
          text: `${this.$t('NN0036')}`,
          panelType: 'crop-flip',
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
        {
          icon: 'cm_flip-h',
          text: `${this.$t('NN0038')}`,
          panelType: 'flip',
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
        {
          icon: 'cm_sliders',
          text: `${this.$t('NN0042')}`,
          panelType: 'adjust',
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.background,
          },
          disabled: this.backgroundLocked,
        },
        {
          icon: 'bg-separate',
          text: `${this.$t('NN0708')}`,
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
      ]
    },
    multiPhotoTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs,
        { icon: 'cm_sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
      ]
    },
    multiFontTabs(): Array<IFooterTab> {
      return [...this.multiGeneralTabs, ...this.fontTabs]
    },
    multiObjectTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs,
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none' || this.isBiColorEditor,
          props: {
            currColorEvent: ColorEventType.shape,
          },
        },
      ]
    },
    objectTabs(): Array<IFooterTab> {
      return [
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none' || this.isBiColorEditor,
          props: {
            currColorEvent: ColorEventType.shape,
          },
        },
        {
          icon: 'cm_sliders',
          text: `${this.$t('NN0042')}`,
          panelType: 'object-adjust',
          hidden: !this.showShapeAdjust,
        },
      ]
    },
    frameTabs(): Array<IFooterTab> {
      const targetLayer = layerUtils.getCurrConfig as IFrame
      if (targetLayer.type !== 'frame') return []
      const showAdjust = targetLayer.clips.some((i) => !['frame', 'svg'].includes(i.srcObj.type))
      const showReplace = targetLayer.clips.length === 1 || targetLayer.clips.some((c) => c.active)
      return [
        { icon: 'duplicate2', text: `${this.$t('NN0251')}` },
        { icon: 'photo', text: `${this.$t('NN0490')}`, hidden: !showReplace },
        {
          icon: 'set-as-frame',
          text: `${this.$t('NN0098')}`,
          hidden: targetLayer.clips.length !== 1,
        },
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape,
          },
        },
        {
          icon: 'cm_sliders',
          text: `${this.$t('NN0042')}`,
          panelType: 'adjust',
          hidden: !showAdjust || this.isSvgImage,
        },
        ...this.genearlLayerTabs,
        {
          icon: 'copy-edits',
          text: `${this.$t('NN0035')}`,
          hidden: this.isCopyFormatDisabled,
        },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
      ]
    },
    showEmptyFrameTabs(): boolean {
      // const currLayer = layerUtils.getCurrLayer as IFrame
      // return !this.controllerHidden && this.editorType === 'object' && currLayer.type === LayerType.frame &&
      //   currLayer.clips.some(i => i.active && i.srcObj.type === 'frame')
      return false
    },
    emptyFrameTabs(): Array<IFooterTab> {
      return [
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape,
          },
        },
        { icon: 'photo', text: `${this.$t('NN0490')}` },
      ] as Array<IFooterTab>
    },
    genearlLayerTabs(): Array<IFooterTab> {
      return [
        { icon: 'cm_flip-h', text: `${this.$t('NN0038')}`, panelType: 'flip' },
        { icon: 'cm_opacity', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        {
          icon: 'multiple-select',
          text: `${this.$t('NN0807')}`,
          disabled: this.layerNum === 1,
          hidden: this.inMultiSelectionMode,
        },
        { icon: 'layers-alt', text: `${this.$t('NN0757')}`, panelType: 'order' },
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        // charmix disabled for now
        // { icon: 'nudge', text: `${this.$t('NN0872')}`, panelType: 'nudge' },
      ]
    },
    bgRemoveTabs(): Array<IFooterTab> {
      return [{ icon: 'cm_remove-bg', text: `${this.$t('NN0043')}`, panelType: 'remove-bg' }]
    },
    multiGeneralTabs(): Array<IFooterTab> {
      return [
        { icon: 'duplicate2', text: `${this.$t('NN0251')}` },
        this.groupTab,
        {
          icon: 'multiple-select',
          text: `${this.$t('NN0807')}`,
          hidden: this.inMultiSelectionMode,
        },
        { icon: 'cm_opacity', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        {
          icon: 'layers-alt',
          text: `${this.$t('NN0031')}`,
          panelType: 'order',
          hidden: this.hasSubSelectedLayer,
        },
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
      ]
    },
    // copyPasteTabs(): Array<IFooterTab> {
    //   return [
    //     { icon: 'copy', text: `${this.$t('NN0032')}` },
    //     { icon: 'paste', text: `${this.$t('NN0230')}` }
    //   ]
    // },
    settingTabs(): Array<IFooterTab> {
      return this.tabs
    },
    magicCombined(): Array<IFooterTab> {
      return [
        { icon: 'crop-flip', text: `${this.$t('NN0036')}`, panelType: 'crop-flip' },
        { icon: 'photo', text: `${this.$t('NN0490')}` },
        { icon: 'switch', text: this.$t('CM0133') },
        { icon: 'cm_sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        { icon: 'cm_opacity', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
      ]
    },
    tabs(): Array<IFooterTab> {
      const { subLayerIdx, getCurrLayer: currLayer } = layerUtils
      const { controllerHidden } = this
      let targetType = ''
      if (subLayerIdx !== -1) {
        // targetType = currLayer.type === LayerType.group ? (currLayer as IGroup).layers[subLayerIdx] : (currLayer as IFrame).clips[subLayerIdx]
        if (
          currLayer.type === LayerType.group &&
          (currLayer as IGroup).layers[subLayerIdx].type === LayerType.image
        ) {
          targetType = LayerType.image
        }
        if (
          currLayer.type === LayerType.frame &&
          (currLayer as IFrame).clips[subLayerIdx].srcObj.type !== 'frame'
        ) {
          targetType = LayerType.image
        }
      }
      if (this.inBgRemoveMode) {
        return this.bgRemoveTabs
      } else if (useEditorStore().editorType === 'magic-combined') {
        return this.magicCombined
      } else if (
        this.isGroupOrTmp &&
        this.targetIs('image') &&
        (this.isWholeGroup || layerUtils.getCurrLayer.type === LayerType.tmp)
      ) {
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
      } else if (
        (this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer)) &&
        !this.singleTargetType()
      ) {
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
        const res = [{ icon: 'duplicate2', text: `${this.$t('NN0251')}` }, ...this.fontTabs]
        res.splice(res.length - 1, 0, ...this.genearlLayerTabs)
        return res
      } else if (this.showShapeSetting) {
        return [
          { icon: 'duplicate2', text: `${this.$t('NN0251')}` },
          ...this.objectTabs,
          ...this.genearlLayerTabs,
        ]
      } else if (this.inBgSettingMode) {
        return this.bgSettingTab
      } else if (this.showInGroupFrame) {
        return [...this.frameTabs, ...this.genearlLayerTabs]
      } else if (this.isGroupOrTmp) {
        return [
          ...this.genearlLayerTabs,
          {
            icon: 'copy-edits',
            text: `${this.$t('NN0035')}`,
            hidden: this.isCopyFormatDisabled,
          },
          {
            icon: 'paste-edits',
            text: `${this.$t('NN0919')}`,
            hidden: this.isPasteFormatDisabled,
          },
        ]
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
      return (
        (!this.isFontsPanelOpened && this.targetIs('image') && this.singleTargetType()) ||
        this.hasFrameClipActive
      )
    },
    showObjectColorAndFontTabs(): boolean {
      const { subLayerIdx } = layerUtils
      const currLayer = layerUtils.getCurrLayer
      if (!(currLayer.type === 'group' || currLayer.type === 'tmp') || subLayerIdx !== -1)
        return false
      const singleColorShapes = currLayer.layers.filter(
        (l) => l.type === 'shape' && l.color.length === 1,
      ) as IShape[]
      const multiColorShapes = currLayer.layers.filter(
        (l) => l.type === 'shape' && l.color.length !== 1,
      ) as IShape[]
      const hasImages =
        (currLayer.layers.filter((l) => l.type === 'image') as IImage[]).length !== 0
      if (hasImages || (singleColorShapes.length === 0 && multiColorShapes.length !== 1))
        return false
      else return true
    },
    hasFrameClipActive(): boolean {
      const layer = layerUtils.getCurrLayer
      if (layer.type === LayerType.frame) {
        return (layer as IFrame).clips.some((c) => c.active)
      } else return false
    },
    showFontTabs(): boolean {
      return (
        !this.inBgRemoveMode &&
        !this.isFontsPanelOpened &&
        this.targetIs('text') &&
        this.singleTargetType()
      )
    },
    // showGeneralTabs(): boolean {
    //   return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
    //     this.selectedLayerNum !== 0
    // },
    showFrame(): boolean {
      // return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
      //   this.selectedLayerNum !== 0 && this.editorType === 'object' && layerUtils.getCurrLayer.type === LayerType.frame &&
      //   (layerUtils.subLayerIdx === -1 || this.controllerHidden)
      return false
    },
    showInGroupFrame(): boolean {
      return (
        !this.inBgRemoveMode &&
        !this.isFontsPanelOpened &&
        this.selectedLayerNum !== 0 &&
        layerUtils.getCurrLayer.type === LayerType.group &&
        layerUtils.getCurrConfig.type === LayerType.frame &&
        (layerUtils.subLayerIdx !== -1 || this.controllerHidden)
      )
    },
    showShapeSetting(): boolean {
      const { getCurrConfig } = layerUtils
      const stateCondition = !this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked
      const typeConditon =
        (this.targetIs('shape') && this.singleTargetType()) ||
        (getCurrConfig.type === LayerType.frame && (getCurrConfig as IFrame).clips.length !== 1)
      return stateCondition && typeConditon
    },
    showFrameTabs(): boolean {
      return (
        this.targetIs('frame') &&
        this.singleTargetType() &&
        !(layerUtils.getCurrLayer as IFrame).clips.some((c) => c.active)
      )
    },
    showShapeAdjust(): boolean {
      return this.isLine || this.isBasicShape
    },
    showBackBtn(): boolean {
      return useEditorStore().editorType !== 'magic-combined'
    },
  },
  watch: {
    hasBottomTitle(newVal) {
      if (newVal) {
        stepsUtils.setCheckpoint()
      }
    },
  },
  methods: {
    ...mapMutations({
      setImgConfig: 'imgControl/SET_CONFIG',
      setPreviewImage: 'bgRemove/SET_previewImage',
      setIsProcessing: 'bgRemove/SET_isProcessing',
    }),
    settingTabColor(tab: IFooterTab): string {
      return tab.disabled || this.isLocked
        ? 'lighter'
        : this.tabActive(tab)
        ? 'yellow-cm'
        : 'yellow-0'
    },
    handleBack() {
      groupUtils.deselect()
      this.$emit('switchTab', 'none')
      if (this.inBgSettingMode) editorUtils.setInBgSettingMode(false)
      if (this.isBgImgCtrl) pageUtils.setBackgroundImageControlDefault()
    },
    handleTabAction(tab: IFooterTab) {
      if (!paymentUtils.checkProApp({ plan: tab.forPro ? 1 : 0 })) return
      // if (tab.icon !== 'multiple-select' && this.inMultiSelectionMode) {
      //   editorUtils.setInMultiSelectionMode(!this.inMultiSelectionMode)
      // }
      // If current state is in cropping, the layerIndex sould be stored
      // bcz after we disable the cropping, the current active index would be lost
      const { pageIndex, layerIndex, subLayerIdx } = layerUtils
      if (tab.icon !== 'crop-flip' && this.isCropping) {
        imageUtils.setImgControlDefault()
      }

      switch (tab.icon) {
        case 'crop-flip': {
          if (this.selectedLayerNum > 0) {
            if (this.isCropping) {
              imageUtils.setImgControlDefault()
            } else {
              let index
              switch (layerUtils.getCurrLayer.type) {
                case 'image':
                  layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, {
                    imgControl: true,
                  })
                  break
                case 'frame':
                  index = (layerUtils.getCurrLayer as IFrame).clips.findIndex(
                    (l) => l.type === 'image' && l.active,
                  )
                  if (index >= 0) {
                    frameUtils.updateFrameLayerProps(
                      layerUtils.pageIndex,
                      layerUtils.layerIndex,
                      index,
                      { imgControl: true },
                    )
                  }
                  break
                case 'group':
                  if (layerUtils.getCurrConfig.type === LayerType.image) {
                    layerUtils.updateLayerProps(
                      layerUtils.pageIndex,
                      layerUtils.layerIndex,
                      { imgControl: true },
                      layerUtils.subLayerIdx,
                    )
                  }
                  break
              }
            }
          } else if (this.inBgSettingMode) {
            if (this.backgroundLocked) return this.handleLockedNotify()
            this.setBgImageControl({
              pageIndex: pageUtils.currFocusPageIndex,
              imgControl: !this.backgroundImgControl,
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
            tiptapUtils.agent((editor) => editor.commands.selectAll())
          }
          break
        }
        case 'edit': {
          const { index, pageIndex } = layerUtils.currSelectedInfo
          const { getCurrLayer: currLayer } = layerUtils

          if (!this.hasSubSelectedLayer) {
            if (currLayer.type === 'text') {
              layerUtils.updateLayerProps(pageIndex, index, {
                contentEditable: true,
              })
            }
            this.$nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, currLayer.isEdited ? 'end' : null)
            })
          } else {
            const { subLayerIdx } = layerUtils
            const subLayer = (currLayer as IGroup).layers[subLayerIdx]
            if (subLayer.type === 'text') {
              layerUtils.updateLayerProps(
                pageIndex,
                index,
                {
                  contentEditable: true,
                },
                subLayerIdx,
              )
            }
            this.$nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, 'end')
            })
          }
          break
        }
        case 'cm_group':
        case 'cm_ungroup': {
          this.disableTabScroll = true
          mappingUtils.mappingIconAction(tab.icon.replace('cm_', ''))
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
        case 'duplicate2': {
          shortcutUtils.copy().then(() => {
            shortcutUtils.paste()
          })
          break
        }
        case 'copy-edits': {
          this.handleCopyFormat()
          break
        }
        case 'paste-edits': {
          formatUtils.applyFormatIfCopied(
            layerUtils.pageIndex,
            layerUtils.layerIndex,
            layerUtils.subLayerIdx,
            false,
          )
          break
        }
        case 'cm_remove-bg': {
          if (!this.inBgRemoveMode && !this.isProcessing) {
            this.setIsProcessing(true)

            const src = imageUtils.getSrc(layerUtils.getCurrLayer as IImage, 'larg')

            generalUtils.toDataURL(src, (dataUrl: string) => {
              uploadUtils.uploadAsset('cm-bg-remove', [dataUrl])
            })
          }
          break
        }
        case 'photo':
        case 'replace': {
          if (tab.panelType !== undefined) break
          this.openImgSelecotr({ replace: true })
          break
        }
        case 'color':
        case 'text-color-mobile':
          colorUtils.setCurrEvent(tab?.props?.currColorEvent as string)
          break
        case 'camera': {
          // Wait for coding
          break
        }
        case 'invert': {
          const imgLayer = this.currLayer as IImage
          const adjust = imgLayer.styles?.adjust
          imageAdjustUtil.setAdjust({
            adjust: { ...adjust, invert: +!adjust?.invert },
            pageIndex,
            layerIndex,
            subLayerIndex: subLayerIdx >= 0 ? subLayerIdx : undefined,
          })
          break
        }
        case 'switch': {
          // Switch first and second layers in page.
          const first = cloneDeep(layerUtils.getLayer(pageIndex, 0))
          const second = cloneDeep(layerUtils.getLayer(pageIndex, 1))
          layerUtils.updateLayerStyles(pageIndex, 0, pick(second.styles, ['x', 'y']))
          layerUtils.updateLayerStyles(pageIndex, 1, pick(first.styles, ['x', 'y']))
          break
        }
        default: {
          break
        }
      }

      if (tab.icon !== 'crop-flip') {
        if (this.isCropping) {
          imageUtils.setImgControlDefault()
        }
      }

      if (tab.panelType !== undefined) {
        this.$emit('switchTab', tab.panelType, tab.props)
      }

      this.clickedTab = tab.icon
      this.clickedTabTimer = window.setTimeout(() => {
        this.clickedTab = ''
      }, 200)

      if (['copy', 'paste'].includes(tab.icon)) {
        notify({
          group: 'copy',
          text: tab.icon === 'copy' ? i18n.global.tc('NN0688') : i18n.global.tc('NN0813'),
        })
      }
    },
    handleBottomCancel() {
      stepsUtils.goToCheckpoint()
      switch (this.currActivePanel) {
        case 'crop-flip':
          this.setImgConfig('reset')
      }
      if (this.inMultiSelectionMode) {
        editorUtils.setInMultiSelectionMode(false)
      }
      editorUtils.setShowMobilePanel(false)
    },
    handleBottomApply() {
      ;(this.$refs['mobile-panel'] as CMobilePanel).rightButtonAction()
    },
    afterLeave() {
      editorUtils.setCurrActivePanel('none')
    },
  },
})
</script>
