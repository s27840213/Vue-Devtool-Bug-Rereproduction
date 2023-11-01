<script lang="ts">
import ColorPanel from '@/components/editor/ColorSlips.vue'
import PanelAddTemplate from '@/components/editor/panelMobile/PanelAddTemplate.vue'
import PanelBackground from '@/components/editor/panelMobile/PanelBackground.vue'
import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
import PanelColorPicker from '@/components/editor/panelMobile/PanelColorPicker.vue'
import PanelGiphyMore from '@/components/editor/panelMobile/PanelGiphyMore.vue'
import PanelMyDesignMore from '@/components/editor/panelMobile/PanelMyDesignMore.vue'
import PanelPageManagement from '@/components/editor/panelMobile/PanelPageManagement.vue'
import PanelReplace from '@/components/editor/panelMobile/PanelReplace.vue'
import PanelTemplateContent from '@/components/editor/panelMobile/PanelTemplateContent.vue'
import PanelVvstkMore from '@/components/editor/panelMobile/PanelVvstkMore.vue'
import panelSelectDesign from '@/components/editor/panelMobile/panelSelectDesign.vue'
import MobilePanel from '@nu/vivi-lib/components/editor/mobile/MobilePanel.vue'
import PanelFonts from '@nu/vivi-lib/components/editor/panelFunction/PanelFonts.vue'
import PanelAdjust from '@nu/vivi-lib/components/editor/panelMobile/PanelAdjust.vue'
import PanelFlip from '@nu/vivi-lib/components/editor/panelMobile/PanelFlip.vue'
import PanelFontFormat from '@nu/vivi-lib/components/editor/panelMobile/PanelFontFormat.vue'
import PanelFontSize from '@nu/vivi-lib/components/editor/panelMobile/PanelFontSize.vue'
import PanelFontSpacing from '@nu/vivi-lib/components/editor/panelMobile/PanelFontSpacing.vue'
import PanelNudge from '@nu/vivi-lib/components/editor/panelMobile/PanelNudge.vue'
import PanelObject from '@nu/vivi-lib/components/editor/panelMobile/PanelObject.vue'
import PanelObjectAdjust from '@nu/vivi-lib/components/editor/panelMobile/PanelObjectAdjust.vue'
import PanelOpacity from '@nu/vivi-lib/components/editor/panelMobile/PanelOpacity.vue'
import PanelOrder from '@nu/vivi-lib/components/editor/panelMobile/PanelOrder.vue'
import PanelPhotoShadow from '@nu/vivi-lib/components/editor/panelMobile/PanelPhotoShadow.vue'
import PanelPosition from '@nu/vivi-lib/components/editor/panelMobile/PanelPosition.vue'
import PanelRemoveBg from '@nu/vivi-lib/components/editor/panelMobile/PanelRemoveBg.vue'
import PanelText from '@nu/vivi-lib/components/editor/panelMobile/PanelText.vue'
import PanelTextEffect from '@nu/vivi-lib/components/editor/panelMobile/PanelTextEffect.vue'
import PanelTextUs from '@nu/vivi-lib/components/editor/panelMobileUs/PanelText.vue'
import PanelPhoto from '@nu/vivi-lib/components/editor/panelSidebar/PanelPhoto.vue'
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
import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
import { replaceImgInject } from '@nu/vivi-lib/utils/textFillUtils'
import { computed, defineComponent, provide } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  extends: MobilePanel,
  mixins: [mobilePanelMixin],
  emits: ['bottomThemeChange'],
  components: {
    PanelPhoto,
    PanelObject,
    PanelBackground,
    PanelText,
    PanelTextUs,
    ColorPanel,
    PanelPosition,
    PanelFlip,
    PanelOpacity,
    PanelOrder,
    PanelFonts,
    PanelFontSize,
    PanelFontFormat,
    PanelFontSpacing,
    PanelNudge,
    PanelColor,
    PanelAdjust,
    PanelTextEffect,
    PanelPhotoShadow,
    PanelObjectAdjust,
    PanelVvstkMore,
    PanelGiphyMore,
    PanelColorPicker,
    PanelMyDesignMore,
    panelSelectDesign,
    PanelAddTemplate,
    PanelRemoveBg,
    PanelPageManagement,
    PanelTemplateContent,
    PanelReplace,
  },
  data() {
    return {
      // Used in extended vivi-lib MobilePanel
      // eslint-disable-next-line vue/no-unused-properties
      keepAlivePanels: ['PanelTemplate', 'PanelPhoto', 'PanelObject', 'PanelBackground', 'PanelText'],
      // eslint-disable-next-line vue/no-unused-properties
      noPaddingPanels: ['text', 'object', 'background', 'template-content', 'vvstk-more', 'my-design-more', 'giphy-more', 'select-design', 'text-effect', 'add-template', 'page-management'],
      // eslint-disable-next-line vue/no-unused-properties
      fixSizePanels: [
        'crop', 'bgRemove', 'position', 'flip', 'opacity',
        'order', 'font-size', 'font-format', 'color-picker', 
        'font-spacing', 'download', 'more', 'object-adjust',
        'vvstk-more', 'giphy-more', 'my-design-more', 'select-design',
        'copy-style', 'multiple-select', 'remove-bg', 'nudge'],
      // eslint-disable-next-line vue/no-unused-properties
      hideDynamicCompPanels: ['crop', 'copy-style', 'multiple-select'],
      // eslint-disable-next-line vue/no-unused-properties
      noRowGapPanels: ['crop', 'color', 'copy-style', 'vvstk-more', 'select-design', 'add-template', 'multiple-select'],
      // eslint-disable-next-line vue/no-unused-properties
      hideFooterPanels: ['remove-bg'],
    }
  },
  watch: {
    bottomTheme(newVal) {
      this.$emit('bottomThemeChange', newVal)
    },
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
    ...mapState('templates', {
      templatesIgLayout: 'igLayout'
    }),
    ...mapGetters({
      isInCategory: 'vivisticker/getIsInCategory',
      isShowAllRecently: 'vivisticker/getShowAllRecently',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      isProcessing: 'bgRemove/getIsProcessing',
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
      isInPagePreview: 'vivisticker/getIsInPagePreview',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      currActiveObjectFavTab: 'vivisticker/getCurrActiveObjectFavTab',
      isInGroupTemplate: 'vivisticker/getIsInGroupTemplate'
    }),
    isUs(): boolean {
      return this.$i18n.locale === 'us'
    },
    isTextInCategory(): boolean {
      return this.isInCategory('text')
    },
    isObjectInCategory(): boolean {
      return this.isInCategory('object')
    },
    isBackgroundInCategory(): boolean {
      return this.isInCategory('background')
    },
    isTemplateInCategory(): boolean {
      return this.isInCategory('template')
    },
    isTextShowAllRecently(): boolean {
      return this.isShowAllRecently('text')
    },
    // Used in extended vivi-lib MobilePanel
    // eslint-disable-next-line vue/no-unused-properties
    whiteThemePanelExceptions(): boolean {
      return true // all stk panels are in dark theme
    },
    // eslint-disable-next-line vue/no-unused-properties
    hideDragBar(): boolean {
      return (!this.insertTheme && !this.isUs && this.panelTitle !== '') || this.fixSize || this.extraFixSizeCondition
    },
    // eslint-disable-next-line vue/no-unused-properties
    hideTopSection(): boolean {
      return ['select-design', 'page-management'].includes(this.currActivePanel)
    },
    // eslint-disable-next-line vue/no-unused-properties
    bottomTheme(): boolean {
      return ['add-template', 'page-management'].includes(this.currActivePanel)
    },
    glassTheme(): boolean {
      return ['page-management'].includes(this.currActivePanel)
    },
    // eslint-disable-next-line vue/no-unused-properties
    noRoundTheme(): boolean {
      return ['add-template', 'page-management'].includes(this.currActivePanel)
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
      return this.extraPanel === '' && ['text', 'object', 'background', 'photo', 'template-content', 'add-template', 'page-management'].includes(this.currActivePanel)
    },
    // eslint-disable-next-line vue/no-unused-properties
    showRightBtn(): boolean {
      return this.currActivePanel !== 'none' && this.currActivePanel !== 'remove-bg'
    },
    // eslint-disable-next-line vue/no-unused-properties
    showLeftBtn(): boolean {
      if (this.extraPanel === 'replace') return true
      if (this.currActivePanel === 'text' && this.isTextInCategory) return true
      if (this.currActivePanel === 'object' && this.isObjectInCategory) return true
      if (this.currActivePanel === 'background' && this.isBackgroundInCategory) return true
      if (this.currActivePanel === 'template-content' && (this.isTemplateInCategory || this.isInGroupTemplate)) return true
      return this.panelHistory.length > 0 || ['color-picker'].includes(this.currActivePanel) || this.extraPanel !== ''
    },
    // eslint-disable-next-line vue/no-unused-properties
    panelBg(): string {
      return this.glassTheme ? 'rgba(20, 20, 20, 0.8)' : '#141414'
    },
    // eslint-disable-next-line vue/no-unused-properties
    specialPanelStyle(): { [index: string]: string } {
      return {
        backdropFilter: this.glassTheme ? 'blur(5px)' : 'none',
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
        case 'download': {
          return 'popup-download'
        }
        case 'text': {
          return 'panel-text' + (this.isUs ? '-us' : '')
        }
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
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindMethod(): { [index: string]: any } {
      const { pushHistory, leaveExtraPanel, openExtraColorModal, openExtraPanelReplace } = this.getBasicBindMethods()
      switch (this.currActivePanel) {
        case 'color':
          return { pushHistory }
        case 'background':
          return { openExtraColorModal }
        case 'text-effect':
          return { pushHistory, openExtraColorModal, openExtraPanelReplace, leaveExtraPanel }
        case 'photo-shadow':
          return { pushHistory, openExtraColorModal }
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
    // eslint-disable-next-line vue/no-unused-properties
    leftBtnName(): string {
      if (this.insertTheme) {
        return 'vivisticker_back'
      } else {
        return 'panel-back'
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    rightBtnName(): string {
      if (this.insertTheme) {
        return 'vivisticker_close'
      } else if (this.bgRemoveMode || (this.panelHistory.length > 0 && this.currActivePanel !== 'brand-list') || ['color-picker'].includes(this.currActivePanel)) {
        return 'panel-done'
      } else {
        return 'panel-close'
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    leftButtonAction(): (e: PointerEvent) => void {
      if (this.currActivePanel === 'text' && this.isTextInCategory) {
        return () => {
          this.setIsInCategory({ tab: 'text', bool: false })
          this.setShowAllRecently({ tab: 'text', bool: false })
          this.resetTextsSearch({ resetCategoryInfo: true })
        }
      }
      if (this.currActivePanel === 'object' && this.isObjectInCategory) {
        return () => {
          this.setIsInCategory({ tab: 'object', bool: false })
          this.setShowAllRecently({ tab: 'object', bool: false })
          if (this.currActiveObjectFavTab) this.resetObjectsFavSearch()
          else this.resetObjectsSearch({ resetCategoryInfo: true })
        }
      }
      if (this.currActivePanel === 'background' && this.isBackgroundInCategory) {
        return () => {
          this.setIsInCategory({ tab: 'background', bool: false })
          this.setShowAllRecently({ tab: 'background', bool: false })
          this.resetBackgroundSearch()
        }
      }
      if (this.currActivePanel === 'template-content') {
        if (this.isInGroupTemplate) return () => this.setIsInGroupTemplate(false)
        if (this.isTemplateInCategory) {
          return () => {
            this.setIsInCategory({ tab: 'template', bool: false })
            this.setShowAllRecently({ tab: 'template', bool: false })
            this.$store.dispatch(`templates/${this.templatesIgLayout}/resetSearch`, { resetCategoryInfo: true })
          }
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
          if (this.currHistory === 'stock') this.panelHistory.pop()
          else this.extraPanel = ''
        }
      }
      if (this.currActivePanel === 'color-picker') {
        return () => {
          stkWVUtils.setHasNewBgColor(false)
          this.closeMobilePanel()
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

          case 'color-picker': {
            stkWVUtils.commitNewBgColor()
            break
          }
        }
        this.closeMobilePanel()
      }
    }
  },
  methods: {
    ...mapMutations({
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel',
      setIsInCategory: 'vivisticker/SET_isInCategory',
      setShowAllRecently: 'vivisticker/SET_showAllRecently',
      setBgImageControl: 'SET_backgroundImageControl',
      setIsInGroupTemplate: 'vivisticker/SET_isInGroupTemplate',
    }),
    ...mapActions({
      initRecentlyColors: 'color/initRecentlyColors',
      resetTextsSearch: 'textStock/resetSearch',
      resetObjectsSearch: 'objects/resetSearch',
      resetObjectsFavSearch: 'objects/resetFavoritesSearch',
      resetBackgroundSearch: 'background/resetSearch',
    }),
    // eslint-disable-next-line vue/no-unused-properties
    notKeepPanel(): boolean {
      return !(this.bgRemoveMode || this.isInPagePreview || this.isBgImgCtrl || this.isProcessing || this.inMultiSelectionMode)
    },
    // eslint-disable-next-line vue/no-unused-properties
    middlewareCondition() {
      return this.currActivePanel === 'select-design'
    },
    // eslint-disable-next-line vue/no-unused-properties
    headerbarHeight() {
      return document.querySelector('.vivisticker .header-bar')?.clientHeight ?? 0
    },
    // eslint-disable-next-line vue/no-unused-properties
    _panelParentHeight() {
      return document.querySelector('.vivisticker .vivisticker__top')?.clientHeight ?? 0
    },
  }
})
</script>
