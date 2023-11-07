<template lang="pug">
div(class="mobile-panel"
    :class="{'panel-padding': !noPaddingTheme, 'not-rounded': noRoundTheme}"
    :style="panelStyle"
    v-click-outside="vcoConfig()"
    ref="panel")
  div(v-if="!hideTopSection" class="mobile-panel__top-section"
    :class="{'self-padding': noPaddingTheme}")
    div(class="mobile-panel__drag-bar"
      :class="{'visible-hidden': hideDragBar}"
      @pointerdown.stop="dragPanelStart"
      @touchstart.stop="disableTouchEvent")
        div
    div(v-if="showLeftBtn || showRightBtn || panelTitle")
      div(class="mobile-panel__btn mobile-panel__left-btn"
          :class="[{'visible-hidden': !showLeftBtn, 'click-disabled': !showLeftBtn}, $i18n.locale]")
        svg-icon(
          class="click-disabled"
          :iconName="leftBtnName"
          :iconColor="whiteTheme ? 'gray-2' : 'white'"
          :iconWidth="'20px'")
        div(class="mobile-panel__btn-click-zone"
          @pointerdown.stop="leftButtonAction"
          @touchstart.stop="disableTouchEvent")
      div(class="mobile-panel__title")
        span(class="mobile-panel__title-text body-1 mr-10"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
        div(v-if="currActivePanel === 'multiple-select'" class="mobile-panel__layer-num")
          span(class="label-sm text-white") {{selectedLayerNum}}
      div(class="mobile-panel__btn mobile-panel__right-btn"
          :class="[{'visible-hidden': !showRightBtn, 'click-disabled': !showRightBtn}, $i18n.locale]")
        svg-icon(
          class="click-disabled"
          :iconName="rightBtnName"
          :iconColor="whiteTheme ? 'gray-2' : 'white'"
          :iconWidth="'20px'")
        div(class="mobile-panel__btn-click-zone"
          @pointerdown.stop="rightButtonAction"
          @touchstart.stop="disableTouchEvent")
  div(class="mobile-panel__bottom-section")
    //- tabs(v-if="innerTabs.label" theme="light"
    //-   :tabs="innerTabs.label" v-model="innerTabIndex")
    keep-alive(:include="keepAlivePanels")
      //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
      component(v-if="dynamicBindIs && !isShowPagePreview && !hideDynamicComp"
        class="border-box"
        :class="{'p-2': $isPic}"
        :is="dynamicBindIs"
        :key="dynamicBindIs"
        :currPage="currPage"
        v-bind="dynamicBindProps"
        v-on="dynamicBindMethod"
        @close="closeMobilePanel")
</template>

<script lang="ts">
// import ColorPanel from '@/components/editor/ColorSlips.vue'
// import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
// import PanelColorPicker from '@/components/editor/panelMobile/PanelColorPicker.vue'
import PanelFonts from '@nu/vivi-lib/components/editor/panelFunction/PanelFonts.vue'
import PanelAdjust from '@nu/vivi-lib/components/editor/panelMobile/PanelAdjust.vue'
import PanelFlip from '@nu/vivi-lib/components/editor/panelMobile/PanelFlip.vue'
import PanelFontFormat from '@nu/vivi-lib/components/editor/panelMobile/PanelFontFormat.vue'
import PanelFontSize from '@nu/vivi-lib/components/editor/panelMobile/PanelFontSize.vue'
import PanelFontSpacing from '@nu/vivi-lib/components/editor/panelMobile/PanelFontSpacing.vue'
import PanelNudge from '@nu/vivi-lib/components/editor/panelMobile/PanelNudge.vue'
import PanelObjectAdjust from '@nu/vivi-lib/components/editor/panelMobile/PanelObjectAdjust.vue'
import PanelOpacity from '@nu/vivi-lib/components/editor/panelMobile/PanelOpacity.vue'
import PanelOrder from '@nu/vivi-lib/components/editor/panelMobile/PanelOrder.vue'
import PanelPhotoShadow from '@nu/vivi-lib/components/editor/panelMobile/PanelPhotoShadow.vue'
import PanelPosition from '@nu/vivi-lib/components/editor/panelMobile/PanelPosition.vue'
import PanelRemoveBg from '@nu/vivi-lib/components/editor/panelMobile/PanelRemoveBg.vue'
import PanelTextEffect from '@nu/vivi-lib/components/editor/panelMobile/PanelTextEffect.vue'
import { IAssetPhoto, IPhotoItem } from '@nu/vivi-lib/interfaces/api'
import { IFrame } from '@nu/vivi-lib/interfaces/layer'
import mobilePanelMixin from '@nu/vivi-lib/mixin/mobilePanel'
import bgRemoveUtils from '@nu/vivi-lib/utils/bgRemoveUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import formatUtils from '@nu/vivi-lib/utils/formatUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { replaceImgInject } from '@nu/vivi-lib/utils/textFillUtils'
import { computed, defineComponent, provide } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  mixins: [mobilePanelMixin],
  components: {
    PanelPosition,
    PanelFlip,
    PanelOpacity,
    PanelOrder,
    PanelFonts,
    PanelFontSize,
    PanelFontFormat,
    PanelFontSpacing,
    PanelNudge,
    PanelAdjust,
    PanelTextEffect,
    PanelPhotoShadow,
    PanelObjectAdjust,
    PanelRemoveBg,
  },
  data() {
    return {
      // Used in extended vivi-lib MobilePanel
      // eslint-disable-next-line vue/no-unused-properties
      noPaddingPanels: ['text-effect'],
      // eslint-disable-next-line vue/no-unused-properties
      fixSizePanels: [
        'crop', 'bgRemove', 'position', 'flip', 'opacity',
        'order', 'font-size', 'font-format',
        'font-spacing', 'download', 'more', 'object-adjust',
        'copy-style', 'multiple-select', 'remove-bg', 'nudge'],
      // eslint-disable-next-line vue/no-unused-properties
      hideDynamicCompPanels: ['crop', 'copy-style', 'multiple-select'],
      // eslint-disable-next-line vue/no-unused-properties
      noRowGapPanels: ['crop', 'color', 'copy-style', 'multiple-select'],
      // eslint-disable-next-line vue/no-unused-properties
      hideFooterPanels: ['remove-bg'],
    }
  },
  created() {
    // Provide props to descendant component, https://vuejs.org/guide/components/provide-inject.html
    provide(replaceImgInject, computed(() => this.extraPanel === 'replace' ? (img: IAssetPhoto | IPhotoItem) => {
      this.replaceImg(img)
      this.extraPanel = ''
      this.panelHistory.pop()
    } : null))
  },
  computed: {
    ...mapGetters({
      isDuringCopy: 'webView/getIsDuringCopy',
      isProcessing: 'bgRemove/getIsProcessing',
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
    }),
    isUs(): boolean {
      return this.$i18n.locale === 'us'
    },
    // Used in extended vivi-lib MobilePanel
    // eslint-disable-next-line vue/no-unused-properties
    whiteThemePanelExceptions(): boolean {
      return true // all cm panels are in dark theme
    },
    // eslint-disable-next-line vue/no-unused-properties
    hideDragBar(): boolean {
      return (!this.isUs && this.panelTitle !== '') || this.fixSize || this.extraFixSizeCondition
    },
    panelTitle(): string {
      switch (this.currActivePanel) {
        case 'crop': {
          return `${this.$t('NN0496')}`
        }
        case 'copy-style': {
          return `${this.$t('NN0809')}`
        }
        case 'multiple-select': {
          return `${this.$t('NN0657')}`
        }
        case 'none': {
          return ''
        }
        default: {
          return ''
        }
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    showRightBtn(): boolean {
      return this.currActivePanel !== 'none' && this.currActivePanel !== 'remove-bg'
    },
    // eslint-disable-next-line vue/no-unused-properties
    showLeftBtn(): boolean {
      if (this.extraPanel === 'replace') return true
      return this.panelHistory.length > 0 || this.extraPanel !== ''
    },
    // eslint-disable-next-line vue/no-unused-properties
    panelBg(): string {
      return 'transparent'
    },
    // eslint-disable-next-line vue/no-unused-properties
    specialPanelStyle(): { [index: string]: string } {
      return {
        ...(this.isDuringCopy && { maxHeight: '0', padding: '0'}),
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindIs(): string {
      switch (this.extraPanel) {
        case 'color':
          return 'panel-color'
        case 'replace':
          return 'panel-replace'
      }

      const defaultVal = `panel-${this.currActivePanel}`

      switch (this.currActivePanel) {
        case 'none':
          return ''
        default: {
          return defaultVal
        }
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindProps(): { [index: string]: any } {
      if (this.extraPanel === 'color') {
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
        default: {
          return {}
        }
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindMethod(): { [index: string]: any } {
      const { pushHistory, leaveExtraPanel, openExtraColorModal, openExtraPanelReplace } = this.getBasicBindMethods()
      switch (this.currActivePanel) {
        case 'color':
          return { pushHistory }
        case 'text-effect':
          return { pushHistory, openExtraColorModal, openExtraPanelReplace, leaveExtraPanel }
        case 'photo-shadow':
          return { pushHistory, openExtraColorModal }
        default:
          return {}
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    leftBtnName(): string {
      return 'panel-back'
    },
    // eslint-disable-next-line vue/no-unused-properties
    rightBtnName(): string {
      if (this.bgRemoveMode || this.panelHistory.length > 0) {
        return 'panel-done'
      } else {
        return 'panel-close'
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    leftButtonAction(): (e: PointerEvent) => void {
      if (this.extraPanel === 'color') {
        return () => {
          this.extraPanel = ''
          this.panelHistory.pop()
        }
      }
      if (this.extraPanel === 'replace') {
        return () => {
          if (this.currHistory === 'stock') this.panelHistory.pop()
          else this.extraPanel = ''
        }
      }
      if (this.panelHistory.length > 0) {
        return () => {
          this.panelHistory.pop()
        }
      } else {
        return () => {
          this.closeMobilePanel()
        }
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
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
            if (this.bgRemoveMode && !this.isProcessing) {
              bgRemoveUtils.setInBgRemoveMode(false)
            }
            break
          }

          case 'copy-style': {
            formatUtils.clearCopiedFormat()
            break
          }

          case 'multiple-select': {
            if (this.inMultiSelectionMode) {
              editorUtils.setInMultiSelectionMode(false)
            }
            break
          }
        }
        this.closeMobilePanel()
      }
    }
  },
  methods: {
    ...mapMutations({
      setBgImageControl: 'SET_backgroundImageControl',
    }),
    // eslint-disable-next-line vue/no-unused-properties
    notKeepPanel(): boolean {
      return !(this.bgRemoveMode || this.isBgImgCtrl || this.isProcessing || this.inMultiSelectionMode)
    },
    // eslint-disable-next-line vue/no-unused-properties
    headerbarHeight() {
      return document.querySelector('.editor-header')?.clientHeight ?? 0
    },
    // eslint-disable-next-line vue/no-unused-properties
    _panelParentHeight() {
      return document.querySelector('#app')?.clientHeight ?? 0
    },
  }
})
</script>

<style lang="scss">
.mobile-panel {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px 10px 0 0;
  @include cm {
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.3);
  }
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

  .tabs {
    margin-bottom: 14px;
  }

  &__btn {
    display: grid; // To fix div height != child height issue. https://stackoverflow.com/questions/5804256
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
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-auto-columns: minmax(0, 1fr);
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    @include no-scrollbar;
    > *:last-child { // panel-* always take minmax(0, 1fr) grid layout.
      grid-row: 2 / 3;
    }
  }

  &__title {
    @include flexCenter();
    font-weight: bold;
  }

  &__layer-num {
    @include size(20px);
    @include flexCenter();
    @include setColors(blue-1, black-5) using ($color) {
      background-color: $color;
    }
    border-radius: 50%;
  }

  &__drag-bar {
    position: absolute;
    touch-action: manipulation;
    top: 2px;
    // 47 = 15 (MobilePanel margin)
    //    + 12 (half of gray-4 div width)
    //    + 20 (left/right btn)
    padding: 10px calc(50% - 47px);
    border-radius: 5px;
    > div {
      @include setColors(gray-4, black-4, black-4) using ($color) {
        background-color: $color;
      }
      height: 3px;
      width: 24px;
    }
  }
}
</style>
