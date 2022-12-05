<template lang="pug">
  div(class="footer-tabs" ref="tabs")
    div(class="footer-tabs__container" :class="{main: !isInEditor}" :style="containerStyles"  ref="container")
      template(v-for="(tab, index) in tabs")
        div(v-if="!tab.hidden"
            class="footer-tabs__item"
            :class="{'click-disabled': (tab.disabled || isLocked)}"
            @click="handleTabAction(tab)")
          svg-icon(class="click-disabled"
            :iconName="tab.icon"
            :iconColor="(tab.disabled || isLocked) ? 'gray-2' : currTab ===  tab.panelType ? 'white' :'black-4'"
            :iconWidth="'24px'")
          span(class="no-wrap click-disabled"
            :class="(tab.disabled || isLocked) ? 'text-gray-2' :(currTab ===  tab.panelType ) ? 'text-white' : 'text-black-4'") {{tab.text}}
</template>
<script lang="ts">
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import stepsUtils from '@/utils/stepsUtils'
import { ColorEventType, LayerType } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import frameUtils from '@/utils/frameUtils'
import { IFooterTab } from '@/interfaces/editor'
import groupUtils from '@/utils/groupUtils'
import pageUtils from '@/utils/pageUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import shapeUtils from '@/utils/shapeUtils'
import mappingUtils from '@/utils/mappingUtils'
import i18n from '@/i18n'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  components: {
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
      homeTabs: [
        { icon: 'objects', text: `${this.$tc('NN0003', 2)}`, panelType: 'object' },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}`, panelType: 'text' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, panelType: 'background' }
      ] as Array<IFooterTab>
    }
  },
  computed: {
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
        // { icon: 'adjust', text: `${this.$t('NN0042')}`, panelType: 'adjust' },
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
        { icon: 'adjust', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: this.isSvgImage },
        ...this.genearlLayerTabs
      ]
    },
    fontTabs(): Array<IFooterTab> {
      return [
        { icon: 'edit', text: `${this.$t('NN0504')}`, hidden: this.selectMultiple || this.hasSubSelectedLayer || this.isGroup },
        { icon: 'plus-square', text: `${this.$t('STK0006')}`, panelType: 'text' },
        { icon: 'font', text: generalUtils.capitalize(`${this.$tc('NN0353', 2)}`), panelType: 'fonts' },
        { icon: 'font-size', text: `${this.$t('NN0492')}`, panelType: 'font-size' },
        {
          icon: 'color',
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
          hidden: shapeUtils.getSingleColorObjNum === 0,
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
          hidden: shapeUtils.getDocumentColors.length === 0,
          props: {
            currColorEvent: ColorEventType.shape
          }
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object-adjust', hidden: !this.showShapeAdjust }
      ]
    },
    frameTabs(): Array<IFooterTab> {
      const currLayer = layerUtils.getCurrLayer as IFrame
      const showAdjust = currLayer.clips.some(i => !['frame', 'svg'].includes(i.srcObj.type))
      const result = [] as Array<IFooterTab>
      if (showAdjust) {
        result.push({ icon: 'adjust', text: `${this.$t('NN0042')}`, panelType: 'adjust', hidden: this.isSvgImage })
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
      if ((this.selectMultiple || this.isGroup) && this.targetIs('image') && (this.isWholeGroup || layerUtils.getCurrLayer.type === LayerType.tmp)) {
        /** tmp layer treated as group */
        return this.multiPhotoTabs
      } else if ((this.selectMultiple || this.isGroup) && this.targetIs('image') && layerUtils.subLayerIdx !== -1) {
        return this.photoInGroupTabs
      } else if ((this.selectMultiple || this.isGroup) && this.targetIs('text')) {
        return this.multiFontTabs
      } else if ((this.selectMultiple || this.isGroup) && this.targetIs('shape') && this.singleTargetType()) {
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
      return layerUtils.getTmpLayer().locked
    },
    isGroup(): boolean {
      return (layerUtils.getCurrLayer.type === LayerType.tmp || this.currSelectedInfo.types.has('group')) && this.currSelectedInfo.layers.length === 1
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer: IImage | IText | IShape | IGroup) => {
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
    containerStyles(): { [index: string]: any } {
      return {
        transform: `translate3d(0,${this.contentEditable ? 100 : 0}%,0)`,
        opacity: `${this.contentEditable ? 0 : 1}`
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
      handler() {
        if (this.disableTabScroll) {
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

            tiptapUtils.focus({ scrollIntoView: false })
          } else {
            /**
             * @Todo handle the sub controler
             */
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
            Vue.notify({ group: 'copy', text: `${i18n.t('NN0665')}` })
            return
          }
          break
        }
        case 'photo':
        case 'replace': {
          const { layerIndex, subLayerIdx } = layerUtils
          const fileInput = document.getElementById(`input-${layerIndex}-${Math.max(subLayerIdx, 0)}`) as HTMLInputElement
          vivistickerUtils.sendToIOS('CHECK_CAMERA_REQUEST', vivistickerUtils.getEmptyMessage())
          return fileInput.click()
        }
        default: {
          break
        }
      }

      if (tab.panelType !== undefined) {
        if (this.isInEditor) {
          this.$emit('switchTab', tab.panelType, tab.props)
        } else {
          this.$emit('switchMainTab', tab.panelType, tab.props)
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
    > span {
      transition: background-color 0.2s, color 0.2s;
      @include body-XXS;
      transform: scale(0.8);
      line-height: 20px;
    }
  }
}
</style>
