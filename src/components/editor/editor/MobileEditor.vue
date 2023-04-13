<template lang="pug">
div(class="mobile-editor")
  div(class="mobile-editor__top")
    header-tabs(@switchTab="switchTab"
      @showAllPages="showAllPages"
      :currTab="currActivePanel"
      :inAllPagesMode="inAllPagesMode")
    div(class="mobile-editor__content" :style="contentStyle" id="mobile-editor__content" ref="mobile-editor__content")
      keep-alive
        component(:is="inAllPagesMode ? 'all-pages' : 'mobile-editor-view'"
          :currActivePanel="currActivePanel"
          :isConfigPanelOpen="isConfigPanelOpen"
          :inAllPagesMode="inAllPagesMode"
          :showMobilePanel="showMobilePanelAfterTransitoin")
    transition(name="panel-up"
              @before-enter="beforeEnter"
              @after-leave="afterLeave")
      mobile-panel(v-show="showMobilePanel"
        :currActivePanel="currActivePanel"
        :currPage="currPage"
        @switchTab="switchTab"
        @panelHeight="setPanelHeight"
        :footerTabsHeight="footerTabsHeight")
  footer-tabs(class="mobile-editor__bottom"
    @switchTab="switchTab"
    :currTab="currActivePanel"
    :inAllPagesMode="inAllPagesMode"
    @showAllPages="showAllPages"
    ref="footerTabs")
</template>

<script lang="ts">
import AllPages from '@/components/editor/mobile/AllPages.vue'
import FooterTabs from '@/components/editor/mobile/FooterTabs.vue'
import HeaderTabs from '@/components/editor/mobile/HeaderTabs.vue'
import MobileEditorView from '@/components/editor/mobile/MobileEditorView.vue'
import MobilePanel from '@/components/editor/mobile/MobilePanel.vue'
import { IFooterTabProps } from '@/interfaces/editor'
import { IPage } from '@/interfaces/page'
import brandkitUtils from '@/utils/brandkitUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import { find } from 'lodash'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'MobileEditor',
  components: {
    MobileEditorView,
    MobilePanel,
    HeaderTabs,
    FooterTabs,
    AllPages
  },
  data() {
    return {
      isConfigPanelOpen: false,
      currColorEvent: '',
      showMobilePanelAfterTransitoin: false,
      marginBottom: 0,
      footerTabsHeight: 0
    }
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  created() {
    eventUtils.on(PanelEvent.switchTab, this.switchTab)
  },
  beforeUnmount() {
    eventUtils.off(PanelEvent.switchTab)
  },
  mounted() {
    if (this.$isTouchDevice()) {
      const el = this.$refs['mobile-editor__content'] as HTMLElement
      editorUtils.setMobileHW({
        width: el.clientWidth,
        height: el.clientHeight
      })
      editorUtils.handleContentScaleRatio(layerUtils.pageIndex)
    }
    // const pz = new PinchZoom(el, {
    //   minZoom: (pageUtils.mobileMinScaleRatio * 0.01)
    // })
    /**
     * @Note the codes below is used to prevent the zoom in/out effect of mobile phone, especially for the "IOS"
     * Remember to set passive to "false", or the preventDefault() function won't work.
     * check the blog below to see some method to prevent this error
     * https://medium.com/@littleDog/%E5%A6%82%E4%BD%95%E8%A7%A3%E6%B1%BA-user-scalable-no-%E5%B1%AC%E6%80%A7%E8%A2%ABios-safari-ignore-e6a0531050ba
     */

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

    if (process.env.NODE_ENV === 'development') {
      // const vconsole = new Vconsole()
      // vconsole.setSwitchPosition(10, 80)
    }

    brandkitUtils.fetchBrands(this.fetchBrands)

    this.setUserState({ enableAdminView: false })

    this.footerTabsHeight = (this.$refs.footerTabs as {$el: HTMLElement}).$el.clientHeight
  },
  computed: {
    ...mapState('mobileEditor', {
      closeMobilePanelFlag: 'closeMobilePanelFlag',
      inAllPagesMode: 'mobileAllPageMode',
      mobilePanel: 'currActivePanel',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode'
    }),
    ...mapState('user', [
      'viewGuide'
    ]),
    ...mapGetters({
      groupId: 'getGroupId',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      contentScaleRatio: 'getContentScaleRatio',
      isShowPagePreview: 'page/getIsShowPagePreview',
      currPanel: 'getCurrSidebarPanelType',
      groupType: 'getGroupType',
      isSidebarPanelOpen: 'getMobileSidebarPanelOpen',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      currActivePanel: 'mobileEditor/getCurrActivePanel',
      showMobilePanel: 'mobileEditor/getShowMobilePanel'
    }),
    contentStyle(): Record<string, string> {
      return { transform: `translateY(-${this.marginBottom}px)` }
    },
  },
  watch: {
    closeMobilePanelFlag(newVal) {
      if (newVal) {
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
      setUserState: 'user/SET_STATE'
    }),
    ...mapActions({
      fetchBrands: 'brandkit/fetchBrands'
    }),
    switchTab(panelType: string, props?: IFooterTabProps) {
      if (!this.inBgRemoveMode && panelType === 'remove-bg') {
        return
      }
      // Switch between color and text-color panel without close panel
      if (this.currActivePanel === panelType && panelType === 'color' &&
        props?.currColorEvent && this.currColorEvent !== props.currColorEvent) {
        this.currColorEvent = props.currColorEvent
      // Close panel if re-click
      } else if (this.currActivePanel === panelType || panelType === 'none') {
        editorUtils.setShowMobilePanel(false)
        editorUtils.setInMultiSelectionMode(false)
      } else {
        editorUtils.setCurrActivePanel(panelType)
        if (panelType === 'color' && props?.currColorEvent) {
          this.currColorEvent = props.currColorEvent
        }
      }

      if (this.currActivePanel !== 'none' && this.inAllPagesMode) {
        editorUtils.setMobileAllPageMode(false)
      }
    },
    showAllPages() {
      editorUtils.setMobileAllPageMode(!this.inAllPagesMode)

      if (!this.inAllPagesMode) {
        this.$nextTick(() => {
          pageUtils.fitPage()
        })
      }
    },
    setPanelHeight(height: number) {
      const content = this.$refs['mobile-editor__content'] as HTMLElement
      const contentHeight = content?.clientHeight ?? 0
      if (height === 0 || height > contentHeight) {
        this.marginBottom = 0
        return
      }

      // Calc additional page card translation by layer position
      const activeLayer = find(this.currPage.layers, ['active', true])
      let offset = 0
      if (activeLayer && contentHeight) {
        const layerMiddleY = activeLayer.styles.y +
          activeLayer.styles.height / 2 - this.currPage.height / 2
        offset = layerMiddleY * this.contentScaleRatio
      }
      this.marginBottom = Math.max(height / 2 + offset, 0)
    },
    beforeEnter() {
      this.showMobilePanelAfterTransitoin = true
    },
    afterLeave() {
      editorUtils.setCurrActivePanel('none')
      setTimeout(() => {
        this.showMobilePanelAfterTransitoin = false
      }, 300)
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-editor {
  @include size(100%, 100%);
  height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: 1fr;

  &__top {
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: 1fr;
    background-color: setColor(gray-5);
  }
  &__bottom {
    z-index: setZindex("footer");
  }

  &__content {
    position: relative;
    height: 100%;
    width: 100%;
    z-index: setZindex("editor-view");
    overflow: hidden;
    transition: transform 0.3s map-get($ease-functions, ease-in-out-quint);
  }

  &__page-preview {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    z-index: setZindex("pages-preview");
    background: setColor(gray-6);
    box-sizing: border-box;
  }
}
</style>
