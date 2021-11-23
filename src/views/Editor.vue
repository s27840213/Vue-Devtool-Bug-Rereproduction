<template lang="pug">
  div(class="editor")
    sidebar(:isSidebarPanelOpen="isSidebarPanelOpen"
      @toggleSidebarPanel="toggleSidebarPanel")
    section
      div(class="content")
        sidebar-panel(:isSidebarPanelOpen="isSidebarPanelOpen")
        div(class="content__main")
          div(class="content__editor")
            editor-view
            scale-ratio-editor(:style="scaleRatioEditorPos")
        div(class="content__panel"
            :style="contentPanelStyles")
          function-panel(@toggleColorPanel="toggleColorPanel")
          transition(name="panel-up")
            color-panel(v-if="isColorPanelOpen"
              @toggleColorPanel="toggleColorPanel")
        div(v-if="isShowPagePreview" class="content__pages")
          page-preview
</template>

<script lang="ts">
import Vue from 'vue'
import Sidebar from '@/components/editor/Sidebar.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import SidebarPanel from '@/components/editor/SidebarPanel.vue'
import FunctionPanel from '@/components/editor/FunctionPanel.vue'
import ColorPanel from '@/components/editor/ColorPanel.vue'
import EditorView from '@/components/editor/EditorView.vue'
import ScaleRatioEditor from '@/components/editor/ScaleRatioEditor.vue'
import PagePreview from '@/components/editor/PagePreview.vue'
import { mapGetters, mapMutations } from 'vuex'
import { FunctionPanelType, SidebarPanelType } from '@/store/types'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  name: 'Editor',
  components: {
    Sidebar,
    EditorHeader,
    SidebarPanel,
    EditorView,
    ScaleRatioEditor,
    FunctionPanel,
    ColorPanel,
    PagePreview
  },
  data() {
    return {
      FunctionPanelType,
      isColorPanelOpen: false,
      isSidebarPanelOpen: true
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      isShowPagePreview: 'page/getIsShowPagePreview',
      currPanel: 'getCurrSidebarPanelType'
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
        'grid-template-rows': '0.2fr 0.8fr'
      } : {
        'grid-template-rows': '1fr'
      }
    }
  },
  created() {
    window.addEventListener('beforeunload', this.beforeWindowUnload)
  },

  beforeDestroy() {
    window.removeEventListener('beforeunload', this.beforeWindowUnload)
  },
  beforeRouteLeave(to, from, next) {
    if (uploadUtils.isLogin) {
      uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH).then(() => {
        next()
      })
    } else {
      next()
    }
    // const answer = this.confirmLeave()
    // if (answer) {
    //   uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
    //   next()
    // } else {
    //   next(false)
    // }
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType'
    }),
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
    async beforeWindowUnload(e: any) {
      // Cancel the event
      if (uploadUtils.isLogin) {
        e.preventDefault()
        await uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
        // // Chrome requires returnValue to be set
        e.returnValue = 'Do you really want to leave? You have unsaved changes'
      }
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

.scale-ratio-editor::v-deep {
  position: absolute;
  bottom: 0px;
  z-index: setZindex("scale-ratio-editor");
}
</style>
