<template lang="pug">
  div(class="editor")
    mobile-sidebar(:isSidebarPanelOpen="isSidebarPanelOpen"
      @toggleSidebarPanel="toggleSidebarPanel")
    section(style="height: 100%;")
      div(class="content")
        sidebar-panel(:isSidebarPanelOpen="isSidebarPanelOpen")
        div(class="content__main")
          div(class="content__editor")
            //- div(class="header-container")
              editor-header
            //- div(v-if="isAdmin" class="admin-options")
              div(class="admin-options__sticky-container"
                  :style="stickyTopPos")
                div(class="flex flex-column mr-10")
                  span(class="ml-10 text-bold text-orange") {{templateText}}
                  span(class="ml-10 pointer text-orange" @click="copyText(groupId)") {{groupId}}
                svg-icon(v-if="isAdmin"
                  :iconName="`user-admin${getAdminModeText}`"
                  :iconWidth="'20px'"
                  :iconColor="'gray-2'"
                  @click.native="setAdminMode()")
            mobile-editor-view(:isConfigPanelOpen="isConfigPanelOpen")
            mobile-scale-ratio-editor(:style="scaleRatioEditorPos"
              @toggleSidebarPanel="toggleSidebarPanel")
            //- currSelectedInfo.types.has('text')"
            div(class="content__panel" :style="panelStyles()")
              mobile-panel-text-setting(v-if="showTextSetting" @toggleColorPanel="toggleColorPanel" @toggleConfigPanel="toggleConfigPanel")
        //- div(class="content__panel")
          function-panel(@toggleColorPanel="toggleColorPanel")
          transition(name="panel-up")
            color-panel(v-if="isColorPanelOpen"
              @toggleColorPanel="toggleColorPanel")
        div(v-if="isShowPagePreview" class="content__pages")
          page-preview
    //- tour-guide(v-if="showEditorGuide")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSidebar from '@/components/editor/mobile/MobileSidebar.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import SidebarPanel from '@/components/editor/SidebarPanel.vue'
import FunctionPanel from '@/components/editor/FunctionPanel.vue'
import ColorPanel from '@/components/editor/ColorPanel.vue'
import MobileEditorView from '@/components/editor/mobile/MobileEditorView.vue'
import MobileScaleRatioEditor from '@/components/editor/mobile/MobileScaleRatioEditor.vue'
import PagePreview from '@/components/editor/PagePreview.vue'
import TourGuide from '@/components/editor/TourGuide.vue'
import MobilePanelTextSetting from '@/components/editor/panelFunction/MobilePanelTextSetting.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { FunctionPanelType, SidebarPanelType } from '@/store/types'
import uploadUtils from '@/utils/uploadUtils'
import store from '@/store'
import rulerUtils from '@/utils/rulerUtils'
import stepsUtils from '@/utils/stepsUtils'
import logUtils from '@/utils/logUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IShape, IText } from '@/interfaces/layer'

export default Vue.extend({
  name: 'MobileEditor',
  components: {
    MobileSidebar,
    EditorHeader,
    SidebarPanel,
    MobileEditorView,
    MobileScaleRatioEditor,
    FunctionPanel,
    ColorPanel,
    PagePreview,
    TourGuide,
    MobilePanelTextSetting
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
    isShape(): boolean {
      return this.currSelectedInfo.types.has('shape') && this.currSelectedInfo.layers.length === 1
    },
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
    contentPanelStyles(): { [index: string]: string } {
      return this.isColorPanelOpen ? {
        'grid-template-rows': '1fr 1fr'
      } : {
        'grid-template-rows': '1fr'
      }
    },
    isLogin(): boolean {
      return store.getters['user/isLogin']
    },
    isAdmin(): boolean {
      return this.role === 0
    },
    getAdminModeText(): string {
      return this.adminMode ? '' : '-disable'
    },
    path(): string {
      return this.$route.path
    },
    templateText(): string {
      if (this.groupId.length > 0 && this.groupType === 1) {
        return '詳情頁模板'
      } else if (this.groupId.length > 0) {
        return '群組模板'
      } else {
        return '單頁模板'
      }
    },
    stickyTopPos(): { [index: string]: string } {
      const top = rulerUtils.showRuler ? `${rulerUtils.RULER_SIZE}px` : '0px'
      return {
        top
      }
    },
    showEditorGuide(): boolean {
      return this.viewGuide === 0
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
    // const answer = this.confirmLeave()
    // if (!answer) {
    //   next(false)
    //   return
    // }

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
      setCurrFunctionPanel: 'SET_currFunctionPanelType',
      setMobileSidebarPanelOpen: 'SET_mobileSidebarPanelOpen',
      _setAdminMode: 'user/SET_ADMIN_MODE'
    }),
    panelStyles() {
      return this.isConfigPanelOpen ? { height: '200px' } : { height: '75px' }
    },
    setAdminMode() {
      this._setAdminMode(!this.adminMode)
    },
    setPanelType(type: number) {
      this.setCurrFunctionPanel(type)
    },
    toggleColorPanel(bool: boolean) {
      this.isColorPanelOpen = bool
    },
    toggleSidebarPanel(bool: boolean) {
      this.setMobileSidebarPanelOpen(bool)
    },
    toggleConfigPanel(bool: boolean) {
      this.isConfigPanelOpen = bool
    },
    confirmLeave() {
      return window.confirm('Do you really want to leave? you have unsaved changes!')
    }
  }
})
</script>

<style lang="scss" scoped>
.editor {
  @include size(100%, 100%);
  max-height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr;
  > section:nth-child(2) {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr;
  }
}

.content {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr auto;
  height: 100%;
  &__main {
    // display: grid;
    // grid-template-rows: minmax(0, 1fr);
    // grid-template-columns: 1fr;
    height: 100%;
  }

  &__editor {
    position: relative;
    height: 100%;
    // display: grid;
    // grid-template-rows: minmax(0, 1fr);
    // grid-template-columns: 1fr auto;
  }

  &__panel {
    position: relative;
    background-color: setColor(gray-1-5);
    // display: grid;
    // grid-template-columns: 1fr;
  }

  &__pages {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    z-index: setZindex("pages-preview");
    background: setColor(gray-6);
  }
}

.header-container {
  // must set to 100% or sticky div won't work
  height: 100%;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate3d(-50%, 0px, 0);
  z-index: setZindex("editor-header");
  pointer-events: none;
}

.admin-options {
  height: 100%;
  position: absolute;
  top: 0;
  right: 30px;
  z-index: setZindex("editor-header");
  font-size: 10px;
  pointer-events: none;
  &__sticky-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: sticky;
    top: 0;
    left: 0;
    background-color: white;
    padding: 5px 10px;
    border-radius: 0 0 0.25rem 0.25rem;
    box-shadow: 0px 2px 10px setColor(gray-2, 0.1);
    pointer-events: auto;
  }
}

.scale-ratio-editor::v-deep {
  position: absolute;
  top: 0px;
  z-index: setZindex("scale-ratio-editor");
}
</style>
