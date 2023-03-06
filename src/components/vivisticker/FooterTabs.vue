<template lang="pug">
div(class="footer-tabs" ref="tabs")
  div(class="footer-tabs__container" :class="{main: !isInEditor}" :style="containerStyles"
      @scroll.passive="updateContainerOverflow" ref="container")
    template(v-for="(tab, index) in tabs")
      div(v-if="!tab.hidden" :key="tab.icon"
          class="footer-tabs__item"
          :class="{'click-disabled': (tab.disabled || isLocked)}"
          @click="handleTabAction(tab)")
        color-btn(v-if="tab.icon === 'color'" size="22px"
                  class="click-disabled"
                  :color="globalSelectedColor")
        svg-icon(v-else class="click-disabled"
          :iconName="tab.icon"
          :iconColor="(tab.disabled || isLocked) ? 'gray-2' : tabActive(tab) ? 'white' :'black-4'"
          :iconWidth="'24px'"
          :style="textIconStyle")
        span(class="no-wrap click-disabled"
          :class="(tab.disabled || isLocked) ? 'text-gray-2' : tabActive(tab) ? 'text-white' : 'text-black-4'") {{tab.text}}
</template>
<script lang="ts">
import ColorBtn from '@/components/global/ColorBtn.vue'
import i18n from '@/i18n'
import { IFooterTab } from '@/interfaces/editor'
import { IFrame, IGroup, IImage, ILayer, IShape } from '@/interfaces/layer'
import { ColorEventType, LayerType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import eventUtils from '@/utils/eventUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import mappingUtils from '@/utils/mappingUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { notify } from '@kyvg/vue3-notification'
import { isEqual, startCase } from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  components: {
    ColorBtn
  },
  props: {
    currTab: {
      default: 'none',
      type: String
    },
    inAllPagesMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    // const mainMenu = { icon: 'main-menu', text: `${this.$t('NN0489')}` }

    return {
      isFontsPanelOpened: false,
      disableTabScroll: false,
      leftOverflow: false,
      rightOverflow: false,
      homeTabs: [
        { icon: 'objects', text: `${this.$tc('NN0003', 2)}`, panelType: 'object' },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}`, panelType: 'text' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, panelType: 'background' }
      ] as Array<IFooterTab>
    }
  },
  computed: {
    ...mapState({
      isTablet: 'isTablet'
    }),
    ...mapState('mobileEditor', { mobilePanel: 'currActivePanel' }),
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      InBgRemoveFirstStep: 'bgRemove/inFirstStep',
      InBgRemoveLastStep: 'bgRemove/inLastStep',
      isHandleShadow: 'shadow/isHandling',
      isInEditor: 'vivisticker/getIsInEditor',
      editorType: 'vivisticker/getEditorType',
      editorTypeTextLike: 'vivisticker/getEditorTypeTextLike',
      isInMyDesign: 'vivisticker/getIsInMyDesign',
      controllerHidden: 'vivisticker/getControllerHidden'
    }),
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
    },
    groupTab(): IFooterTab {
      return { icon: this.isGroup ? 'ungroup' : 'group', text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`, hidden: !this.isGroup && this.selectedLayerNum === 1 }
    },
    photoInGroupTabs(): Array<IFooterTab> {
      return [
        { icon: 'photo', text: `${this.$t('NN0490')}`, panelType: 'replace', hidden: this.isInFrame },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        // { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
        // { icon: 'effect', text: `${this.$t('NN0429')}`, panelType: 'photo-shadow', hidden: this.isInFrame },
        ...this.genearlLayerTabs
        // ...this.genearlLayerTabs,
        // { icon: 'bg-separate', text: `${this.$t('NN0707')}`, hidden: this.isInFrame }
      ]
    },
    photoTabs(): Array<IFooterTab> {
      return [
        { icon: 'photo', text: `${this.$t('NN0490')}`, panelType: 'replace', hidden: this.isSvgImage },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop', hidden: this.isSvgImage },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: this.isSvgImage },
        ...this.genearlLayerTabs
      ]
    },
    fontTabs(): Array<IFooterTab> {
      return [
        { icon: 'edit', text: `${this.$t('NN0504')}`, hidden: this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer) },
        { icon: 'plus-square', text: `${this.$t('STK0006')}`, panelType: 'text' },
        { icon: 'font', text: generalUtils.capitalize(`${this.$tc('NN0353', 2)}`), panelType: 'fonts' },
        { icon: 'font-size', text: `${this.$t('NN0492')}`, panelType: 'font-size' },
        {
          icon: 'text-color-mobile',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          props: {
            currColorEvent: ColorEventType.text
          }
        },
        { icon: 'effect', text: `${this.$t('NN0491')}`, panelType: 'text-effect' },
        { icon: 'spacing', text: `${this.$t('NN0755')}`, panelType: 'font-spacing' },
        { icon: 'text-format', text: `${this.$t('NN0498')}`, panelType: 'font-format' }
      ]
    },
    multiPhotoTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs
      ]
    },
    multiFontTabs(): Array<IFooterTab> {
      return [
        ...this.multiGeneralTabs,
        ...this.fontTabs
      ]
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
            currColorEvent: ColorEventType.shape
          }
        }
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
            currColorEvent: ColorEventType.shape
          }
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object-adjust', hidden: !this.showShapeAdjust }
      ]
    },
    frameTabs(): Array<IFooterTab> {
      const currLayer = layerUtils.getCurrLayer
      if (currLayer.type !== 'frame') return []
      const showAdjust = currLayer.clips.some(i => !['frame', 'svg'].includes(i.srcObj.type))
      const result = [] as Array<IFooterTab>
      if (showAdjust) {
        result.push({ icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: this.isSvgImage })
      }
      return result
    },
    showEmptyFrameTabs(): boolean {
      const currLayer = layerUtils.getCurrLayer as IFrame
      return !this.controllerHidden && this.editorType === 'object' && currLayer.type === LayerType.frame &&
        currLayer.clips.some(i => i.active && i.srcObj.type === 'frame')
    },
    emptyFrameTabs(): Array<IFooterTab> {
      return [{ icon: 'photo', text: `${this.$t('NN0490')}`, panelType: 'replace' }] as Array<IFooterTab>
    },
    genearlLayerTabs(): Array<IFooterTab> {
      // return [
      //   { icon: this.isGroup ? 'ungroup' : 'group', text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`, disabled: !this.isGroup && this.selectedLayerNum === 1 },
      //   { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
      //   { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip', disabled: this.currSelectedInfo.types.has(LayerType.frame) },
      //   { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
      //   { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object', hidden: true },
      //   { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order' }
      // ]
      return [
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' }
      ]
    },
    multiGeneralTabs(): Array<IFooterTab> {
      return [
        this.groupTab,
        // { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        // { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order', hidden: this.hasSubSelectedLayer },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' }
      ]
    },
    tabs(): Array<IFooterTab> {
      const { subLayerIdx, getCurrLayer: currLayer } = layerUtils
      const { controllerHidden } = this
      let targetType = ''
      if (subLayerIdx !== -1) {
        // targetType = currLayer.type === LayerType.group ? (currLayer as IGroup).layers[subLayerIdx] : (currLayer as IFrame).clips[subLayerIdx]
        if (currLayer.type === LayerType.group && (currLayer as IGroup).layers[subLayerIdx].type === LayerType.image) {
          targetType = LayerType.image
        }
        if (currLayer.type === LayerType.frame && (currLayer as IFrame).clips[subLayerIdx].srcObj.type !== 'frame') {
          targetType = LayerType.image
        }
      }
      if (this.isGroupOrTmp && this.targetIs('image') && (this.isWholeGroup || layerUtils.getCurrLayer.type === LayerType.tmp)) {
        /** tmp layer treated as group */
        return this.multiPhotoTabs
      } else if (this.isGroupOrTmp && this.targetIs('image') && layerUtils.subLayerIdx !== -1) {
        return this.photoInGroupTabs
      // text + shape color
      } else if (this.isGroupOrTmp && this.targetIs('text') && this.showObjectColorAndFontTabs) {
        return [...this.multiObjectTabs, ...this.fontTabs]
      } else if (this.isGroupOrTmp && this.targetIs('text')) {
        return this.multiFontTabs
      } else if (this.isGroupOrTmp && this.targetIs('shape') && this.singleTargetType()) {
        return this.multiObjectTabs
      } else if ((this.selectMultiple || (this.isGroup && !this.hasSubSelectedLayer)) && !this.singleTargetType()) {
        return this.multiGeneralTabs
      } else if (this.showFrame) {
        return [...this.frameTabs, ...this.genearlLayerTabs]
      } else if (this.showEmptyFrameTabs) {
        return this.emptyFrameTabs
      } else if ((this.showPhotoTabs || targetType === LayerType.image) && !controllerHidden) {
        return this.photoTabs
      } else if (this.showFontTabs) {
        return [...this.fontTabs, ...this.genearlLayerTabs]
      } else if (this.showShapeSetting) {
        return this.objectTabs.concat(this.genearlLayerTabs)
      } else if (this.showGeneralTabs) {
        return [...this.genearlLayerTabs]
      } else if (!this.isInEditor) {
        return this.homeTabs
      } else if (this.editorTypeTextLike) {
        return [{ icon: 'plus-square', text: `${this.$t('STK0006')}`, panelType: 'text' }]
      } else {
        return []
      }
    },
    globalSelectedColor(): string {
      return colorUtils.globalSelectedColor.color
    },
    textIconStyle(): Record<string, string> {
      const textColor = colorUtils.globalSelectedColor.textColor
      return textColor === 'multi' ? {
        '--multi-text-color': '1' // For svg icon 'text-color-mobile.svg' rect fill multi-color
      } : {
        '--multi-text-color': '0',
        '--text-color': textColor // For svg icon 'text-color-mobile.svg' rect fill color
      }
    },
    isWholeGroup(): boolean {
      /**
       * Select whole group and no sub-layer selected
       */
      return this.isGroup && this.groupTypes.size === 1 && layerUtils.subLayerIdx === -1
    },
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return layerUtils.getSelectedLayer().locked
    },
    isGroup(): boolean {
      return layerUtils.getCurrLayer.type === LayerType.group
    },
    isGroupOrTmp(): boolean {
      return (layerUtils.getCurrLayer.type === LayerType.tmp ||
      layerUtils.getCurrLayer.type === LayerType.group)
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer) => {
        return layer.type
      })
      return new Set(types)
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    isInFirstStep(): boolean {
      return stepsUtils.isInFirstStep
    },
    isInLastStep(): boolean {
      return stepsUtils.isInLastStep
    },
    isInFrame(): boolean {
      const layer = layerUtils.getCurrLayer
      return layer.type === LayerType.frame && (layer as IFrame).clips[0].srcObj.assetId !== ''
    },
    isFrameImg(): boolean {
      return layerUtils.getCurrLayer.type === LayerType.frame && ((layerUtils.getCurrConfig as IImage).isFrameImg ?? false)
    },
    isSubLayerFrameImage(): boolean {
      const { index } = this.currSubSelectedInfo
      const { clips, type } = this.currSelectedInfo.layers[0].layers[index]
      return type === 'frame' && clips[0].srcObj.assetId
    },
    isSvgImage(): boolean {
      const layer = layerUtils.getCurrLayer
      const subLayerIdx = layerUtils.subLayerIdx
      if (subLayerIdx === -1) {
        return layer.type === LayerType.image && (layer as IImage).srcObj.type === 'svg'
      } else {
        const layers = (layer as IGroup).layers
        if (!layers) return false
        const subLayer = layers[subLayerIdx]
        return subLayer.type === LayerType.image && (subLayer as IImage).srcObj.type === 'svg'
      }
    },
    showPhotoTabs(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.targetIs('image') && this.singleTargetType()
    },
    showObjectColorAndFontTabs(): boolean {
      const { subLayerIdx } = layerUtils
      const currLayer = layerUtils.getCurrLayer
      if (!(currLayer.type === 'group' || currLayer.type === 'tmp') || subLayerIdx !== -1) return false
      const singleColorShapes = currLayer.layers.filter(l => l.type === 'shape' && l.color.length === 1) as IShape[]
      const multiColorShapes = currLayer.layers.filter(l => l.type === 'shape' && l.color.length !== 1) as IShape[]
      const hasImages = (currLayer.layers.filter(l => l.type === 'image') as IImage[]).length !== 0
      if (hasImages || (singleColorShapes.length === 0 && multiColorShapes.length !== 1)) return false
      else return true
    },
    showFontTabs(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.targetIs('text') && this.singleTargetType()
    },
    showGeneralTabs(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.selectedLayerNum !== 0
    },
    showSingleFrameTabs(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.selectedLayerNum !== 0 && layerUtils.getCurrLayer.type === LayerType.frame &&
        (layerUtils.getCurrLayer as IFrame).clips.length === 1
    },
    showFrame(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.selectedLayerNum !== 0 && this.editorType === 'object' && layerUtils.getCurrLayer.type === LayerType.frame &&
        (layerUtils.subLayerIdx === -1 || this.controllerHidden)
    },
    showShapeSetting(): boolean {
      const { getCurrConfig } = layerUtils
      const stateCondition = !this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked
      const typeConditon = (this.targetIs('shape') && this.singleTargetType()) ||
        (getCurrConfig.type === LayerType.frame && (getCurrConfig as IFrame).clips.length !== 1)
      return stateCondition && typeConditon
    },
    layerType(): { [key: string]: string } {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      return {
        currLayerType: currLayer.type,
        targetLayerType: (() => {
          if (subLayerIdx !== -1) {
            return currLayer.type === LayerType.group
              ? (currLayer as IGroup).layers[subLayerIdx].type : LayerType.image
          }
          return currLayer.type
        })()
      }
    },
    contentEditable(): boolean {
      return this.currSelectedInfo.layers[0]?.contentEditable
    },
    containerStyles(): { [index: string]: string } {
      // Use mask-image implement fade scroll style, support Safari 14.3, https://stackoverflow.com/a/70971847
      return {
        transform: `translate(0,${this.contentEditable ? 100 : 0}%)`,
        opacity: `${this.contentEditable ? 0 : 1}`,
        maskImage: this.contentEditable ? 'none'
          : `linear-gradient(to right, 
          transparent 0, black ${this.leftOverflow ? '56px' : 0}, 
          black calc(100% - ${this.rightOverflow ? '56px' : '0px'}), transparent 100%)`,
        ...(this.isTablet && this.isInEditor && { height: '80px', justifyContent: 'center' })
      }
    },
    currLayer(): ILayer {
      return layerUtils.getCurrLayer
    },
    isLine(): boolean {
      return this.currLayer.type === 'shape' && this.currLayer.category === 'D'
    },
    isBasicShape(): boolean {
      return this.currLayer.type === 'shape' && this.currLayer.category === 'E'
    },
    showShapeAdjust(): boolean {
      return this.isLine || this.isBasicShape
    },
    selectMultiple(): boolean {
      return this.selectedLayerNum > 1
    }
  },
  watch: {
    selectedLayerNum(newVal) {
      if (newVal === 0) {
        this.$emit('switchTab', 'none')
      }
    },
    tabs: {
      handler(newVal, oldVal) {
        if (this.disableTabScroll || isEqual(newVal, oldVal)) {
          this.disableTabScroll = false
          return
        }
        const container = this.$refs.container as HTMLElement
        container.scrollTo(0, 0)
      },
      deep: true
    },
    contentEditable(newVal) {
      if (newVal) {
        this.$emit('switchTab', 'none')
      }
    }
  },
  methods: {
    updateContainerOverflow() {
      const { scrollLeft, scrollWidth, offsetWidth } = this.$refs.container as HTMLElement
      this.leftOverflow = scrollLeft > 0
      this.rightOverflow = scrollLeft + 0.5 < (scrollWidth - offsetWidth) && scrollWidth > offsetWidth
    },
    handleTabAction(tab: IFooterTab) {
      if (tab.icon !== 'crop') {
        if (this.isCropping) {
          imageUtils.setImgControlDefault()
        }
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
                  layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true })
                  break
                case 'frame':
                  index = (layerUtils.getCurrLayer as IFrame).clips.findIndex(l => l.type === 'image' && l.active)
                  if (index >= 0) {
                    frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, index, { imgControl: true })
                  }
                  break
                case 'group':
                  if (layerUtils.getCurrConfig.type === LayerType.image) {
                    layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true }, layerUtils.subLayerIdx)
                  }
                  break
              }
            }
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
        case 'main-menu': {
          groupUtils.deselect()
          this.$emit('switchTab', 'none')
          break
        }
        case 'text-format': {
          if (!this.selectMultiple && !this.isGroup) {
            tiptapUtils.agent(editor => editor.commands.selectAll())
          }
          break
        }
        case 'edit': {
          const { index, pageIndex } = layerUtils.currSelectedInfo
          const { getCurrLayer: currLayer } = layerUtils

          if (!this.hasSubSelectedLayer) {
            if (currLayer.type === 'text') {
              layerUtils.updateLayerProps(pageIndex, index, {
                contentEditable: true
              })
            }
            this.$nextTick(() => {
              tiptapUtils.focus({ scrollIntoView: false }, currLayer.isEdited ? 'end' : null)
            })
          } else {
            const { subLayerIdx } = layerUtils
            const subLayer = (currLayer as IGroup).layers[subLayerIdx]
            if (subLayer.type === 'text') {
              layerUtils.updateLayerProps(pageIndex, index, {
                contentEditable: true
              }, subLayerIdx)
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
        case 'effect': {
          if (this.isHandleShadow && this.mobilePanel !== 'photo-shadow') {
            notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
            return
          }
          break
        }
        case 'photo':
        case 'replace': {
          const { pageIndex, layerIndex, subLayerIdx = 0 } = layerUtils
          vivistickerUtils.getIosImg()
            .then(async (images: Array<string>) => {
              const { imgX, imgY, imgWidth, imgHeight } = await imageUtils
                .getClipImgDimension((layerUtils.getCurrLayer as IFrame).clips[subLayerIdx], imageUtils.getSrc({
                  type: 'ios',
                  assetId: images[0],
                  userId: ''
                }))
              frameUtils.updateFrameLayerStyles(pageIndex, layerIndex, subLayerIdx, {
                imgWidth,
                imgHeight,
                imgX,
                imgY
              })
              frameUtils.updateFrameClipSrc(pageIndex, layerIndex, subLayerIdx, {
                type: 'ios',
                assetId: images[0],
                userId: ''
              })
              stepsUtils.record()
            })
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

      if (tab.panelType !== undefined) {
        if (this.isInEditor) {
          this.$emit('switchTab', tab.panelType, tab.props)
        } else {
          this.$emit('switchMainTab', tab.panelType, tab.props)
          if (this.currTab === tab.panelType) {
            eventUtils.emit(`scrollPanel${startCase(this.currTab)}ToTop`)
          }
        }
      }
    },
    targetIs(type: string): boolean {
      if (this.isGroup) {
        if (this.hasSubSelectedLayer) {
          return this.subLayerType === type
        } else {
          return this.groupTypes.has(type)
        }
      } else {
        if (this.currSelectedInfo.types.has('frame') && type === 'image') {
          return this.isInFrame
        }
        return this.currSelectedInfo.types.has(type)
      }
    },
    singleTargetType(): boolean {
      if (this.isGroup) {
        if (this.hasSubSelectedLayer) {
          return true
        } else {
          return this.groupTypes.size === 1
        }
      } else {
        return this.currSelectedInfo.types.size === 1
      }
    },
    tabActive(tab: IFooterTab): boolean {
      if (this.currTab === 'color') {
        return this.currTab === tab.panelType &&
          ((colorUtils.currEvent === 'setTextColor' && tab.icon === 'text-color-mobile') ||
          (colorUtils.currEvent !== 'setTextColor' && tab.icon === 'color'))
      } else return this.currTab === tab.panelType
    }
  }
})
</script>

<style lang="scss" scoped>
.footer-tabs {
  overflow: hidden;
  background-color: setColor(black-1);
  &__container {
    height: 57px;
    overflow: scroll;
    display: grid;
    grid-template-rows: auto;
    grid-auto-flow: column;
    grid-auto-columns: 62px;
    background-color: setColor(black-1);
    padding: 0 12px;
    @include no-scrollbar;
    transition: transform 0.3s, opacity 0.4s;
    &.main {
      overflow: hidden;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      align-items: center;
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0px 4px;
    & .color-btn {
      margin: 1px;
    }
    > span {
      transition: background-color 0.2s, color 0.2s;
      @include body-XXS;
      transform: scale(0.8);
      line-height: 20px;
    }
  }
}
</style>
