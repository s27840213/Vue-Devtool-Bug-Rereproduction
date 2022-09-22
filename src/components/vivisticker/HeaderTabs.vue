<template lang="pug">
  div(class="header-bar relative" @pointerdown.stop)
    div(class="header-bar__left" :class="{ editor: isInEditor }")
      div(v-for="tab in leftTabs"
          :class="{'header-bar__feature-icon': !tab.logo, 'click-disabled': tab.disabled}"
          :style="`width: ${tab.width}px; height: ${tab.height !== undefined ? tab.height : tab.width}px`"
          @click.prevent.stop="handleTabAction(tab.action)")
        svg-icon(:iconName="tab.icon"
                  :iconWidth="`${tab.width}px`"
                  :iconHeight="`${tab.height !== undefined ? tab.height : tab.width}px`"
                  :iconColor="tab.disabled ? 'gray-2' : 'white'")
    div(class="header-bar__center")
      span(v-if="centerTitle") {{ centerTitle }}
    div(class="header-bar__right")
      div(v-for="tab in rightTabs"
          :class="{'header-bar__feature-icon': !tab.logo, 'click-disabled': tab.disabled}"
          :style="`width: ${tab.width}px; height: ${tab.height !== undefined ? tab.height : tab.width}px`"
          @click.prevent.stop="handleTabAction(tab.action)")
        svg-icon(:iconName="tab.icon"
                  :iconWidth="`${tab.width}px`"
                  :iconHeight="`${tab.height !== undefined ? tab.height : tab.width}px`"
                  :iconColor="tab.disabled ? 'gray-2' : 'white'")
</template>
<script lang="ts">
import editorUtils from '@/utils/editorUtils'
import imageUtils from '@/utils/imageUtils'
import shortcutUtils from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

type TabConfig = {
  icon: string,
  logo?: boolean,
  disabled?: boolean,
  width: number,
  height?: number,
  action?: () => void
}

export default Vue.extend({
  data() {
    return {
      stepCount: stepsUtils.steps.length,
      stepsUtils
    }
  },
  watch: {
    'stepsUtils.steps': {
      handler(newVal) {
        this.stepCount = newVal.length
      },
      deep: true
    }
  },
  computed: {
    ...mapState('objects', {
      objectsKeyword: 'keyword'
    }),
    ...mapState('background', {
      backgroundKeyword: 'keyword'
    }),
    ...mapState('textStock', {
      textKeyword: 'keyword'
    }),
    ...mapGetters({
      isInEditor: 'vivisticker/getIsInEditor',
      isCurrentInCategory: 'vivisticker/getIsInCategory',
      currActiveTab: 'vivisticker/getCurrActiveTab',
      isInBgShare: 'vivisticker/getIsInBgShare',
      editorType: 'vivisticker/getEditorType'
    }),
    isInCategory(): boolean {
      return this.isCurrentInCategory(this.currActiveTab)
    },
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    leftTabs(): TabConfig[] {
      if (this.isInEditor) {
        return this.stepCount > 1 ? [
          { icon: 'undo', disabled: stepsUtils.isInFirstStep || this.isCropping, width: 24, action: shortcutUtils.undo },
          { icon: 'redo', disabled: stepsUtils.isInLastStep || this.isCropping, width: 24, action: shortcutUtils.redo }
        ] : []
      } else if (this.isInBgShare) {
        return [
          { icon: 'chevron-left', width: 24, action: this.clearBgShare }
        ]
      } else if (this.isInCategory) {
        return [
          { icon: 'chevron-left', width: 24, action: this.clearCategory }
        ]
      } else {
        return [
          { icon: 'vivisticker_logo', logo: true, width: 20 },
          { icon: 'vivisticker_title', logo: true, width: 100, height: 18 }
        ]
      }
    },
    keyword(): string {
      switch (this.currActiveTab) {
        case 'object':
          return this.objectsKeyword
        case 'background':
          return this.backgroundKeyword
        case 'text':
          return this.textKeyword
      }
      return ''
    },
    centerTitle(): string {
      if (this.isInEditor) {
        return ''
      } else if (this.isInBgShare) {
        return `${this.$t('NN0214')}`
      } else if (this.isInCategory) {
        return this.keyword
      } else {
        return ''
      }
    },
    rightTabs(): TabConfig[] {
      if (this.isInEditor) {
        return [
          { icon: 'bg', width: 24, action: this.handleSwitchBg },
          ...(this.editorType === 'text' ? [{ icon: 'trash', width: 24, action: shortcutUtils.del }] : []),
          { icon: 'copy', width: 24, action: this.handleCopy },
          { icon: 'vivisticker_close', width: 24, action: this.handleEndEditing }
        ]
      } else if (this.isInCategory || this.isInBgShare) {
        return []
      } else {
        return [
          { icon: 'more', width: 24, action: this.handleMore }
        ]
      }
    }
  },
  methods: {
    ...mapActions({
      resetObjects: 'objects/resetContent',
      refetchObjects: 'objects/getRecAndCate',
      resetBackgrounds: 'background/resetContent',
      refetchBackgrounds: 'background/getRecAndCate',
      resetTexts: 'textStock/resetContent',
      refetchTexts: 'textStock/getRecAndCate',
      refetchTextContent: 'textStock/getContent'
    }),
    ...mapMutations({
      setIsInCategory: 'vivisticker/SET_isInCategory',
      setIsInBgShare: 'vivisticker/SET_isInBgShare',
      setShareItem: 'vivisticker/SET_shareItem',
      setShareColor: 'vivisticker/SET_shareColor',
      switchBg: 'vivisticker/UPDATE_switchBg'
    }),
    handleTabAction(action?: () => void) {
      if (action) {
        action()
      }
    },
    clearCategory() {
      this.setIsInCategory({ tab: this.currActiveTab, bool: false })
      switch (this.currActiveTab) {
        case 'object':
          this.resetObjects()
          this.refetchObjects('objects')
          break
        case 'background':
          this.resetBackgrounds()
          this.refetchBackgrounds('background')
          break
        case 'text':
          this.resetTexts()
          this.refetchTexts('textStock')
          this.refetchTextContent()
      }
    },
    clearBgShare() {
      this.setIsInBgShare(false)
      this.setShareItem(undefined)
      this.setShareColor('')
    },
    handleSwitchBg() {
      this.switchBg()
    },
    handleEndEditing() {
      vivistickerUtils.endEditing()
    },
    handleCopy() {
      vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON())
    },
    handleMore() {
      editorUtils.setCurrActivePanel('vvstk-more')
      editorUtils.setShowMobilePanel(true)
    }
  }
})
</script>

<style lang="scss" scoped>
.header-bar {
  @include size(100%, 44px);
  background-color: setColor(black-1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 24px;
  box-sizing: border-box;
  z-index: setZindex("editor-header");

  &__feature-icon {
    transition: background-color 0.1s;
    padding: 4px;
    border-radius: 3px;
    &:active {
      background-color: setColor(gray-2);
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    &.editor {
      gap: 24px;
    }
    & > div {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 600;
    font-size: 18px;
    line-height: 140%;
    color: white;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
}
</style>
