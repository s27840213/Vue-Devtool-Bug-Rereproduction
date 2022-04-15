<template lang="pug">
  div(class="footer-tabs")
    div(class="footer-tabs__item" v-for="(tab, index) in tabs"
        @click="handleTabAction(tab)")
      svg-icon(class="mb-5"
        :iconName="tab.icon"
        :iconColor="currTab ===  tab.panelType ? 'blue-1' :'white'"
        :iconWidth="'20px'")
      span(class="text-body-4 no-wrap"
      :class="(currTab ===  tab.panelType ) ? 'text-blue-1' : 'text-white'") {{tab.text}}
</template>
<script lang="ts">
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import stepsUtils from '@/utils/stepsUtils'
import { LayerType } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import frameUtils from '@/utils/frameUtils'
import { IFooterTab } from '@/interfaces/editor'
import groupUtils from '@/utils/groupUtils'

export default Vue.extend({
  components: {
  },
  props: {
    currTab: {
      default: 'none',
      type: String
    }
  },
  data() {
    const mainMenu = { icon: 'main-menu', text: `${this.$t('NN0489')}` }

    return {
      isFontsPanelOpened: false,
      homeTabs: [
        { icon: 'template', text: `${this.$t('NN0001')}`, panelType: 'template' },
        { icon: 'photo', text: `${this.$t('NN0002')}`, panelType: 'photo' },
        { icon: 'shape', text: `${this.$t('NN0003')}`, panelType: 'object' },
        { icon: 'bg', text: `${this.$t('NN0004')}`, panelType: 'background' },
        { icon: 'text', text: `${this.$t('NN0005')}`, panelType: 'text' },
        { icon: 'upload', text: `${this.$t('NN0006')}`, panelType: 'file' }
        // { panelType: 'brand', text: `${this.$t('NN0007')}` }
      ] as Array<IFooterTab>,
      photoTabs: [
        mainMenu,
        { icon: 'replace', text: `${this.$t('NN0490')}`, panelType: 'photo' },
        { icon: 'crop', text: `${this.$t('NN0036')}`, panelType: 'crop' },
        { icon: 'removed-bg', text: `${this.$t('NN0043')}`, panelType: 'background' },
        { icon: 'position', text: `${this.$tc('NN0044', 2)}`, panelType: 'position' },
        { icon: 'flip', text: `${this.$t('NN0038')}`, panelType: 'flip' },
        { icon: 'transparency', text: `${this.$t('NN0030')}`, panelType: 'opacity' },
        { icon: 'effect', text: `${this.$t('NN0491')}`, panelType: 'object' },
        { icon: 'sliders', text: `${this.$t('NN0042')}`, panelType: 'object' },
        { icon: 'layers-alt', text: `${this.$t('NN0031')}`, panelType: 'photo' },
        { icon: 'ungroup', text: `${this.$t('NN0212')}`, panelType: 'background' },
        { icon: 'copy-style', text: `${this.$t('NN0035')}`, panelType: 'text' }
      ] as Array<IFooterTab>,
      fontTabs: [
        mainMenu,
        { icon: 'font', text: `${this.$t('NN0353')}`, panelType: 'photo' }
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
    tabs(): Array<IFooterTab> {
      if (this.showPhotoTabs) {
        // this.$emit('switchTab', 'none')
        return this.photoTabs
      } else if (this.showFontTabs) {
        // this.$emit('switchTab', 'none')
        return this.fontTabs
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
    }
  },
  watch: {
    selectedLayerNum(newVal) {
      if (newVal === 0) {
        this.$emit('switchTab', 'none')
      }
    }
  },
  methods: {
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
          break
        }
        default: {
          break
        }
      }

      if (tab.panelType !== undefined) {
        this.$emit('switchTab', tab.panelType)
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
  overflow: scroll;
  display: grid;
  grid-template-rows: auto;
  grid-auto-flow: column;
  grid-auto-columns: 60px;
  column-gap: 32px;

  background-color: setColor(nav);
  padding: 8px 12px;
  @include no-scrollbar;

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
