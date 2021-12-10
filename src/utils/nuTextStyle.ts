import { IText } from '@/interfaces/layer'
import { Extension } from '@tiptap/core'
import tiptapUtils from './tiptapUtils'
import layerUtils from './layerUtils'
import stepsUtils from './stepsUtils'

export default Extension.create({
  name: 'nuTextStyle',
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
      }
    ]
  },
  addKeyboardShortcuts() {
    return {
      'Mod-z': ({ editor }) => {
        stepsUtils.undo()
        const paragraphs = (layerUtils.getCurrLayer as IText).paragraphs
        editor.commands.setContent(tiptapUtils.toHTML(paragraphs))
        return true
      },
      'Shift-Mod-z': ({ editor }) => {
        stepsUtils.redo()
        const paragraphs = (layerUtils.getCurrLayer as IText).paragraphs
        editor.commands.setContent(tiptapUtils.toHTML(paragraphs))
        return true
      },

      // Russian keyboard layouts
      'Mod-я': ({ editor }) => {
        stepsUtils.undo()
        const paragraphs = (layerUtils.getCurrLayer as IText).paragraphs
        editor.commands.setContent(tiptapUtils.toHTML(paragraphs))
        return true
      },
      'Shift-Mod-я': ({ editor }) => {
        stepsUtils.redo()
        const paragraphs = (layerUtils.getCurrLayer as IText).paragraphs
        editor.commands.setContent(tiptapUtils.toHTML(paragraphs))
        return true
      },
    }
  }
})
