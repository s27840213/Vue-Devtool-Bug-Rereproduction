<template lang="pug">
  div(class="mobile-editor")
    div(class="mobile-editor__top")
      header-tabs(@switchTab="switchTab"
        @showAllPages="showAllPages"
        :currTab="currActivePanel"
        :inAllPagesMode="inAllPagesMode")
      div(class="mobile-editor__content")
        mobile-editor-view(v-if="!inAllPagesMode"
          :currActivePanel="currActivePanel"
          :isConfigPanelOpen="isConfigPanelOpen"
          :inAllPagesMode="inAllPagesMode")
        div(v-else class="mobile-editor__page-preview")
          page-preview
      transition(name="panel-up")
        mobile-panel(v-if="currActivePanel !== 'none' || inMultiSelectionMode"
          :currActivePanel="currActivePanel"
          :currColorEvent="currColorEvent"
          @openExtraColorModal="openExtraColorModal"
          @switchTab="switchTab")
      //- mobile-panel(v-if="currActivePanel !== 'none' && showExtraColorPanel"
      //-   :currActivePanel="'color'"
      //-   :currColorEvent="ColorEventType.background"
      //-   :isExtraPanel="true"
      //-   @switchTab="switchTab")
    footer-tabs(class="mobile-editor__bottom"
      @switchTab="switchTab"
      :currTab="currActivePanel"
      :inAllPagesMode="inAllPagesMode"
      @showAllPages="showAllPages")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileEditorView from '@/components/editor/mobile/MobileEditorView.vue'
import MobilePanel from '@/components/editor/mobile/MobilePanel.vue'
import HeaderTabs from '@/components/editor/mobile/HeaderTabs.vue'
import FooterTabs from '@/components/editor/mobile/FooterTabs.vue'
import MobilePanelTextSetting from '@/components/editor/panelFunction/MobilePanelTextSetting.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { FunctionPanelType, SidebarPanelType, ColorEventType } from '@/store/types'
import uploadUtils from '@/utils/uploadUtils'
import store from '@/store'
import stepsUtils from '@/utils/stepsUtils'
import logUtils from '@/utils/logUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import { IFooterTabProps } from '@/interfaces/editor'
import PagePreview from '@/components/editor/PagePreview.vue'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'

export default Vue.extend({
  name: 'MobileEditor',
  components: {
    MobileEditorView,
    MobilePanel,
    HeaderTabs,
    MobilePanelTextSetting,
    FooterTabs,
    PagePreview
  },
  data() {
    return {
      FunctionPanelType,
      isColorPanelOpen: false,
      isConfigPanelOpen: false,
      isLoading: false,
      isSaving: false,
      currActivePanel: 'none',
      currColorEvent: '',
      inAllPagesMode: false,
      showExtraColorPanel: false,
      ColorEventType
    }
  },
  mounted() {
    eventUtils.on(PanelEvent.showMobilePhotoShadow, () => {
      this.currActivePanel = 'photo-shadow'
    })
  },
  computed: {
    ...mapState({
      closeMobilePanelFlag: 'closeMobilePanelFlag'
    }),
    ...mapState('user', [
      'role',
      'adminMode',
      'viewGuide']),
    ...mapGetters({
      groupId: 'getGroupId',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      isShowPagePreview: 'page/getIsShowPagePreview',
      currPanel: 'getCurrSidebarPanelType',
      groupType: 'getGroupType',
      isSidebarPanelOpen: 'getMobileSidebarPanelOpen',
      inMultiSelectionMode: 'getInMultiSelectionMode'
    }),
    inPagePanel(): boolean {
      return SidebarPanelType.page === this.currPanel
    },
    scaleRatioEditorPos(): { [index: string]: string } {
      return this.inPagePanel ? {
        right: '2rem'
      } : {
        left: '50%',
        transform: 'translateX(-50%)'
      }
    },
    isLogin(): boolean {
      return store.getters['user/isLogin']
    },
    isAdmin(): boolean {
      return this.role === 0
    },
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
        this.setCloseMobilePanelFlag(false)
        this.currActivePanel = 'none'
        this.showExtraColorPanel = false
      }
    }
  },
  beforeRouteLeave(to, from, next) {
    stepsUtils.clearSteps()
    if (uploadUtils.isLogin && this.$router.currentRoute.query.design_id && this.$router.currentRoute.query.type) {
      this.isSaving = true
      uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH).then(() => {
        uploadUtils.isGettingDesign = false
        logUtils.setLog('Leave editor')
        this.isSaving = false
        next()
      })
    } else {
      logUtils.setLog('Leave editor')
      next()
    }
  },
  methods: {
    ...mapMutations({
      setMobileSidebarPanelOpen: 'SET_mobileSidebarPanelOpen',
      _setAdminMode: 'user/SET_ADMIN_MODE',
      setCloseMobilePanelFlag: 'SET_closeMobilePanelFlag'
    }),
    switchTab(panelType: string, props?: IFooterTabProps) {
      if (this.currActivePanel === panelType) {
        this.currActivePanel = 'none'
      } else {
        this.currActivePanel = panelType
        if (props) {
          if (panelType === 'color' && props.currColorEvent) {
            this.currColorEvent = props.currColorEvent
          }
        }
      }
    },
    showAllPages() {
      this.inAllPagesMode = !this.inAllPagesMode
    },
    openExtraColorModal() {
      this.showExtraColorPanel = !this.showExtraColorPanel
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-editor {
  @include size(100%, 100%);
  height: 100%;
  display: grid;
  grid-template-rows: minmax(auto, 1fr) auto;
  grid-template-columns: 1fr;

  &__top {
    height: 100%;
    width: 100%;
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(auto, 1fr);
    grid-template-columns: 1fr;
  }
  &__bottom {
    z-index: setZindex("footer");
  }

  &__content {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: scroll;
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
