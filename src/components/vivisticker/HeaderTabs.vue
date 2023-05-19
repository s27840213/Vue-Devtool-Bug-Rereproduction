<template lang="pug">
div(class="header-bar relative" @pointerdown.stop)
  div(class="header-bar__left" :class="{ editor: isInEditor }")
    div(v-for="tab in leftTabs"
        :key="tab.icon"
        :class="{'header-bar__feature-icon': !tab.logo, 'click-disabled': tab.disabled, 'panel-icon': tab.isPanelIcon}"
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
        :key="tab.icon"
        :class="{'header-bar__feature-icon': !tab.logo, 'click-disabled': tab.disabled, 'panel-icon': tab.isPanelIcon}"
        :style="`width: ${tab.width}px; height: ${tab.height !== undefined ? tab.height : tab.width}px`"
        @click.prevent.stop="handleTabAction(tab.action)")
      svg-icon(:iconName="tab.icon"
                :iconWidth="`${tab.width}px`"
                :iconHeight="`${tab.height !== undefined ? tab.height : tab.width}px`"
                :iconColor="tab.disabled ? 'gray-2' : 'white'")
    div(v-if="isInEditor && !editorTypeTemplate" class="header-bar__feature-icon body-XS text-black-1 btn-copy" @click.prevent.stop="handleCopy")
        svg-icon(iconName="copy"
                  iconWidth="18px"
                  iconHeight="18px"
                  iconColor="black-1")
        span {{ $t('NN0032') }}
    div(v-if="isInMyDesign && !isInEditor" class="header-bar__right-text" @click.stop.prevent="handleSelectDesign") {{ isInSelectionMode ? $t('NN0203') : $t('STK0007') }}
</template>

<script lang="ts">
import editorUtils from '@/utils/editorUtils'
import imageUtils from '@/utils/imageUtils'
import modalUtils from '@/utils/modalUtils'
import shortcutUtils from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import _ from 'lodash'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

type TabConfig = {
  icon: string,
  logo?: boolean,
  disabled?: boolean,
  width: number,
  height?: number,
  action?: () => void,
  // If isPanelIcon is true, MobilePanel v-out will not be triggered by this icon.
  isPanelIcon?: boolean
}

export default defineComponent({
  computed: {
    ...mapGetters('objects', {
      staticHeaderTab: 'headerTab'
    }),
    ...mapGetters('giphy', {
      giphyKeyword: 'keyword',
      gihpyHeaderTab: 'headerTab'
    }),
    ...mapState('background', {
      backgroundKeyword: 'keyword'
    }),
    ...mapState('textStock', {
      textKeyword: 'keyword'
    }),
    ...mapState('templates', {
      templatesIgLayout: 'igLayout'
    }),
    ...mapGetters({
      isInEditor: 'vivisticker/getIsInEditor',
      isCurrentInCategory: 'vivisticker/getIsInCategory',
      isCurrentShowAllRecently: 'vivisticker/getShowAllRecently',
      currActiveTab: 'vivisticker/getCurrActiveTab',
      isInBgShare: 'vivisticker/getIsInBgShare',
      isInGroupTemplate: 'vivisticker/getIsInGroupTemplate',
      editorType: 'vivisticker/getEditorType',
      editorTypeTextLike: 'vivisticker/getEditorTypeTextLike',
      editorTypeTemplate: 'vivisticker/getEditorTypeTemplate',
      editorBg: 'vivisticker/getEditorBg',
      isInMyDesign: 'vivisticker/getIsInMyDesign',
      isInSelectionMode: 'vivisticker/getIsInSelectionMode',
      userSettings: 'vivisticker/getUserSettings'
    }),
    templateKeyword() {
      return this.$store.state.templates[this.templatesIgLayout].keyword
    },
    stepCount(): number {
      return stepsUtils.steps.length
    },
    isInCategory(): boolean {
      return this.isCurrentInCategory(this.currActiveTab)
    },
    showAllRecently(): boolean {
      return this.isCurrentShowAllRecently(this.currActiveTab)
    },
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    leftTabs(): TabConfig[] {
      if (this.isInEditor) {
        const retTabs = []
        const stepTabs = [
          { icon: 'undo', disabled: stepsUtils.isInFirstStep || this.isCropping, width: 24, action: shortcutUtils.undo },
          { icon: 'redo', disabled: stepsUtils.isInLastStep || this.isCropping, width: 24, action: shortcutUtils.redo }
        ]
        retTabs.push({ icon: 'vivisticker_close', disabled: false, width: 24, action: this.handleEndEditing })
        if (this.stepCount > 1) retTabs.push(...stepTabs)
        return retTabs
      } else if (this.isInMyDesign) {
        return [
          { icon: 'chevron-left', width: 24, action: this.leaveMyDesign }
        ]
      } else if (this.isInBgShare) {
        return [
          { icon: 'chevron-left', width: 24, action: this.clearBgShare }
        ]
      } else if (this.isInGroupTemplate) {
        return [
          { icon: 'chevron-left', width: 24, action: () => this.setIsInGroupTemplate(false) }
        ]
      } else if (this.isInCategory) {
        return [
          { icon: 'chevron-left', width: 24, action: this.clearCategory }
        ]
      } else {
        return [
          { icon: 'vivisticker_logo', logo: true, width: 20, action: this.handleOpenIG },
          { icon: 'vivisticker_title', logo: true, width: 100, height: 18, action: this.handleOpenIG }
        ]
      }
    },
    keyword(): string {
      switch (this.currActiveTab) {
        case 'object':
          return this.staticHeaderTab.title || this.giphyKeyword
        case 'background':
          return this.backgroundKeyword
        case 'text':
          return this.textKeyword
        case 'template':
          return this.templateKeyword
      }
      return ''
    },
    centerTitle(): string {
      if (this.isInEditor) {
        return ''
      } else if (this.isInMyDesign) {
        return `${this.$t('NN0080')}`
      } else if (this.isInBgShare) {
        return `${this.$t('NN0214')}`
      } else if (this.isInCategory) {
        if (this.showAllRecently) {
          return `${this.$t('NN0024')}`
        } else {
          return this.keyword
        }
      } else {
        return ''
      }
    },
    rightTabs(): TabConfig[] {
      if (this.isInEditor) {
        if (this.editorTypeTemplate) {
          return [
            { icon: 'copy', width: 24, action: this.handleCopy },
            { icon: 'trash', width: 24, action: shortcutUtils.del },
            { icon: 'share', width: 24, action: this.handleShare },
          ]
        }
        return [
          { icon: 'bg', width: 24, action: this.handleSwitchBg },
          ...(this.editorTypeTextLike ? [{ icon: 'trash', width: 24, action: shortcutUtils.del }] : []),
        ]
      } else if (this.isInMyDesign) {
        return []
      } else if (this.isInCategory && !_.isEmpty(this.staticHeaderTab)) {
        return this.staticHeaderTab.icons
      } else if (this.isInCategory && !_.isEmpty(this.gihpyHeaderTab)) {
        return this.gihpyHeaderTab
      } else if (this.isInCategory || this.isInBgShare) {
        return []
      } else {
        return [
          ...(vivistickerUtils.checkVersion('1.13') ? [{ icon: 'folder', width: 24, action: this.handleMyDesign }] : []),
          { icon: 'more', width: 24, action: this.handleMore, isPanelIcon: true }
        ]
      }
    }
  },
  methods: {
    ...mapActions({
      resetObjectsSearch: 'objects/resetSearch',
      resetObjectsFavoritesSearch: 'objects/resetFavoritesSearch',
      resetGifCategoryContent: 'giphy/resetCategoryContent',
      resetGifTagContent: 'giphy/resetTagContent',
      resetBackgroundsSearch: 'background/resetSearch',
      resetTextsSearch: 'textStock/resetSearch',
      updateUserSettings: 'vivisticker/updateUserSettings'
    }),
    ...mapMutations({
      setIsInCategory: 'vivisticker/SET_isInCategory',
      setShowAllRecently: 'vivisticker/SET_showAllRecently',
      setIsInBgShare: 'vivisticker/SET_isInBgShare',
      setIsInGroupTemplate: 'vivisticker/SET_isInGroupTemplate',
      setShareItem: 'vivisticker/SET_shareItem',
      setShareColor: 'vivisticker/SET_shareColor',
      switchBg: 'vivisticker/UPDATE_switchBg',
      setIsInMyDesign: 'vivisticker/SET_isInMyDesign',
      setMyDesignTab: 'vivisticker/SET_myDesignTab',
      setIsInSelectionMode: 'vivisticker/SET_isInSelectionMode'
    }),
    resetTemplatesSearch(params = {}) {
      this.$store.dispatch(`templates/${this.templatesIgLayout}/resetSearch`, params)
    },
    handleTabAction(action?: () => void) {
      if (action) {
        action()
      }
    },
    clearCategory() {
      this.setIsInCategory({ tab: this.currActiveTab, bool: false })
      this.setShowAllRecently({ tab: this.currActiveTab, bool: false })
      switch (this.currActiveTab) {
        case 'object':
          this.resetObjectsSearch({ resetCategoryInfo: true })
          this.resetObjectsFavoritesSearch()
          this.resetGifCategoryContent()
          this.resetGifTagContent()
          this.setShowAllRecently({ tab: 'giphy', bool: false })
          break
        case 'background':
          this.resetBackgroundsSearch()
          break
        case 'text':
          this.resetTextsSearch()
          break
        case 'template':
          this.resetTemplatesSearch({ resetCategoryInfo: true })
      }
    },
    clearBgShare() {
      this.setIsInBgShare(false)
      this.setShareItem(undefined)
      this.setShareColor('')
    },
    handleSwitchBg() {
      this.switchBg()
      vivistickerUtils.sendToIOS('UPDATE_USER_INFO', { editorBg: this.editorBg })
    },
    handleEndEditing() {
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault()
      }
      if (vivistickerUtils.checkVersion('1.13')) {
        if (vivistickerUtils.userSettings.autoSave) {
          vivistickerUtils.saveAsMyDesign().then(() => {
            vivistickerUtils.endEditing()
          })
        } else {
          const options = {
            checkboxText: `${this.$t('STK0010')}`,
            checked: this.userSettings.autoSave,
            onCheckedChange: (checked: boolean) => {
              this.updateUserSettings({
                autoSave: checked
              })
              if (checked) {
                modalUtils.updateButton('cancel', {
                  style: {
                    color: '#9C9C9C',
                    backgroundColor: '#D9DBE1',
                    pointerEvents: 'none'
                  }
                })
              } else {
                modalUtils.updateButton('cancel', {
                  style: {
                    color: '#474A57',
                    backgroundColor: '#D9DBE1'
                  }
                })
              }
            }
          }
          modalUtils.setModalInfo(
            `${this.$t('STK0008')}`,
            `${this.$t('STK0009')}`,
            {
              msg: `${this.$t('STK0004')}`,
              action: () => {
                vivistickerUtils.saveAsMyDesign().then(() => {
                  vivistickerUtils.endEditing()
                })
              }
            },
            {
              msg: `${this.$t('STK0011')}`,
              action: () => { vivistickerUtils.endEditing() },
              style: {
                color: '#474A57',
                backgroundColor: '#D9DBE1'
              }
            },
            options)
        }
      } else {
        vivistickerUtils.endEditing()
      }
    },
    handleCopy() {
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault()
      }
      if (vivistickerUtils.checkVersion('1.3')) {
        vivistickerUtils.copyEditor((flag: string) => {
          if (flag === '1') {
            modalUtils.setModalInfo(
              `${this.$t('STK0017')}`,
              [`${this.$t('STK0018')}`],
              {
                msg: `${this.$t('STK0019')}`
              }
            )
          } else if (['object', 'objectGroup'].includes(this.editorType)) {
            vivistickerUtils.handleIos16Video()
          }
        })
      } else {
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON())
      }
    },
    handleMore() {
      editorUtils.setCurrActivePanel('vvstk-more')
      editorUtils.setShowMobilePanel(true)
    },
    handleOpenIG() {
      let url = 'https://www.instagram.com/vivisticker/'
      switch (this.$i18n.locale) {
        case 'tw':
          url = 'https://www.instagram.com/vivistickertw/'
          break
        case 'jp':
          url = 'https://www.instagram.com/vivistickerjp/'
          break
      }
      window.open(url, '_blank')
    },
    handleMyDesign() {
      if (this.currActiveTab === 'background') {
        this.setMyDesignTab('text')
      } else {
        this.setMyDesignTab(this.currActiveTab)
      }
      this.setIsInMyDesign(true)
    },
    leaveMyDesign() {
      this.setIsInMyDesign(false)
      this.setIsInSelectionMode(false)
    },
    handleSelectDesign() {
      this.setIsInSelectionMode(!this.isInSelectionMode)
    },
    handleShare() {
      if (this.editorType === 'story') {
        console.log('share IG story')
      } else if (this.editorType === 'post') {
        console.log('share IG post')
      }
    },
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
    &.btn-copy{
      display: flex;
      align-items: center;
      padding: 4px 8px;
      gap: 4px;
      background-color: white;
      border-radius: 100px;
      >svg {
        padding: 2px;
      }
      &:active {
        background-color: setColor(black-6);
      }
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
    &-text {
      color: white;
      font-weight: 600;
      font-size: 14px;
      line-height: 140%;
    }
  }
}
</style>
