<template lang="pug">
  div(class="editor")
    sidebar
    div
      editor-header
      div(class="content")
        function-panel
        div(class="bg-gray-6")
          div(class="content__blank bg-white")
          div
            editor-view
            frames
</template>

<script lang="ts">
import Vue from 'vue';
import Sidebar from '@/components/editor/Sidebar.vue';
import EditorHeader from '@/components/editor/EditorHeader.vue';
import FunctionPanel from '@/components/editor/FunctionPanel.vue';
import EditorView from '@/components/editor/EditorView.vue';
import Frames from '@/components/editor/Frames.vue';

export default Vue.extend({
  name: 'Editor',
  components: {
    Sidebar,
    EditorHeader,
    FunctionPanel,
    EditorView,
    Frames
  },
  data() {
    return {

    }
  }
})
</script>

<style lang="scss" scoped>
.editor {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr;
  > div:nth-child(2) {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
  }
}

.content {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr;
  > div:nth-child(2) {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: 1fr;
    > div:nth-child(2) {
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      grid-template-columns: 1fr auto;
    }
  }
  &__blank {
    @include size(100%, 50px);
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
    z-index: setZindex("default-1");
  }
}
</style>
