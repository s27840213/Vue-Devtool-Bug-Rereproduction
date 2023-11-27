<script lang="ts">
import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
import MobilePanel from '@nu/vivi-lib/components/editor/mobile/MobilePanel.vue'
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
import Tabs from '@nu/vivi-lib/components/Tabs.vue'
import { IAssetPhoto, IPhotoItem } from '@nu/vivi-lib/interfaces/api'
import { IFrame } from '@nu/vivi-lib/interfaces/layer'
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

const component = defineComponent({
  extends: MobilePanel,
  components: {
    PanelColor,
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
    Tabs,
  },
  data() {
    return {
      // Used in extended vivi-lib MobilePanel
      // eslint-disable-next-line vue/no-unused-properties
      noPaddingPanels: ['text-effect'],
      // eslint-disable-next-line vue/no-unused-properties
      fixSizePanels: [
        'crop-flip',
        'bgRemove',
        'position',
        'flip',
        'opacity',
        'order',
        'font-size',
        'font-format',
        'font-spacing',
        'download',
        'more',
        'object-adjust',
        'copy-style',
        'multiple-select',
        'remove-bg',
        'nudge',
      ],
      // eslint-disable-next-line vue/no-unused-properties
      hideDynamicCompPanels: ['crop-flip', 'copy-style', 'multiple-select'],
      // eslint-disable-next-line vue/no-unused-properties
      noRowGapPanels: ['crop-flip', 'color', 'copy-style', 'multiple-select'],
      // eslint-disable-next-line vue/no-unused-properties
      hideFooterPanels: ['remove-bg'],
      // eslint-disable-next-line vue/no-unused-properties
      hideMobilePanelPanels: ['crop-flip'],
    }
  },
  created() {
    // Provide props to descendant component, https://vuejs.org/guide/components/provide-inject.html
    provide(
      replaceImgInject,
      computed(() =>
        this.extraPanel === 'replace'
          ? (img: IAssetPhoto | IPhotoItem) => {
              this.replaceImg(img)
              this.extraPanel = ''
              this.panelHistory.pop()
            }
          : null,
      ),
    )
  },
  computed: {
    ...mapGetters({
      isDuringCopy: 'cmWV/getIsDuringCopy',
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
        case 'crop-flip': {
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
        ...(this.isDuringCopy && { maxHeight: '0', padding: '0' }),
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
          panelHistory: this.panelHistory,
        }
      }

      switch (this.currActivePanel) {
        case 'fonts': {
          return {
            showTitle: false,
          }
        }
        case 'text-effect': {
          return {
            panelHistory: this.panelHistory,
          }
        }
        case 'color': {
          return {
            panelHistory: this.panelHistory,
          }
        }
        default: {
          return {}
        }
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindMethod(): { [index: string]: any } {
      const { pushHistory, leaveExtraPanel, openExtraColorModal, openExtraPanelReplace } =
        this.getBasicBindMethods()
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
          case 'crop-flip': {
            if (this.selectedLayerNum > 0) {
              if (imageUtils.isImgControl()) {
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
                      (l) => l.type === 'image',
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
                }
              }
            } else if (this.inBgSettingMode) {
              if (this.backgroundLocked) return this.handleLockedNotify()
              this.setBgImageControl({
                pageIndex: pageUtils.currFocusPageIndex,
                imgControl: false,
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
    },
  },
  methods: {
    ...mapMutations({
      setBgImageControl: 'SET_backgroundImageControl',
    }),
    // eslint-disable-next-line vue/no-unused-properties
    notKeepPanel(): boolean {
      return !(
        this.isImgCtrl ||
        this.bgRemoveMode ||
        this.isBgImgCtrl ||
        this.isProcessing ||
        this.inMultiSelectionMode
      )
    },
    // eslint-disable-next-line vue/no-unused-properties
    headerbarHeight() {
      return (
        (document.querySelector('.editor-header')?.clientHeight ?? 0) +
        (document.querySelector('.footer-tabs-row')?.clientHeight ?? 0) +
        40
      )
    },
    // eslint-disable-next-line vue/no-unused-properties
    _panelParentHeight() {
      return document.querySelector('#app')?.clientHeight ?? 0
    },
    // eslint-disable-next-line vue/no-unused-properties
    middlewareCondition(target: HTMLElement | SVGElement): boolean {
      const isSvg = target.nodeName === 'svg'
      return isSvg
        ? (target as SVGElement).classList.contains('layer-action')
        : (target as HTMLElement).className.includes?.('layer-action') // Skip layer action icon or element
    },
  },
})
export default component
export type CMobilePanel = InstanceType<typeof component>
</script>
