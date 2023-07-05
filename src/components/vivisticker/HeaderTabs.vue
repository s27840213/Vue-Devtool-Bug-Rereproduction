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
    link-or-text(:title="centerTitle" :url="isInCategory ? titleInfo.url : ''")
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
    div(v-if="isInEditor && !editorTypeTemplate" class="header-bar__feature-icon body-XS text-black-1 btn-feature" @click.prevent.stop="handleCopy")
        svg-icon(iconName="copy"
                  iconWidth="18px"
                  iconHeight="18px"
                  iconColor="black-1")
        span {{ $t('NN0032') }}
    div(v-if="inBgRemoveMode" class="header-bar__feature-icon body-XS text-black-1 btn-feature" @click.prevent.stop="handleNext")
        span(class="ml-5") {{ $t('NN0744') }}
        svg-icon(iconName="chevron-right"
                  iconWidth="18px"
                  iconHeight="18px"
                  iconColor="black-1")
    div(v-if="isInMyDesign && !isInEditor" class="header-bar__right-text" @click.stop.prevent="handleSelectDesign") {{ isInSelectionMode ? $t('NN0203') : $t('STK0007') }}
</template>

<script lang="ts">
import LinkOrText from '@/components/vivisticker/LinkOrText.vue'
import i18n from '@/i18n'
import { SrcObj } from '@/interfaces/gallery'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import assetUtils from '@/utils/assetUtils'
import backgroundUtils from '@/utils/backgroundUtils'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import editorUtils from '@/utils/editorUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import mappingUtils from '@/utils/mappingUtils'
import modalUtils from '@/utils/modalUtils'
import pageUtils from '@/utils/pageUtils'
import shortcutUtils from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { notify } from '@kyvg/vue3-notification'
import _ from 'lodash'
import { computed, defineComponent } from 'vue'
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
  setup() {
    const isInFirstStep = computed(() => stepsUtils.isInFirstStep)
    const isInLastStep = computed(() => stepsUtils.isInLastStep)
    const isSavingAsMyDesign = false
    return {
      isInFirstStep,
      isInLastStep,
      isSavingAsMyDesign
    }
  },
  components: {
    LinkOrText
  },
  computed: {
    ...mapState('templates', {
      templatesIgLayout: 'igLayout'
    }),
    ...mapGetters({
      staticHeaderTab: 'objects/headerTab',
      giphyKeyword: 'giphy/keyword',
      gihpyHeaderTab: 'giphy/headerTab',
      backgroundHeaderTab: 'background/headerTab',
      textHeaderTab: 'textStock/headerTab',
      isInEditor: 'vivisticker/getIsInEditor',
      isCurrentInCategory: 'vivisticker/getIsInCategory',
      isCurrentShowAllRecently: 'vivisticker/getShowAllRecently',
      currActiveTab: 'vivisticker/getCurrActiveTab',
      isInBgShare: 'vivisticker/getIsInBgShare',
      isInTemplateShare: 'vivisticker/getIsInTemplateShare',
      isInMultiPageShare: 'vivisticker/getIsInMultiPageShare',
      isInPagePreview: 'vivisticker/getIsInPagePreview',
      isInGroupTemplate: 'vivisticker/getIsInGroupTemplate',
      editorType: 'vivisticker/getEditorType',
      editorTypeTextLike: 'vivisticker/getEditorTypeTextLike',
      editorTypeTemplate: 'vivisticker/getEditorTypeTemplate',
      editorBg: 'vivisticker/getEditorBg',
      editingAssetInfo: 'vivisticker/getEditingAssetInfo',
      isInMyDesign: 'vivisticker/getIsInMyDesign',
      isInSelectionMode: 'vivisticker/getIsInSelectionMode',
      userSettings: 'vivisticker/getUserSettings',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      inBgRemoveFirstStep: 'bgRemove/inFirstStep',
      inBgRemoveLastStep: 'bgRemove/inLastStep',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      currSelectedInfo: 'getCurrSelectedInfo',
      isUploadingShadowImg: 'shadow/isUploading'
    }),
    templateHeaderTab() {
      return this.$store.getters[`templates/${this.$store.state.templates.igLayout}/headerTab`]
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
      if (this.isInMultiPageShare) {
        return [
          { icon: 'chevron-left', width: 24, action: () => this.setIsInMultiPageShare(false) }
        ]
      } else if (this.isInTemplateShare) {
        return [
          { icon: 'chevron-left', width: 24, action: this.clearTemplateShare }
        ]
      } else if (this.isInEditor) {
        if (this.isInPagePreview) return [{ icon: 'chevron-left', width: 24, action: () => this.setIsInPagePreview(false) }]
        const retTabs = []
        const stepTabs = [
          { icon: 'undo', disabled: stepsUtils.isInFirstStep || this.isCropping, width: 24, action: this.undo },
          { icon: 'redo', disabled: stepsUtils.isInLastStep || this.isCropping, width: 24, action: this.redo }
        ]
        retTabs.push({
          icon: 'vivisticker_close',
          disabled: false,
          width: 24,
          action: () => {
            if (this.inEffectEditingMode) {
              this.setInEffectEditingMode(false)
            }
            this.handleEndEditing()
          }
        })
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
      } else if (this.inBgRemoveMode) {
        const retTabs = []
        const stepTabs = [
          { icon: 'undo', disabled: this.inBgRemoveFirstStep || this.isCropping, width: 24, action: this.undo },
          { icon: 'redo', disabled: this.inBgRemoveLastStep || this.isCropping, width: 24, action: this.redo }
        ]
        retTabs.push({
          icon: 'vivisticker_close',
          disabled: false,
          width: 24,
          action: () => {
            bgRemoveUtils.setInBgRemoveMode(false)
            editorUtils.setCurrActivePanel('none')
            this.setInEffectEditingMode(false)
          }
        })
        retTabs.push(...stepTabs)
        return retTabs
      } else {
        return [
          { icon: 'vivisticker_logo', logo: true, width: 20, action: this.handleOpenIG },
          { icon: 'vivisticker_title', logo: true, width: 100, height: 18, action: this.handleOpenIG }
        ]
      }
    },
    titleInfo(): { title: string, url: string } {
      switch (this.currActiveTab) {
        case 'object':
          return {
            title: this.staticHeaderTab.title || this.giphyKeyword,
            url: this.staticHeaderTab.bulbUrl || ''
          }
        case 'background':
          return {
            title: this.backgroundHeaderTab.title,
            url: this.backgroundHeaderTab.bulbUrl
          }
        case 'text':
          return {
            title: this.textHeaderTab.title,
            url: this.textHeaderTab.bulbUrl
          }
        case 'template':
          return {
            title: this.templateHeaderTab.title,
            url: this.templateHeaderTab.bulbUrl
          }
      }
      return { title: '', url: '' }
    },
    centerTitle(): string {
      if (this.isInMultiPageShare) {
        return `${this.$t('NN0124')}`
      } else if (this.isInBgShare || this.isInTemplateShare) {
        return `${this.$t('NN0214')}`
      } else if (this.isInEditor) {
        if (this.isInPagePreview) return `${this.$t('STK0072')}`
        return ''
      } else if (this.isInMyDesign) {
        return `${this.$t('NN0080')}`
      } else if (this.isInCategory) {
        if (this.showAllRecently) {
          return `${this.$t('NN0024')}`
        } else {
          return this.titleInfo.title
        }
      } else {
        return ''
      }
    },
    rightTabs(): TabConfig[] {
      if (this.isInTemplateShare) {
        return []
      } else if (this.isInEditor) {
        if (this.isInPagePreview) return []
        if (this.inEffectEditingMode) {
          return [{
            icon: 'download',
            width: 24,
            action: () => {
              vivistickerUtils.saveToIOS(bgRemoveUtils.getBgRemoveResultSrc())
            }
          }]
        }
        if (this.editorTypeTemplate) {
          return [
            ...this.lockIcon,
            { icon: 'copy', width: 24, action: this.handleCopy },
            { icon: 'share', width: 24, action: this.handleShareTemplate },
          ]
        }
        return [
          { icon: 'bg', width: 24, action: this.handleSwitchBg },
        ]
      } else if (this.isInMyDesign) {
        return []
      } else if (this.isInCategory && !_.isEmpty(this.staticHeaderTab)) {
        return this.staticHeaderTab.icons
      } else if (this.isInCategory && !_.isEmpty(this.gihpyHeaderTab)) {
        return this.gihpyHeaderTab
      } else if (this.isInCategory || this.isInBgShare) {
        return []
      } else if (this.inBgRemoveMode) {
        return []
      } else {
        return [
          ...(vivistickerUtils.checkVersion('1.13') ? [{ icon: 'folder', width: 24, action: this.handleMyDesign }] : []),
          { icon: 'more', width: 24, action: this.handleMore, isPanelIcon: true }
        ]
      }
    },
    lockIcon(): TabConfig[] {
      const icon = this.isLocked ? 'lock' : 'unlock'
      if (this.inBgSettingMode || this.selectedLayerNum > 0) {
        return [{
          icon,
          width: 24,
          action: () => mappingUtils.mappingIconAction(icon)
        }]
      } else {
        return []
      }
    },
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return this.inBgSettingMode ? backgroundUtils.backgroundLocked : layerUtils.getSelectedLayer().locked
    },
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
      setIsInMultiPageShare: 'vivisticker/SET_isInMultiPageShare',
      setTemplateShareType: 'vivisticker/SET_templateShareType',
      setIsInPagePreview: 'vivisticker/SET_isInPagePreview',
      setIsInGroupTemplate: 'vivisticker/SET_isInGroupTemplate',
      setShareItem: 'vivisticker/SET_shareItem',
      setShareColor: 'vivisticker/SET_shareColor',
      switchBg: 'vivisticker/UPDATE_switchBg',
      setIsInMyDesign: 'vivisticker/SET_isInMyDesign',
      setMyDesignTab: 'vivisticker/SET_myDesignTab',
      setIsInSelectionMode: 'vivisticker/SET_isInSelectionMode',
      clearBgRemoveState: 'bgRemove/CLEAR_bgRemoveState',
      setInEffectEditingMode: 'bgRemove/SET_inEffectEditingMode',
      deletePreviewSrc: 'DELETE_previewSrc'
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
          this.resetTextsSearch({ resetCategoryInfo: true })
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
    clearTemplateShare() {
      this.setTemplateShareType('none')
    },
    handleSwitchBg() {
      this.switchBg()
      vivistickerUtils.sendToIOS('UPDATE_USER_INFO', { editorBg: this.editorBg })
    },
    handleEndEditing() {
      if (this.isUploadingShadowImg) {
        notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
        return
      }
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault()
      }
      if (bgRemoveUtils.autoRemoveResult !== null) {
        this.clearBgRemoveState()
      }
      if (vivistickerUtils.checkVersion('1.13')) {
        if (vivistickerUtils.userSettings.autoSave) {
          if (this.isSavingAsMyDesign) return
          this.isSavingAsMyDesign = true
          vivistickerUtils.saveAsMyDesign().catch((err) => {
            console.warn(err.message)
          }).finally(() => {
            vivistickerUtils.endEditing()
            this.isSavingAsMyDesign = false
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
          /**
           * @Note have not implement the save feature for bg remove result
           */
          modalUtils.setModalInfo(
            `${this.$t('STK0008')}`,
            `${this.$t('STK0009')}`,
            {
              msg: `${this.$t('STK0004')}`,
              action: () => {
                if (this.isSavingAsMyDesign) return
                this.isSavingAsMyDesign = true
                vivistickerUtils.saveAsMyDesign().catch((err) => {
                  console.warn(err.message)
                }).finally(() => {
                  vivistickerUtils.endEditing()
                  this.isSavingAsMyDesign = false
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
      if (this.isUploadingShadowImg) {
        notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
        return
      }
      if (backgroundUtils.inBgSettingMode) editorUtils.setInBgSettingMode(false)
      if (this.isBgImgCtrl) pageUtils.setBackgroundImageControlDefault()
      const copyCallback = (flag: string) => {
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
      }
      if (this.inBgRemoveMode) {
        bgRemoveUtils.screenshot()
      } else if (vivistickerUtils.checkVersion('1.31') && (this.editingAssetInfo.isFrame || this.editingAssetInfo.fit === 1)) {
        vivistickerUtils.copyWithScreenshotUrl(
          vivistickerUtils.createUrlForJSON({ source: 'editor' }),
          copyCallback
        )
      } else if (vivistickerUtils.checkVersion('1.3')) {
        vivistickerUtils.copyEditor(copyCallback)
      } else {
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON({ source: 'editor' }))
      }
    },
    async addImage(srcObj: SrcObj, aspectRatio: number) {
      assetUtils.addImage(srcObj, aspectRatio, {
        pageIndex: 0,
      })
    },
    handleNext() {
      bgRemoveUtils.setInBgRemoveMode(false)
      editorUtils.setShowMobilePanel(false)
      this.setInEffectEditingMode(true)

      vivistickerUtils.startEditing(
        'image',
        { plan: 0, assetId: '' },
        async () => {
          return await bgRemoveUtils.saveToIOS(async (data, assetId) => {
            const srcObj = {
              type: 'ios',
              userId: '',
              assetId: 'bgRemove/' + assetId,
            }
            this.addImage(srcObj, this.autoRemoveResult.width / this.autoRemoveResult.height)
            imageShadowUtils.setHandleId({
              pageId: pageUtils.currFocusPage.id,
              layerId: layerUtils.getCurrLayer.id,
              subLayerId: ''
            })
            imageShadowUtils.updateEffectProps({
              pageIndex: layerUtils.pageIndex,
              layerIndex: layerUtils.layerIndex,
              subLayerIdx: -1
            }, { isTransparent: true })
            return srcObj
          })
        },
        () => {
          // setTimeout(() => {
          imageShadowUtils.setEffect(ShadowEffectType.frame, {
            frame: {
              spread: 30,
              radius: 0,
              opacity: 100
            },
            frameColor: '#FECD56'
          })
          imageShadowPanelUtils.handleShadowUpload(undefined, true)
          //   console.warn(6000)
          // }, 6000)
        }
        // vivistickerUtils.getEmptyCallback()
      )
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
      } else if (this.currActiveTab === 'remove-bg') {
        this.setMyDesignTab('image')
      } else {
        console.log(this.currActiveTab)
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
        shortcutUtils.undo()
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
        shortcutUtils.redo()
      }
    },
    handleShareTemplate() {
      if (this.isUploadingShadowImg) {
        notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
        return
      }
      this.setTemplateShareType(this.editorType)
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
    &.btn-feature{
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
