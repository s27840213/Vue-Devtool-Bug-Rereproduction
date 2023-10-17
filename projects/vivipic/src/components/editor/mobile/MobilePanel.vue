<script lang="ts">
import Overlay from '@/components/editor/overlay/Overlay.vue'
import PanelFonts from '@nu/vivi-lib/components/editor/panelFunction/PanelFonts.vue'
import PanelAdjust from '@nu/vivi-lib/components/editor/panelMobile/PanelAdjust.vue'
import PanelBleed from '@/components/editor/panelMobile/PanelBleed.vue'
import PanelBrand from '@/components/editor/panelMobile/PanelBrand.vue'
import PanelBrandList from '@/components/editor/panelMobile/PanelBrandList.vue'
import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
import PanelDownload from '@/components/editor/panelMobile/PanelDownload.vue'
import PanelFlip from '@nu/vivi-lib/components/editor/panelMobile/PanelFlip.vue'
import PanelFontFormat from '@nu/vivi-lib/components/editor/panelMobile/PanelFontFormat.vue'
import PanelFontSize from '@nu/vivi-lib/components/editor/panelMobile/PanelFontSize.vue'
import PanelFontSpacing from '@nu/vivi-lib/components/editor/panelMobile/PanelFontSpacing.vue'
import PanelMore from '@/components/editor/panelMobile/PanelMore.vue'
import PanelNudge from '@nu/vivi-lib/components/editor/panelMobile/PanelNudge.vue'
import PanelObjectAdjust from '@nu/vivi-lib/components/editor/panelMobile/PanelObjectAdjust.vue'
import PanelOpacity from '@nu/vivi-lib/components/editor/panelMobile/PanelOpacity.vue'
import PanelOrder from '@nu/vivi-lib/components/editor/panelMobile/PanelOrder.vue'
import PanelPhotoShadow from '@nu/vivi-lib/components/editor/panelMobile/PanelPhotoShadow.vue'
import PanelPosition from '@nu/vivi-lib/components/editor/panelMobile/PanelPosition.vue'
import PanelRemoveBg from '@nu/vivi-lib/components/editor/panelMobile/PanelRemoveBg.vue'
import PanelResize from '@/components/editor/panelMobile/PanelResize.vue'
import PanelTextEffect from '@nu/vivi-lib/components/editor/panelMobile/PanelTextEffect.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import PanelPage from '@/components/editor/panelSidebar/PanelPage.vue'
import PanelPhoto from '@nu/vivi-lib/components/editor/panelSidebar/PanelPhoto.vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelText from '@/components/editor/panelSidebar/PanelText.vue'
import MobilePanel from '@nu/vivi-lib/components/editor/mobile/MobilePanel.vue'
import mobilePanelMixin from '@nu/vivi-lib/mixin/mobilePanel'
import { computed, defineComponent, provide } from 'vue'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { replaceImgInject } from '@nu/vivi-lib/utils/textFillUtils'
import { IFrame } from '@nu/vivi-lib/interfaces/layer'
import bgRemoveUtils from '@nu/vivi-lib/utils/bgRemoveUtils'
import formatUtils from '@nu/vivi-lib/utils/formatUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import { mapMutations } from 'vuex'

export default defineComponent({
  extends: MobilePanel,
  mixins: [mobilePanelMixin],
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
    PanelRemoveBg,
    PanelOrder,
    PanelFonts,
    PanelFontSize,
    PanelFontFormat,
    PanelFontSpacing,
    PanelResize,
    PanelMore,
    PanelColor,
    PanelAdjust,
    PanelTextEffect,
    PanelDownload,
    PanelNudge,
    PanelPhotoShadow,
    PanelObjectAdjust,
    PanelBrandList,
    PanelBleed,
    Overlay,
  },
  data() {
    return {
      // Used in extended vivi-lib MobilePanel
      // eslint-disable-next-line vue/no-unused-properties
      keepAlivePanels: ['PanelTemplate', 'PanelPhoto', 'PanelObject', 'PanelBackground', 'PanelText', 'PanelFile'],
      // eslint-disable-next-line vue/no-unused-properties
      noPaddingPanels: ['brand-list', 'text-effect', 'overlay-dark', 'overlay-light'],
      // eslint-disable-next-line vue/no-unused-properties
      whiteThemePanels: [
        'bleed', 'replace', 'crop', 'bgRemove', 'position', 'flip',
        'opacity', 'order', 'fonts', 'font-size', 'text-effect',
        'font-format', 'font-spacing', 'download', 'more', 'color',
        'adjust', 'photo-shadow', 'resize', 'object-adjust', 'brand-list', 'copy-style',
        'multiple-select', 'remove-bg', 'nudge', 'overlay-light'],
      // eslint-disable-next-line vue/no-unused-properties
      fixSizePanels: [
        'bleed', 'crop', 'bgRemove', 'position', 'flip', 'opacity',
        'order', 'font-size', 'font-format',
        'font-spacing', 'more', 'object-adjust', 'brand-list', 'multiple-select', 'nudge'],
      // eslint-disable-next-line vue/no-unused-properties
      hideDynamicCompPanels: ['crop', 'copy-style', 'multiple-select'],
      // eslint-disable-next-line vue/no-unused-properties
      noRowGapPanels: ['crop', 'color', 'copy-style', 'multiple-select', 'remove-bg',
        'text-effect'],
      // eslint-disable-next-line vue/no-unused-properties
      hideFooterPanels: ['download', 'remove-bg'],
    }
  },
  created() {
    // Provide props to descendant component, https://vuejs.org/guide/components/provide-inject.html
    provide(replaceImgInject, computed(() => this.extraPanel === 'replace' ? this.replaceImg : null))
  },
  computed: {
    // Used in extended vivi-lib MobilePanel
    // eslint-disable-next-line vue/no-unused-properties
    hideTopSection(): boolean {
      return ['overlay-dark', 'overlay-light'].includes(this.currActivePanel) && this.historySize === 0
    },
    // eslint-disable-next-line vue/no-unused-properties
    whiteThemeConditions(): boolean {
      return (this.currActivePanel === 'overlay-dark' && this.historySize > 0)
    },
    // eslint-disable-next-line vue/no-unused-properties
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
        case 'remove-bg': {
          return `${this.$t('NN0043')}`
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
      if (this.currActivePanel === 'download') {
        return (this.historySize < 2) && !['polling', 'downloaded'].includes(this.currHistory)
      }
      return this.currActivePanel !== 'none'
    },
    // eslint-disable-next-line vue/no-unused-properties
    showLeftBtn(): boolean {
      if (this.currActivePanel === 'download' && ['polling', 'downloaded', 'setting'].includes(this.currHistory)) return false
      return this.bgRemoveMode || (this.whiteTheme && (this.panelHistory.length > 0 || this.extraPanel))
    },
    // eslint-disable-next-line vue/no-unused-properties
    panelBg(): string {
      return '#2C2F43'
    },
    // eslint-disable-next-line vue/no-unused-properties
    innerTabs(): Record<string, string[]>  {
      const panelReplace = {
        key: ['file', 'photo'],
        label: [this.$tc('NN0006'), this.$t('STK0069')]
      }

      if (this.extraPanel === 'replace') {
        return panelReplace
      }
      switch (this.currActivePanel) {
        case 'replace':
          return panelReplace
        default:
          return {
            key: ['']
          }
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindIs(): string {
      switch (this.extraPanel) {
        case 'color':
          return 'panel-color'
        case 'replace':
          return `panel-${this.innerTab}`
      }

      switch (this.currActivePanel) {
        case 'replace':
          return `panel-${this.innerTab}`
        case 'overlay-dark':
        case 'overlay-light':
          return 'overlay'
        case 'none':
          return ''
        default:
          return `panel-${this.currActivePanel}`
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
        case 'download': {
          return {
            hideContainer: true,
            pageIndex: pageUtils.currFocusPageIndex,
            panelHistory: this.panelHistory
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
        case 'more': {
          return {
            panelHistory: this.panelHistory
          }
        }
        case 'overlay-dark':
        case 'overlay-light':
          return {
            theme: this.currActivePanel.replace('overlay-', ''),
            panelHistory: this.panelHistory,
          }
        default: {
          return {}
        }
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindMethod(): { [index: string]: any } {
      const { pushHistory, openExtraColorModal, openExtraPanelReplace } = this.getBasicBindMethods()
      switch (this.currActivePanel) {
        case 'color':
        case 'more':
        case 'overlay-dark':
        case 'overlay-light':
          return { pushHistory }
        case 'background':
          return { openExtraColorModal }
        case 'text-effect':
          return { pushHistory, openExtraColorModal, openExtraPanelReplace }
        case 'photo-shadow':
          return { pushHistory, openExtraColorModal }
        case 'download':
        case 'brand-list':
          return {
            pushHistory,
            back: () => {
              this.panelHistory.pop()
            },
            'update:panelHistory': (val: string) => {
              this.panelHistory = [val]
            }
          }
        default:
          return {}
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    leftBtnName(): string {
      return this.bgRemoveMode ? 'close-circle' : 'back-circle'
    },
    // eslint-disable-next-line vue/no-unused-properties
    rightBtnName(): string {
      if (this.currActivePanel === 'download') {
        return 'close-circle'
      } else if (this.bgRemoveMode || (this.panelHistory.length > 0 && this.currActivePanel !== 'brand-list') || ['crop'].includes(this.currActivePanel)) {
        return 'check-mobile-circle'
      } else {
        return 'close-circle'
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    leftButtonAction(): () => void {
      if (this.bgRemoveMode) {
        return () => {
          bgRemoveUtils.cancel()
        }
      }

      if (this.extraPanel === 'color') {
        return () => {
          this.extraPanel = ''
          this.panelHistory.pop()
        }
      }
      if (this.extraPanel === 'replace') {
        return () => {
          this.extraPanel = ''
          this.panelHistory.pop()
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
          case 'remove-bg': {
            if (this.bgRemoveMode) {
              bgRemoveUtils.save()
            }
            break
          }
        }
        this.closeMobilePanel()
      }
    },
  },
  methods: {
    ...mapMutations({
      setBgImageControl: 'SET_backgroundImageControl'
    }),
    // eslint-disable-next-line vue/no-unused-properties
    notKeepPanel(): boolean {
      return !this.isImgCtrl && !this.isBgImgCtrl && !this.inMultiSelectionMode && !this.bgRemoveMode
    },
    // eslint-disable-next-line vue/no-unused-properties
    headerbarHeight() {
      return document.querySelector('.mobile-editor .header-bar')?.clientHeight ?? 0
    },
    // eslint-disable-next-line vue/no-unused-properties
    _panelParentHeight() {
      return document.querySelector('.mobile-editor .mobile-editor__top')?.clientHeight ?? 0
    }
  }
})
</script>
