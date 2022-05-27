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
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  components: {
    EditorContent
  },
  props: {
    initText: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number
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
      const currLayer = layerUtils.getLayer(this.pageIndex, this.layerIndex)
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
      currLayer: layerUtils.getLayer(this.pageIndex, this.layerIndex) as IText | IGroup | ITmp,
      layerIndex: this.layerIndex,
      subLayerIdx: this.subLayerIndex
    }

    const contentEditable = this.subLayerIndex === -1 ? (this.layerInfo.currLayer as IText).contentEditable : ((this.layerInfo.currLayer as IGroup).layers[this.subLayerIndex] as IText).contentEditable

    tiptapUtils.init(this.initText, contentEditable)
    this.editor = tiptapUtils.editor
    tiptapUtils.on('update', ({ editor }) => {
      this.$emit('update', tiptapUtils.toIParagraph(editor.getJSON()))
      const newText = tiptapUtils.getText(editor)
      if (!editor.view.composing && (tiptapUtils.prevText !== newText)) {
        this.$nextTick(() => {
          stepsUtils.record()
        })
      }
      tiptapUtils.prevText = newText
      this.updateLayerProps({ isEdited: true })
      if (Object.prototype.hasOwnProperty.call(this.config, 'loadFontEdited')) {
        this.updateLayerProps({ loadFontEdited: true })
      }
    })
    tiptapUtils.onForceUpdate((editor) => {
      this.$emit('update', tiptapUtils.toIParagraph(editor.getJSON()))
    })
    tiptapUtils.on('create', ({ editor }) => {
      if (!this.config?.isEdited && !generalUtils.isTouchDevice) {
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: true })
        editor.commands.focus()
      }
      const editorDiv = editor.view.dom as HTMLDivElement
      if (editorDiv) {
        editorDiv.addEventListener('compositionend', () => {
          this.$emit('compositionend')
          this.$nextTick(() => {
            const pages = stepsUtils.getPrevPages()
            let currLayerInPrevStep = pages[this.pageIndex].layers[this.layerIndex]
            if (currLayerInPrevStep.type === 'group') {
              currLayerInPrevStep = (currLayerInPrevStep as IGroup).layers[this.subLayerIndex] as IText
            } else {
              currLayerInPrevStep = currLayerInPrevStep as IText
            }
            if (tiptapUtils.toText(currLayerInPrevStep) !== tiptapUtils.getText(editor)) { // record only when the updated text has not been recorded yet
              stepsUtils.record()
            }
            tiptapUtils.agent(editor => {
              editor.chain().setContent(tiptapUtils.toJSON(tiptapUtils.toIParagraph(editor.getJSON()).paragraphs)).selectPrevious().run()
            })
          })
        })
      }
    })
    tiptapUtils.on('focus', () => {
      this.updateLayerProps({ isTyping: true })
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
            layerUtils.updateLayerProps(this.pageIndex, layerIndex, props)
            break
          case 'group':
            layerUtils.updateSubLayerProps(this.pageIndex, layerIndex, subLayerIdx, props)
        }
      }
    }
  }
})
</script>

<style lang="scss">
.non-selectable[contenteditable="false"] {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}

.ProseMirror.non-selectable {
  white-space: pre-wrap;
}

::selection {
  color: currentColor;
  background-color: #acd2fe94;
}
</style>
