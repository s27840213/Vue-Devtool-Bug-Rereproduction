<template lang="pug">
  div(class="editor")
    header-tabs
    div(class="editor__content")
        mobile-editor-view(:isConfigPanelOpen="isConfigPanelOpen")
            //- div(class="content__panel" :style="panelStyles()")
            //-   mobile-panel-text-setting(v-if="showTextSetting" @toggleColorPanel="toggleColorPanel" @toggleConfigPanel="toggleConfigPanel")
    footer-tabs
    //- mobile-sidebar(:isSidebarPanelOpen="isSidebarPanelOpen"
    //-   @toggleSidebarPanel="toggleSidebarPanel")
    //- section(style="height: 100%;")
    //-   div(class="content")
    //-     sidebar-panel(:isSidebarPanelOpen="isSidebarPanelOpen")
    //-     div(class="content__main")
    //-       div(class="content__editor")
    //-         mobile-editor-view(:isConfigPanelOpen="isConfigPanelOpen")
    //-         mobile-scale-ratio-editor(:style="scaleRatioEditorPos"
    //-           @toggleSidebarPanel="toggleSidebarPanel")
    //-         div(class="content__panel" :style="panelStyles()")
    //-           mobile-panel-text-setting(v-if="showTextSetting" @toggleColorPanel="toggleColorPanel" @toggleConfigPanel="toggleConfigPanel")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileEditorView from '@/components/editor/mobile/MobileEditorView.vue'
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
      isSaving: false
      // isSidebarPanelOpen: false
    }
  },
  watch: {
    isShowPagePreview() {
      this.toggleSidebarPanel = this.isShowPagePreview
    }
  },
  computed: {
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
      const types = groupLayer.layers.map((layer: IImage | IText | IShape | IGroup, index: number) => {
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
      _setAdminMode: 'user/SET_ADMIN_MODE'
    }),
    panelStyles() {
      return this.isConfigPanelOpen ? { height: '200px' } : { height: '75px' }
    },
    setAdminMode() {
      this._setAdminMode(!this.adminMode)
    },
    toggleColorPanel(bool: boolean) {
      this.isColorPanelOpen = bool
    },
    toggleSidebarPanel(bool: boolean) {
      this.setMobileSidebarPanelOpen(bool)
    },
    toggleConfigPanel(bool: boolean) {
      this.isConfigPanelOpen = bool
    }
  }
})
</script>

<style lang="scss" scoped>
.editor {
  @include size(100%, 100%);
  max-height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-columns: 1fr;

  &__content {
    height: 100%;
    width: 100%;
  }
}
</style>
