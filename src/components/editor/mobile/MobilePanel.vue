<template lang="pug">
div(class="mobile-panel"
    :class="{'p-15': !noPaddingTheme}"
    :style="panelStyle"
    v-click-outside="vcoConfig()"
    ref="panel")
  div(class="mobile-panel__top-section"
    :class="{'self-padding': noPaddingTheme}")
    div(class="mobile-panel__drag-bar"
      :class="{'visible-hidden': panelTitle !== ''}"
      @pointerdown="dragPanelStart"
      @touchstart="disableTouchEvent")
        div
    div
      div(class="mobile-panel__btn mobile-panel__left-btn"
          :class="{'visible-hidden': !showLeftBtn, 'click-disabled': !showLeftBtn,}")
        svg-icon(
          class="click-disabled"
          :iconName="leftBtnName"
          :iconColor="'white'"
          :iconWidth="'20px'")
        div(class="mobile-panel__btn-click-zone"
          @pointerdown="leftButtonAction"
          @touchstart="disableTouchEvent")
      div(class="mobile-panel__title")
        span(class="mobile-panel__title-text body-1 mr-10"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
        div(v-if="inSelectionState" class="mobile-panel__layer-num")
          span(class="label-sm text-white") {{selectedLayerNum}}
      div(class="mobile-panel__btn mobile-panel__right-btn"
          :class="{'visible-hidden': !showRightBtn, 'click-disabled': !showRightBtn}")
        svg-icon(
          class="click-disabled"
          :iconName="rightBtnName"
          :iconColor="'white'"
          :iconWidth="'20px'")
        div(class="mobile-panel__btn-click-zone"
          @pointerdown="rightButtonAction"
          @touchstart="disableTouchEvent")
  div(class="mobile-panel__bottom-section")
    tabs(v-if="innerTabs.label" theme="light"
      :tabs="innerTabs.label" v-model="innerTabIndex")
    keep-alive(:include="['PanelTemplate', 'PanelPhoto', 'PanelObject', 'PanelBackground', 'PanelText', 'PanelFile']")
      //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
      component(v-if="dynamicBindIs && !isShowPagePreview && !bgRemoveMode && !hideDynamicComp"
        class="border-box p-2"
        :is="dynamicBindIs"
        :key="dynamicBindIs"
        v-bind="dynamicBindProps"
        v-on="dynamicBindMethod"
        @close="closeMobilePanel")
  transition(name="panel-up")
    mobile-panel(v-if="!isSubPanel && currActiveSubPanel !== 'none'"
      :currActivePanel="currActiveSubPanel"
      :currColorEvent="currSubColorEvent"
      :isSubPanel="true"
      @switchTab="switchTab"
      @close="closeMobilePanel")
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import i18n from '@/i18n'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelText from '@/components/editor/panelSidebar/PanelText.vue'
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
import Tabs from '@/components/Tabs.vue'

import { mapActions, mapGetters, mapMutations } from 'vuex'
import { notify } from '@kyvg/vue3-notification'
import vClickOutside from 'click-outside-vue3'
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
import _ from 'lodash'

export default defineComponent({
  name: 'mobile-panel',
  props: {
    currActivePanel: {
      default: 'none',
      type: String
    },
    isSubPanel: {
      default: false,
      type: Boolean
    }
  },
  emits: ['panelHeight', 'switchTab'],
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
      innerTabIndex: 0,
      fitPage: _.debounce(() => {
        this.$nextTick(() => {
          pageUtils.fitPage()
        })
      }, 100),
      resizeObserver: null as unknown as ResizeObserver
    }
  },
  computed: {
    ...mapGetters({
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      currSelectedInfo: 'getCurrSelectedInfo',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      currActiveSubPanel: 'mobileEditor/getCurrActiveSubPanel',
      showMobilePanel: 'mobileEditor/getShowMobilePanel'
    }),
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
        'adjust', 'photo-shadow', 'resize', 'object-adjust', 'brand-list']

      return this.inSelectionState || this.showExtraColorPanel || whiteThemePanel.includes(this.currActivePanel)
    },
    noPaddingTheme(): boolean {
      return ['brand-list'].includes(this.currActivePanel)
    },
    fixSize(): boolean {
      return this.inSelectionState || [
        'crop', 'bgRemove', 'position', 'flip', 'opacity',
        'order', 'font-size', 'font-format',
        'font-spacing', 'download', 'more', 'object-adjust', 'brand-list'].includes(this.currActivePanel)
    },
    extraFixSizeCondition(): boolean {
      switch (this.currActivePanel) {
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
    showRightBtn(): boolean {
      return this.whiteTheme
    },
    showLeftBtn(): boolean {
      return this.whiteTheme && (this.panelHistory.length > 0 || this.showExtraColorPanel)
    },
    hideDynamicComp(): boolean {
      return this.currActivePanel === 'crop' || this.inSelectionState
    },
    noRowGap(): boolean {
      return this.inSelectionState || ['crop', 'color'].includes(this.currActivePanel)
    },
    panelStyle(): { [index: string]: string } {
      return Object.assign(
        (this.isSubPanel ? { bottom: '0', position: 'absolute', zIndex: '100' } : {}) as { [index: string]: string },
        {
          'row-gap': this.noRowGap ? '0px' : '10px',
          backgroundColor: this.whiteTheme ? 'white' : '#2C2F43',
          maxHeight: this.fixSize || this.extraFixSizeCondition
            ? 'initial' : this.panelHeight + 'px'
        }
      )
    },
    innerTab(): string {
      return this.innerTabs.key[this.innerTabIndex]
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
    dynamicBindIs(): string {
      if (this.showExtraColorPanel) {
        return 'panel-color'
      }

      const defaultVal = `panel-${this.currActivePanel}`

      switch (this.currActivePanel) {
        case 'download': {
          return 'popup-download'
        }
        case 'replace': {
          return `panel-${this.innerTab}`
        }
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
            maxheight: this.maxHeightPx()
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
        case 'photo-shadow':
          return { pushHistory, openExtraColorModal }
        case 'brand-list':
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
      return 'back-circle'
    },
    rightBtnName(): string {
      if ((this.panelHistory.length > 0 && this.currActivePanel !== 'brand-list') || ['crop'].includes(this.currActivePanel)) {
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
            } else if (this.inBgSettingMode) {
              if (this.backgroundLocked) return this.handleLockedNotify()
              this.setBgImageControl({
                pageIndex: pageUtils.currFocusPageIndex,
                imgControl: !this.backgroundImgControl
              })
            }
            break
          }

          case 'color': {
            if (this.panelHistory[this.panelHistory.length - 1] === 'color-picker') {
              this.addRecentlyColors(colorUtils.currColor)
            }
          }
        }
        if (this.showExtraColorPanel) {
          this.addRecentlyColors(colorUtils.currColor)
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
      this.innerTabIndex = 0
      // Use v-show to show MobilePanel will cause
      // mounted not triggered, use watch to reset height.
      this.panelHeight = newVal === 'none' ? 0 : this.initHeightPx()
    },
    showMobilePanel(newVal) {
      if (!newVal) {
        this.showExtraColorPanel = false
      }
    }
  },
  mounted() {
    this.panelHeight = 0
    this.resizeObserver = new ResizeObserver(() => {
      this.$emit('panelHeight', (this.$refs.panel as HTMLElement).clientHeight)
      this.fitPage()
    })
    this.resizeObserver.observe(this.$refs.panel as Element)
  },
  beforeUnmount() {
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  methods: {
    ...mapMutations({
      setBgImageControl: 'SET_backgroundImageControl',
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel'
    }),
    ...mapActions({
      fetchPalettes: 'brandkit/fetchPalettes',
      initRecentlyColors: 'color/initRecentlyColors',
      addRecentlyColors: 'color/addRecentlyColors'
    }),
    vcoConfig() {
      return {
        handler: this.closeMobilePanel,
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
        target.className === 'inputNode'
      )
    },
    closeMobilePanel() {
      this.$emit('switchTab', 'none')
      this.panelHistory = []
      editorUtils.setCurrActivePanel('none')
    },
    initHeightPx() {
      return ((this.$el.parentElement as HTMLElement).clientHeight) * (this.halfSizeInInitState ? 0.5 : 1.0)
    },
    maxHeightPx() {
      return (this.$el.parentElement as HTMLElement).clientHeight
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
      } else {
        this.panelHeight = maxHeightPx * 0.5
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
      notify({ group: 'copy', text: i18n.global.tc('NN0804') })
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
  box-shadow: 0px -2px 5px setColor(gray-4, 0.5);

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  justify-items: center;

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

  &__btn-click-zone {
    position: absolute;
    width: 28px;
    height: 28px;
    top: 0;
    left: 0;
    transform: translate(-4px, -4px);
    border-radius: 50%;
    touch-action: manipulation;
  }

  &__bottom-section {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
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
