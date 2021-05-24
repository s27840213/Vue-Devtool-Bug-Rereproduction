<template lang="pug">
  div(class="editor")
    sidebar
    section
      editor-header
      div(class="content")
        sidebar-panel
        div(class="content__main")
          //- div(class="content__blank bg-white")
          //-   div(class="test-nav")
          //-     div(v-for="nav in testNav" @click="setPanelType(FunctionPanelType[nav])") {{nav}}
          div(class="content__editor")
            editor-view
            size-editor
        function-panel
</template>

<script lang="ts">
import Vue from 'vue'
import Sidebar from '@/components/editor/Sidebar.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import SidebarPanel from '@/components/editor/SidebarPanel.vue'
import FunctionPanel from '@/components/editor/FunctionPanel.vue'
import EditorView from '@/components/editor/EditorView.vue'
import SizeEditor from '@/components/editor/SizeEditor.vue'
import { mapMutations } from 'vuex'
import { FunctionPanelType } from '@/store/types'

export default Vue.extend({
  name: 'Editor',
  components: {
    Sidebar,
    EditorHeader,
    SidebarPanel,
    EditorView,
    SizeEditor,
    FunctionPanel
  },
  data() {
    return {
      FunctionPanelType,
      testNav: [
        'group',
        'textSetting',
        'colorPicker',
        'pageSetting',
        'photoSetting']
    }
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType'
    }),
    setPanelType(type: number) {
      this.setCurrFunctionPanel(type)
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
  &__main {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr;
  }
  // &__blank {
  //   @include size(100%, 50px);
  //   @include flexCenter;
  //   box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
  //   z-index: setZindex("default-1");
  // }
  &__editor {
    position: relative;
    height: 100%;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr auto;
  }
}

.size-editor::v-deep {
  position: absolute;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  z-index: setZindex("size-editor");
}

.test-nav {
  display: flex;
  top: 10px;
  left: 10px;
  > div {
    margin: 0px 5px;
    border: 1px solid setColor(gray-3);
    padding: 5px 10px;
    border-radius: 25px;
    cursor: pointer;
  }
}
</style>
