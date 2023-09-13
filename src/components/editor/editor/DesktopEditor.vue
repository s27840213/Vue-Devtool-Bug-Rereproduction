<template lang="pug">
div(class="desktop-editor")
  sidebar(:isSidebarPanelOpen="isSidebarPanelOpen"
    @toggleSidebarPanel="toggleSidebarPanel")
  section
    div(class="content")
      sidebar-panel(:isSidebarPanelOpen="isSidebarPanelOpen" :currPage="currPage")
      div(class="content__main")
        div(class="content__editor")
          div(v-if="!inBgRemoveMode" class="header-container")
            editor-header
          div(v-if="showAllAdminTool" class="admin-options")
            div(class="admin-options__sticky-container"
                :style="stickyTopPos")
              div(class="flex flex-column mr-10")
                span(class="ml-10 text-bold text-orange") {{templateText}}
                span(class="ml-10 pointer text-orange" @click="copyText(groupId)") {{groupId}}
              svg-icon(
                :iconName="`user-admin${getAdminModeText}`"
                :iconWidth="'20px'"
                :iconColor="'gray-2'"
                @click="setAdminMode()")
              svg-icon(
                iconName="vivisticker_logo"
                iconWidth="20px"
                :iconColor="stkMode ? 'black' : 'blue-1'"
                @click="switchApp")
              div(class="flex flex-column")
                select(class="locale-select" v-model="inputLocale")
                  option(v-for="locale in localeOptions" :key="locale" :value="locale") {{locale}}
              div(class="ml-10" @click="setEnableComponentLog(!enableComponentLog)")
                span {{`${enableComponentLog ? '關閉' : '開啟'} Log`}}
          editor-view(:currPage="currPage" :isSidebarPanelOpen="isSidebarPanelOpen")
          scale-ratio-editor(v-if="!isShowPagePreview" @toggleSidebarPanel="toggleSidebarPanel")
      div(class="content__panel"
          :style="contentPanelStyles")
        function-panel(:currPage="currPage")
        transition(name="panel-up")
          color-slips(v-if="showColorSlips" mode="FunctionPanel"
            :selectedColor="currEventColor()"
            :currPage="currPage"
            class="content__panel__color-panel")
      div(v-if="isShowPagePreview" class="content__pages")
        page-preview
  tour-guide(v-if="showEditorGuide")
  popup-brand-settings(v-if="isBrandSettingsOpen")
  popup-update-design(v-if="isUpdateDesignOpen")
  component-log(v-if="enableComponentLog" :logs="componentLogs")
</template>

<script lang="ts">
import ComponentLog from '@/components/componentLog/ComponentLog.vue'
import ColorSlips from '@/components/editor/ColorSlips.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import EditorView from '@/components/editor/EditorView.vue'
import FunctionPanel from '@/components/editor/FunctionPanel.vue'
import PagePreview from '@/components/editor/PagePreview.vue'
import ScaleRatioEditor from '@/components/editor/ScaleRatioEditor.vue'
import Sidebar from '@/components/editor/Sidebar.vue'
import SidebarPanel from '@/components/editor/SidebarPanel.vue'
import TourGuide from '@/components/editor/TourGuide.vue'
import PopupBrandSettings from '@/components/popup/PopupBrandSettings.vue'
import PopupUpdateDesign from '@/components/popup/PopupUpdateDesign.vue'
import i18n, { LocaleName } from '@/i18n'
import { IComponentUpdatedLog } from '@/interfaces/componentUpdateLog'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import brandkitUtils from '@/utils/brandkitUtils'
import colorUtils from '@/utils/colorUtils'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import logUtils from '@/utils/logUtils'
import rulerUtils from '@/utils/rulerUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

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
  emits: ['setIsLoading'],
  data() {
    return {
      isSidebarPanelOpen: true,
      inputLocale: i18n.global.locale,
      stkMode: /app=1/.test(window.location.href),
      componentLogs: [] as Array<IComponentUpdatedLog>
    }
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  created() {
    this.inputLocale = this.$i18n.locale as LocaleName
    const self = this as any
    self.$eventBus.on('on-re-rendering', (component: IComponentUpdatedLog) => {
      if (this.componentLogs.length >= 50) {
        this.componentLogs.shift()
      }
      this.componentLogs.push(component)
    })
  },
  watch: {
    isShowPagePreview() {
      this.toggleSidebarPanel = this.isShowPagePreview
    },
    async inputLocale() {
      this.$emit('setIsLoading', true)
      const updateValue: { [key: string]: string } = {}
      updateValue.token = this.token
      updateValue.locale = this.inputLocale

      await store.dispatch('user/updateUser', updateValue)
        .then((value) => {
          if (!value.data.flag) {
            localStorage.setItem('locale', value.data.locale)
            this.$router.go(0)
          } else {
            this.networkError()
          }
        }, () => {
          this.networkError()
        })
    }
  },
  computed: {
    ...mapState('user', [
      'adminMode',
      'viewGuide']),
    ...mapGetters({
      groupId: 'getGroupId',
      currSelectedInfo: 'getCurrSelectedInfo',
      isShowPagePreview: 'page/getIsShowPagePreview',
      currPanel: 'getCurrSidebarPanelType',
      groupType: 'getGroupType',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      enableComponentLog: 'getEnalbleComponentLog',
      showAllAdminTool: 'user/showAllAdminTool'
    }),
    ...mapGetters('user', {
      token: 'getToken',
      isUpdateDesignOpen: 'getIsUpdateDesignOpen'
    }),
    ...mapGetters('brandkit', {
      isBrandSettingsOpen: 'getIsSettingsOpen'
    }),
    showColorSlips(): boolean {
      return editorUtils.showColorSlips
    },
    contentPanelStyles(): { [index: string]: string } {
      return this.showColorSlips ? {
        'grid-template-rows': '1fr 1fr'
      } : {
        'grid-template-rows': '1fr'
      }
    },
    getAdminModeText(): string {
      return this.adminMode ? '' : '-disable'
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
      editorUtils.toggleColorSlips(false)
    })
    if (brandkitUtils.isBrandkitAvailable) {
      brandkitUtils.fetchBrands(this.fetchBrands)
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
    currEventColor(): string {
      return colorUtils.globalSelectedColor.currEventColor
    },
    setAdminMode() {
      this._setAdminMode(!this.adminMode)
    },
    switchApp() {
      this.stkMode = !this.stkMode
      const url = new URL(window.location.href)
      this.stkMode ? url.searchParams.append('app', '1') : url.searchParams.delete('app')
      window.location.href = url.toString()
    },
    toggleSidebarPanel(bool: boolean) {
      this.isSidebarPanelOpen = bool
    },
    copyText(text: string) {
      generalUtils.copyText(text)
      notify({ group: 'copy', text: `${text} 已複製` })
    },
    networkError(): void {
      notify({ group: 'error', text: `${i18n.global.t('NN0351')}` })
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
    border-left: 1px solid setColor(gray-4,0.2);
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
