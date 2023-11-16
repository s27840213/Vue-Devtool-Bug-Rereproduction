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
  transition(name="slide-left")
    template(v-if="isSlideShown")
      component(:is="slideType" class="vivisticker__slide")
  transition(name="panel-up")
    tutorial(v-if="showTutorial")
  transition(name="panel-up")
    full-page(v-if="fullPageType !== 'none'" class="vivisticker__full-page")
  loading-overlay
</template>

<script lang="ts">
import VvstkEditor from '@/components/editor/editor/VvstkEditor.vue'
import FooterTabs from '@/components/editor/mobile/FooterTabs.vue'
import HeaderTabs from '@/components/editor/mobile/HeaderTabs.vue'
import MobilePanel from '@/components/editor/mobile/MobilePanel.vue'
import FullPage from '@/components/fullPage/FullPage.vue'
import LoadingOverlay from '@/components/global/LoadingOverlay.vue'
import MainMenu from '@/components/mainMenu/MainMenu.vue'
import MyDesign from '@/components/mydesign/MyDesign.vue'
import SlideUserSettings from '@/components/slide/SlideUserSettings.vue'
import Tutorial from '@/components/tutorial/Tutorial.vue'
import { IPage } from '@/interfaces/page'
import { CustomWindow } from '@nu/vivi-lib/interfaces/customWindow'
import { IFooterTabProps } from '@nu/vivi-lib/interfaces/editor'
import { IPayment } from '@nu/vivi-lib/interfaces/vivisticker'
import constantData from '@nu/vivi-lib/utils/constantData'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import eventUtils, { PanelEvent } from '@nu/vivi-lib/utils/eventUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
import textUtils from '@nu/vivi-lib/utils/textUtils'
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
    LoadingOverlay
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
    }
  },
  created() {
    eventUtils.on(PanelEvent.switchTab, this.switchTab)
    textUtils.loadDefaultFonts()
    stkWVUtils.registerCallbacks('vvstk')
  },
  async mounted() {
    this.mounted = true
    const tempDesign = await stkWVUtils.fetchDesign()
    if (tempDesign) {
      try {
        stkWVUtils.initWithTempDesign(tempDesign)
      } catch (error) {
        logUtils.setLogAndConsoleLog(error)
      }
    }

    if (!stkWVUtils.checkVersion(this.modalInfo.ver_min || '0')) {
      stkWVUtils.showUpdateModal(true)
      stkWVUtils.sendAppLoaded()
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

    const debugMode = process.env.NODE_ENV === 'development' ? true : (await stkWVUtils.getState('debugMode'))?.value ?? false
    this.setDebugMode(debugMode)
    this.footerTabsRef = (this.$refs.footerTabs as any).$el as HTMLElement

    if (this.showVConsole) {
      this.vConsole = new VConsole({ theme: 'dark' })
      this.vConsole.setSwitchPosition(25, 80)
    }
    this.setEditorSizeInit()
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
      currActiveTab: 'assetPanel/getCurrActiveTab',
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
      modalOpen: 'modal/getModalOpen',
      isPromote: 'vivisticker/getIsPromote'
    }),
    payment(): IPayment {
      return this.$store.state.vivisticker.payment as IPayment
    },
    currPage(): IPage {
      return this.getPage(pageUtils.currFocusPageIndex)
    },
    showFooterTabs(): boolean {
      return !(this.isInBgShare || this.isInTemplateShare || this.isInPagePreview || this.isProcessing || this.inBgRemoveMode)
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
      setCurrActiveTab: 'assetPanel/SET_currActiveTab',
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
      if (constantData.checkIfUseNewLogic()) {
        switch (panelType) {
          case 'text':
            if (!stkWVUtils.tutorialFlags.text && !this.debugMode) {
              stkWVUtils.openFullPageVideo('tutorial2', { delayedClose: 5000 })
              stkWVUtils.updateTutorialFlags({ text: true })
            }
            break
          case 'background':
            if (!stkWVUtils.tutorialFlags.background && !this.debugMode) {
              stkWVUtils.openFullPageVideo('tutorial4', { delayedClose: 5000 })
              stkWVUtils.updateTutorialFlags({ background: true })
            }
            break
        }
      }
      if (this.currActivePanel === 'color-picker') {
        stkWVUtils.setHasNewBgColor(false)
        this.switchTab('none')
      }
    },
    outerClick() {
      console.log('outer click')
      if (this.isInEditor) {
        stkWVUtils.deselect()
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
    async showPushModalInfo(): Promise<boolean> {
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
      const subscribed = (await stkWVUtils.getState('subscribeInfo'))?.subscribe ?? false
      const price = stkWVUtils.formatPrice(this.payment.prices.annually.value, this.payment.prices.currency, this.payment.prices.annually.text, 'modal')
      const priceOriginal = this.payment.prices.annuallyOriginal ? stkWVUtils.formatPrice(this.payment.prices.annuallyOriginal.value, this.payment.prices.currency, this.payment.prices.annuallyOriginal.text, 'modal') : ''
      const isCloseBtnOnly = this.isPromote && subscribed
      const lastModalMsg = await stkWVUtils.getState('lastModalMsg')
      const shown = (lastModalMsg === undefined || lastModalMsg === null) ? false : lastModalMsg.value === modalInfo.msg
      const btn_txt = modalInfo.btn_txt
      if (!btn_txt || shown) return false

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
      modalUtils.setModalInfo(
        modalInfo.title,
        this.isPromote && priceOriginal ? [`<del>${priceOriginal}</del> → ${price}`, modalInfo.msg] : [modalInfo.msg],
        {
          msg: isCloseBtnOnly ? modalInfo.btn2_txt : btn_txt,
          class: 'btn-black-mid',
          style: {
            color: '#F8F8F8'
          },
          action: () => {
            if(isCloseBtnOnly) return
            const url = modalInfo.btn_url
            if (url) { window.open(url, '_blank') }
          }
        },
        isCloseBtnOnly ? undefined : {
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
      stkWVUtils.setState('lastModalMsg', { value: modalInfo.msg })
      return true
    },
    async showInitPopups() {
      const showPaymentInfo = await stkWVUtils.getState('showPaymentInfo')
      const isFirstOpen = this.userInfo.isFirstOpen && showPaymentInfo === undefined
      const subscribed = (await stkWVUtils.getState('subscribeInfo'))?.subscribe ?? false
      const m = parseInt(this.modalInfo[`pop_${this.userInfo.locale}_m`])
      const n = parseInt(this.modalInfo[`pop_${this.userInfo.locale}_n`])
      const showPaymentTime = showPaymentInfo?.timestamp ?? 0
      const showPaymentCount = (showPaymentInfo?.count ?? 0) + 1
      const diffShowPaymentTime = showPaymentTime ? Date.now() - showPaymentTime : 0
      let isShowPaymentView = isFirstOpen ? this.modalInfo[`pop_${this.userInfo.locale}`] === '1'
        : !subscribed && showPaymentCount >= m && diffShowPaymentTime >= n * 86400000
      const isShowTutorial = isFirstOpen && this.$i18n.locale !== 'us'
      const show = () => {
        if (isShowPaymentView) {
          stkWVUtils.openPayment()
          stkWVUtils.setState('showPaymentInfo', { count: 0, timestamp: Date.now() })
        } else stkWVUtils.setState('showPaymentInfo', { count: showPaymentCount, timestamp: showPaymentTime || Date.now() })
        if (isShowTutorial) this.setShowTutorial(true)
        if (!isShowPaymentView && !isShowTutorial) stkWVUtils.sendAppLoaded()
      }

      const isPushModalShown = await this.showPushModalInfo()
      if (isPushModalShown) {
        stkWVUtils.sendAppLoaded()
        if (this.isPromote && !subscribed) {
          isShowPaymentView = true
        }
        const unwatch = this.$watch('modalOpen', (newVal) => {
          if(!newVal) show()
          unwatch()
        })
      }
      else show()
    },
    setEditorSizeInit() {
      const rect = (this.$refs.vivisticker__content as HTMLElement).getBoundingClientRect()
      editorUtils.setMobilePhysicalData({
        size: {
          width: rect.width,
          height: rect.height,
        },
        centerPos: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        },
        pos: {
          x: rect.left,
          y: rect.top
        }
      })
    },
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
  &-enter-from {
    transform: translateX(100%);
  }
}

.header-bar {
  overflow-y: hidden;
}
</style>
