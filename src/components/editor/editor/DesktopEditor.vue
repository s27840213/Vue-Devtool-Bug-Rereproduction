<template lang="pug">
div(class="desktop-editor")
  sidebar(:isSidebarPanelOpen="isSidebarPanelOpen"
    @toggleSidebarPanel="toggleSidebarPanel")
  section
    div(class="content")
      sidebar-panel(:isSidebarPanelOpen="isSidebarPanelOpen")
      div(class="content__main")
        div(class="content__editor")
          div(v-if="!inBgRemoveMode" class="header-container")
            editor-header
          div(v-if="isAdmin" class="admin-options")
            div(class="admin-options__sticky-container"
                :style="stickyTopPos")
              div(class="flex flex-column mr-10")
                span(class="ml-10 text-bold text-orange") {{templateText}}
                span(class="ml-10 pointer text-orange" @click="copyText(groupId)") {{groupId}}
              svg-icon(v-if="isAdmin"
                class="mr-10"
                :iconName="`user-admin${getAdminModeText}`"
                :iconWidth="'20px'"
                :iconColor="'gray-2'"
                @click.native="setAdminMode()")
              div(class="flex flex-column")
                select(class="locale-select" v-model="inputLocale")
                  option(v-for="locale in localeOptions" :value="locale") {{locale}}
              div(class="ml-10" @click="setEnableComponentLog(!enableComponentLog)")
                span {{`${enableComponentLog ? '關閉' : '開啟'} Log`}}
          editor-view
          scale-ratio-editor(@toggleSidebarPanel="toggleSidebarPanel")
      div(class="content__panel"
          :style="contentPanelStyles")
        function-panel(@toggleColorPanel="toggleColorPanel")
        transition(name="panel-up")
          color-slips(v-if="isColorPanelOpen" mode="FunctionPanel"
            class="content__panel__color-panel"
            @toggleColorPanel="toggleColorPanel")
      div(v-if="isShowPagePreview" class="content__pages")
        page-preview
  tour-guide(v-if="showEditorGuide")
  popup-brand-settings(v-if="isBrandSettingsOpen")
  popup-update-design(v-if="isUpdateDesignOpen")
  component-log(v-if="enableComponentLog" :logs="componentLogs")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Sidebar from '@/components/editor/Sidebar.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import SidebarPanel from '@/components/editor/SidebarPanel.vue'
import FunctionPanel from '@/components/editor/FunctionPanel.vue'
import ColorSlips from '@/components/editor/ColorSlips.vue'
import EditorView from '@/components/editor/EditorView.vue'
import ScaleRatioEditor from '@/components/editor/ScaleRatioEditor.vue'
import PagePreview from '@/components/editor/PagePreview.vue'
import TourGuide from '@/components/editor/TourGuide.vue'
import PopupBrandSettings from '@/components/popup/PopupBrandSettings.vue'
import PopupUpdateDesign from '@/components/popup/PopupUpdateDesign.vue'
import { mapGetters, mapMutations, mapState, mapActions } from 'vuex'
import { FunctionPanelType, SidebarPanelType } from '@/store/types'
import store from '@/store'
import rulerUtils from '@/utils/rulerUtils'
import logUtils from '@/utils/logUtils'
import colorUtils from '@/utils/colorUtils'
import brandkitUtils from '@/utils/brandkitUtils'
import pageUtils from '@/utils/pageUtils'
import ComponentLog from '@/components/componentLog/ComponentLog.vue'
import { IComponentUpdatedLog } from '@/interfaces/componentUpdateLog'

export default defineComponent({
  name: 'DesktopEditor',
  components: {
    Sidebar,
    EditorHeader,
    SidebarPanel,
    EditorView,
    ScaleRatioEditor,
    FunctionPanel,
    ColorSlips,
    PagePreview,
    TourGuide,
    PopupBrandSettings,
    PopupUpdateDesign,
    ComponentLog
  },
  data() {
    return {
      FunctionPanelType,
      isSidebarPanelOpen: true,
      inputLocale: '',
      // isColorPanelOpen: false
      colorPanelOpenState: {
        val: false
      },
      componentLogs: [] as Array<IComponentUpdatedLog>
    }
  },
  created() {
    this.inputLocale = this.$i18n.locale
    // this.$root.$on('on-re-rendering', (component: IComponentUpdatedLog) => {
    //   if (this.componentLogs.length >= 50) {
    //     this.componentLogs.shift()
    //   }
    //   this.componentLogs.push(component)
    // })
  },
  watch: {
    isShowPagePreview() {
      this.toggleSidebarPanel = this.isShowPagePreview
    },
    async inputLocale() {
      // this.$emit('setIsLoading', true)
      // const updateValue: { [key: string]: string } = {}
      // updateValue.token = this.token
      // updateValue.locale = this.inputLocale

      // await store.dispatch('user/updateUser', updateValue)
      //   .then((value) => {
      //     if (!value.data.flag) {
      //       localStorage.setItem('locale', value.data.locale)
      //       this.$router.go(0)
      //     } else {
      //       this.networkError()
      //     }
      //   }, () => {
      //     this.networkError()
      //   })
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
      isShowPagePreview: 'page/getIsShowPagePreview',
      currPanel: 'getCurrSidebarPanelType',
      groupType: 'getGroupType',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      enableComponentLog: 'getEnalbleComponentLog'
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
      return this.$i18n.availableLocales
    }
  },
  mounted() {
    logUtils.setLog('Editor mounted')
    this.clearBgRemoveState()
    colorUtils.on('closeColorPanel', () => {
      this.colorPanelOpenState.val = false
    })
    if (brandkitUtils.isBrandkitAvailable) {
      brandkitUtils.fetchBrands(this.fetchBrands)
    }

    // load size from query for new design
    const newDesignWidth = parseInt(this.$route.query.width as string)
    const newDesignHeight = parseInt(this.$route.query.height as string)
    if (newDesignWidth && newDesignHeight) {
      pageUtils.setPageSize(0, newDesignWidth, newDesignHeight)
      pageUtils.fitPage()
    }
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType',
      _setAdminMode: 'user/SET_ADMIN_MODE',
      clearBgRemoveState: 'bgRemove/CLEAR_bgRemoveState',
      setEnableComponentLog: 'SET_enalbleComponentLog'
    }),
    ...mapActions({
      fetchBrands: 'brandkit/fetchBrands'
    }),
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
      this.isSidebarPanelOpen = bool
    },
    confirmLeave() {
      return window.confirm('Do you really want to leave? you have unsaved changes!')
    },
    networkError(): void {
      // Vue.notify({ group: 'error', text: `${i18n.t('NN0351')}` })
      this.$emit('setIsLoading', false)
    }
  }
})
</script>

<style lang="scss" scoped>
.desktop-editor {
  @include size(100%, 100%);
  max-height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr;
  user-select: none;
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
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr;
  }

  &__editor {
    position: relative;
    height: 100%;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr auto;
  }

  &__panel {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr;
    &__color-panel {
      height: 50%;
      position: absolute;
      bottom: 0;
      left: 0;
      z-index: setZindex("color-panel");
    }
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
  transform: translate(-50%, 0px);
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
</style>
