<template lang="pug">
header-tabs(
  :rootStyles="rootStyles"
  :leftTabs="leftTabs"
  :rightTabs="rightTabs")
</template>

<script lang="ts">
import { notify } from '@kyvg/vue3-notification'
import { TabConfig } from '@nu/vivi-lib/components/editor/mobile/HeaderTab.vue'
import HeaderTabs from '@nu/vivi-lib/components/editor/mobile/HeaderTabs.vue'
import i18n from '@nu/vivi-lib/i18n'
import backgroundUtils from '@nu/vivi-lib/utils/backgroundUtils'
import bgRemoveUtils from '@nu/vivi-lib/utils/bgRemoveUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import mappingUtils from '@nu/vivi-lib/utils/mappingUtils'
import picWVUtils from '@nu/vivi-lib/utils/picWVUtils'
import shortcutUtils from '@nu/vivi-lib/utils/shortcutUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import { computed, defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  props: {
    currTab: {
      default: 'none',
      type: String,
    },
    inAllPagesMode: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['switchTab', 'showAllPages'],
  setup() {
    const isInFirstStep = computed(() => stepsUtils.isInFirstStep)
    const isInLastStep = computed(() => stepsUtils.isInLastStep)
    return {
      isInFirstStep,
      isInLastStep,
    }
  },
  components: {
    HeaderTabs,
  },
  computed: {
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currActivePanel: 'mobileEditor/getCurrActivePanel',
      isShowPagePreview: 'page/getIsShowPagePreview',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      inBgRemoveFirstStep: 'bgRemove/inFirstStep',
      inBgRemoveLastStep: 'bgRemove/inLastStep',
      isHandleShadow: 'shadow/isHandling',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      hasBleed: 'getHasBleed',
      userInfo: 'webView/getUserInfo',
      uploadingImgs: 'file/getUploadingImgs',
    }),
    rootStyles(): { [key: string]: string } {
      const basePadding = picWVUtils.inBrowserMode ? 10.7 : 8
      return {
        paddingTop: `${this.userInfo.statusBarHeight + basePadding}px`,
        paddingBottom: `${basePadding}px`,
      }
    },
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    leftTabs(): TabConfig[] {
      const retTabs = [
        { icon: 'chevron-left', width: 22, action: this.backBtnAction },
      ] as TabConfig[]
      if (!this.isShowDownloadPanel) {
        retTabs.push({
          icon: 'group',
          width: 0,
          tabs: [
            {
              icon: 'undo',
              width: 22,
              action: this.undo,
              disabled:
                (this.inBgRemoveMode ? this.inBgRemoveFirstStep : this.isInFirstStep) ||
                this.isCropping,
            },
            {
              icon: 'redo',
              width: 22,
              action: this.redo,
              disabled:
                (this.inBgRemoveMode ? this.inBgRemoveLastStep : this.isInLastStep) ||
                this.isCropping,
            },
          ],
        })
      }
      return retTabs
    },
    layerTabs(): TabConfig[] {
      return [
        this.createRightTab({ icon: 'copy', disabled: this.isLocked }),
        this.createRightTab({ icon: this.isLocked ? 'lock' : 'unlock' }),
        this.createRightTab({ icon: 'trash', disabled: this.isLocked }),
      ]
    },
    bgSettingTabs(): TabConfig[] {
      return [
        this.createRightTab({ icon: backgroundUtils.backgroundLocked ? 'lock' : 'unlock' }),
        this.createRightTab({ icon: 'trash', disabled: this.isLocked }),
      ]
    },
    rightTabs(): TabConfig[] {
      if (this.inBgRemoveMode) {
        return []
      } else if (this.isShowDownloadPanel) {
        return [this.createRightTab({ icon: 'home' })]
      } else if (this.selectedLayerNum > 0) {
        return this.layerTabs
      } else if (this.inBgSettingMode) {
        return this.bgSettingTabs
      } else {
        return [
          this.createRightTab({ icon: 'bleed', isPanelIcon: true, isHidden: !this.hasBleed }),
          this.createRightTab({ icon: 'resize', isPanelIcon: true }),
          this.createRightTab({
            icon: 'all-pages',
            isActive: (icon: string) => this.inAllPagesMode,
          }),
          this.createRightTab({
            icon: 'download',
            isPanelIcon: true,
            disabled: (this.uploadingImgs as unknown[]).length > 0,
          }),
          this.createRightTab({ icon: 'more', isPanelIcon: true }),
        ] as TabConfig[]
      }
    },
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return this.inBgSettingMode
        ? backgroundUtils.backgroundLocked
        : layerUtils.getSelectedLayer().locked
    },
    isShowDownloadPanel(): boolean {
      return this.currActivePanel === 'download'
    },
  },
  methods: {
    createRightTab(configs: Pick<TabConfig, 'icon'> & Partial<TabConfig>): TabConfig {
      return Object.assign(
        {
          width: 22,
          isActive: this.isTabActive,
          color: { active: 'blue-1' },
          action: () => {
            this.handleIconAction(configs.icon)
          },
        },
        configs,
      )
    },
    isTabActive(icon: string): boolean {
      return this.currTab === icon
    },
    goHome() {
      this.$router.push({ name: 'Home' })
    },
    backBtnAction() {
      if (this.inBgRemoveMode) {
        bgRemoveUtils.setInBgRemoveMode(false)
        this.$emit('switchTab', 'none')
      } else if (this.inAllPagesMode) {
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
          shortcutUtils.duplicate()
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
          repeat: false,
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
          repeat: false,
        })
        window.dispatchEvent(event)
      } else {
        shortcutUtils.redo()
      }
    },
  },
})
</script>
