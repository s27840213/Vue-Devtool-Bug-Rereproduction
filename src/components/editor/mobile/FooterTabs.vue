<template lang="pug">
  div(class="footer-tabs" ref="tabs")
    div(class="footer-tabs__container" :style="containerStyles")
      template(v-for="(tab, index) in tabs")
        div(v-if="!tab.disabled"
            class="footer-tabs__item"
            :class="{'click-disabled': (tab.disabled || isLocked)}"
            @click="handleTabAction(tab)")
          svg-icon(class="mb-5"
            :iconName="tab.icon"
            :iconColor="(tab.disabled || isLocked) ? 'gray-2' : currTab ===  tab.panelType ? 'blue-1' :'white'"
            :iconWidth="'24px'")
          span(class="text-body-4 no-wrap"
          :class="(tab.disabled || isLocked) ? 'text-gray-2' :(currTab ===  tab.panelType ) ? 'text-blue-1' : 'text-white'") {{tab.text}}
</template>
<script lang="ts">
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import stepsUtils from '@/utils/stepsUtils'
import { ColorEventType, LayerType } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import frameUtils from '@/utils/frameUtils'
import { IFooterTab } from '@/interfaces/editor'
import groupUtils from '@/utils/groupUtils'
import pageUtils from '@/utils/pageUtils'
import tiptapUtils from '@/utils/tiptapUtils'

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
    const mainMenu = { icon: 'main-menu', text: `${this.$t('NN0489')}` }

    return {
      isFontsPanelOpened: false,
      homeTabs: [
        { icon: 'template', text: `${this.$tc('NN0001', 2)}`, panelType: 'template' },
        { icon: 'photo', text: `${this.$tc('NN0002', 2)}`, panelType: 'photo' },
        { icon: 'shape', text: `${this.$tc('NN0003', 2)}`, panelType: 'object' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, panelType: 'background' },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}`, panelType: 'text' },
        { icon: 'upload', text: `${this.$tc('NN0006', 2)}`, panelType: 'file' },
        { panelType: 'brand', text: `${this.$t('NN0007')}`, disabled: true }
      ] as Array<IFooterTab>,
      photoTabs: [
        mainMenu,
        { icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'photo', disabled: true },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        { icon: 'removed-bg', text: `${this.$t('NN0043')}`, panelType: 'background', disabled: true },
        { icon: 'effect', text: `${this.$t('NN0491')}`, panelType: 'object', disabled: true }
        // { icon: 'copy-style', text: `${this.$t('NN0035')}`, panelType: 'text', disabled: true }
      ] as Array<IFooterTab>,
      fontTabs: [
        mainMenu,
        { icon: 'edit', text: `${this.$t('NN0504')}` },
        { icon: 'font', text: `${this.$t('NN0353')}`, panelType: 'fonts' },
        { icon: 'font-size', text: `${this.$t('NN0492')}`, panelType: 'font-size' },
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          props: {
            currColorEvent: ColorEventType.text
          }
        },
        { icon: 'spacing', text: `${this.$t('NN0109')}`, panelType: 'font-spacing' },
        { icon: 'text-format', text: `${this.$t('NN0498')}`, panelType: 'font-format' },
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip' },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        { icon: 'effect', text: `${this.$t('NN0491')}`, panelType: 'text-effect' },
        { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order' },
        { icon: 'ungroup', text: `${this.$t('NN0212')}`, panelType: 'background', disabled: true }
        // { icon: 'copy-style', text: `${this.$t('NN0035')}`, panelType: 'text', disabled: true }
      ] as Array<IFooterTab>,
      objectTabs: [
        mainMenu,
        {
          icon: 'color',
          text: `${this.$t('NN0495')}`,
          panelType: 'color',
          props: {
            currColorEvent: ColorEventType.shape
          }
        },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object', disabled: true },
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip' },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order' }
      ] as Array<IFooterTab>,
      pageTabs: [
        mainMenu,
        { icon: 'add-page', text: `${this.$t('NN0139')}` },
        { icon: 'duplicate-page', text: `${this.$t('NN0140')}` },
        // { icon: 'select-page', text: `${this.$tc('NN0124', 2)}` },
        { icon: 'trash', text: `${this.$t('NN0141')}` }
        // { icon: 'adjust-order', text: `${this.$t('NN0030')}`, panelType: 'opacity' }
      ] as Array<IFooterTab>
    }
  },
  computed: {
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      isShowPagePreview: 'page/getIsShowPagePreview',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      InBgRemoveFirstStep: 'bgRemove/inFirstStep',
      InBgRemoveLastStep: 'bgRemove/inLastStep'
    }),
    genearlLayerTabs(): Array<IFooterTab> {
      return [
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip' },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object', disabled: true },
        { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'order' },
        { icon: this.isGroup ? 'ungroup' : 'group', text: this.isGroup ? `${this.$t('NN0212')}` : `${this.$t('NN0029')}`, disabled: !this.isGroup && this.selectedLayerNum === 1 }
      ]
    },
    tabs(): Array<IFooterTab> {
      if (this.inAllPagesMode) {
        return this.pageTabs
      } else if (this.showPhotoTabs) {
        // this.$emit('switchTab', 'none')
        return this.photoTabs.concat(this.genearlLayerTabs)
      } else if (this.showFontTabs) {
        // this.$emit('switchTab', 'none')
        return this.fontTabs.concat(this.genearlLayerTabs)
      } else if (this.showShapeSetting) {
        return this.objectTabs.concat(this.genearlLayerTabs)
      } else {
        return this.homeTabs
      }
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
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer: IImage | IText | IShape | IGroup, index: number) => {
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
    isFrameImage(): boolean {
      const { layers, types } = this.currSelectedInfo
      const frameLayer = layers[0] as IFrame
      return layers.length === 1 && types.has('frame') && frameLayer.clips[0].srcObj.assetId
    },
    isSubLayerFrameImage(): boolean {
      const { index } = this.currSubSelectedInfo
      const { clips, type } = this.currSelectedInfo.layers[0].layers[index]
      return type === 'frame' && clips[0].srcObj.assetId
    },
    showPhotoTabs(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.targetIs('image') && this.singleTargetType()
    },
    showFontTabs(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.targetIs('text') && this.singleTargetType()
    },
    showShapeSetting(): boolean {
      const { getCurrConfig } = layerUtils
      const stateCondition = !this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked
      const typeConditon = (this.targetIs('shape') && this.singleTargetType()) || getCurrConfig.type === LayerType.frame
      return stateCondition && typeConditon
    },
    isSuperUser(): boolean {
      return generalUtils.isSuperUser
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
    }
  },
  watch: {
    selectedLayerNum(newVal) {
      if (newVal === 0) {
        this.$emit('switchTab', 'none')
      }
    },
    tabs() {
      const tabs = this.$refs.tabs as HTMLElement
      tabs.scrollTo(0, 0)
    },
    contentEditable(newVal) {
      if (newVal) {
        this.$emit('switchTab', 'none')
      }
    }
  },
  methods: {
    ...mapMutations({
      _addPage: 'ADD_page',
      _addPageToPos: 'ADD_pageToPos',
      _deletePage: 'DELETE_page',
      _setmiddlemostPageIndex: 'SET_middlemostPageIndex',
      _setCurrActivePageIndex: 'SET_currActivePageIndex',
      _setIsDragged: 'page/SET_IsDragged',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview'
    }),
    handleTabAction(tab: IFooterTab) {
      switch (tab.icon) {
        case 'crop': {
          if (this.isCropping) {
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
        case 'main-menu': {
          groupUtils.deselect()
          this.$emit('switchTab', 'none')
          if (this.inAllPagesMode) {
            this.$emit('showAllPages')
          }
          break
        }
        case 'add-page': {
          const { width, height } = pageUtils.getPageSize(pageUtils.currActivePageIndex)
          pageUtils.addPageToPos(pageUtils.newPage({ width, height }), pageUtils.currActivePageIndex + 1)
          stepsUtils.record()
          break
        }
        case 'duplicate-page': {
          const { width, height } = pageUtils.getPageSize(pageUtils.currActivePageIndex)
          pageUtils.addPageToPos(pageUtils.newPage({ width, height }), pageUtils.currActivePageIndex + 1)
          groupUtils.deselect()
          this._setCurrActivePageIndex(pageUtils.currActivePageIndex + 1)
          stepsUtils.record()
          break
        }
        case 'trash': {
          groupUtils.deselect()
          this._deletePage(pageUtils.currActivePageIndex)
          stepsUtils.record()
          break
        }
        case 'text-format': {
          tiptapUtils.agent(editor => editor.commands.selectAll())
          break
        }
        case 'edit': {
          const { index, pageIndex } = layerUtils.currSelectedInfo

          layerUtils.updateLayerProps(pageIndex, index, {
            contentEditable: true
          })
          break
        }
        default: {
          break
        }
      }

      if (tab.panelType !== undefined) {
        this.$emit('switchTab', tab.panelType, tab.props)
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
          return this.isFrameImage
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
  background-color: setColor(gray-5);
  &__container {
    overflow: scroll;
    display: grid;
    grid-template-rows: auto;
    grid-auto-flow: column;
    grid-auto-columns: 60px;
    column-gap: 32px;
    background-color: setColor(nav);
    padding: 8px 12px;
    @include no-scrollbar;
    transition: transform 0.3s, opacity 0.4s;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0px 4px;
    > span {
      transform: scale(0.833);
    }
  }
}
</style>
