<template lang="pug">
editor-content(:editor="editor")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-2'
import tiptapUtils from '@/utils/tiptapUtils'
import stepsUtils from '@/utils/stepsUtils'
import { IGroup, IText, ITmp } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  components: {
    EditorContent
  },
  props: {
    initText: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    subLayerIndex: {
      type: Number,
      required: true
    }
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
      let toRecord = false
      const newText = tiptapUtils.getText(editor)
      if (!editor.view.composing && (tiptapUtils.prevText !== newText)) {
        toRecord = true
      }
      this.$emit('update', { ...tiptapUtils.toIParagraph(editor.getJSON()), toRecord })
      tiptapUtils.prevText = newText
      this.updateLayerProps({ isEdited: true })
      if (Object.prototype.hasOwnProperty.call(this.config, 'loadFontEdited')) {
        this.updateLayerProps({ loadFontEdited: true })
      }
    })
    tiptapUtils.onForceUpdate((editor, toRecord) => {
      this.$emit('update', { ...tiptapUtils.toIParagraph(editor.getJSON()), toRecord })
    })
    tiptapUtils.on('create', ({ editor }) => {
      if (!this.config?.isEdited && !generalUtils.isTouchDevice()) {
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { contentEditable: true })
        editor.commands.focus()
      }
      const editorDiv = editor.view.dom as HTMLDivElement
      if (editorDiv) {
        editorDiv.addEventListener('compositionend', () => {
          let toRecord = false
          const pages = stepsUtils.getPrevPages()
          let currLayerInPrevStep = pages[this.pageIndex].layers[this.layerIndex]
          if (currLayerInPrevStep.type === 'group') {
            currLayerInPrevStep = (currLayerInPrevStep as IGroup).layers[this.subLayerIndex] as IText
          } else {
            currLayerInPrevStep = currLayerInPrevStep as IText
          }
          if (tiptapUtils.toText(currLayerInPrevStep) !== tiptapUtils.getText(editor)) { // record only when the updated text has not been recorded yet
            toRecord = true
          }
          this.$emit('compositionend', toRecord)
          tiptapUtils.agent(editor => {
            // setContent will be skipped while composing even when isSetContentRequired is true in NuController/NuSubController.
            // So do it here. (the JSON created by toJSON(.) is probably different from editor.getJSON(.))
            editor.chain().setContent(tiptapUtils.toJSON(tiptapUtils.toIParagraph(editor.getJSON()).paragraphs)).selectPrevious().run()
          })
        })
      }
    })
    tiptapUtils.on('focus', () => {
      // this.updateLayerProps({ isTyping: true })
    })
    tiptapUtils.on('blur', () => {
      this.updateLayerProps({ isTyping: false })
      if (generalUtils.isTouchDevice()) {
        this.updateLayerProps({ contentEditable: false })
      }
    })
  },
  unmounted() {
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
  font-variant-ligatures: unset;
}

::selection {
  color: currentColor;
  background-color: #acd2fe94;
}
</style>
