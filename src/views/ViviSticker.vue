<template lang="pug">
div(class="vivisticker" :style="copyingStyles()")
  div(class="vivisticker__top" :style="topStyles()")
    header-tabs(:style="headerStyles()")
    div(ref="vivisticker__content"
        class="vivisticker__content"
        id="vivisticker__content"
        @click.self="outerClick")
      my-design(v-show="isInMyDesign && !isInEditor")
      vvstk-editor(v-show="isInEditor" :isInEditor="isInEditor" :currPage="currPage" :marginBottom="marginBottom")
      main-menu(v-show="!isInEditor && !isInMyDesign" @openColorPicker="handleOpenColorPicker")
    teleport(v-if="mounted" to="#vivisticker__mobile-panel-bottom" :disabled="!isMobilePanelBottom")
      transition(name="panel-up"
                @before-enter="beforeEnter"
                @after-enter="afterEnter"
                @after-leave="afterLeave")
        mobile-panel(v-show="showMobilePanel"
          ref="mobilePanel"
          :currActivePanel="currActivePanel"
          :currPage="currPage"
          @switchTab="switchTab"
          @panelHeight="setPanelHeight"
          @bottomThemeChange="(val: boolean) => isMobilePanelBottom = val"
          :footerTabsRef="footerTabsRef")
  footer-tabs(v-if="showFooterTabs" class="vivisticker__bottom"
    ref="footerTabs"
    @switchTab="switchTab"
    @switchMainTab="switchMainTab"
    :currTab="isInEditor ? currActivePanel : (isInMyDesign ? 'none' : currActiveTab)"
    :inAllPagesMode="false")
  div(id="vivisticker__mobile-panel-bottom")
  div(v-if="pushModalInfo && isShowPushModal" class="vivisticker__push-modal-container" :style="pushModalInfo?.backdropStyle")
    modal-card(v-model:show="isShowPushModal" :initModalInfo="pushModalInfo")
  transition(name="slide-left")
    component(v-if="isSlideShown" :is="slideType" class="vivisticker__slide")
  transition(name="panel-up")
    tutorial(v-if="showTutorial")
  transition(name="panel-up")
    full-page(v-if="fullPageType !== 'none'" class="vivisticker__full-page")
  loading-overlay
</template>

<script lang="ts">
import ModalCard from '@/components/modal/ModalCard.vue'
import FooterTabs from '@/components/vivisticker/FooterTabs.vue'
import FullPage from '@/components/vivisticker/FullPage.vue'
import HeaderTabs from '@/components/vivisticker/HeaderTabs.vue'
import LoadingOverlay from '@/components/vivisticker/LoadingOverlay.vue'
import MainMenu from '@/components/vivisticker/MainMenu.vue'
import MobilePanel from '@/components/vivisticker/MobilePanel.vue'
import MyDesign from '@/components/vivisticker/MyDesign.vue'
import ShareTemplate from '@/components/vivisticker/ShareTemplate.vue'
import SlideUserSettings from '@/components/vivisticker/slide/SlideUserSettings.vue'
import Tutorial from '@/components/vivisticker/Tutorial.vue'
import VvstkEditor from '@/components/vivisticker/VvstkEditor.vue'
import { CustomWindow } from '@/interfaces/customWindow'
import { IFooterTabProps } from '@/interfaces/editor'
import { IModalInfo } from '@/interfaces/modal'
import { IPage } from '@/interfaces/page'
import editorUtils from '@/utils/editorUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import logUtils from '@/utils/logUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import textUtils from '@/utils/textUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { find } from 'lodash'
import VConsole from 'vconsole'
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
    SlideUserSettings,
    ShareTemplate,
    LoadingOverlay,
    ModalCard
  },
  data() {
    return {
      currColorEvent: '',
      headerOffset: 0,
      isKeyboardAnimation: 0,
      showMobilePanelAfterTransitoin: false,
      marginBottom: 0,
      vConsole: null as any,
      footerTabsRef: undefined as unknown as HTMLElement,
      mounted: false,
      isMobilePanelBottom: false,
      pushModalInfo: undefined as IModalInfo | undefined,
      isShowPushModal: true
    }
  },
  created() {
    eventUtils.on(PanelEvent.switchTab, this.switchTab)
    textUtils.loadDefaultFonts()
    vivistickerUtils.registerCallbacks('vvstk')
  },
  async mounted() {
    this.mounted = true
    const tempDesign = await vivistickerUtils.fetchDesign()
    if (tempDesign) {
      try {
        vivistickerUtils.initWithTempDesign(tempDesign)
      } catch (error) {
        logUtils.setLogAndConsoleLog(error)
      }
    }

    if (!vivistickerUtils.checkVersion(this.modalInfo.ver_min || '0')) {
      vivistickerUtils.showUpdateModal(true)
      vivistickerUtils.sendAppLoaded()
    } else this.showInitPopups()

    stepsUtils.MAX_STORAGE_COUNT = 15
    /**
     * @Note the codes below is used to prevent the zoom in/out effect of mobile phone, especially for the "IOS"
     * Remember to set passive to "false", or the preventDefault() function won't work.
     * check the blog below to see some method to prevent this error
     * https://medium.com/@littleDog/%E5%A6%82%E4%BD%95%E8%A7%A3%E6%B1%BA-user-scalable-no-%E5%B1%AC%E6%80%A7%E8%A2%ABios-safari-ignore-e6a0531050ba
     */
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
    document.addEventListener('scroll', this.handleScroll)

    const debugMode = process.env.NODE_ENV === 'development' ? true : (await vivistickerUtils.getState('debugMode'))?.value ?? false
    this.setDebugMode(debugMode)
    this.footerTabsRef = (this.$refs.footerTabs as any).$el as HTMLElement

    if (this.showVConsole) {
      this.vConsole = new VConsole({ theme: 'dark' })
      this.vConsole.setSwitchPosition(25, 80)
    }
  },
  unmounted() {
    document.removeEventListener('scroll', this.handleScroll)
    this.vConsole && this.vConsole.destroy()
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
      contentScaleRatio: 'getContentScaleRatio',
      currPanel: 'getCurrSidebarPanelType',
      groupType: 'getGroupType',
      isSidebarPanelOpen: 'getMobileSidebarPanelOpen',
      isProcessing: 'bgRemove/getIsProcessing',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      getPage: 'getPage',
      currActivePanel: 'mobileEditor/getCurrActivePanel',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
      currActiveTab: 'vivisticker/getCurrActiveTab',
      isInEditor: 'vivisticker/getIsInEditor',
      isInBgShare: 'vivisticker/getIsInBgShare',
      isInTemplateShare: 'vivisticker/getIsInTemplateShare',
      isInPagePreview: 'vivisticker/getIsInPagePreview',
      showTutorial: 'vivisticker/getShowTutorial',
      fullPageType: 'vivisticker/getFullPageType',
      userInfo: 'vivisticker/getUserInfo',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      isInMyDesign: 'vivisticker/getIsInMyDesign',
      slideType: 'vivisticker/getSlideType',
      isSlideShown: 'vivisticker/getIsSlideShown',
      modalInfo: 'vivisticker/getModalInfo',
      debugMode: 'vivisticker/getDebugMode',
      isInBgRemoveSection: 'vivisticker/getIsInBgRemoveSection',
    }),
    currPage(): IPage {
      return this.getPage(pageUtils.currFocusPageIndex)
    },
    showFooterTabs(): boolean {
      return !(this.isInBgShare || this.isInTemplateShare || this.isInPagePreview || this.isProcessing || this.isInBgRemoveSection)
    },
    showVConsole(): boolean {
      return false
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
    // mobilePanel(newVal, oldVal) {
    //   if (oldVal === 'photo-shadow') {
    //     imageShadowPanelUtils.handleShadowUpload()
    //   }
    // },
    debugMode(newVal) {
      if (newVal && this.showVConsole && !this.vConsole) {
        this.vConsole = new VConsole({ theme: 'dark' })
        this.vConsole.setSwitchPosition(25, 80)
      } else if (!newVal && this.vConsole) {
        this.vConsole.destroy()
        this.vConsole = null
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
      setIsInSelectionMode: 'vivisticker/SET_isInSelectionMode',
      setFullPageConfig: 'vivisticker/SET_fullPageConfig',
      setDebugMode: 'vivisticker/SET_debugMode'
    }),
    headerStyles() {
      return {
        transform: `translateY(${this.headerOffset}px)`,
        ...((!this.isDuringCopy && this.isKeyboardAnimation) && { height: '0px', marginBottom: '44px' }),
        ...(!this.isKeyboardAnimation && { transition: 'height 0.2s cubic-bezier(0.380, 0.700, 0.125, 1.000), margin-bottom 0.2s cubic-bezier(0.380, 0.700, 0.125, 1.000)' })
      }
    },
    copyingStyles() {
      return this.isDuringCopy ? { background: 'transparent' } : {}
    },
    topStyles() {
      return {
        ...this.isDuringCopy ? { background: 'transparent' } : {},
        gridTemplateRows: ['text', 'template-content'].includes(this.currActivePanel) ? '1fr' : 'auto 1fr'
      }
    },
    switchTab(panelType: string, props?: IFooterTabProps) {
      // Switch between color and text-color panel without close panel
      if (this.currActivePanel === panelType && panelType === 'color' &&
        props?.currColorEvent && this.currColorEvent !== props.currColorEvent) {
        this.currColorEvent = props.currColorEvent
      // Close panel if re-click
      } else if (this.currActivePanel === panelType || panelType === 'none') {
        editorUtils.setShowMobilePanel(false)
      } else {
        editorUtils.setCurrActivePanel(panelType)
        if (panelType === 'color' && props?.currColorEvent) {
          this.currColorEvent = props.currColorEvent
        }
      }
    },
    handleOpenColorPicker() {
      editorUtils.setCurrActivePanel('color-picker')
    },
    switchMainTab(panelType: string) {
      this.setIsInMyDesign(false)
      this.setIsInSelectionMode(false)
      this.setCurrActiveTab(panelType)
      if (['us', 'jp'].includes(this.$i18n.locale)) {
        switch (panelType) {
          case 'text':
            if (!vivistickerUtils.tutorialFlags.text && !this.debugMode) {
              vivistickerUtils.openFullPageVideo('tutorial2', { delayedClose: 5000 })
              vivistickerUtils.updateTutorialFlags({ text: true })
            }
            break
          case 'background':
            if (!vivistickerUtils.tutorialFlags.background && !this.debugMode) {
              vivistickerUtils.openFullPageVideo('tutorial4', { delayedClose: 5000 })
              vivistickerUtils.updateTutorialFlags({ background: true })
            }
            break
        }
      }
      if (this.currActivePanel === 'color-picker') {
        vivistickerUtils.setHasNewBgColor(false)
        this.switchTab('none')
      }
    },
    outerClick() {
      console.log('outer click')
      if (this.isInEditor) {
        vivistickerUtils.deselect()
      }
    },
    handleScroll() {
      // handle page scroll by mobile keyboard
      this.headerOffset = document.documentElement.scrollTop ? document.documentElement.scrollTop - 1 : 0
      window.clearTimeout(this.isKeyboardAnimation)
      this.isKeyboardAnimation = window.setTimeout(() => {
        this.isKeyboardAnimation = 0
      }, 500)
    },
    setPanelHeight(height: number) {
      const content = this.$refs.vivisticker__content as HTMLElement
      const contentHeight = content?.clientHeight ?? 0
      if (height === 0 || height > contentHeight || this.currActivePanel === 'page-management') {
        this.marginBottom = 0
        return
      }

      // Calc additional page card translation by layer position
      const activeLayer = find(this.currPage.layers, ['active', true])
      let offset = 0
      let pageOffset = 0
      if (activeLayer && contentHeight) {
        const layerMiddleY = activeLayer.styles.y +
          activeLayer.styles.height / 2 - this.currPage.height / 2
        offset = layerMiddleY * this.contentScaleRatio
      }
      const pseudoPage = document.getElementById(`vvstk-page-${pageUtils.currFocusPageIndex}`) as HTMLElement | null
      if (pseudoPage) {
        pageOffset = contentHeight - pseudoPage.clientHeight
      }
      this.marginBottom = Math.max((height - pageOffset) / 2 + offset, 0)
    },
    beforeEnter() {
      this.showMobilePanelAfterTransitoin = true
    },
    afterEnter() {
      this.setPanelHeight((this.$refs.mobilePanel as {$el: HTMLElement}).$el.clientHeight)
    },
    afterLeave() {
      editorUtils.setCurrActivePanel('none')
      this.setPanelHeight(0)
      setTimeout(() => {
        this.showMobilePanelAfterTransitoin = false
      }, 300)
    },
    async getPushModalInfo() {
      // parse modal info
      let locale = this.userInfo.locale
      if (!['us', 'tw', 'jp'].includes(locale)) {
        locale = 'us'
      }
      const prefix = locale + '_'
      const modalInfo = Object.fromEntries(Object.entries(this.modalInfo).map(
        ([k, v]) => {
          if (k.startsWith(prefix)) k = k.replace(prefix, '')
          return [k, v as string]
        })
      )

      // show popup
      const lastModalMsg = await vivistickerUtils.getState('lastModalMsg')
      const shown = (lastModalMsg === undefined || lastModalMsg === null) ? false : lastModalMsg.value === modalInfo.msg
      const btn_txt = modalInfo.btn_txt
      if (!btn_txt || shown) return

      const options = {
        imgSrc: modalInfo.img_url,
        noClose: false,
        noCloseIcon: true,
        backdropStyle: {},
        cardStyle: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255,255,255,0.9)'
        },
        checkboxText: '',
        checked: false,
        onCheckedChange: (checked: boolean) => { console.log(checked) }
      }
      this.pushModalInfo = {
        title: modalInfo.title,
        content: [modalInfo.msg],
        confirmButton: {
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
        cancelButton: {
          msg: modalInfo.btn2_txt || '',
          class: 'btn-light-mid',
          style: {
            border: 'none',
            color: '#474A57',
            backgroundColor: '#D3D3D3'
          }
        },
        ...options
      }
      await vivistickerUtils.setState('lastModalMsg', { value: modalInfo.msg })
    },
    async showInitPopups() {
      this.getPushModalInfo()
      const isFirstOpen = this.userInfo.isFirstOpen
      const subscribed = (await vivistickerUtils.getState('subscribeInfo'))?.subscribe ?? false
      const m = parseInt(this.modalInfo[`pop_${this.userInfo.locale}_m`])
      const n = parseInt(this.modalInfo[`pop_${this.userInfo.locale}_n`])
      const showPaymentInfo = await vivistickerUtils.getState('showPaymentInfo')
      const showPaymentTime = showPaymentInfo?.timestamp ?? 0
      const showPaymentCount = (showPaymentInfo?.count ?? 0) + 1
      const diffShowPaymentTime = showPaymentTime ? Date.now() - showPaymentTime : 0
      const isShowPaymentView = isFirstOpen ? this.modalInfo[`pop_${this.userInfo.locale}`] === '1'
        : !subscribed && showPaymentCount >= m && diffShowPaymentTime >= n * 86400000
      const isShowTutorial = isFirstOpen && this.$i18n.locale !== 'us'
      if (isShowPaymentView) {
        vivistickerUtils.openPayment()
        vivistickerUtils.setState('showPaymentInfo', { count: 0, timestamp: Date.now() })
      } else vivistickerUtils.setState('showPaymentInfo', { count: showPaymentCount, timestamp: showPaymentTime || Date.now() })
      if (isShowTutorial) this.setShowTutorial(true)
      if (!isShowPaymentView && !isShowTutorial) vivistickerUtils.sendAppLoaded()
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

  &__push-modal-container {
    position: fixed;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: setColor(gray-1, 0.3);
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
  overflow-y: hidden;
}
</style>
