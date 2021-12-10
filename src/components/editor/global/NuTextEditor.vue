<template lang="pug">
  editor-content(:editor="editor")
</template>

<script lang="ts">
import Vue from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-2'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import NuTextStyle from '@/utils/nuTextStyle'

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
    // content: this.initText ?? '',
    // content: '<p><span style="font-weight: bold">test</span></p>',
    this.editor = new Editor({
      content: this.initText ?? '',
      extensions: [
        Document,
        Paragraph,
        Text,
        TextStyle,
        NuTextStyle
      ],
      autofocus: 'start',
      onFocus({ editor }) {
        editor.commands.selectAll()
      },
      onUpdate({ editor }) {
        console.log(editor.getJSON())
      }
    })
  },
  destroyed() {
    if (this.editor) {
      this.editor.destroy()
    }
  }
})
</script>
