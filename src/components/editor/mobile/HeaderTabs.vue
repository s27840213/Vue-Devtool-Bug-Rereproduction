<template lang="pug">
  div(class="header-bar" @pointerdown.stop)
    div(class="header-bar__left")
      div(class="header-bar__feature-icon mr-25"
          @pointerdown="backBtnAction()")
        svg-icon(
          :iconName="'chevron-left'"
          :iconColor="'white'"
          :iconWidth="'24px'")
      div(class="header-bar__feature-icon mr-20"
          :class="{'click-disabled': stepsUtils.isInFirstStep || isCropping}"
          @pointerdown="undo()")
        svg-icon(:iconName="'undo'"
          :iconColor="(!stepsUtils.isInFirstStep && !isCropping) ? 'white' : 'gray-2'"
          :iconWidth="'24px'")
      div(class="header-bar__feature-icon"
          :class="{'click-disabled': stepsUtils.isInLastStep || isCropping}"
          @pointerdown="redo()")
        svg-icon(:iconName="'redo'"
          :iconColor="(!stepsUtils.isInLastStep && !isCropping) ? 'white' : 'gray-2'"
          :iconWidth="'24px'")
    div(class="header-bar__right")
      div(v-for="tab in rightTabs" class="header-bar__feature-icon"
          :class="{'click-disabled': ((tab.disabled || isLocked) && tab.icon !== 'lock')}"
          @pointerdown="handleIconAction(tab.icon)")
        svg-icon(
          :iconName="tab.icon"
          :iconColor="iconColor(tab)"
          :iconWidth="'24px'")
</template>
<script lang="ts">
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import mappingUtils from '@/utils/mappingUtils'
import stepsUtils from '@/utils/stepsUtils'
import shotcutUtils from '@/utils/shortcutUtils'
import i18n from '@/i18n'
import backgroundUtils from '@/utils/backgroundUtils'
import imageUtils from '@/utils/imageUtils'

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
      required: true
    }
  },
  data() {
    return {
      homeTabs: [
        { icon: 'resize' },
        { icon: 'all-pages' },
        { icon: 'download' },
        { icon: 'more' }
      ],
      stepsUtils
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
      InBgRemoveLastStep: 'bgRemove/inLastStep',
      isHandleShadow: 'shadow/isHandling',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode'
    }),
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    stepCount(): number {
      return stepsUtils.steps.length
    },
    layerTabs(): Array<{ icon: string, disabled?: boolean }> {
      return [
        { icon: 'copy' },
        { icon: this.isLocked ? 'lock' : 'unlock' },
        { icon: 'trash' }
      ]
    },
    bgSettingTabs(): Array<{ icon: string, disabled?: boolean }> {
      return [
        { icon: backgroundUtils.backgroundLocked ? 'lock' : 'unlock' },
        { icon: 'trash' }
      ]
    },
    rightTabs(): Array<{ icon: string, disabled?: boolean }> {
      if (this.selectedLayerNum > 0) {
        return this.layerTabs
      } else if (this.inBgSettingMode) {
        return this.bgSettingTabs
      } else {
        return this.homeTabs
      }
    },
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return this.inBgSettingMode ? backgroundUtils.backgroundLocked : layerUtils.getTmpLayer().locked
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
    iconColor(tab: { icon: string, disabled: boolean }): string {
      if (tab.icon === 'all-pages') {
        return this.inAllPagesMode ? 'blue-1' : 'white'
      }
      return ((tab.disabled || this.isLocked) && tab.icon !== 'lock') ? 'gray-2' : this.currTab === tab.icon ? 'blue-1' : 'white'
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
    },
    goHome() {
      this.$router.push({ name: 'Home' })
    },
    backBtnAction() {
      if (this.inAllPagesMode) {
        this.$emit('showAllPages')
      } else {
        this.goHome()
      }
    },
    handleIconAction(icon: string) {
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault()
      }

      switch (icon) {
        case 'download': {
          if (!this.isHandleShadow) {
            this.$emit('switchTab', icon)
          } else {
            Vue.notify({ group: 'copy', text: `${i18n.t('NN0665')}` })
          }
          break
        }
        case 'more': {
          this.$emit('switchTab', icon)
          break
        }
        case 'all-pages': {
          this.$emit('showAllPages')
          break
        }
        case 'resize': {
          this.$emit('switchTab', icon)
          break
        }
        case 'copy': {
          shotcutUtils.duplicate()
          break
        }
        default: {
          mappingUtils.mappingIconAction(icon)
          break
        }
      }
    },
    undo() {
      if (this.inBgRemoveMode) {
        // BgRemoveArea will listen to Ctrl/Cmd + Z event, so I dispatch an event to make the undo function in BgRemoveArea.vue conducted
        const event = new KeyboardEvent('keydown', {
          ctrlKey: true,
          metaKey: true,
          shiftKey: false,
          key: 'z',
          repeat: false
        })
        window.dispatchEvent(event)
      } else {
        shotcutUtils.undo()
      }
    },
    redo() {
      if (this.inBgRemoveMode) {
        const event = new KeyboardEvent('keydown', {
          ctrlKey: true,
          metaKey: true,
          shiftKey: true,
          key: 'z',
          repeat: false
        })
        window.dispatchEvent(event)
      } else {
        shotcutUtils.redo()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.header-bar {
  @include size(100%);
  background-color: setColor(nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  box-sizing: border-box;
  z-index: setZindex("editor-header");

  &__feature-icon {
    width: 22px;
    height: 22px;
    transition: background-color 0.1s;
    padding: 2px;
    border-radius: 3px;
    &:active {
      background-color: setColor(gray-2);
    }
  }

  &__left {
    display: flex;
  }
  &__right {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: auto;
    grid-auto-columns: auto;
    column-gap: 20px;
  }
}
</style>
