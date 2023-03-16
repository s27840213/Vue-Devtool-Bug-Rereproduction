<template lang="pug">
editor-content(:editor="(editor as Editor)" :style="layerStyles")
</template>

<script lang="ts">
import { IGroup, IText, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import layerUtils from '@/utils/layerUtils'
import stepsUtils from '@/utils/stepsUtils'
import textBgUtils from '@/utils/textBgUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { isEqual } from 'lodash'
import { defineComponent, PropType } from 'vue'

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
    page: {
      type: Object as PropType<IPage>,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    config: {
      type: Object as PropType<IText>,
      required: true
    },
    primaryLayer: {
      type: Object
    },
    subLayerIndex: {
      type: Number,
      required: true
    }
  },
  emits: ['update', 'compositionend'],
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
  mounted() {
    this.layerInfo = {
      currLayer: (this.primaryLayer ? this.primaryLayer : this.config) as IText | IGroup | ITmp,
      layerIndex: this.layerIndex,
      subLayerIdx: this.subLayerIndex
    }

    const contentEditable = this.config.contentEditable

    tiptapUtils.init(this.initText, contentEditable)
    // tiptapUtils.applyDivStyle()
    /**
     * @Note why I use as any is bcz when I update the tiptap from vue2 ver to vue 3 ver, it throw some weird error
     * If TingAn is avalible, maybe we could discuss and fix the error.
     */
    this.editor = tiptapUtils.editor as any
    tiptapUtils.on('update', ({ editor }) => {
      let toRecord = false
      const newJSON = editor.getJSON()
      const newText = tiptapUtils.getText(newJSON)
      if (!editor.view.composing && (tiptapUtils.prevText !== newText)) {
        toRecord = true
      }
      this.$emit('update', { ...tiptapUtils.toIParagraph(newJSON), toRecord })
      if (!isEqual(newJSON, tiptapUtils.prevJSON)) {
        this.updateLayerProps({ isEdited: true })
        if (Object.prototype.hasOwnProperty.call(this.config, 'loadFontEdited')) {
          this.updateLayerProps({ loadFontEdited: true })
        }
      }
      tiptapUtils.prevText = newText
      tiptapUtils.prevJSON = newJSON
    })
    tiptapUtils.onForceUpdate((editor, toRecord) => {
      this.$emit('update', { ...tiptapUtils.toIParagraph(editor.getJSON()), toRecord })
    })
    tiptapUtils.on('create', ({ editor }) => {
      if (this.config?.contentEditable && !this.$isTouchDevice()) {
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
          this.$emit('update', { ...tiptapUtils.toIParagraph(editor.getJSON()) })
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
      if (this.$isTouchDevice()) {
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
  computed: {
    layerStyles() {
      const layer = layerUtils.getCurrLayer as IText
      return {
        ...textBgUtils.convertTextEffect(layer.styles.textBg).div
      }
    }
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

.ProseMirror:hover, .ProseMirror:not(:hover)  {
  position: initial; // Overwrite 'position: relative' css rule
}

.ProseMirror.non-selectable {
  outline: none;
  white-space: pre-wrap;
  font-variant-ligatures: unset;
}

::selection {
  color: currentColor;
  background-color: #acd2fe94;
}
</style>
