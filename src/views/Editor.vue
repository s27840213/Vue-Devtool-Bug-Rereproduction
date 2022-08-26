<template lang="pug">
  div(class="editor")
    desktop-editor(v-if="!useMobileEditor" @setIsLoading="setIsLoading")
    mobile-editor(v-else)
    spinner(v-if="isLoading || isSaving || isGlobalLoading" :textContent="isSaving ? $t('NN0455') : $t('NN0454')")
    popup-brand-settings(v-if="isBrandSettingsOpen")
    popup-update-design(v-if="isUpdateDesignOpen")
</template>

<script lang="ts">
import Vue from 'vue'
import Sidebar from '@/components/editor/Sidebar.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import SidebarPanel from '@/components/editor/SidebarPanel.vue'
import FunctionPanel from '@/components/editor/FunctionPanel.vue'
import ColorPanel from '@/components/editor/ColorSlips.vue'
import EditorView from '@/components/editor/EditorView.vue'
import ScaleRatioEditor from '@/components/editor/ScaleRatioEditor.vue'
import PagePreview from '@/components/editor/PagePreview.vue'
import TourGuide from '@/components/editor/TourGuide.vue'
import PopupBrandSettings from '@/components/popup/PopupBrandSettings.vue'
import PopupUpdateDesign from '@/components/popup/PopupUpdateDesign.vue'
import { mapGetters, mapMutations, mapState, mapActions } from 'vuex'
import { FunctionPanelType, SidebarPanelType } from '@/store/types'
import uploadUtils from '@/utils/uploadUtils'
import store from '@/store'
import rulerUtils from '@/utils/rulerUtils'
import stepsUtils from '@/utils/stepsUtils'
import logUtils from '@/utils/logUtils'
import stepsUtils from '@/utils/stepsUtils'
import uploadUtils from '@/utils/uploadUtils'
import editorUtils from '@/utils/editorUtils'

import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  components: {
    Sidebar,
    EditorHeader,
    SidebarPanel,
    EditorView,
    ScaleRatioEditor,
    FunctionPanel,
    ColorPanel,
    PagePreview,
    TourGuide,
    PopupBrandSettings,
    PopupUpdateDesign
  },
  data() {
    return {
      isSaving: false,
      isLoading: false
    }
  },
  computed: {
    ...mapGetters({
      useMobileEditor: 'getUseMobileEditor',
      isGlobalLoading: 'getIsGlobalLoading'
    }),
    ...mapGetters('user', {
      token: 'getToken',
      isUpdateDesignOpen: 'getIsUpdateDesignOpen'
    }),
    ...mapGetters('brandkit', {
      isBrandSettingsOpen: 'getIsSettingsOpen'
    }),
    isColorPanelOpen: {
      get: function (): boolean {
        return this.colorPanelOpenState ? this.colorPanelOpenState.val : false
      },
      set: function (newVal: boolean) {
        this.colorPanelOpenState.val = newVal
      }
    },
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
    localeOptions(): string[] {
      return i18n.availableLocales
    }
  },
  beforeRouteLeave(to, from, next) {
    // const answer = this.confirmLeave()
    // if (!answer) {
    //   next(false)
    //   return
    // }

    editorUtils.setCloseMobilePanelFlag(true)
    stepsUtils.clearSteps()
    if (uploadUtils.isLogin && this.$router.currentRoute.query.design_id && this.$router.currentRoute.query.type) {
      this.isSaving = true
      uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH).then(() => {
        uploadUtils.isGettingDesign = false
        logUtils.setLog('Leave editor')
        this.isSaving = false
        this.clearState()
        next()
      })
    } else {
      logUtils.setLog('Leave editor')
      this.clearState()
      next()
    }
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType',
      _setAdminMode: 'user/SET_ADMIN_MODE',
      clearState: 'CLEAR_state',
      clearBgRemoveState: 'bgRemove/CLEAR_bgRemoveState'
    }),
    setIsLoading(bool: boolean) {
      this.isLoading = true
    }
  }
})
</script>

<style lang="scss" scoped>
.editor {
  @include size(100%, 100%);
}
</style>
