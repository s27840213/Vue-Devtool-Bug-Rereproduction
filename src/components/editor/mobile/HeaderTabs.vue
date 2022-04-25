<template lang="pug">
  div(class="header-bar")
    svg-icon(class="header-bar__feature-icon"
      :iconName="'chevron-left'"
      :iconColor="'white'"
      :iconWidth="'20px'"
      @click.native="goHome()")
    div(class="header-bar__right")
      svg-icon(v-for="tab in rightTabs" class="header-bar__feature-icon"
        :class="{'click-disabled': ((tab.disabled || isLocked) && tab.icon !== 'lock')}"
        :iconName="tab.icon"
        :iconColor="((tab.disabled || isLocked) && tab.icon !== 'lock') ? 'gray-2' : currTab ===  tab.icon ? 'blue-1' :'white'"
        :iconWidth="'20px'"
        @click.native="handleIconAction(tab.icon)")
</template>
<script lang="ts">
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import mappingUtils from '@/utils/mappingUtils'

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
    return {
      homeTabs: [
        { icon: 'resize', disabled: true },
        { icon: 'all-pages', disabled: true },
        { icon: 'download' },
        { icon: 'more' }
      ]
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
    layerTabs(): Array<{ icon: string, disabled?: boolean }> {
      return [
        { icon: 'copy' },
        { icon: this.isLocked ? 'lock' : 'unlock' },
        { icon: 'trash' }
      ]
    },
    rightTabs(): Array<{ icon: string, disabled?: boolean }> {
      if (this.selectedLayerNum > 0) {
        return this.layerTabs
      } else {
        return this.homeTabs
      }
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
    showPhotoTabs(): boolean {
      return !this.inBgRemoveMode && !this.isLocked &&
        this.targetIs('image') && this.singleTargetType()
    },
    showFontTabs(): boolean {
      return !this.inBgRemoveMode && !this.isLocked &&
        this.targetIs('text') && this.singleTargetType()
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
    isFrameImage(): boolean {
      const { layers, types } = this.currSelectedInfo
      const frameLayer = layers[0] as IFrame
      return layers.length === 1 && types.has('frame') && frameLayer.clips[0].srcObj.assetId
    }
  },
  methods: {
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
    },
    goHome() {
      this.$router.push({ name: 'Home' })
    },
    handleIconAction(icon: string) {
      switch (icon) {
        case 'download':
        case 'more': {
          this.$emit('switchTab', icon)
          break
        }
        default: {
          mappingUtils.mappingIconAction(icon)
          break
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.header-bar {
  @include size(100%, 40px);
  background-color: setColor(nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 16px;
  box-sizing: border-box;

  &__right {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: auto;
    grid-auto-columns: auto;
    column-gap: 24px;
  }
}
</style>
