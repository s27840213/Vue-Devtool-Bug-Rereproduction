<template lang="pug">
  editor-content(:editor="tiptapUtils.editor")
</template>

<script lang="ts">
import Vue from 'vue'
import { EditorContent } from '@tiptap/vue-2'
import tiptapUtils from '@/utils/tiptapUtils'
import stepsUtils from '@/utils/stepsUtils'

export default Vue.extend({
  components: {
    EditorContent
  },
  props: {
    initText: String
  },
  data() {
    return {
      tiptapUtils
    }
  },
  mounted() {
    tiptapUtils.init(this.initText)
    tiptapUtils.on('update', ({ editor }) => {
      this.$emit('update', tiptapUtils.toIParagraph(editor.getJSON()))
      if (!editor.view.composing && (tiptapUtils.prevText !== editor.getText())) {
        this.$nextTick(() => {
          stepsUtils.record()
        })
      }
      tiptapUtils.prevText = editor.getText()
    })
    tiptapUtils.on('create', ({ editor }) => {
      const editorDiv = editor.view.dom as HTMLDivElement
      if (editorDiv) {
        editorDiv.addEventListener('compositionend', () => {
          this.$nextTick(() => {
            stepsUtils.record()
            tiptapUtils.agent(editor => {
              editor.chain().setContent(tiptapUtils.toHTML(tiptapUtils.toIParagraph(editor.getJSON()).paragraphs)).selectPrevious().run()
            })
          })
        })
      }
    })
  },
  destroyed() {
    tiptapUtils.destroy()
  }
})
</script>
