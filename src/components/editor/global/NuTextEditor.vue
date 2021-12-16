<template lang="pug">
  editor-content(:editor="editor")
</template>

<script lang="ts">
import Vue from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-2'
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
      editor: undefined as Editor | undefined
    }
  },
  mounted() {
    tiptapUtils.init(this.initText)
    this.editor = tiptapUtils.editor
    tiptapUtils.on('update', ({ editor }) => {
      this.$emit('update', tiptapUtils.toIParagraph(editor.getJSON()))
      if (!editor.view.composing && (tiptapUtils.prevText !== editor.getText())) {
        this.$nextTick(() => {
          stepsUtils.record()
        })
      }
      tiptapUtils.prevText = editor.getText()
    })
    tiptapUtils.onForceUpdate((editor) => {
      this.$emit('update', tiptapUtils.toIParagraph(editor.getJSON()))
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
    if (this.editor) {
      this.editor.destroy()
    }
  }
})
</script>

<style lang="scss">
.non-selectable[contenteditable] {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;;
}
</style>
