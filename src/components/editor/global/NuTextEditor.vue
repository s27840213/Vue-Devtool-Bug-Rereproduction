<template lang="pug">
  editor-content(:editor="editor")
</template>

<script lang="ts">
import Vue from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-2'
import tiptapUtils from '@/utils/tiptapUtils'
import stepsUtils from '@/utils/stepsUtils'
import { IGroup, IText, ITmp } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'

export default Vue.extend({
  components: {
    EditorContent
  },
  props: {
    initText: String
  },
  data() {
    return {
      editor: undefined as Editor | undefined,
      layerInfo: {} as {
        currLayer: IText | IGroup | ITmp,
        layerIndex: number,
        subLayerIdx: number
      } | undefined
    }
  },
  computed: {
    config(): IText | undefined {
      const currLayer = layerUtils.getCurrLayer
      switch (currLayer.type) {
        case 'text':
          return currLayer as IText
        case 'group':
          return (currLayer as IGroup).layers.find(l => l.active) as IText ?? undefined
        default:
          console.error('cannt access acitve text config')
          return undefined
      }
    }
  },
  mounted() {
    this.layerInfo = {
      currLayer: layerUtils.getCurrLayer as IText | IGroup | ITmp,
      layerIndex: layerUtils.layerIndex,
      subLayerIdx: layerUtils.subLayerIdx
    }

    tiptapUtils.init(this.initText)
    this.editor = tiptapUtils.editor
    tiptapUtils.on('update', ({ editor }) => {
      // console.log(JSON.stringify(tiptapUtils.getText(editor)))
      this.$emit('update', tiptapUtils.toIParagraph(editor.getJSON()))
      if (!editor.view.composing && (tiptapUtils.prevText !== tiptapUtils.getText(editor))) {
        this.$nextTick(() => {
          stepsUtils.record()
        })
      }
      tiptapUtils.prevText = tiptapUtils.getText(editor)
      this.updateLayerProps({ isEdited: true })
      if (Object.prototype.hasOwnProperty.call(this.config, 'loadFontEdited')) {
        this.updateLayerProps({ loadFontEdited: true })
      }
    })
    tiptapUtils.onForceUpdate((editor) => {
      this.$emit('update', tiptapUtils.toIParagraph(editor.getJSON()))
    })
    tiptapUtils.on('create', ({ editor }) => {
      if (!this.config?.isEdited) {
        editor.commands.focus()
      }
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
    tiptapUtils.on('focus', ({ editor }) => {
      this.updateLayerProps({ isTyping: true })
      if (!this.config?.isEdited) {
        editor.commands.selectAll()
      }
    })
    tiptapUtils.on('blur', () => {
      this.updateLayerProps({ isTyping: false })
    })
  },
  destroyed() {
    if (this.editor) {
      this.editor.destroy()
    }
    this.layerInfo = undefined
  },
  methods: {
    updateLayerProps(props: { [key: string]: string | number | boolean }) {
      if (this.layerInfo) {
        const { currLayer, layerIndex, subLayerIdx } = this.layerInfo
        switch (currLayer.type) {
          case 'text':
            layerUtils.updateLayerProps(layerUtils.pageIndex, layerIndex, props)
            break
          case 'group':
            layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, subLayerIdx, props)
        }
      }
    }
  }
})
</script>

<style lang="scss">
.non-selectable[contenteditable=false] {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}
</style>
