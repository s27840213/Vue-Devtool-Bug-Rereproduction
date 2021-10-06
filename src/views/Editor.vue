<template lang="pug">
  div(class="editor")
    editor-header
    sidebar
    section
      div(class="content")
        sidebar-panel
        div(class="content__main")
          div(class="content__editor")
            editor-view
            scale-ratio-editor
        div(class="content__panel")
          function-panel(@toggleColorPanel="toggleColorPanel")
          transition(name="panel-up")
            color-panel(v-if="isColorPanelOpen"
              @toggleColorPanel="toggleColorPanel")
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
import { mapGetters, mapMutations } from 'vuex'
import { FunctionPanelType } from '@/store/types'

export default Vue.extend({
  name: 'Editor',
  components: {
    Sidebar,
    EditorHeader,
    SidebarPanel,
    EditorView,
    ScaleRatioEditor,
    FunctionPanel,
    ColorPanel
  },
  data() {
    return {
      FunctionPanelType,
      isColorPanelOpen: false
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    isShape(): boolean {
      return this.currSelectedInfo.types.has('shape') && this.currSelectedInfo.layers.length === 1
    }
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
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
  }
}

.content {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr auto;
  padding-top: 50px;
  height: calc(100% - 50px);
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
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-columns: 1fr;
  }
}

.scale-ratio-editor::v-deep {
  position: absolute;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  z-index: setZindex("scale-ratio-editor");
}
</style>
