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
      tiptapUtils,
      isComposing: false
    }
  },
  mounted() {
    // content: '<p><span style="font-weight: bold">test</span></p>',
    tiptapUtils.init(this.initText)
    tiptapUtils.on('update', ({ editor }) => {
      this.$emit('update', tiptapUtils.toIParagraph(editor.getJSON()))
      if (!this.isComposing) {
        this.$nextTick(() => {
          stepsUtils.record()
        })
      }
    })
    tiptapUtils.on('create', ({ editor }) => {
      const editorDiv = (editor.options.element as HTMLElement).firstElementChild
      if (editorDiv) {
        editorDiv.addEventListener('compositionstart', () => {
          this.isComposing = true
        })
        editorDiv.addEventListener('compositionend', () => {
          this.isComposing = false
          stepsUtils.record()
        })
      }
    })
  },
  destroyed() {
    tiptapUtils.destroy()
  }
})
</script>
