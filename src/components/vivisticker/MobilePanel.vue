<template lang="pug">
  div(class="mobile-panel"
      :class="{'panel-padding': !noPaddingTheme, 'not-rounded': insertTheme}"
      :style="panelStyle"
      v-click-outside="vcoConfig()"
      ref="panel")
    div(class="mobile-panel__top-section"
      :class="{'self-padding': noPaddingTheme}")
      div(class="mobile-panel__drag-bar"
        :class="{'visible-hidden': panelTitle !== '' || fixSize || extraFixSizeCondition}"
        @pointerdown="dragPanelStart"
        @touchstart="disableTouchEvent")
          div
      div
        div(class="mobile-panel__btn mobile-panel__left-btn"
            :class="{'visible-hidden': !showLeftBtn, 'click-disabled': !showLeftBtn, 'insert': insertTheme}")
          svg-icon(
            class="click-disabled"
            :iconName="leftBtnName"
            :iconColor="'white'"
            :iconWidth="insertTheme ? '32px' : '20px'")
          div(class="mobile-panel__btn-click-zone"
            :class="{'insert-left': insertTheme}"
            @pointerdown="leftButtonAction"
            @touchstart="disableTouchEvent")
        div(class="mobile-panel__title")
          span(class="mobile-panel__title-text body-1 mr-10"
            :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
          div(v-if="inSelectionState" class="mobile-panel__layer-num")
            span(class="label-sm text-white") {{selectedLayerNum}}
        div(class="mobile-panel__btn mobile-panel__right-btn"
            :class="{'visible-hidden': !showRightBtn, 'click-disabled': !showRightBtn, 'insert': insertTheme}")
          svg-icon(
            class="click-disabled"
            :iconName="rightBtnName"
            :iconColor="'white'"
            :iconWidth="insertTheme ? '24px' : '20px'")
          div(class="mobile-panel__btn-click-zone"
            :class="{'insert-right': insertTheme}"
            @pointerdown="rightButtonAction"
            @touchstart="disableTouchEvent")
      tabs(v-if="innerTabs.label" class="mobile-panel__inner-tab" theme="light"
          :tabs="innerTabs.label" @switchTab="switchInnerTab")
    div(class="mobile-panel__bottom-section")
      //- keep-alive(:include="['panel-template', 'panel-photo', 'panel-object', 'panel-background', 'panel-file']")
      //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
      component(v-if="!bgRemoveMode && !hideDynamicComp"
        class="border-box"
        v-bind="dynamicBindProps"
        v-on="dynamicBindMethod"
        @close="closeMobilePanel"
        @fitPage="fitPage")
    transition(name="panel-up")
      mobile-panel(v-if="!isSubPanel && currActiveSubPanel !== 'none'"
        :currActivePanel="currActiveSubPanel"
        :currColorEvent="currSubColorEvent"
        :isSubPanel="true"
        @switchTab="switchTab")
</template>
<script lang="ts">
import Vue from 'vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import ColorPanel from '@/components/editor/ColorSlips.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelText from '@/components/vivisticker/PanelText.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelBrand from '@/components/editor/panelMobile/PanelBrand.vue'
import PanelPage from '@/components/editor/panelSidebar/PanelPage.vue'
import PanelPosition from '@/components/editor/panelMobile/PanelPosition.vue'
import PanelFlip from '@/components/editor/panelMobile/PanelFlip.vue'
import PanelOpacity from '@/components/editor/panelMobile/PanelOpacity.vue'
import PanelOrder from '@/components/editor/panelMobile/PanelOrder.vue'
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import PanelFontSize from '@/components/editor/panelMobile/PanelFontSize.vue'
import PanelFontFormat from '@/components/editor/panelMobile/PanelFontFormat.vue'
import PanelFontSpacing from '@/components/editor/panelMobile/PanelFontSpacing.vue'
import PanelResize from '@/components/editor/panelMobile/PanelResize.vue'
import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
import PanelMore from '@/components/editor/panelMobile/PanelMore.vue'
import PanelTextEffect from '@/components/editor/panelMobile/PanelTextEffect.vue'
import PanelAdjust from '@/components/editor/panelMobile/PanelAdjust.vue'
import PanelObjectAdjust from '@/components/editor/panelMobile/PanelObjectAdjust.vue'
import PanelPhotoShadow from '@/components/editor/panelMobile/PanelPhotoShadow.vue'
import PanelBrandList from '@/components/editor/panelMobile/PanelBrandList.vue'
import PopupDownload from '@/components/popup/PopupDownload.vue'
import PanelVvstkMore from '@/components/editor/panelMobile/PanelVvstkMore.vue'
import PanelColorPicker from '@/components/editor/panelMobile/PanelColorPicker.vue'
import Tabs from '@/components/Tabs.vue'

import { mapActions, mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import { IFrame } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'
import eventUtils from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import { ICurrSelectedInfo, IFooterTabProps } from '@/interfaces/editor'
import editorUtils from '@/utils/editorUtils'
import pageUtils from '@/utils/pageUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  name: 'mobile-panel',
  props: {
    currActivePanel: {
      default: 'none',
      type: String
    },
    currColorEvent: {
      default: 'text',
      type: String
    },
    isSubPanel: {
      default: false,
      type: Boolean
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
    PanelColorPicker,
    Tabs
  },
  data() {
    return {
      panelHistory: [] as Array<string>,
      panelHeight: 0,
      lastPointerY: 0,
      showExtraColorPanel: false,
      extraColorEvent: ColorEventType.text,
      isDraggingPanel: false,
      currSubColorEvent: '',
      innerTab: '',
      draggedPanelHeight: 0
    }
  },
  computed: {
    ...mapGetters({
      bgRemoveMode: 'bgRemove/getInBgRemoveMode',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      currSelectedInfo: 'getCurrSelectedInfo',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      currActiveSubPanel: 'mobileEditor/getCurrActiveSubPanel',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
      isInCategory: 'vivisticker/getIsInCategory',
      isDuringCopy: 'vivisticker/getIsDuringCopy'
    }),
    isTextInCategory(): boolean {
      return this.isInCategory('text')
    },
    backgroundImgControl(): boolean {
      return pageUtils.currFocusPage.backgroundImage.config?.imgControl ?? false
    },
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
    },
    selectedLayerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    },
    inSelectionState(): boolean {
      return this.currActivePanel === 'none' && this.inMultiSelectionMode
    },
    whiteTheme(): boolean {
      const whiteThemePanel = [
        'replace', 'crop', 'bgRemove', 'position', 'flip',
        'opacity', 'order', 'fonts', 'font-size', 'text-effect',
        'font-format', 'font-spacing', 'download', 'more', 'color',
        'adjust', 'photo-shadow', 'resize', 'object-adjust', 'brand-list', 'vvstk-more', 'color-picker']

      return this.inSelectionState || this.showExtraColorPanel || whiteThemePanel.includes(this.currActivePanel)
    },
    noPaddingTheme(): boolean {
      return ['brand-list', 'text', 'vvstk-more'].includes(this.currActivePanel)
    },
    fixSize(): boolean {
      return this.inSelectionState || [
        'crop', 'bgRemove', 'position', 'flip', 'opacity',
        'order', 'font-size', 'font-format',
        'font-spacing', 'download', 'more', 'object-adjust', 'brand-list', 'vvstk-more'].includes(this.currActivePanel)
    },
    extraFixSizeCondition(): boolean {
      switch (this.currActivePanel) {
        case 'color': {
          return this.currColorEvent === ColorEventType.shape && this.panelHistory.length === 0
        }
        case 'text-effect': {
          return this.panelHistory.length === 0
        }
        default: {
          return false
        }
      }
    },
    halfSizeInInitState(): boolean {
      return this.showExtraColorPanel || ['fonts', 'adjust', 'photo-shadow', 'color', 'text-effect'].includes(this.currActivePanel)
    },
    minHalfSize(): boolean {
      return ['fonts'].includes(this.currActivePanel)
    },
    panelTitle(): string {
      switch (this.currActivePanel) {
        case 'crop': {
          return `${this.$t('NN0496')}`
        }
        case 'none': {
          if (this.inMultiSelectionMode) {
            return '已選取'
          }
          return ''
        }
        default: {
          return ''
        }
      }
    },
    insertTheme(): boolean {
      return this.currActivePanel === 'text'
    },
    showRightBtn(): boolean {
      return this.whiteTheme || this.insertTheme
    },
    showLeftBtn(): boolean {
      return (this.whiteTheme && (this.panelHistory.length > 0 || ['resize', 'color-picker'].includes(this.currActivePanel) || this.showExtraColorPanel)) || (this.insertTheme && this.isTextInCategory)
    },
    hideDynamicComp(): boolean {
      return this.currActivePanel === 'crop' || this.inSelectionState
    },
    panelStyle(): { [index: string]: string } {
      return Object.assign(
        (this.isSubPanel ? { bottom: '0', position: 'absolute', zIndex: '100' } : {}) as { [index: string]: string },
        {
          'row-gap': (this.hideDynamicComp || this.currActivePanel === 'vvstk-more') ? '0px' : '10px',
          backgroundColor: this.whiteTheme ? 'white' : '#1F1F1F',
          maxHeight: this.isDuringCopy ? '0' : (
            this.fixSize || this.extraFixSizeCondition
              ? 'initial'
              : this.isDraggingPanel ? this.panelHeight + 'px' : this.panelHeight + 'px'
          ),
          minHeight: (this.minHalfSize && !this.isDraggingPanel && !this.isDuringCopy) ? this.draggedPanelHeight + 'px' : 'unset'
        },
        this.isDuringCopy ? { padding: '0' } : {}
      )
    },
    innerTabs(): Record<string, string[]> {
      switch (this.currActivePanel) {
        case 'replace':
          return {
            key: [
              'photo',
              'file'
            ],
            label: [
              this.$tc('NN0002', 2),
              this.$tc('NN0006')
            ]
          }
        default:
          return {
            key: ['']
          }
      }
    },
    dynamicBindProps(): { [index: string]: any } {
      if (this.showExtraColorPanel) {
        return {
          is: 'panel-color',
          currEvent: this.extraColorEvent,
          panelHistory: this.panelHistory
        }
      }

      const defaultVal = {
        is: `panel-${this.currActivePanel}`
      }

      switch (this.currActivePanel) {
        case 'fonts': {
          return Object.assign(defaultVal, {
            showTitle: false
          })
        }
        case 'download': {
          return {
            is: 'popup-download',
            hideContainer: true
          }
        }
        case 'text-effect': {
          return Object.assign(defaultVal, {
            panelHistory: this.panelHistory
          })
        }
        case 'color': {
          return Object.assign(defaultVal, {
            currEvent: this.currColorEvent,
            panelHistory: this.panelHistory
          })
        }
        case 'color-picker': {
          return Object.assign(defaultVal, {
            currEvent: this.currColorEvent
          })
        }
        case 'resize': {
          return Object.assign(defaultVal, {
            ref: 'panelResize'
          })
        }
        case 'brand-list': {
          const brandDefaultVal = Object.assign(defaultVal, {
            panelHistory: this.panelHistory
          })
          if (editorUtils.currActivePanel === 'text') {
            return Object.assign(brandDefaultVal, {
              defaultOption: true
            })
          }
          if (editorUtils.currActivePanel === 'brand') {
            return Object.assign(brandDefaultVal, {
              hasAddBrand: true
            })
          }
          return brandDefaultVal
        }
        case 'vvstk-more': {
          return Object.assign(defaultVal, {
            panelHistory: this.panelHistory
          })
        }
        case 'brand': {
          return Object.assign(defaultVal, {
            maxheight: this.maxHeightPx()
          })
        }
        case 'replace':
          return {
            is: `panel-${this.innerTab}`
          }
        case 'none':
          return {
            is: ''
          }
        case 'text':
          return Object.assign(defaultVal, {
            isInsert: true
          })
        default: {
          return defaultVal
        }
      }
    },
    dynamicBindMethod(): { [index: string]: any } {
      switch (this.currActivePanel) {
        case 'color': {
          return {
            pushHistory: (history: string) => {
              this.panelHistory.push(history)
            }
          }
        }
        case 'text-effect':
        case 'photo-shadow': {
          return {
            pushHistory: (history: string) => {
              this.panelHistory.push(history)
            },
            openExtraColorModal: (colorEventType: ColorEventType, initColorPanelType: MobileColorPanelType) => {
              this.showExtraColorPanel = true
              this.extraColorEvent = colorEventType
              this.panelHistory.push(initColorPanelType)
            }
          }
        }
        case 'background': {
          // bind listener to let the parent access the grandchild's event
          // return this.$listeners

          return {
            openExtraColorModal: (colorEventType: ColorEventType, initColorPanelType: MobileColorPanelType) => {
              this.showExtraColorPanel = true
              this.extraColorEvent = colorEventType
              this.panelHistory.push(initColorPanelType)
            }
          }
        }
        case 'brand-list': {
          return {
            pushHistory: (history: string) => {
              this.panelHistory.push(history)
            },
            back: () => {
              this.panelHistory.pop()
            }
          }
        }
        case 'vvstk-more': {
          return {
            pushHistory: (history: string) => {
              this.panelHistory.push(history)
            },
            back: () => {
              this.panelHistory.pop()
            }
          }
        }
        default: {
          return {}
        }
      }
    },
    leftBtnName(): string {
      if (this.insertTheme) {
        return 'vivisticker_back'
      } else if (this.panelHistory.length > 0 && !['resize', 'color-picker'].includes(this.currActivePanel)) {
        return 'back-circle'
      } else {
        return 'close-circle'
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
          this.resetTexts()
          this.refetchTexts('textStock')
          this.refetchTextContent()
        }
      }
      if (this.showExtraColorPanel) {
        return () => {
          colorHandler()
          this.showExtraColorPanel = false
          this.panelHistory.pop()
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
            }
            break
          }

          case 'resize': {
            (this.$refs.panelResize as any).applySelectedFormat()
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
        this.closeMobilePanel()

        if (this.inMultiSelectionMode && this.inSelectionState) {
          editorUtils.setInMultiSelectionMode(false)
        }
      }
    }
  },
  watch: {
    selectedLayerNum(newVal: number) {
      if (newVal === 0) {
        editorUtils.setInMultiSelectionMode(false)
      }
    },
    currActivePanel(newVal) {
      this.panelHistory = []
      this.innerTab = this.innerTabs.key[0]
      // Use v-show to show MobilePanel will cause
      // mounted not triggered, use watch to reset height.
      this.panelHeight = this.initHeightPx()
      this.draggedPanelHeight = this.panelHeight
    },
    showMobilePanel(newVal) {
      if (!newVal) {
        this.showExtraColorPanel = false
      }
    }
  },
  mounted() {
    this.panelHeight = this.initHeightPx()
    this.draggedPanelHeight = this.panelHeight
  },
  methods: {
    ...mapMutations({
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel',
      setIsInCategory: 'vivisticker/SET_isInCategory',
      setShowAllRecently: 'vivisticker/SET_showAllRecently'
    }),
    ...mapActions({
      initRecentlyColors: 'color/initRecentlyColors',
      addRecentlyColors: 'color/addRecentlyColors',
      resetTexts: 'textStock/resetContent',
      refetchTexts: 'textStock/getRecAndCate',
      refetchTextContent: 'textStock/getContent'
    }),
    vcoConfig() {
      return {
        handler: this.closeMobilePanel,
        middleware: this.middleware,
        events: ['contextmenu', 'touchstart', 'pointerdown']
      }
    },
    isModal(target: HTMLElement): boolean {
      if (!target || target.id === 'app') return false
      else if (target.className.includes('modal')) return true
      return this.isModal(target.parentNode as HTMLElement)
    },
    middleware(event: MouseEvent | TouchEvent | PointerEvent) {
      const target = event.target as HTMLElement
      return !(typeof target.className === 'object' || // className is SVGAnimatedString
        this.isModal(target) ||
        target.className.includes('footer-tabs') ||
        target.className === 'inputNode'
      )
    },
    closeMobilePanel() {
      this.$emit('switchTab', 'none')
      this.panelHistory = []
    },
    initHeightPx() {
      // 40 = HeaderTabs height
      return ((this.$el.parentElement as HTMLElement).clientHeight - 40) * (this.halfSizeInInitState ? 0.5 : 1.0)
    },
    maxHeightPx() {
      return ((this.$el.parentElement as HTMLElement).clientHeight - 40) * 1.0
    },
    getMaxHeightPx(): number {
      return parseFloat((this.$el as HTMLElement).style.maxHeight.split('px')[0])
    },
    dragPanelStart(event: MouseEvent | PointerEvent) {
      if (this.fixSize) {
        return
      }
      this.isDraggingPanel = true
      this.lastPointerY = event.clientY
      this.panelHeight = (this.$refs.panel as HTMLElement).clientHeight
      eventUtils.addPointerEvent('pointermove', this.dragingPanel)
      eventUtils.addPointerEvent('pointerup', this.dragPanelEnd)
    },
    dragingPanel(event: MouseEvent | PointerEvent) {
      this.panelHeight -= event.clientY - this.lastPointerY
      this.lastPointerY = event.clientY
    },
    dragPanelEnd() {
      this.isDraggingPanel = false
      const maxHeightPx = this.maxHeightPx()
      if (this.panelHeight < maxHeightPx * 0.25) {
        this.closeMobilePanel()
      } else if (this.panelHeight >= maxHeightPx * 0.75) {
        this.panelHeight = maxHeightPx
        this.draggedPanelHeight = this.panelHeight
        this.$nextTick(() => {
          pageUtils.fitPage()
        })
      } else {
        this.panelHeight = maxHeightPx * 0.5
        this.draggedPanelHeight = this.panelHeight
        this.$nextTick(() => {
          pageUtils.fitPage()
        })
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
    handleLockedNotify() {
      this.$notify({ group: 'copy', text: '🔒背景已被鎖定，請解鎖後再進行操作' })
    },
    switchTab(panelType: string, props?: IFooterTabProps) {
      if (this.currActiveSubPanel === panelType) {
        this.setCurrActiveSubPanel('none')
      } else {
        this.setCurrActiveSubPanel(panelType)
        if (props) {
          if (panelType === 'color' && props.currColorEvent) {
            this.currSubColorEvent = props.currColorEvent
          }
        }
      }
    },
    switchInnerTab(panelIndex: number) {
      this.innerTab = this.innerTabs.key[panelIndex]
    },
    fitPage() {
      this.$nextTick(() => {
        pageUtils.fitPage()
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-panel {
  position: relative;
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
  }

  &__btn {
    position: relative;
  }

  &__left-btn.insert {
    transform: translate(-2px, -6px);
  }

  &__right-btn.insert {
    transform: translate(-6px, -4px);
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

  &__inner-tab {
    margin: 15px 0 14px 0;
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
    padding: 10px 20px;
    border-radius: 5px;
    > div {
      background-color: setColor(gray-4);
      height: 3px;
      width: 24px;
    }
  }
}
</style>
