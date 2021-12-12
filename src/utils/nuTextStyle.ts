import { IText } from '@/interfaces/layer'
import { Extension } from '@tiptap/core'
import tiptapUtils from './tiptapUtils'
import layerUtils from './layerUtils'
import stepsUtils from './stepsUtils'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nuTextStyle: {
      selectPrevious: () => ReturnType,
    }
  }
}

export default Extension.create({
  name: 'nuTextStyle',
  addStorage() {
    return {
      spanStyle: undefined,
      from: undefined,
      to: undefined
    }
  },
  onSelectionUpdate() {
    const spanStyle = this.editor.getAttributes('textStyle').style
    if (spanStyle) {
      this.storage.spanStyle = spanStyle
    }
    const selectionRanges = this.editor.view.state.selection.ranges
    if (selectionRanges.length > 0) {
      this.storage.from = selectionRanges[0].$from.pos
      this.storage.to = selectionRanges[0].$to.pos
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
        const paragraphs = (layerUtils.getCurrLayer as IText).paragraphs
        editor.chain().setContent(tiptapUtils.toHTML(paragraphs)).selectPrevious().run()
        return true
      },
      'Shift-Mod-z': ({ editor }) => {
        stepsUtils.redo()
        const paragraphs = (layerUtils.getCurrLayer as IText).paragraphs
        editor.chain().setContent(tiptapUtils.toHTML(paragraphs)).selectPrevious().run()
        return true
      },

      // Russian keyboard layouts
      'Mod-я': ({ editor }) => {
        stepsUtils.undo()
        const paragraphs = (layerUtils.getCurrLayer as IText).paragraphs
        editor.chain().setContent(tiptapUtils.toHTML(paragraphs)).selectPrevious().run()
        return true
      },
      'Shift-Mod-я': ({ editor }) => {
        stepsUtils.redo()
        const paragraphs = (layerUtils.getCurrLayer as IText).paragraphs
        editor.chain().setContent(tiptapUtils.toHTML(paragraphs)).selectPrevious().run()
        return true
      }
    }
  },
  addCommands() {
    return {
      selectPrevious: () => ({ commands }) => {
        const from = this.storage.from ?? 0
        const to = this.storage.to ?? 0
        console.log(from, to)
        return commands.setTextSelection({ from, to })
      }
    }
  }
})
