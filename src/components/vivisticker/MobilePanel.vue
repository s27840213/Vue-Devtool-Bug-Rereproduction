<template lang="pug">
div(class="mobile-panel"
    :class="{'panel-padding': !noPaddingTheme, 'not-rounded': insertTheme, 'at-bottom': bottomTheme}"
    :style="panelStyle"
    v-click-outside="vcoConfig()"
    ref="panel")
  div(v-if="!noHeaderTheme" class="mobile-panel__top-section"
    :class="{'self-padding': noPaddingTheme, 'insert-us': insertTheme && isUs }")
    div(class="mobile-panel__drag-bar"
      :class="{'visible-hidden': (!insertTheme && !isUs && panelTitle !== '') || fixSize || extraFixSizeCondition}"
      @pointerdown.stop="dragPanelStart"
      @touchstart.stop="disableTouchEvent")
        div
    div
      div(class="mobile-panel__btn mobile-panel__left-btn"
          :class="{'visible-hidden': !showLeftBtn, 'click-disabled': !showLeftBtn, 'insert': insertTheme, 'us': isUs}")
        svg-icon(
          class="click-disabled"
          :iconName="leftBtnName"
          :iconColor="'white'"
          :iconWidth="insertTheme ? '32px' : '20px'")
        div(class="mobile-panel__btn-click-zone"
          :class="{'insert-left': insertTheme}"
          @pointerdown.stop="leftButtonAction"
          @touchstart.stop="disableTouchEvent")
      div(class="mobile-panel__title")
        span(class="mobile-panel__title-text body-1 mr-10"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
        div(v-if="currActivePanel === 'multiple-select'" class="mobile-panel__layer-num")
          span(class="label-sm text-white") {{selectedLayerNum}}
      div(class="mobile-panel__btn mobile-panel__right-btn"
          :class="{'visible-hidden': !showRightBtn, 'click-disabled': !showRightBtn, 'insert': insertTheme, 'us': isUs}")
        svg-icon(
          class="click-disabled"
          :iconName="rightBtnName"
          :iconColor="'white'"
          :iconWidth="insertTheme ? '24px' : '20px'")
        div(class="mobile-panel__btn-click-zone"
          :class="{'insert-right': insertTheme}"
          @pointerdown.stop="rightButtonAction"
          @touchstart.stop="disableTouchEvent")
    tabs(v-if="innerTabs.label" class="mobile-panel__inner-tab" theme="light"
        :tabs="innerTabs.label" v-model="innerTabIndex")
  div(class="mobile-panel__bottom-section")
    //- keep-alive(:include="['panel-template', 'panel-photo', 'panel-object', 'panel-background', 'panel-file']")
    //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
    component(v-if="dynamicBindIs && !hideDynamicComp"
      class="border-box"
      :is="dynamicBindIs"
      :key="dynamicBindIs"
      :currPage="currPage"
      v-bind="dynamicBindProps"
      v-on="dynamicBindMethod"
      @close="closeMobilePanel"
      @fitPage="fitPage")
  transition(name="panel-up")
    mobile-panel(v-if="!isSubPanel && currActiveSubPanel !== 'none'"
      :currActivePanel="currActiveSubPanel"
      :isSubPanel="true"
      :currPage="currPage"
      @switchTab="switchTab"
      @close="closeMobilePanel")
</template>
<script lang="ts">
import ColorPanel from '@/components/editor/ColorSlips.vue'
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import PanelAdjust from '@/components/editor/panelMobile/PanelAdjust.vue'
import PanelBrand from '@/components/editor/panelMobile/PanelBrand.vue'
import PanelBrandList from '@/components/editor/panelMobile/PanelBrandList.vue'
import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
import PanelColorPicker from '@/components/editor/panelMobile/PanelColorPicker.vue'
import PanelFlip from '@/components/editor/panelMobile/PanelFlip.vue'
import PanelFontFormat from '@/components/editor/panelMobile/PanelFontFormat.vue'
import PanelFontSize from '@/components/editor/panelMobile/PanelFontSize.vue'
import PanelFontSpacing from '@/components/editor/panelMobile/PanelFontSpacing.vue'
import PanelGiphyMore from '@/components/editor/panelMobile/PanelGiphyMore.vue'
import PanelMore from '@/components/editor/panelMobile/PanelMore.vue'
import PanelMyDesignMore from '@/components/editor/panelMobile/PanelMyDesignMore.vue'
import PanelObjectAdjust from '@/components/editor/panelMobile/PanelObjectAdjust.vue'
import PanelOpacity from '@/components/editor/panelMobile/PanelOpacity.vue'
import PanelOrder from '@/components/editor/panelMobile/PanelOrder.vue'
import PanelPhotoShadow from '@/components/editor/panelMobile/PanelPhotoShadow.vue'
import PanelPosition from '@/components/editor/panelMobile/PanelPosition.vue'
import PanelRemoveBg from '@/components/editor/panelMobile/PanelRemoveBg.vue'
import PanelResize from '@/components/editor/panelMobile/PanelResize.vue'
import panelSelectDesign from '@/components/editor/panelMobile/panelSelectDesign.vue'
import PanelTextEffect from '@/components/editor/panelMobile/PanelTextEffect.vue'
import PanelVvstkMore from '@/components/editor/panelMobile/PanelVvstkMore.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import PanelPage from '@/components/editor/panelSidebar/PanelPage.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PopupDownload from '@/components/popup/PopupDownload.vue'
import Tabs from '@/components/Tabs.vue'
import PanelAddTemplate from '@/components/vivisticker/PanelAddTemplate.vue'
import PanelPageManagement from '@/components/vivisticker/PanelPageManagement.vue'
import PanelTemplateContent from '@/components/vivisticker/PanelTemplateContent.vue'
import PanelText from '@/components/vivisticker/PanelText.vue'
import PanelTextUs from '@/components/vivisticker/us/PanelText.vue'
import i18n from '@/i18n'

import { ICurrSelectedInfo, IFooterTabProps } from '@/interfaces/editor'
import { IFrame } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import colorUtils from '@/utils/colorUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils from '@/utils/eventUtils'
import formatUtils from '@/utils/formatUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { notify } from '@kyvg/vue3-notification'
import vClickOutside from 'click-outside-vue3'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  name: 'mobile-panel',
  emits: ['switchTab', 'panelHeight', 'bottomThemeChange'],
  props: {
    currActivePanel: {
      default: 'none',
      type: String
    },
    isSubPanel: {
      default: false,
      type: Boolean
    },
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    PanelTemplate,
    PanelPhoto,
    PanelObject,
    PanelBackground,
    PanelText,
    PanelTextUs,
    PanelFile,
    PanelBrand,
    PanelPage,
    ColorPanel,
    PanelPosition,
    PanelFlip,
    PanelOpacity,
    PanelOrder,
    PanelFonts,
    PanelFontSize,
    PanelFontFormat,
    PanelFontSpacing,
    PanelResize,
    PopupDownload,
    PanelMore,
    PanelColor,
    PanelAdjust,
    PanelTextEffect,
    PanelPhotoShadow,
    PanelObjectAdjust,
    PanelBrandList,
    PanelVvstkMore,
    PanelGiphyMore,
    PanelColorPicker,
    PanelMyDesignMore,
    panelSelectDesign,
    PanelAddTemplate,
    Tabs,
    PanelRemoveBg,
    PanelPageManagement,
    PanelTemplateContent
  },
  data() {
    return {
      panelHistory: [] as Array<string>,
      // If fixSize is true, panelDragHeight take no effect.
      panelDragHeight: 0,
      lastPointerY: 0,
      showExtraColorPanel: false,
      extraColorEvent: ColorEventType.text,
      isDraggingPanel: false,
      innerTabIndex: 0,
      resizeObserver: null as unknown as ResizeObserver
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      currActiveSubPanel: 'mobileEditor/getCurrActiveSubPanel',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
      isInCategory: 'vivisticker/getIsInCategory',
      isShowAllRecently: 'vivisticker/getShowAllRecently',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode',
      isInPagePreview: 'vivisticker/getIsInPagePreview',
      isBgImgCtrl: 'imgControl/isBgImgCtrl'
    }),
    isUs(): boolean {
      return this.$i18n.locale === 'us'
    },
    isTextInCategory(): boolean {
      return this.isInCategory('text')
    },
    isTextShowAllRecently(): boolean {
      return this.isShowAllRecently('text')
    },
    selectedLayerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    },
    whiteTheme(): boolean {
      const whiteThemePanel = [
        'replace', 'crop', 'bgRemove', 'position', 'flip', 'remove-bg',
        'opacity', 'order', 'fonts', 'font-size', 'text-effect',
        'font-format', 'font-spacing', 'download', 'more', 'color',
        'adjust', 'photo-shadow', 'resize', 'object-adjust', 'brand-list', 'copy-style',
        'vvstk-more', 'giphy-more', 'color-picker', 'my-design-more', 'select-design']

      return this.showExtraColorPanel || whiteThemePanel.includes(this.currActivePanel)
    },
    noPaddingTheme(): boolean {
      return ['brand-list', 'text', 'vvstk-more', 'my-design-more', 'select-design', 'text-effect', 'add-template', 'page-management'].includes(this.currActivePanel)
    },
    noHeaderTheme(): boolean {
      return ['select-design', 'page-management'].includes(this.currActivePanel)
    },
    bottomTheme(): boolean {
      return ['add-template', 'page-management'].includes(this.currActivePanel)
    },
    glassTheme(): boolean {
      return ['page-management'].includes(this.currActivePanel)
    },
    fixSize(): boolean {
      return [
        'crop', 'bgRemove', 'position', 'flip', 'opacity',
        'order', 'font-size', 'font-format',
        'font-spacing', 'download', 'more', 'object-adjust', 'brand-list', 'vvstk-more', 'select-design'].includes(this.currActivePanel)
    },
    trueWholeSize(): boolean {
      return ['text', 'template-content'].includes(this.currActivePanel)
    },
    extraFixSizeCondition(): boolean {
      switch (this.currActivePanel) {
        default: {
          return false
        }
      }
    },
    halfSizeInInitState(): boolean {
      return this.showExtraColorPanel || ['fonts', 'adjust', 'photo-shadow', 'color', 'text-effect'].includes(this.currActivePanel)
    },
    panelTitle(): string {
      switch (this.currActivePanel) {
        case 'crop': {
          return `${this.$t('NN0496')}`
        }
        case 'copy-style': {
          return `${this.$t('NN0809')}`
        }
        case 'text': {
          return this.isTextShowAllRecently && this.isUs ? `${this.$t('NN0024')}` : ''
        }
        case 'none': {
          return ''
        }
        default: {
          return ''
        }
      }
    },
    insertTheme(): boolean {
      return ['text', 'template-content', 'add-template', 'page-management'].includes(this.currActivePanel)
    },
    showRightBtn(): boolean {
      return this.currActivePanel !== 'none'
    },
    showLeftBtn(): boolean {
      return (this.whiteTheme && (this.panelHistory.length > 0 || ['color-picker'].includes(this.currActivePanel) || this.showExtraColorPanel)) || (this.insertTheme && this.isTextInCategory)
    },
    hideDynamicComp(): boolean {
      return ['crop', 'copy-style'].includes(this.currActivePanel)
    },
    noRowGap(): boolean {
      return ['crop', 'color', 'copy-style', 'vvstk-more', 'select-design', 'add-template'].includes(this.currActivePanel)
    },
    panelStyle(): { [index: string]: string } {
      const isSidebarPanel = ['template', 'photo', 'object', 'background', 'text', 'file', 'fonts', 'template-content'].includes(this.currActivePanel)
      return Object.assign(
        (this.isSubPanel ? { bottom: '0', position: 'absolute', zIndex: '100' } : {}) as { [index: string]: string },
        {
          'row-gap': this.noRowGap ? '0px' : '10px',
          backgroundColor: this.whiteTheme ? 'white'
            : this.glassTheme ? 'rgba(20, 20, 20, 0.8)'
              : this.bottomTheme ? '#141414'
                : '#1F1F1F',
          backdropFilter: this.glassTheme ? 'blur(5px)' : 'none',
          maxHeight: this.isDuringCopy ? '0' : (
            this.fixSize || this.extraFixSizeCondition
              ? '100%' : Math.min(this.panelDragHeight, this.panelParentHeight()) + 'px'
          ),
        },
        isSidebarPanel ? { height: '100%' } : {},
        this.isDuringCopy ? { padding: '0' } : {}
      )
    },
    innerTabs(): Record<string, string[]> {
      switch (this.currActivePanel) {
        // case 'replace':
        // return {
        //   key: [
        //     'photo',
        //     'file'
        //   ],
        //   label: [
        //     this.$tc('NN0002', 2),
        //     this.$tc('NN0006')
        //   ]
        // }
        default:
          return {
            key: ['']
          }
      }
    },
    dynamicBindIs(): string {
      if (this.showExtraColorPanel) {
        return 'panel-color'
      }

      const defaultVal = `panel-${this.currActivePanel}`

      switch (this.currActivePanel) {
        case 'download': {
          return 'popup-download'
        }
        case 'text': {
          return 'panel-text' + (this.isUs ? '-us' : '')
        }
        // case 'replace': {
        //   return `panel-${this.innerTab}`
        // }
        case 'none':
          return ''
        default: {
          return defaultVal
        }
      }
    },
    dynamicBindProps(): { [index: string]: any } {
      if (this.showExtraColorPanel) {
        return {
          currEvent: this.extraColorEvent,
          panelHistory: this.panelHistory
        }
      }

      switch (this.currActivePanel) {
        case 'fonts': {
          return {
            showTitle: false
          }
        }
        case 'download': {
          return {
            hideContainer: true,
            pageIndex: pageUtils.currFocusPageIndex
          }
        }
        case 'text-effect': {
          return {
            panelHistory: this.panelHistory
          }
        }
        case 'color': {
          return {
            panelHistory: this.panelHistory
          }
        }
        case 'brand-list': {
          const brandDefaultVal = {
            panelHistory: this.panelHistory
          }
          if (editorUtils.currActivePanel === 'text') {
            return {
              defaultOption: true
            }
          }
          if (editorUtils.currActivePanel === 'brand') {
            return {
              hasAddBrand: true
            }
          }
          return brandDefaultVal
        }
        case 'brand': {
          return {
            maxheight: this.panelParentHeight()
          }
        }
        case 'vvstk-more': {
          return {
            panelHistory: this.panelHistory
          }
        }
        default: {
          return {}
        }
      }
    },
    dynamicBindMethod(): { [index: string]: any } {
      const pushHistory = (history: string) => {
        this.panelHistory.push(history)
      }
      const openExtraColorModal = (colorEventType: ColorEventType, initColorPanelType: MobileColorPanelType) => {
        this.showExtraColorPanel = true
        this.extraColorEvent = colorEventType
        this.panelHistory.push(initColorPanelType)
      }
      switch (this.currActivePanel) {
        case 'color':
          return { pushHistory }
        case 'background':
          return { openExtraColorModal }
        case 'text-effect':
        case 'photo-shadow': {
          return { pushHistory, openExtraColorModal }
        }
        case 'brand-list':
        case 'vvstk-more':
          return {
            pushHistory,
            back: () => {
              this.panelHistory.pop()
            }
          }
        default:
          return {}
      }
    },
    leftBtnName(): string {
      if (this.insertTheme) {
        return 'vivisticker_back'
      } else {
        return 'back-circle'
      }
    },
    rightBtnName(): string {
      if (this.insertTheme) {
        return 'vivisticker_close'
      } else if (this.currActivePanel === 'color-picker') {
        return 'check-mobile-circle'
      } else {
        return 'close-circle'
      }
    },
    leftButtonAction(): (e: PointerEvent) => void {
      const colorHandler = () => {
        if (this.showExtraColorPanel || this.currActivePanel === 'color') {
          if (this.panelHistory[this.panelHistory.length - 1] === 'color-picker') {
            this.addRecentlyColors(colorUtils.currColor)
          }
        }
      }
      if (this.insertTheme && this.isTextInCategory) {
        return () => {
          this.setIsInCategory({ tab: 'text', bool: false })
          this.setShowAllRecently({ tab: 'text', bool: false })
          this.resetTextsSearch()
        }
      }
      if (this.showExtraColorPanel) {
        return () => {
          colorHandler()
          this.showExtraColorPanel = false
          this.panelHistory.pop()
        }
      }
      if (this.currActivePanel === 'color-picker') {
        return () => {
          vivistickerUtils.setHasNewBgColor(false)
          this.closeMobilePanel()
        }
      }
      if (this.panelHistory.length > 0) {
        return () => {
          colorHandler()
          this.panelHistory.pop()
        }
      } else {
        return () => {
          colorHandler()
          this.closeMobilePanel()
        }
      }
    },
    rightButtonAction(): () => void {
      return () => {
        switch (this.currActivePanel) {
          case 'crop': {
            if (this.selectedLayerNum > 0) {
              if (imageUtils.isImgControl()) {
                imageUtils.setImgControlDefault()
              } else {
                let index
                switch (layerUtils.getCurrLayer.type) {
                  case 'image':
                    layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true })
                    break
                  case 'frame':
                    index = (layerUtils.getCurrLayer as IFrame).clips.findIndex(l => l.type === 'image')
                    if (index >= 0) {
                      frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, index, { imgControl: true })
                    }
                    break
                }
              }
            } else if (this.inBgSettingMode) {
              if (this.backgroundLocked) return this.handleLockedNotify()
              this.setBgImageControl({
                pageIndex: pageUtils.currFocusPageIndex,
                imgControl: false
              })
            }
            break
          }

          case 'remove-bg': {
            if (this.bgRemoveMode) {
              bgRemoveUtils.setInBgRemoveMode(false)
            }
            break
          }

          case 'copy-style': {
            formatUtils.clearCopiedFormat()
            break
          }

          case 'color': {
            if (this.panelHistory[this.panelHistory.length - 1] === 'color-picker') {
              this.addRecentlyColors(colorUtils.currColor)
            }
            break
          }

          case 'color-picker': {
            vivistickerUtils.commitNewBgColor()
            break
          }
        }
        if (this.showExtraColorPanel) {
          this.addRecentlyColors(colorUtils.currColor)
        }
        this.closeMobilePanel()
      }
    },
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
    },
  },
  watch: {
    selectedLayerNum(newVal: number) {
      if (newVal === 0) {
        editorUtils.setInMultiSelectionMode(false)
      }
    },
    currActivePanel(newVal, oldVal) {
      this.panelHistory = []
      this.innerTabIndex = 0
      // Use v-show to show MobilePanel will cause
      // mounted not triggered, use watch to reset height.
      if (oldVal === 'none' || newVal === 'text') { // Prevent reset height when switch panel
        this.panelDragHeight = newVal === 'none' ? 0 : this.initPanelHeight()
      }
    },
    showMobilePanel(newVal) {
      if (!newVal) {
        this.showExtraColorPanel = false
      }
    },
    bottomTheme(newVal) {
      this.$emit('bottomThemeChange', newVal)
    }
  },
  mounted() {
    this.panelDragHeight = this.currActivePanel === 'none'
      ? 0 : this.initPanelHeight()
    this.resizeObserver = new ResizeObserver(() => {
      this.$emit('panelHeight', this.currPanelHeight())
      // No fit page in mobile now
      // Prevent fitPage when full size panel open, ex: SidebarPanel
      // if (this.fixSize || this.panelDragHeight !== this.panelParentHeight()) {
      //   this.fitPage()
      // }
    })
    this.resizeObserver.observe(this.$refs.panel as Element)
  },
  beforeUnmount() {
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  methods: {
    ...mapMutations({
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel',
      setIsInCategory: 'vivisticker/SET_isInCategory',
      setShowAllRecently: 'vivisticker/SET_showAllRecently',
      setBgImageControl: 'SET_backgroundImageControl'
    }),
    ...mapActions({
      initRecentlyColors: 'color/initRecentlyColors',
      addRecentlyColors: 'color/addRecentlyColors',
      resetTextsSearch: 'textStock/resetSearch'
    }),
    vcoConfig() {
      return {
        handler: () => {
          if (!(this.bgRemoveMode || this.isInPagePreview || this.isBgImgCtrl)) {
            this.closeMobilePanel()
          }
        },
        middleware: this.middleware,
        events: ['touchstart', 'pointerdown',
          ...window.location.host === 'localhost:8080' ? [] : ['contextmenu']]
      }
    },
    middleware(event: MouseEvent | TouchEvent | PointerEvent) {
      const target = event.target as HTMLElement
      return !(target.matches('.header-bar .panel-icon *') || // Skip header-bar icon
        target.matches('.modal-container, .modal-container *') || // Skip modal-card
        target.className.includes?.('footer-tabs') || // Skip footer-bar icon
        target.className === 'inputNode' ||
        this.currActivePanel === 'select-design'
      )
    },
    closeMobilePanel() {
      editorUtils.setShowMobilePanel(false)
    },
    initPanelHeight() {
      const parentElementHeight = this.panelParentHeight()
      if (this.halfSizeInInitState) return parentElementHeight * 0.5
      return parentElementHeight - 40
    },
    currPanelHeight() {
      return (this.$refs.panel as HTMLElement).clientHeight
    },
    panelParentHeight() {
      // 40 = HeaderTabs height
      if (!this.$el) return window.innerHeight
      return (this.$el.parentElement as HTMLElement).clientHeight - (this.trueWholeSize ? 0 : 40)
    },
    dragPanelStart(event: MouseEvent | PointerEvent) {
      if (this.fixSize) {
        return
      }
      this.isDraggingPanel = true
      this.lastPointerY = event.clientY
      this.panelDragHeight = this.currPanelHeight()
      eventUtils.addPointerEvent('pointermove', this.dragingPanel)
      eventUtils.addPointerEvent('pointerup', this.dragPanelEnd)
    },
    dragingPanel(event: MouseEvent | PointerEvent) {
      this.panelDragHeight -= event.clientY - this.lastPointerY
      this.lastPointerY = event.clientY
    },
    dragPanelEnd() {
      this.isDraggingPanel = false
      const panelParentHeight = this.panelParentHeight()
      if (this.panelDragHeight < panelParentHeight * 0.25) {
        this.closeMobilePanel()
      } else if (this.panelDragHeight >= panelParentHeight * 0.75) {
        this.panelDragHeight = panelParentHeight - 40
        this.$emit('panelHeight', this.panelDragHeight + 30) // 30 = 15 padding * 2
      } else {
        this.panelDragHeight = panelParentHeight * 0.5
        this.$emit('panelHeight', this.panelDragHeight + 30)
      }

      eventUtils.removePointerEvent('pointermove', this.dragingPanel)
      eventUtils.removePointerEvent('pointerup', this.dragPanelEnd)
    },
    disableTouchEvent(e: TouchEvent) {
      if (generalUtils.isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    switchTab(panelType: string, props?: IFooterTabProps) {
      if (this.currActiveSubPanel === panelType) {
        this.setCurrActiveSubPanel('none')
      } else {
        this.setCurrActiveSubPanel(panelType)
      }
    },
    fitPage() {
      this.$nextTick(() => {
        pageUtils.fitPage()
      })
    },
    handleLockedNotify() {
      notify({ group: 'copy', text: i18n.global.tc('NN0804') })
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-panel {
  position: absolute;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: setZindex(mobile-panel);
  border-radius: 10px 10px 0 0;
  // box-shadow: 0px -2px 5px setColor(gray-4, 0.5);
  box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  justify-items: center;

  &.not-rounded {
    border-radius: 0;
  }

  &.panel-padding {
    padding: 16px;
  }

  &.at-bottom {
    z-index: setZindex(mobile-panel-bottom);
  }

  &__top-section {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    &.self-padding {
      padding: 15px;
      padding-bottom: 0;
      box-sizing: border-box;
    }
    > div:nth-child(2) {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    &.insert-us {
      padding-top: 25px;
    }
  }

  &__btn {
    position: relative;
  }

  &__left-btn.insert {
    transform: translate(-2px, -6px);
    &.us{
      transform: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__right-btn.insert {
    transform: translate(-6px, -4px);
    &.us{
      transform: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__btn-click-zone {
    position: absolute;
    width: 28px;
    height: 28px;
    top: 0;
    left: 0;
    transform: translate(-4px, -4px);
    border-radius: 50%;
    touch-action: manipulation;
    &.insert-left {
      width: 32px;
      height: 32px;
      transform: none;
      border-radius: 5px;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
    &.insert-right {
      width: 32px;
      height: 32px;
      border-radius: 5px;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  &__bottom-section {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    @include no-scrollbar;
  }

  &__title {
    @include flexCenter();
    font-weight: bold;
  }

  &__layer-num {
    @include size(20px);
    @include flexCenter();
    background-color: setColor(blue-1);
    border-radius: 50%;
  }

  &__drag-bar {
    position: absolute;
    touch-action: manipulation;
    top: 2px;
    padding: 10px 20px 20px 20px;
    border-radius: 5px;
    > div {
      background-color: setColor(gray-4);
      height: 3px;
      width: 24px;
    }
  }
}
</style>
