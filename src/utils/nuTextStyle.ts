import Vue from 'vue'
import { IText } from '@/interfaces/layer'
import { Extension } from '@tiptap/core'
import tiptapUtils from './tiptapUtils'
import layerUtils from './layerUtils'
import stepsUtils from './stepsUtils'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nuTextStyle: {
      selectPrevious: () => ReturnType,
      sync: () => ReturnType,
      setSpanProps: (props:{[key: string]: string}) => ReturnType,
      setParagraphProps: (props:{[key: string]: string}) => ReturnType
    }
  }
}

export default Extension.create({
  name: 'nuTextStyle',
  addStorage() {
    return {
      spanStyle: undefined,
      from: undefined,
      to: undefined,
      prevChangeCount: 0
    }
  },
  onSelectionUpdate() {
    const spanStyle = this.editor.getAttributes('textStyle').style
    if (spanStyle) {
      this.storage.spanStyle = spanStyle
    }
    const selectionRanges = this.editor.view.state.selection.ranges
    if (selectionRanges.length > 0) {
      const from = selectionRanges[0].$from.pos
      const to = selectionRanges[0].$to.pos
      this.storage.from = from
      this.storage.to = to
      layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, {
        selection: { from, to }
      })
      const currChangeCount = (this.editor.view as any).domChangeCount
      if (currChangeCount === this.storage.prevChangeCount && !this.editor.view.composing) {
        stepsUtils.updateHead(layerUtils.pageIndex, layerUtils.layerIndex, {
          selection: { from, to }
        })
      }
      this.storage.prevChangeCount = currChangeCount
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle', 'paragraph'],
        attributes: {
          style: {
            default: null,
            parseHTML: element => {
              return element.style
            },
            renderHTML: attributes => {
              if (!attributes.style) return {}
              return {
                style: attributes.style.cssText + ' margin: 0;'
              }
            }
          }
        }
      }, {
        types: ['paragraph'],
        attributes: {
          spanStyle: {
            default: null,
            parseHTML: element => {
              const cssText = element.getAttribute('data-span-style')
              if (cssText) {
                const el = document.createElement('div')
                el.style.cssText = cssText
                return el.style
              } else {
                return null
              }
            },
            renderHTML: attributes => {
              if (!attributes.spanStyle) return {}
              return {
                'data-span-style': attributes.spanStyle.cssText
              }
            }
          }
        }
      }
    ]
  },
  addKeyboardShortcuts() {
    return {
      'Mod-z': ({ editor }) => {
        stepsUtils.undo()
        Vue.nextTick(() => {
          if (!tiptapUtils.editor) return
          editor.commands.sync()
        })
        return true
      },
      'Shift-Mod-z': ({ editor }) => {
        stepsUtils.redo()
        Vue.nextTick(() => {
          if (!tiptapUtils.editor) return
          editor.commands.sync()
        })
        return true
      },

      // Russian keyboard layouts
      'Mod-я': ({ editor }) => {
        stepsUtils.undo()
        Vue.nextTick(() => {
          if (!tiptapUtils.editor) return
          editor.commands.sync()
        })
        return true
      },
      'Shift-Mod-я': ({ editor }) => {
        stepsUtils.redo()
        Vue.nextTick(() => {
          if (!tiptapUtils.editor) return
          editor.commands.sync()
        })
        return true
      }
    }
  },
  addCommands() {
    return {
      selectPrevious: () => ({ commands }) => {
        const from = this.storage.from ?? 0
        const to = this.storage.to ?? 0
        return commands.setTextSelection({ from, to })
      },
      sync: () => ({ chain }) => {
        const currLayer = layerUtils.getCurrLayer as IText
        const paragraphs = currLayer.paragraphs
        const selection = currLayer.selection
        return chain().setContent(tiptapUtils.toHTML(paragraphs)).setTextSelection(selection).run()
      },
      setSpanProps: (props: {[key: string]: string}) => ({ editor, commands }) => {
        let updateOnSpan = true
        let currStyles
        const spanStyles = editor.getAttributes('textStyle')
        if (spanStyles.style) {
          currStyles = spanStyles.style
        } else {
          updateOnSpan = false
          const paragraphStyles = editor.getAttributes('paragraph')
          if (paragraphStyles.spanStyle) {
            currStyles = paragraphStyles.spanStyle
          } else {
            currStyles = editor.storage.nuTextStyle.spanStyle
          }
        }
        // copy CSSStyleDeclaration
        const el = document.createElement('div')
        el.style.cssText = currStyles.cssText
        currStyles = el.style
        for (const [key, value] of Object.entries(props)) {
          currStyles.setProperty(key, value)
        }
        if (updateOnSpan) {
          return commands.updateAttributes('textStyle', { style: currStyles })
        } else {
          return commands.updateAttributes('paragraph', { spanStyle: currStyles })
        }
      },
      setParagraphProps: (props: {[key: string]: string}) => ({ editor, commands }) => {
        let currStyles = editor.getAttributes('paragraph').style
        // copy CSSStyleDeclaration
        const el = document.createElement('div')
        el.style.cssText = currStyles.cssText
        currStyles = el.style
        for (const [key, value] of Object.entries(props)) {
          currStyles.setProperty(key, value)
        }
        return commands.updateAttributes('paragraph', { style: currStyles })
      }
    }
  }
})
