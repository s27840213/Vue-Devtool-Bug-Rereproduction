<template lang="pug">
  div(class="vivisticker" :style="copyingStyles()")
    div(class="vivisticker__top" :style="topStyles()")
      header-tabs(v-show="currActivePanel !== 'text'" :style="headerStyles()")
      div(class="vivisticker__content"
          @pointerdown="outerClick")
        vvstk-editor(v-show="isInEditor")
        main-menu(v-show="!isInEditor" @openColorPicker="handleOpenColorPicker")
      transition(name="panel-up")
        mobile-panel(v-show="showMobilePanel"
          :currActivePanel="currActivePanel"
          :currColorEvent="currColorEvent"
          @switchTab="switchTab")
    footer-tabs(v-if="!isInBgShare" class="vivisticker__bottom"
      @switchTab="switchTab"
      @switchMainTab="switchMainTab"
      :currTab="isInEditor ? currActivePanel : currActiveTab"
      :inAllPagesMode="false")
    tutorial(v-if="showTutorial")
</template>

<script lang="ts">
import Vue from 'vue'
import MainMenu from '@/components/vivisticker/MainMenu.vue'
import VvstkEditor from '@/components/vivisticker/VvstkEditor.vue'
import MobilePanel from '@/components/vivisticker/MobilePanel.vue'
import HeaderTabs from '@/components/vivisticker/HeaderTabs.vue'
import FooterTabs from '@/components/vivisticker/FooterTabs.vue'
import Tutorial from '@/components/vivisticker/Tutorial.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import stepsUtils from '@/utils/stepsUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import { IFooterTabProps } from '@/interfaces/editor'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import editorUtils from '@/utils/editorUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import textUtils from '@/utils/textUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { CustomWindow } from '@/interfaces/customWindow'
import { ColorEventType } from '@/store/types'

declare let window: CustomWindow

export default Vue.extend({
  name: 'ViviSticker',
  components: {
    MainMenu,
    VvstkEditor,
    MobilePanel,
    HeaderTabs,
    FooterTabs,
    Tutorial
  },
  data() {
    return {
      currColorEvent: '',
      defaultWindowHeight: window.innerHeight,
      headerOffset: 0
    }
  },
  created() {
    eventUtils.on(PanelEvent.switchTab, this.switchTab)
    textUtils.loadDefaultFonts()
    window.updateInfoDone = vivistickerUtils.updateInfoDone
    window.listAssetResult = vivistickerUtils.listAssetResult
    window.copyDone = vivistickerUtils.copyDone
    window.getStateResult = vivistickerUtils.getStateResult
    if (this.userInfo.isFirstOpen) {
      this.setShowTutorial(true)
    }
    vivistickerUtils.getState('objects')
  },
  mounted() {
    /**
     * @Note the codes below is used to prevent the zoom in/out effect of mobile phone, especially for the "IOS"
     * Remember to set passive to "false", or the preventDefault() function won't work.
     * check the blog below to see some method to prevent this error
     * https://medium.com/@littleDog/%E5%A6%82%E4%BD%95%E8%A7%A3%E6%B1%BA-user-scalable-no-%E5%B1%AC%E6%80%A7%E8%A2%ABios-safari-ignore-e6a0531050ba
     */

    if (!this.userInfo.isFirstOpen) {
      vivistickerUtils.sendAppLoaded()
    }

    stepsUtils.MAX_STORAGE_COUNT = 15
    document.addEventListener('touchstart', (event: TouchEvent) => {
      /**
       * @param nearHrEdge - is used to prevnt the IOS navagation gesture, this is just a workaround
       */
      const nearHrEdge = (event as TouchEvent).touches[0].clientX <= 5 || (event as TouchEvent).touches[0].clientX > window.innerWidth - 5

      if (event.touches.length > 1 || nearHrEdge) {
        event.preventDefault()
      }
    }, { passive: false })

    let lastTouchEnd = 0
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)
    window.visualViewport.addEventListener('resize', this.handleResize)
  },
  destroyed() {
    window.visualViewport.removeEventListener('resize', this.handleResize)
  },
  computed: {
    ...mapState('mobileEditor', {
      closeMobilePanelFlag: 'closeMobilePanelFlag',
      mobilePanel: 'currActivePanel'
    }),
    ...mapGetters({
      groupId: 'getGroupId',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currPanel: 'getCurrSidebarPanelType',
      groupType: 'getGroupType',
      isSidebarPanelOpen: 'getMobileSidebarPanelOpen',
      currActivePanel: 'mobileEditor/getCurrActivePanel',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
      currActiveTab: 'vivisticker/getCurrActiveTab',
      isInEditor: 'vivisticker/getIsInEditor',
      isInBgShare: 'vivisticker/getIsInBgShare',
      showTutorial: 'vivisticker/getShowTutorial',
      userInfo: 'vivisticker/getUserInfo',
      isDuringCopy: 'vivisticker/getIsDuringCopy'
    }),
    isLocked(): boolean {
      return layerUtils.getTmpLayer().locked
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer: IImage | IText | IShape | IGroup) => {
        return layer.type
      })
      return new Set(types)
    },
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    showTextSetting(): boolean {
      return this.isGroup ? (
        this.hasSubSelectedLayer ? (
          this.subLayerType === 'text' && !this.isLocked
        ) : (this.groupTypes.has('text') && !this.isLocked)
      ) : (this.currSelectedInfo.types.has('text'))
    },
    contentEditable(): boolean {
      return this.currSelectedInfo.layers[0]?.contentEditable
    }
  },
  watch: {
    closeMobilePanelFlag(newVal) {
      if (newVal) {
        this.setCurrActivePanel('none')
        this.setCurrActiveSubPanel('none')
        this.setCloseMobilePanelFlag(false)
        editorUtils.setShowMobilePanel(false)
      }
    },
    mobilePanel(newVal, oldVal) {
      if (oldVal === 'photo-shadow') {
        imageShadowPanelUtils.handleShadowUpload()
      }
    }
  },
  methods: {
    ...mapMutations({
      setMobileSidebarPanelOpen: 'SET_mobileSidebarPanelOpen',
      setCloseMobilePanelFlag: 'mobileEditor/SET_closeMobilePanelFlag',
      setCurrActivePanel: 'mobileEditor/SET_currActivePanel',
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel',
      setCurrActiveTab: 'vivisticker/SET_currActiveTab',
      setShowTutorial: 'vivisticker/SET_showTutorial'
    }),
    headerStyles() {
      return {
        transform: `translateY(${this.contentEditable ? this.headerOffset : 0}px)`
      }
    },
    copyingStyles() {
      return this.isDuringCopy ? { background: 'transparent' } : {}
    },
    topStyles() {
      return {
        ...this.isDuringCopy ? { background: 'transparent' } : {},
        gridTemplateRows: this.currActivePanel === 'text' ? '1fr auto' : 'auto 1fr auto'
      }
    },
    handleSwitchTab(panelType: string, props?: IFooterTabProps) {
      if (this.isInEditor) {
        this.switchTab(panelType, props)
      } else {
        this.switchMainTab(panelType)
      }
    },
    switchTab(panelType: string, props?: IFooterTabProps) {
      if (this.currActivePanel === panelType || panelType === 'none') {
        editorUtils.setShowMobilePanel(false)
        this.setCurrActivePanel('none')
      } else {
        editorUtils.setShowMobilePanel(true)
        this.setCurrActivePanel(panelType)
        if (props) {
          if (panelType === 'color' && props.currColorEvent) {
            this.currColorEvent = props.currColorEvent
          }
        }
      }
    },
    handleOpenColorPicker() {
      editorUtils.setShowMobilePanel(true)
      this.setCurrActivePanel('color-picker')
      this.currColorEvent = ColorEventType.background
    },
    switchMainTab(panelType: string) {
      this.setCurrActiveTab(panelType)
    },
    outerClick() {
      if (this.isInEditor) {
        vivistickerUtils.deselect()
      }
    },
    handleResize() {
      this.headerOffset = this.defaultWindowHeight - window.innerHeight - 1
    }
  }
})
</script>

<style lang="scss" scoped>
.vivisticker {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: 1fr;
  overflow: hidden;
  background-color: setColor(black-2);

  &__top {
    height: 100%;
    width: 100%;
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr;
    background-color: setColor(black-2);
  }
  &__bottom {
    z-index: setZindex("footer");
    background-color: setColor(black-2);
  }

  &__content {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
    z-index: setZindex("editor-view");
  }
}

.header-bar {
  transition: 0.2s ease;
}
</style>
