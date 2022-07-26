<template lang="pug">
  div(class="mobile-panel p-15"
      :style="panelStyle"
      v-click-outside="vcoConfig()")
    div(class="mobile-panel__top-section")
      div(class="mobile-panel__drag-bar"
        :class="{'visible-hidden': panelTitle !== ''}"
        @pointerdown="dragPanelStart"
        @touchstart="disableTouchEvent")
          div
      div
        div(class="mobile-panel__btn mobile-panel__left-btn"
            :class="{'visible-hidden': !showLeftBtn, 'click-disabled': !showLeftBtn}")
          svg-icon(
            class="click-disabled"
            :iconName="leftBtnName"
            :iconColor="'white'"
            :iconWidth="'20px'")
          div(class="mobile-panel__btn-click-zone"
            @pointerdown="leftButtonAction")
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
            @pointerdown="rightButtonAction")
    div(class="mobile-panel__bottom-section")
      keep-alive(:include="['panel-template', 'panel-photo', 'panel-object', 'panel-background', 'panel-text', 'panel-file']")
        //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
        component(v-if="!isShowPagePreview && !bgRemoveMode && !hideDynamicComp"
          class="border-box p-2"
          v-bind="dynamicBindProps"
          v-on="dynamicBindMethod"
          @close="closeMobilePanel")
</template>
<script lang="ts">
import Vue from 'vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import ColorPanel from '@/components/editor/ColorSlips.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelText from '@/components/editor/panelSidebar/PanelText.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelBrand from '@/components/editor/panelSidebar/PanelBrand.vue'
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
import PopupDownload from '@/components/popup/PopupDownload.vue'

import { mapActions, mapGetters } from 'vuex'
import vClickOutside from 'v-click-outside'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import { IFrame } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'
import eventUtils from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import editorUtils from '@/utils/editorUtils'

export default Vue.extend({
  props: {
    currActivePanel: {
      default: 'none',
      type: String
    },
    currColorEvent: {
      default: 'text',
      type: String
    },
    isExtraPanel: {
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
    PanelObjectAdjust
  },
  data() {
    return {
      panelHistory: [] as Array<string>,
      panelHeight: 0,
      lastPointerY: 0,
      showExtraColorPanel: false,
      extraColorEvent: ColorEventType.text
    }
  },
  computed: {
    ...mapGetters({
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
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
        'adjust', 'photo-shadow', 'resize', 'object-adjust']

      return this.inSelectionState || this.showExtraColorPanel || whiteThemePanel.includes(this.currActivePanel)
    },
    fixSize(): boolean {
      return this.showExtraColorPanel || this.inSelectionState || [
        'replace', 'crop', 'bgRemove', 'position', 'flip', 'opacity',
        'order', 'font-size', 'font-format',
        'font-spacing', 'download', 'more', 'object-adjust'].includes(this.currActivePanel)
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
      return ['fonts', 'adjust', 'photo-shadow', 'color', 'text-effect'].includes(this.currActivePanel)
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
      return this.whiteTheme && (this.panelHistory.length > 0 || this.currActivePanel === 'resize' || this.showExtraColorPanel)
    },
    hideDynamicComp(): boolean {
      return this.currActivePanel === 'crop' || this.inSelectionState
    },
    panelStyle(): { [index: string]: string } {
      return {
        'row-gap': this.hideDynamicComp ? '0px' : '10px',
        backgroundColor: this.whiteTheme ? 'white' : '#2C2F43',
        height: this.fixSize || this.extraFixSizeCondition
          ? 'initial'
          : this.panelHeight + 'px'
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
        case 'resize': {
          return Object.assign(defaultVal, {
            ref: 'panelResize'
          })
        }
        default: {
          return defaultVal
        }
      }
    },
    dynamicBindMethod(): { [index: string]: any } {
      switch (this.currActivePanel) {
        case 'text-effect':
        case 'color': {
          return {
            pushHistory: (history: string) => {
              this.panelHistory.push(history)
            }
          }
        }
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
        default: {
          return {}
        }
      }
    },
    leftBtnName(): string {
      if (this.panelHistory.length > 0 && this.currActivePanel !== 'resize') {
        return 'back-circle'
      } else {
        return 'close-circle'
      }
    },
    rightBtnName(): string {
      if (this.panelHistory.length > 0 || ['crop', 'resize'].includes(this.currActivePanel)) {
        return 'check-circle'
      } else {
        return 'close-circle'
      }
    },
    leftButtonAction(): (e: PointerEvent) => void {
      if (this.showExtraColorPanel && this.panelHistory.length === 1) {
        return () => {
          this.showExtraColorPanel = false
        }
      }
      if (this.panelHistory.length > 0) {
        return () => { this.panelHistory.pop() }
      } else {
        return () => { this.closeMobilePanel() }
      }
    },
    rightButtonAction(): () => void {
      return () => {
        switch (this.currActivePanel) {
          case 'crop': {
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
    currActivePanel(newVal: string) {
      console.log(newVal)
      this.initHeightPx()
    }
  },
  mounted() {
    this.panelHeight = this.initHeightPx()
  },
  methods: {
    ...mapActions({
      fetchPalettes: 'brandkit/fetchPalettes',
      initRecentlyColors: 'color/initRecentlyColors',
      addRecentlyColors: 'color/addRecentlyColors'
    }),
    vcoConfig() {
      return {
        handler: this.closeMobilePanel,
        middleware: this.middleware,
        events: ['contextmenu', 'pointerdown', 'touchstart']
        // events: ['dblclick', 'click', 'contextmenu', 'mousedown']
      }
    },
    middleware(event: MouseEvent | TouchEvent | PointerEvent) {
      return !(typeof (event.target as HTMLElement).className === 'object' || // classNamm can be SVGAnimatedString
        (event.target as HTMLElement).className.includes('footer-tabs') || (event.target as HTMLElement).className === 'inputNode')
    },
    closeMobilePanel() {
      this.$emit('switchTab', 'none')
      this.panelHistory = []
    },
    initHeightPx() {
      return (this.$el.parentElement as HTMLElement).clientHeight * (this.halfSizeInInitState ? 0.5 : 0.9)
    },
    maxHeightPx() {
      return (this.$el.parentElement as HTMLElement).clientHeight * 0.9
    },
    dragPanelStart(event: MouseEvent | PointerEvent) {
      this.lastPointerY = event.clientY
      eventUtils.addPointerEvent('pointermove', this.dragingPanel)
      eventUtils.addPointerEvent('pointerup', this.dragPanelEnd)
    },
    dragingPanel(event: MouseEvent | PointerEvent) {
      this.panelHeight -= event.clientY - this.lastPointerY
      this.lastPointerY = event.clientY
    },
    dragPanelEnd() {
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
