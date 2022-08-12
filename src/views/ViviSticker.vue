<template lang="pug">
  div(class="vivisticker")
    div(class="vivisticker__top")
      header-tabs(@switchTab="switchTab"
        :currTab="currActivePanel"
        :inAllPagesMode="false")
      div(class="vivisticker__content")
        //- v-if in main menu or in editor
        //- mobile-editor-view(:currActivePanel="currActivePanel"
                          :isConfigPanelOpen="isConfigPanelOpen"
                          :inAllPagesMode="false")
      transition(name="panel-up")
        mobile-panel(v-show="showMobilePanel"
          :currActivePanel="currActivePanel"
          :currColorEvent="currColorEvent"
          @switchTab="switchTab")
    footer-tabs(class="vivisticker__bottom"
      @switchTab="switchTab"
      :currTab="currActivePanel"
      :inAllPagesMode="false")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileEditorView from '@/components/editor/mobile/MobileEditorView.vue'
import MobilePanel from '@/components/editor/mobile/MobilePanel.vue'
import HeaderTabs from '@/components/editor/mobile/HeaderTabs.vue'
import FooterTabs from '@/components/editor/mobile/FooterTabs.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import stepsUtils from '@/utils/stepsUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import { IFooterTabProps } from '@/interfaces/editor'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import editorUtils from '@/utils/editorUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'

export default Vue.extend({
  name: 'MobileEditor',
  components: {
    MobileEditorView,
    MobilePanel,
    HeaderTabs,
    FooterTabs
  },
  data() {
    return {
      isConfigPanelOpen: false,
      currColorEvent: ''
    }
  },
  created() {
    eventUtils.on(PanelEvent.switchTab, this.switchTab)
  },
  mounted() {
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
      showMobilePanel: 'mobileEditor/getShowMobilePanel'
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
    }
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
      setCurrActivePanel: 'mobileEditor/SET_currActivePanel',
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel'
    }),
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
    }
  }
})
</script>

<style lang="scss" scoped>
.vivisticker {
  @include size(100%, 100%);
  height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: 1fr;

  &__top {
    height: 100%;
    width: 100%;
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
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
    overflow: hidden;
    z-index: setZindex("editor-view");
  }
}
</style>
