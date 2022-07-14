<template lang="pug">
  div(class="mobile-panel p-15"
      :style="panelStyle")
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
        span(class="mobile-panel__title"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
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
import PanelPhotoShadow from '@/components/editor/panelMobile/PanelPhotoShadow.vue'
import PopupDownload from '@/components/popup/PopupDownload.vue'

import { mapGetters } from 'vuex'
import vClickOutside from 'v-click-outside'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import { IFrame } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'
import eventUtils from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import { ColorEventType } from '@/store/types'

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
    PanelPhotoShadow
  },
  data() {
    return {
      panelHistory: [] as Array<string>,
      panelHeight: 0,
      lastPointerY: 0,
      showColorPanel: false
    }
  },
  computed: {
    ...mapGetters({
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode',
      inMultiSelectionMode: 'getInMultiSelectionMode'
    }),
    whiteTheme(): boolean {
      const whiteThemePanel = ['replace', 'crop', 'bgRemove', 'position', 'flip', 'opacity', 'order', 'fonts', 'font-size', 'text-effect', 'font-format', 'font-spacing', 'download', 'more', 'color', 'adjust', 'photo-shadow', 'resize']
      return this.showColorPanel || whiteThemePanel.includes(this.currActivePanel)
    },
    fixSize(): boolean {
      return this.showColorPanel || ['replace', 'crop', 'bgRemove', 'position', 'flip', 'opacity', 'order', 'font-size', 'font-format', 'text-effect', 'font-spacing', 'download', 'more', 'color'].includes(this.currActivePanel)
    },
    halfSizeInInitState(): boolean {
      return ['fonts'].includes(this.currActivePanel)
    },
    maxHalfSize(): boolean {
      return ['adjust', 'photo-shadow'].includes(this.currActivePanel)
    },
    panelTitle(): string {
      switch (this.currActivePanel) {
        case 'crop': {
          return `${this.$t('NN0496')}`
        }
        case 'none': {
          if (this.inMultiSelectionMode) {
            return ''
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
      return this.whiteTheme && (this.panelHistory.length > 0 || this.currActivePanel === 'resize' || this.showColorPanel)
    },
    hideDynamicComp(): boolean {
      return this.currActivePanel === 'crop'
    },
    panelStyle(): { [index: string]: string } {
      const heightStyle = {
        maxHeight: this.fixSize ? '80%' : this.maxHalfSize ? '50%' : '90%',
        height: this.fixSize ? 'initial' : this.panelHeight + 'px'
      }
      return {
        'row-gap': this.hideDynamicComp ? '0px' : '10px',
        backgroundColor: this.whiteTheme ? 'white' : '#2C2F43',
        ...heightStyle
      }
    },
    dynamicBindProps(): { [index: string]: any } {
      if (this.showColorPanel) {
        return {
          is: 'panel-color',
          currEvent: ColorEventType.background,
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
        case 'background': {
          // bind listener to let the parent access the grandchild's event
          // return this.$listeners

          return {
            openExtraColorModal: () => {
              this.showColorPanel = true
              this.panelHistory.push('color-picker')
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
    leftButtonAction(): () => void {
      if (this.showColorPanel) {
        return () => {
          this.showColorPanel = false
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
          }
        }
        this.closeMobilePanel()
      }
    }
  },
  mounted() {
    this.panelHeight = this.initHeightPx()
  },
  methods: {
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
      this.panelHeight = this.panelHeight >= maxHeightPx * 0.75
        ? maxHeightPx
        : this.panelHeight < maxHeightPx * 0.25
          ? 0
          : maxHeightPx * 0.5
      eventUtils.removePointerEvent('pointermove', this.dragingPanel)
      eventUtils.removePointerEvent('pointerup', this.dragPanelEnd)
      if (this.panelHeight === 0) this.closeMobilePanel()
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
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  background-color: setColor(sidebar-panel);
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
  }

  &__bottom-section {
    width: 100%;
    height: 100%;
    overflow: scroll;
    @include no-scrollbar;
  }

  &__title {
    font-weight: bold;
  }

  &__drag-bar {
    position: absolute;
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
