<template lang="pug">
  div(class="mobile-editor")
    div(class="mobile-editor__top")
      header-tabs(@switchTab="switchTab"
        :currTab="currActivePanel")
      div(class="mobile-editor__content")
          mobile-editor-view(:isConfigPanelOpen="isConfigPanelOpen")
              //- div(class="content__panel" :style="panelStyles()")
              //-   mobile-panel-text-setting(v-if="showTextSetting" @toggleColorPanel="toggleColorPanel" @toggleConfigPanel="toggleConfigPanel")
      mobile-panel(v-if="currActivePanel !== 'none'"
        :currActivePanel="currActivePanel"
        @switchTab="switchTab")
    footer-tabs(@switchTab="switchTab" :currTab="currActivePanel")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileEditorView from '@/components/editor/mobile/MobileEditorView.vue'
import MobilePanel from '@/components/editor/mobile/MobilePanel.vue'
import HeaderTabs from '@/components/editor/mobile/HeaderTabs.vue'
import FooterTabs from '@/components/editor/mobile/FooterTabs.vue'
import MobilePanelTextSetting from '@/components/editor/panelFunction/MobilePanelTextSetting.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { FunctionPanelType, SidebarPanelType } from '@/store/types'
import uploadUtils from '@/utils/uploadUtils'
import store from '@/store'
import stepsUtils from '@/utils/stepsUtils'
import logUtils from '@/utils/logUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IShape, IText } from '@/interfaces/layer'

export default Vue.extend({
  name: 'MobileEditor',
  components: {
    MobileEditorView,
    MobilePanel,
    HeaderTabs,
    MobilePanelTextSetting,
    FooterTabs
  },
  data() {
    return {
      FunctionPanelType,
      isColorPanelOpen: false,
      isConfigPanelOpen: false,
      isLoading: false,
      isSaving: false,
      currActivePanel: 'none'
    }
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
      isSidebarPanelOpen: 'getMobileSidebarPanelOpen'
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
      console.log(newVal)
      if (newVal) {
        this.setCloseMobilePanelFlag(false)
        this.currActivePanel = 'none'
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
    switchTab(panelType: string) {
      if (this.currActivePanel === panelType) {
        this.currActivePanel = 'none'
      } else {
        this.currActivePanel = panelType
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-editor {
  @include size(100%, 100%);
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr;

  &__top {
    height: 100%;
    width: 100%;
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(auto, 1fr);
    grid-template-columns: 1fr;
  }

  &__content {
    height: 100%;
    width: 100%;
  }
}
</style>
