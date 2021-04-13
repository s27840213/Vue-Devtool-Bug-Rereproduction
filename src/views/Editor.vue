<template lang="pug">
  div(class="editor")
    sidebar
    section
      editor-header
      div(class="content")
        function-panel
        div(class="content__main")
          div(class="content__blank bg-white")
            div(class="test-nav")
              div(v-for="nav in testNav" @click="setPanelType(PanelType[nav])") {{nav}}
          div(class="content__editor")
            editor-view
            size-editor
</template>

<script lang="ts">
import Vue from 'vue'
import Sidebar from '@/components/editor/Sidebar.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import FunctionPanel from '@/components/editor/FunctionPanel.vue'
import EditorView from '@/components/editor/EditorView.vue'
import Frames from '@/components/editor/Frames.vue'
import SizeEditor from '@/components/editor/SizeEditor.vue'
import { mapMutations } from 'vuex'
import { PanelType } from '@/store/types'

export default Vue.extend({
  name: 'Editor',
  components: {
    Sidebar,
    EditorHeader,
    FunctionPanel,
    EditorView,
    Frames,
    SizeEditor
  },
  data() {
    return {
      PanelType,
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
      SET_currPanelType: 'SET_currPanelType'
    }),
    setPanelType(type: number) {
      this.SET_currPanelType(type)
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
  grid-template-columns: auto 1fr;
  &__main {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
  }
  &__blank {
    @include size(100%, 50px);
    @include flexCenter;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
    z-index: setZindex("default-1");
  }
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
