<template lang="pug">
div(class="vivisticker" :style="copyingStyles()")
  div(class="vivisticker__top" :style="topStyles()")
    header-tabs(v-show="currActivePanel !== 'text'" :style="headerStyles()")
    div(class="vivisticker__content"
        @pointerdown="outerClick")
      my-design(v-show="isInMyDesign && !isInEditor")
      vvstk-editor(v-show="isInEditor")
      main-menu(v-show="!isInEditor && !isInMyDesign" @openColorPicker="handleOpenColorPicker")
    transition(name="panel-up")
      mobile-panel(v-show="showMobilePanel"
        :currActivePanel="currActivePanel"
        :currPage="currPage"
        @switchTab="switchTab")
  footer-tabs(v-if="!isInBgShare" class="vivisticker__bottom"
    @switchTab="switchTab"
    @switchMainTab="switchMainTab"
    :currTab="isInEditor ? currActivePanel : (isInMyDesign ? 'none' : currActiveTab)"
    :inAllPagesMode="false")
  transition(name="slide-left")
    component(v-if="isSlideShown" :is="slideType" class="vivisticker__slide")
  tutorial(v-if="showTutorial")
  full-page(v-if="fullPageType !== 'none'" class="vivisticker__full-page")
</template>

<script lang="ts">
import FooterTabs from '@/components/vivisticker/FooterTabs.vue'
import FullPage from '@/components/vivisticker/FullPage.vue'
import HeaderTabs from '@/components/vivisticker/HeaderTabs.vue'
import MainMenu from '@/components/vivisticker/MainMenu.vue'
import MobilePanel from '@/components/vivisticker/MobilePanel.vue'
import MyDesign from '@/components/vivisticker/MyDesign.vue'
import SlideUserSettings from '@/components/vivisticker/slide/SlideUserSettings.vue'
import Tutorial from '@/components/vivisticker/Tutorial.vue'
import VvstkEditor from '@/components/vivisticker/VvstkEditor.vue'
import { CustomWindow } from '@/interfaces/customWindow'
import { IFooterTabProps } from '@/interfaces/editor'
import { IPage } from '@/interfaces/page'
import { ColorEventType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import modalUtils from '@/utils/modalUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import textUtils from '@/utils/textUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

declare let window: CustomWindow

export default defineComponent({
  name: 'ViviSticker',
  components: {
    MainMenu,
    VvstkEditor,
    MyDesign,
    MobilePanel,
    HeaderTabs,
    FooterTabs,
    Tutorial,
    FullPage,
    SlideUserSettings
  },
  data() {
    return {
      currColorEvent: '',
      defaultWindowHeight: window.outerHeight,
      headerOffset: 0
    }
  },
  created() {
    eventUtils.on(PanelEvent.switchTab, this.switchTab)
    textUtils.loadDefaultFonts()
    vivistickerUtils.registerCallbacks('vvstk')
    if (this.userInfo.isFirstOpen) {
      this.setShowTutorial(true)
    }
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
      const nearHrEdge = (event as TouchEvent).touches[0].clientX <= 5 || (event as TouchEvent).touches[0].clientX > window.outerWidth - 5

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
    window.visualViewport && window.visualViewport.addEventListener('resize', this.handleResize)

    // parse modal info
    const exp = !vivistickerUtils.checkVersion(this.modalInfo.ver_min || '0') ? 'exp_' : ''
    let locale = this.userInfo.locale
    if (!['us', 'tw', 'jp'].includes(locale)) {
      locale = 'us'
    }
    const prefix = exp + locale + '_'
    const modalInfo = Object.fromEntries(Object.entries(this.modalInfo).map(
      ([k, v]) => {
        if (k.startsWith(prefix)) k = k.replace(prefix, '')
        return [k, v as string]
      })
    )

    // show popup
    const btn_txt = modalInfo.btn_txt
    if (btn_txt) {
      const options = {
        imgSrc: modalInfo.img_url,
        noClose: !!exp,
        noCloseIcon: true,
        backdropStyle: {
          backgroundColor: 'rgba(24,25,31,0.3)'
        },
        cardStyle: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255,255,255,0.9)'
        }
      }
      modalUtils.setModalInfo(
        modalInfo.title,
        modalInfo.msg,
        {
          msg: btn_txt,
          class: 'btn-black-mid',
          style: {
            color: '#F8F8F8'
          },
          action: () => {
            const url = modalInfo.btn_url
            if (url) { window.open(url, '_blank') }
          }
        },
        {
          msg: modalInfo.btn2_txt || '',
          class: 'btn-light-mid',
          style: {
            border: 'none',
            color: '#474A57',
            backgroundColor: '#D3D3D3'
          }
        },
        options
      )
    }
  },
  unmounted() {
    window.visualViewport && window.visualViewport.removeEventListener('resize', this.handleResize)
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
      getPage: 'getPage',
      currActivePanel: 'mobileEditor/getCurrActivePanel',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
      currActiveTab: 'vivisticker/getCurrActiveTab',
      isInEditor: 'vivisticker/getIsInEditor',
      isInBgShare: 'vivisticker/getIsInBgShare',
      showTutorial: 'vivisticker/getShowTutorial',
      fullPageType: 'vivisticker/getFullPageType',
      userInfo: 'vivisticker/getUserInfo',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      isInMyDesign: 'vivisticker/getIsInMyDesign',
      slideType: 'vivisticker/getSlideType',
      isSlideShown: 'vivisticker/getIsSlideShown',
      modalInfo: 'vivisticker/getModalInfo'
    }),
    contentEditable(): boolean {
      return this.currSelectedInfo.layers[0]?.contentEditable
    },
    currPage(): IPage {
      return this.getPage(pageUtils.currFocusPageIndex)
    }
  },
  watch: {
    closeMobilePanelFlag(newVal) {
      if (newVal) {
        editorUtils.setCurrActivePanel('none')
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
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel',
      setCurrActiveTab: 'vivisticker/SET_currActiveTab',
      setShowTutorial: 'vivisticker/SET_showTutorial',
      setIsInMyDesign: 'vivisticker/SET_isInMyDesign',
      setIsInSelectionMode: 'vivisticker/SET_isInSelectionMode'
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
      // Switch between color and text-color panel without close panel
      if (this.currActivePanel === panelType && panelType === 'color' &&
        props?.currColorEvent && this.currColorEvent !== props.currColorEvent) {
        this.currColorEvent = props.currColorEvent
      // Close panel if re-click
      } else if (this.currActivePanel === panelType || panelType === 'none') {
        editorUtils.setCurrActivePanel('none')
      } else {
        editorUtils.setCurrActivePanel(panelType)
        if (panelType === 'color' && props?.currColorEvent) {
          this.currColorEvent = props.currColorEvent
        }
      }
    },
    handleOpenColorPicker() {
      editorUtils.setCurrActivePanel('color-picker')
      colorUtils.setCurrEvent(ColorEventType.background)
    },
    switchMainTab(panelType: string) {
      this.setIsInMyDesign(false)
      this.setIsInSelectionMode(false)
      this.setCurrActiveTab(panelType)
      if (this.currActivePanel === 'color-picker') {
        vivistickerUtils.setNewBgColor('')
        this.switchTab('none')
      }
    },
    outerClick() {
      if (this.isInEditor) {
        vivistickerUtils.deselect()
      }
    },
    handleResize() {
      this.headerOffset = this.defaultWindowHeight - window.outerHeight - 1
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
    // height: 100%;
    width: 100%;
    overflow: hidden;
    z-index: setZindex("editor-view");
  }

  &__slide {
    position: absolute;
    height: 100%;
    width: 100%;
    overflow: hidden;
    z-index: setZindex("popup");
  }
}

.dim-background {
  @include size(100%);
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: setColor(gray-1, 0.3);
  z-index: 1000;
}

.slide-left {
  &-leave-active,
  &-enter-active {
    transition: transform 0.3s map-get($ease-functions, ease-in-out-quint);
  }
  &-leave,
  &-enter-to {
    transform: translateX(0);
  }
  &-leave-to,
  &-enter {
    transform: translateX(100%);
  }
}

.header-bar {
  transition: 0.2s ease;
}
</style>
