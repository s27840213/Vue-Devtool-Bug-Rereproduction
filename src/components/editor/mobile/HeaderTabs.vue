<template lang="pug">
div(class="header-bar" :style="rootStyles" @pointerdown.stop)
  div(class="header-bar__left")
    div(class="header-bar__feature-icon mr-20"
        @pointerdown="backBtnAction()")
      svg-icon(
        :iconName="'chevron-left'"
        :iconColor="'white'"
        :iconWidth="'22px'")
    template(v-if="!isShowDownloadPanel")
      div(class="header-bar__feature-icon mr-15"
          :class="{'click-disabled': isInFirstStep || isCropping}"
          @pointerdown="undo()")
        svg-icon(:iconName="'undo'"
          :iconColor="(!isInFirstStep && !isCropping) ? 'white' : 'gray-2'"
          :iconWidth="'22px'")
      div(class="header-bar__feature-icon"
          :class="{'click-disabled': isInLastStep || isCropping}"
          @pointerdown="redo()")
        svg-icon(:iconName="'redo'"
          :iconColor="(!isInLastStep && !isCropping) ? 'white' : 'gray-2'"
          :iconWidth="'22px'")
  div(class="header-bar__right")
    div(v-for="tab in rightTabs")
      div(v-if="!tab.isHidden" class="header-bar__feature-icon" :class="{'click-disabled': (isLocked && tab.icon !== 'lock'), 'panel-icon': tab.isPanelIcon }"
        @pointerdown="handleIconAction(tab.icon)")
        svg-icon(
          :iconName="tab.icon"
          :iconColor="iconColor(tab)"
          :iconWidth="'22px'")
</template>

<script lang="ts">
import i18n from '@/i18n'
import { IFrame, IGroup } from '@/interfaces/layer'
import backgroundUtils from '@/utils/backgroundUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import mappingUtils from '@/utils/mappingUtils'
import webViewUtils from '@/utils/picWVUtils'
import shotcutUtils from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import { notify } from '@kyvg/vue3-notification'
import { computed, defineComponent } from 'vue'
import { mapGetters } from 'vuex'

interface IIcon {
  icon: string,
  // If isPanelIcon is true, MobilePanel v-out will not be triggered by this icon.
  isPanelIcon?: boolean,
  isHidden?: boolean
}

export default defineComponent({
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
  emits: ['switchTab', 'showAllPages'],
  setup() {
    const isInFirstStep = computed(() => stepsUtils.isInFirstStep)
    const isInLastStep = computed(() => stepsUtils.isInLastStep)
    return {
      isInFirstStep,
      isInLastStep
    }
  },
  data() {
    return {
      homeTabs: [
        { icon: 'bleed', isPanelIcon: true },
        { icon: 'resize', isPanelIcon: true },
        { icon: 'all-pages' },
        { icon: 'download', isPanelIcon: true },
        { icon: 'more', isPanelIcon: true }
      ] as IIcon[],
      stepsUtils
    }
  },
  computed: {
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currActivePanel: 'mobileEditor/getCurrActivePanel',
      isShowPagePreview: 'page/getIsShowPagePreview',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      InBgRemoveFirstStep: 'bgRemove/inFirstStep',
      InBgRemoveLastStep: 'bgRemove/inLastStep',
      isHandleShadow: 'shadow/isHandling',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      hasBleed: 'getHasBleed',
      userInfo: webViewUtils.appendModuleName('getUserInfo')
    }),
    rootStyles(): {[key: string]: string} {
      return {
        paddingTop: `${this.userInfo.statusBarHeight + 8}px`
      }
    },
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    layerTabs(): IIcon[] {
      return [
        { icon: 'copy' },
        { icon: this.isLocked ? 'lock' : 'unlock' },
        { icon: 'trash' }
      ]
    },
    bgSettingTabs(): IIcon[] {
      return [
        { icon: backgroundUtils.backgroundLocked ? 'lock' : 'unlock' },
        { icon: 'trash' }
      ]
    },
    rightTabs(): IIcon[] {
      if (this.inBgRemoveMode) {
        return []
      } else if (this.isShowDownloadPanel) {
        return [{ icon: 'home' }]
      } else if (this.selectedLayerNum > 0) {
        return this.layerTabs
      } else if (this.inBgSettingMode) {
        return this.bgSettingTabs
      } else {
        return this.homeTabs.map(tab => {
          if (tab.icon === 'bleed') tab.isHidden = !this.hasBleed
          return tab
        })
      }
    },
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return this.inBgSettingMode ? backgroundUtils.backgroundLocked : layerUtils.getSelectedLayer().locked
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
    isFrameImage(): boolean {
      const { layers, types } = this.currSelectedInfo
      const frameLayer = layers[0] as IFrame
      return layers.length === 1 && types.has('frame') && frameLayer.clips[0].srcObj.assetId
    },
    isShowDownloadPanel(): boolean {
      return this.currActivePanel === 'download'
    }
  },
  methods: {
    iconColor(tab: IIcon): string {
      if (tab.icon === 'all-pages') {
        return this.inAllPagesMode ? 'blue-1' : 'white'
      }
      return (this.isLocked && tab.icon !== 'lock') ? 'gray-2' : this.currTab === tab.icon ? 'blue-1' : 'white'
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
      } else if (this.isShowDownloadPanel) {
        this.$emit('switchTab', 'none')
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
            notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
          }
          break
        }
        case 'home': {
          this.goHome()
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
        case 'bleed': {
          this.$emit('switchTab', icon)
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
  z-index: setZindex("header");
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;

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
    column-gap: 12px;
  }
}
</style>
