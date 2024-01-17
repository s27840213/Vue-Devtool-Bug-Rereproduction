<script lang="ts">
import { notify } from '@kyvg/vue3-notification'
import FooterTabs from '@nu/vivi-lib/components/editor/mobile/FooterTabs.vue'
import i18n from '@nu/vivi-lib/i18n'
import { IColorKeys, colorTable } from '@nu/vivi-lib/interfaces/color'
import { IFooterTab } from '@nu/vivi-lib/interfaces/editor'
import { IFrame, IGroup, IImage, IShape } from '@nu/vivi-lib/interfaces/layer'
import { ColorEventType, LayerType } from '@nu/vivi-lib/store/types'
import backgroundUtils from '@nu/vivi-lib/utils/backgroundUtils'
import bgRemoveUtils from '@nu/vivi-lib/utils/bgRemoveUtils'
import brandkitUtils from '@nu/vivi-lib/utils/brandkitUtils'
import colorUtils from '@nu/vivi-lib/utils/colorUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import formatUtils from '@nu/vivi-lib/utils/formatUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import mappingUtils from '@nu/vivi-lib/utils/mappingUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import picWVUtils from '@nu/vivi-lib/utils/picWVUtils'
import shortcutUtils from '@nu/vivi-lib/utils/shortcutUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import tiptapUtils from '@nu/vivi-lib/utils/tiptapUtils'
import uploadUtils from '@nu/vivi-lib/utils/uploadUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  extends: FooterTabs,
  computed: {
    // eslint-disable-next-line vue/no-unused-properties
    isSettingTabsOpen(): boolean {
      return this.settingTabs.length > 0 || this.inBgRemoveMode
    },
    groupTab(): IFooterTab {
      return {
        icon: this.isGroup ? 'ungroup' : 'group',
        text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`,
        hidden: !this.isGroup && this.selectedLayerNum === 1,
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    homeTabs(): Array<IFooterTab> {
      const useCameraroll = generalUtils.versionCheck({
        greaterThan: '1.05',
        version: picWVUtils.getUserInfoFromStore().appVer,
      })
      return [
        { icon: 'template', text: `${this.$tc('NN0001', 2)}`, panelType: 'template' },
        ...(useCameraroll
          ? [{ icon: 'cameraroll', text: `${this.$tc('STK0067', 2)}` }]
          : [{ icon: 'photo', text: `${this.$tc('NN0002', 2)}`, panelType: 'photo' }]),
        { icon: 'objects', text: `${this.$tc('NN0003', 2)}`, panelType: 'object' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, panelType: 'background' },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}`, panelType: 'text' },
        { icon: 'upload', text: `${this.$tc('NN0006', 2)}`, panelType: 'file' },
        ...(this.isAdmin
          ? [{ icon: 'overlay', text: this.$t('NN0899'), panelType: 'overlay-dark' }]
          : []),
        ...(useCameraroll
          ? [{ icon: 'photo', text: `${this.$t('STK0069')}`, panelType: 'photo' }]
          : []),
        { icon: 'add-page', text: `${this.$t('NN0139')}` },
        { icon: 'trash', text: `${this.$t('NN0141')}`, hidden: pageUtils.getPages.length <= 1 },
        { icon: 'duplicate-page', text: `${this.$t('NN0140')}` },
        { icon: 'paste', text: `${this.$t('NN0230')}` },
        ...(brandkitUtils.isBrandkitAvailable
          ? [{ icon: 'brand', text: `${this.$t('NN0497')}`, panelType: 'brand' }]
          : []),
      ] as Array<IFooterTab>
    },
    photoInGroupTabs(): Array<IFooterTab> {
      return [
        {
          icon: 'replace',
          text: `${this.$t('NN0490')}`,
          panelType: 'replace',
          hidden: this.isInFrame,
        },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          hidden: this.isInFrame,
          // empty type in srcObj means the image is being uploading
          disabled:
            (this.isHandleShadow ||
              this.isUploadShadow ||
              !(layerUtils.getCurrConfig as IImage).srcObj.type) &&
            this.mobilePanel !== 'photo-shadow',
        },
        ...this.genearlLayerTabs,
        { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: this.isInFrame },
        {
          icon: 'copy-edits',
          text: `${this.$t('NN0035')}`,
          hidden: this.isCopyFormatDisabled,
        },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
      ]
    },
    photoTabs(): Array<IFooterTab> {
      return [
        { icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace' },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        ...(this.isInFrame ? [{ icon: 'set-as-frame', text: `${this.$t('NN0098')}` }] : []),
        {
          icon: 'effect',
          text: `${this.$t('NN0429')}`,
          panelType: 'photo-shadow',
          hidden: this.isInFrame,
          // empty type in srcObj means the image is being uploading
          disabled:
            (this.isHandleShadow ||
              this.isUploadShadow ||
              !(layerUtils.getCurrConfig as IImage).srcObj?.type) &&
            this.mobilePanel !== 'photo-shadow',
        },
        ...(this.isAdmin
          ? [{ icon: 'overlay', text: this.$t('NN0899'), panelType: 'overlay-light' }]
          : []),
        ...this.genearlLayerTabs,
        { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: this.isInFrame },
        ...this.copyPasteTabs,
        ...(!this.isInFrame ? [{ icon: 'set-as-frame', text: `${this.$t('NN0706')}` }] : []),
        {
          icon: 'copy-edits',
          text: `${this.$t('NN0035')}`,
          hidden: this.isCopyFormatDisabled,
        },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
        ...(!picWVUtils.inReviewMode
          ? [
              {
                icon: 'remove-bg',
                text: `${this.$t('NN0043')}`,
                panelType: 'remove-bg',
                hidden: this.isInFrame,
                disabled: this.isSvgImage || this.isProcessing || this.isUploadingImg,
              },
            ]
          : []),
      ]
    },
    frameTabs(): Array<IFooterTab> {
      const frame = layerUtils.getCurrLayer
      if (frame.type !== 'frame') return []
      const showReplace = frame.clips.length === 1 || frame.clips.some((c) => c.active)
      const replace = showReplace
        ? [{ icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'replace' }]
        : []
      return [
        ...replace,
        ...(frame.clips.length === 1
          ? [{ icon: 'set-as-frame', text: `${this.$t('NN0098')}` }]
          : []),
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape,
          },
        },
        ...this.genearlLayerTabs,
        ...this.copyPasteTabs,
        {
          icon: 'copy-edits',
          text: `${this.$t('NN0035')}`,
          hidden: this.isCopyFormatDisabled,
        },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
      ]
    },
    fontTabs(): Array<IFooterTab> {
      return [
        {
          icon: 'edit',
          text: `${this.$t('NN0504')}`,
          hidden: this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer),
        },
        {
          icon: 'font',
          text: generalUtils.capitalize(`${this.$tc('NN0353', 2)}`),
          panelType: 'fonts',
        },
        { icon: 'font-size', text: `${this.$t('NN0122')}`, panelType: 'font-size' },
        {
          icon: 'text-color-mobile',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          props: {
            currColorEvent: ColorEventType.text,
          },
        },
        { icon: 'effect', text: `${this.$t('NN0491')}`, panelType: 'text-effect' },
        { icon: 'spacing', text: `${this.$t('NN0755')}`, panelType: 'font-spacing' },
        { icon: 'text-format', text: `${this.$t('NN0498')}`, panelType: 'font-format' },
        {
          icon: 'copy-edits',
          text: `${this.$t('NN0035')}`,
          hidden: this.isCopyFormatDisabled,
        },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
      ]
    },
    bgSettingTab(): Array<IFooterTab> {
      const { hasBgImage } = backgroundUtils
      return [
        {
          icon: 'replace',
          text: `${this.$t('NN0490')}`,
          panelType: 'replace',
          hidden: this.isInFrame,
        },
        {
          icon: 'transparency',
          text: `${this.$t('NN0030')}`,
          panelType: 'opacity',
          disabled: this.backgroundLocked,
        },
        {
          icon: 'crop',
          text: `${this.$t('NN0036')}`,
          panelType: 'crop',
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
        ...(this.isAdmin
          ? [
              {
                icon: 'overlay',
                text: this.$t('NN0899'),
                panelType: 'overlay-light',
                hidden: !hasBgImage,
                disabled: this.backgroundLocked,
              },
            ]
          : []),
        {
          icon: 'flip',
          text: `${this.$t('NN0038')}`,
          panelType: 'flip',
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
        {
          icon: 'sliders',
          text: `${this.$t('NN0042')}`,
          panelType: 'adjust',
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.background,
          },
          disabled: this.backgroundLocked,
        },
        {
          icon: 'bg-separate',
          text: `${this.$t('NN0708')}`,
          hidden: !hasBgImage,
          disabled: this.backgroundLocked,
        },
      ]
    },
    multiPhotoTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs,
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        {
          icon: 'paste-edits',
          text: `${this.$t('NN0919')}`,
          hidden: this.isPasteFormatDisabled,
        },
      ]
    },
    multiFontTabs(): Array<IFooterTab> {
      return [...this.multiGeneralTabs, ...this.fontTabs]
    },
    multiObjectTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs,
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape,
          },
        },
      ]
    },
    objectTabs(): Array<IFooterTab> {
      return [
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          hidden: this.globalSelectedColor === 'none',
          props: {
            currColorEvent: ColorEventType.shape,
          },
        },
        {
          icon: 'sliders',
          text: `${this.$t('NN0042')}`,
          panelType: 'object-adjust',
          hidden: !this.showShapeAdjust,
        },
      ]
    },
    pageTabs(): Array<IFooterTab> {
      return [
        { icon: 'add-page', text: `${this.$t('NN0139')}` },
        { icon: 'duplicate-page', text: `${this.$t('NN0140')}` },
        // { icon: 'select-page', text: `${this.$tc('NN0124', 2)}` },
        { icon: 'trash', text: `${this.$t('NN0141')}`, hidden: pageUtils.getPages.length <= 1 },
        // { icon: 'adjust-order', text: `${this.$t('NN0030')}`, panelType: 'opacity' }
      ]
    },
    genearlLayerTabs(): Array<IFooterTab> {
      return [
        { icon: 'layers-alt', text: `${this.$t('NN0757')}`, panelType: 'order' },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        this.groupTab,
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip' },
        { icon: 'nudge', text: `${this.$t('NN0872')}`, panelType: 'nudge' },
        { icon: 'multiple-select', text: `${this.$t('NN0807')}`, panelType: 'multiple-select' },
        // { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object', hidden: true }
      ]
    },
    multiGeneralTabs(): Array<IFooterTab> {
      return [
        {
          icon: 'layers-alt',
          text: `${this.$t('NN0031')}`,
          panelType: 'order',
          hidden: this.hasSubSelectedLayer,
        },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        this.groupTab,
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'multiple-select', text: `${this.$t('NN0807')}`, panelType: 'multiple-select' },
        ...this.copyPasteTabs,
      ]
    },
    copyPasteTabs(): Array<IFooterTab> {
      return [
        { icon: 'copy', text: `${this.$t('NN0032')}` },
        { icon: 'paste', text: `${this.$t('NN0230')}` },
      ]
    },
    settingTabs(): Array<IFooterTab> {
      if (this.inAllPagesMode) {
        return this.pageTabs
        // A group that only has images
      } else if (
        this.isGroupOrTmp &&
        this.targetIs('image') &&
        (this.isWholeGroup || layerUtils.getCurrLayer.type === LayerType.tmp)
      ) {
        return this.multiPhotoTabs
      } else if (this.isGroupOrTmp && this.targetIs('image') && layerUtils.subLayerIdx !== -1) {
        return this.photoInGroupTabs
        // text + shape color
      } else if (this.isGroupOrTmp && this.targetIs('text') && this.showObjectColorAndFontTabs) {
        return [...this.multiObjectTabs, ...this.fontTabs]
        // only text
      } else if (this.isGroupOrTmp && this.targetIs('text')) {
        return this.multiFontTabs
        // only shape
      } else if (this.isGroupOrTmp && this.targetIs('shape') && this.singleTargetType()) {
        return this.multiObjectTabs
      } else if (
        (this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer)) &&
        !this.singleTargetType()
      ) {
        return this.multiGeneralTabs
      } else if (this.showPhotoTabs) {
        return this.photoTabs
      } else if (this.showFontTabs) {
        return [...this.fontTabs, ...this.genearlLayerTabs, ...this.copyPasteTabs]
      } else if (this.showShapeSetting) {
        return [...this.objectTabs, ...this.genearlLayerTabs, ...this.copyPasteTabs]
      } else if (this.inBgSettingMode) {
        return this.bgSettingTab
      } else if (this.isGroupOrTmp) {
        return [
          ...this.genearlLayerTabs,
          {
            icon: 'copy-edits',
            text: `${this.$t('NN0035')}`,
            hidden: this.isCopyFormatDisabled,
          },
          {
            icon: 'paste-edits',
            text: `${this.$t('NN0919')}`,
            hidden: this.isPasteFormatDisabled,
          },
        ]
      } else if (this.showFrameTabs) {
        if (frameUtils.isImageFrame(layerUtils.getCurrLayer as IFrame)) {
          return this.photoTabs
        }
        return this.frameTabs
      }
      return []
    },
    showPhotoTabs(): boolean {
      return (
        (!this.isFontsPanelOpened && this.targetIs('image') && this.singleTargetType()) ||
        this.hasFrameClipActive ||
        this.inBgRemoveMode
      )
    },
    showObjectColorAndFontTabs(): boolean {
      const { subLayerIdx } = layerUtils
      const currLayer = layerUtils.getCurrLayer
      if (!(currLayer.type === 'group' || currLayer.type === 'tmp') || subLayerIdx !== -1)
        return false
      const singleColorShapes = currLayer.layers.filter(
        (l) => l.type === 'shape' && l.color.length === 1,
      ) as IShape[]
      const multiColorShapes = currLayer.layers.filter(
        (l) => l.type === 'shape' && l.color.length !== 1,
      ) as IShape[]
      const hasImages =
        (currLayer.layers.filter((l) => l.type === 'image') as IImage[]).length !== 0
      if (hasImages || (singleColorShapes.length === 0 && multiColorShapes.length !== 1))
        return false
      else return true
    },
    hasFrameClipActive(): boolean {
      const layer = layerUtils.getCurrLayer
      if (layer.type === LayerType.frame) {
        return (layer as IFrame).clips.some((c) => c.active)
      } else return false
    },
    showFontTabs(): boolean {
      return (
        !this.inBgRemoveMode &&
        !this.isFontsPanelOpened &&
        this.targetIs('text') &&
        this.singleTargetType()
      )
    },
    showShapeSetting(): boolean {
      const stateCondition = !this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked
      const typeConditon = this.targetIs('shape') && this.singleTargetType()
      return stateCondition && typeConditon
    },
    showFrameTabs(): boolean {
      return (
        this.targetIs('frame') &&
        this.singleTargetType() &&
        !(layerUtils.getCurrLayer as IFrame).clips.some((c) => c.active)
      )
    },
    showShapeAdjust(): boolean {
      return this.isLine || this.isBasicShape
    },
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    handleTabAction(tab: IFooterTab) {
      if (tab.icon !== 'multiple-select' && this.inMultiSelectionMode) {
        editorUtils.setInMultiSelectionMode(!this.inMultiSelectionMode)
      }
      switch (tab.icon) {
        case 'crop': {
          if (this.selectedLayerNum > 0) {
            if (this.isCropping) {
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
                  index = Math.max(
                    (layerUtils.getCurrLayer as IFrame).clips.findIndex(
                      (l) => l.type === 'image' && l.active,
                    ),
                    0,
                  )
                  frameUtils.updateFrameLayerProps(
                    layerUtils.pageIndex,
                    layerUtils.layerIndex,
                    index,
                    { imgControl: true },
                  )
                  break
                case 'group':
                  if (layerUtils.getCurrConfig.type === LayerType.image) {
                    layerUtils.updateLayerProps(
                      layerUtils.pageIndex,
                      layerUtils.layerIndex,
                      { imgControl: true },
                      layerUtils.subLayerIdx,
                    )
                  }
                  break
              }
            }
          } else if (this.inBgSettingMode) {
            if (this.backgroundLocked) return this.handleLockedNotify()
            this.setBgImageControl({
              pageIndex: pageUtils.currFocusPageIndex,
              imgControl: !this.backgroundImgControl,
            })
          }
          break
        }
        case 'set-as-frame': {
          if (layerUtils.getCurrLayer.type === LayerType.frame) {
            frameUtils.detachImage(layerUtils.layerIndex)
          } else {
            frameUtils.updateImgToFrame()
          }
          break
        }
        case 'cameraroll': {
          if (picWVUtils.inBrowserMode) {
            uploadUtils.chooseAssets('image', true)
          } else {
            picWVUtils.getIosImg().then((images: string[]) => {
              if (images.length > 0) {
                generalUtils.toDataURL(`vvpic://${images[0]}`, (dataUrl: string) => {
                  uploadUtils.uploadAsset('image', [dataUrl], {
                    addToPage: true,
                  })
                })
              }
            })
          }
          break
        }
        case 'remove-bg': {
          if (!this.inBgRemoveMode) {
            bgRemoveUtils.removeBg()
          }
          break
        }
        case 'unfold': {
          groupUtils.deselect()
          this.$emit('switchTab', 'none')
          if (this.inAllPagesMode) {
            this.$emit('showAllPages')
          }

          if (this.inBgRemoveMode) {
            bgRemoveUtils.setInBgRemoveMode(false)
          }

          if (this.inBgSettingMode) {
            editorUtils.setInBgSettingMode(false)
          }
          break
        }
        case 'add-page': {
          const page = pageUtils.getPage(pageUtils.currFocusPageIndex)
          const currPage = pageUtils.currFocusPage
          pageUtils.addPageToPos(
            pageUtils.newPage({
              width: page.width,
              height: page.height,
              bleeds: currPage.bleeds,
              physicalBleeds: currPage.physicalBleeds,
              isEnableBleed: currPage.isEnableBleed,
              backgroundColor: currPage.backgroundColor,
              unit: currPage.unit,
            }),
            pageUtils.currFocusPageIndex + 1,
          )
          this._setCurrActivePageIndex(pageUtils.currFocusPageIndex + 1)
          stepsUtils.record()
          break
        }
        case 'duplicate-page': {
          const { currFocusPageIndex } = pageUtils
          const page = generalUtils.deepCopy(pageUtils.getPage(currFocusPageIndex))
          page.designId = ''
          page.id = generalUtils.generateRandomString(8)
          pageUtils.addPageToPos(page, currFocusPageIndex + 1)
          this._setCurrActivePageIndex(currFocusPageIndex + 1)
          const targetPreviewPage = document.querySelector(`.page-preview_${currFocusPageIndex}`)

          // eslint-disable-next-line no-unused-expressions
          targetPreviewPage?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          })
          break
        }
        case 'trash': {
          groupUtils.deselect()
          const tmpIndex = pageUtils.currFocusPageIndex
          this._setCurrActivePageIndex(pageUtils.isLastPage ? tmpIndex - 1 : tmpIndex)
          editorUtils.setCurrCardIndex(pageUtils.currActivePageIndex)
          pageUtils.deletePage(tmpIndex)
          stepsUtils.record()
          break
        }
        case 'text-format': {
          if (!this.selectMultiple && !this.isGroup) {
            tiptapUtils.agent((editor) => editor.commands.selectAll())
          }
          break
        }
        case 'edit': {
          const { index, pageIndex } = layerUtils.currSelectedInfo
          const { getCurrLayer: currLayer } = layerUtils

          if (!this.hasSubSelectedLayer) {
            if (currLayer.type === 'text') {
              layerUtils.updateLayerProps(pageIndex, index, {
                contentEditable: true,
              })
            }

            this.$nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, currLayer.isEdited ? 'end' : null)
            })
          } else {
            /**
             * @Todo handle the sub controler
             */
            const { subLayerIdx } = layerUtils
            const subLayer = (currLayer as IGroup).layers[subLayerIdx]
            if (subLayer.type === 'text') {
              layerUtils.updateLayerProps(
                pageIndex,
                index,
                {
                  contentEditable: true,
                },
                subLayerIdx,
              )
            }
            this.$nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, 'end')
            })
          }
          break
        }
        case 'group':
        case 'ungroup': {
          this.disableTabScroll = true
          mappingUtils.mappingIconAction(tab.icon)
          break
        }
        case 'multiple-select': {
          editorUtils.setInMultiSelectionMode(!this.inMultiSelectionMode)
          break
        }
        case 'bg-separate': {
          if (this.inBgSettingMode) {
            backgroundUtils.detachBgImage()
          } else {
            backgroundUtils.setBgImageSrc()
          }
          break
        }
        case 'copy': {
          shortcutUtils.copy()
          break
        }
        case 'paste': {
          shortcutUtils.paste()
          break
        }
        case 'copy-edits': {
          this.handleCopyFormat()
          break
        }
        case 'paste-edits': {
          formatUtils.applyFormatIfCopied(layerUtils.pageIndex, layerUtils.layerIndex, layerUtils.subLayerIdx, false)
          break
        }
        case 'effect': {
          // Unreachable, becaues button is disabled
          // if (this.isHandleShadow && this.mobilePanel !== 'photo-shadow') {
          //   notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
          //   return
          // }
          break
        }
        case 'color':
        case 'text-color-mobile':
          colorUtils.setCurrEvent(tab?.props?.currColorEvent as string)
          break
        default: {
          break
        }
      }
      if (tab.icon !== 'crop') {
        if (this.isCropping) {
          imageUtils.setImgControlDefault()
        }
        if (backgroundUtils.backgroundImageControl) {
          backgroundUtils.setAllBackgroundImageControlDefault()
        }
      }
      if (tab.panelType !== undefined) {
        this.$emit('switchTab', tab.panelType, tab.props)
      }

      if (
        ['copy', 'paste', 'add-page', 'remove-bg', 'trash', 'duplicate-page', 'copy-edits'].includes(tab.icon)
      ) {
        this.clickedTab = tab.icon
        this.clickedTabTimer = window.setTimeout(() => {
          this.clickedTab = ''
        }, 400)
      }

      if (['copy', 'paste'].includes(tab.icon)) {
        notify({
          group: 'copy',
          text: tab.icon === 'copy' ? i18n.global.tc('NN0688') : i18n.global.tc('NN0813'),
        })
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    homeTabColor(icon: IFooterTab): IColorKeys {
      return this.tabActive(icon) ? 'blue-1' : 'white'
    },
    // eslint-disable-next-line vue/no-unused-properties
    settingTabColor(icon: IFooterTab): string {
      return icon.disabled || this.isLocked || (icon.icon !== 'remove-bg' && this.inBgRemoveMode)
        ? 'gray-4'
        : this.tabActive(icon)
        ? 'blue-1'
        : this.isSettingTabsOpen
        ? 'gray-2'
        : 'white'
    },
    // eslint-disable-next-line vue/no-unused-properties
    BGColor(isSub: boolean) {
      return {
        backgroundColor: isSub ? colorTable['gray-6'] : colorTable.nav
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    customContentStyles(isSub = false) {
      if (isSub) {
        return {}
      }
      return {
        borderTop: !this.contentEditable && this.isSettingTabsOpen ? '0.5px solid #D9DBE1' : 'none',
        boxShadow:
          !this.contentEditable && this.isSettingTabsOpen ? '0px 0px 6px 0px  #3C3C3C0D' : 'none',
      }
    },
  },
})
</script>
