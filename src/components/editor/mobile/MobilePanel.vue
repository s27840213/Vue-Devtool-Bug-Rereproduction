<template lang="pug">
  div(class="mobile-panel p-15"
      :style="panelStyle")
    div(class="mobile-panel__top-section")
      div(class="mobile-panel__drag-bar"
        :class="{'visible-hidden': panelTitle !== ''}")
      div
        svg-icon(class="mobile-panel__left-btn"
          :class="{'visible-hidden': !showLeftBtn}"
          :iconName="leftBtnName"
          :iconColor="'white'"
          :iconWidth="'20px'"
          @click.native="leftButtonAction")
        span(class="mobile-panel__title"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
        svg-icon(class="mobile-panel__right-btn"
          :class="{'visible-hidden': !showRightBtn}"
          :iconName="rightBtnName"
          :iconColor="'white'"
          :iconWidth="'20px'"
          @click.native="rightButtonAction")
    div(class="mobile-panel__bottom-section")
      keep-alive(:include="['panel-template', 'panel-photo', 'panel-object', 'panel-background', 'panel-text', 'panel-file']")
        component(v-if="!isShowPagePreview && !bgRemoveMode && !hideDynamicComp"
          class="border-box"
          v-bind="dynamicBindProps"
          v-on="dynamicBindMethod"
          @close="closeMobilePanel")
</template>
<script lang="ts">
import Vue from 'vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import ColorPanel from '@/components/editor/ColorPanel.vue'
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
import PopupDownload from '@/components/popup/PopupDownload.vue'

import { mapGetters } from 'vuex'
import vClickOutside from 'v-click-outside'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import { IFrame } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'

export default Vue.extend({
  props: {
    currActivePanel: {
      default: 'none',
      type: String
    },
    currColorEvent: {
      default: 'text',
      type: String
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
    PanelTextEffect
  },
  data() {
    return {
      panelHistory: [] as Array<string>
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
      return ['replace', 'crop', 'bgRemove', 'position', 'flip', 'opacity', 'order', 'fonts', 'font-size', 'text-effect', 'font-format', 'font-spacing', 'download', 'more', 'color', 'resize'].includes(this.currActivePanel)
    },
    fixSize(): boolean {
      return ['replace', 'crop', 'bgRemove', 'position', 'flip', 'opacity', 'order', 'font-size', 'font-format', 'text-effect', 'font-spacing', 'download', 'more', 'color'].includes(this.currActivePanel)
    },
    halfSize(): boolean {
      return ['fonts'].includes(this.currActivePanel)
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
      return this.whiteTheme && (this.panelHistory.length > 0 || this.currActivePanel === 'resize')
    },
    hideDynamicComp(): boolean {
      return this.currActivePanel === 'crop'
    },
    panelStyle(): { [index: string]: string } {
      return {
        height: this.halfSize ? '50%' : this.fixSize ? 'initial' : '90%',
        'row-gap': this.hideDynamicComp ? '0px' : '10px',
        backgroundColor: this.whiteTheme ? 'white' : '#2C2F43',
        ...(this.fixSize && { 'max-height': '80%' })
      }
    },
    dynamicBindProps(): { [index: string]: any } {
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
          return this.$listeners
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
  methods: {
    closeMobilePanel() {
      this.$emit('switchTab', 'none')
      this.panelHistory = []
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
    height: 3px;
    width: 24px;
    // margin: 6px auto 32px auto;
    border-radius: 5px;
    background-color: setColor(gray-4);
  }
}
</style>
