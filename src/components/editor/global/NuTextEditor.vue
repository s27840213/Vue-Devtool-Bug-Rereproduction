<template lang="pug">
  editor-content(:editor="editor")
</template>

<script lang="ts">
import Vue from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-2'
import StarterKit from '@tiptap/starter-kit'

export default Vue.extend({
  components: {
    EditorContent
  },
  props: {
    initText: String
  },
  data() {
    return {
      editor: undefined as Editor | undefined
    }
  },
  mounted() {
    this.editor = new Editor({
      content: this.initText ?? '',
      extensions: [
        StarterKit
      ]
    })
  },
  destroyed() {
    if (this.editor) {
      this.editor.destroy()
    }
  }
})
</script>
