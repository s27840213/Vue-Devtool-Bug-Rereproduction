import Vue from 'vue'
import { IText } from '@/interfaces/layer'
import { Extension } from '@tiptap/core'
import tiptapUtils from './tiptapUtils'
import layerUtils from './layerUtils'
import stepsUtils from './stepsUtils'
import textPropUtils from './textPropUtils'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nuTextStyle: {
      selectPrevious: () => ReturnType,
      sync: () => ReturnType
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
    const spanAttrs = this.editor.getAttributes('textStyle')
    if (Object.keys(spanAttrs).length) {
      this.storage.spanStyle = tiptapUtils.textStyles(spanAttrs)
    } else {
      const spanStyle = this.editor.getAttributes('paragraph').spanStyle
      if (spanStyle) {
        this.storage.spanStyle = spanStyle
      }
    }
    textPropUtils.updateTextPropsState()
    const selectionRanges = this.editor.view.state.selection.ranges
    if (selectionRanges.length > 0) {
      const from = selectionRanges[0].$from.pos
      const to = selectionRanges[0].$to.pos
      this.storage.from = from
      this.storage.to = to
      layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, {
        selection: { from, to }
      })
      // const startNode = selectionRanges[0].$from.node()
      // if (from === to && startNode.content.size === 0) {
      //   let spanStyle: string
      //   if (this.editor.getAttributes('paragraph').spanStyle) {
      //     spanStyle = this.editor.getAttributes('paragraph').spanStyle
      //   } else {
      //     spanStyle = this.storage.spanStyle
      //   }
      //   if (this.editor.isActive('textStyle')) {
      //     this.editor.chain().focus().unsetAllMarks().setMark('textStyle', sStyles).run()
      //   } else {
      //     this.editor.chain().focus().setMark('textStyle', sStyles).run()
      //   }
      //   this.editor.chain().focus().insertContent(
      //     `<span style="${spanStyle}">&#8288</span>`,
      //     { updateSelection: false }
      //   ).run()
      // }
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
        types: ['textStyle'],
        attributes: {
          font: {
            default: null,
            parseHTML: element => {
              const spanStyle = element.style
              return spanStyle.fontFamily.split(',')[0]
            },
            renderHTML: () => ({})
          },
          weight: {
            default: null,
            parseHTML: element => {
              const spanStyle = element.style
              return spanStyle.fontWeight
            },
            renderHTML: () => ({})
          },
          size: {
            default: null,
            parseHTML: element => {
              const spanStyle = element.style
              return Math.round(parseFloat(spanStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100
            },
            renderHTML: () => ({})
          },
          decoration: {
            default: null,
            parseHTML: element => {
              const spanStyle = element.style
              return spanStyle.textDecorationLine
            },
            renderHTML: () => ({})
          },
          style: {
            default: null,
            parseHTML: element => {
              const spanStyle = element.style
              return spanStyle.fontStyle
            },
            renderHTML: () => ({})
          },
          color: {
            default: null,
            parseHTML: element => {
              const spanStyle = element.style
              return tiptapUtils.isValidHexColor(spanStyle.color) ? spanStyle.color : tiptapUtils.rgbToHex(spanStyle.color)
            },
            renderHTML: () => ({})
          },
          opacity: {
            default: null,
            parseHTML: element => {
              const spanStyle = element.style
              return parseInt(spanStyle.opacity)
            },
            renderHTML: attributes => {
              return {
                style: tiptapUtils.textStyles(attributes)
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
              return cssText
            },
            renderHTML: attributes => {
              if (!attributes.spanStyle) return {}
              return {
                'data-span-style': attributes.spanStyle
              }
            }
          },
          font: {
            default: null,
            parseHTML: element => {
              const paragraphStyle = element.style
              return paragraphStyle.fontFamily.split(',')[0]
            },
            renderHTML: () => ({})
          },
          lineHeight: {
            default: null,
            parseHTML: element => {
              const paragraphStyle = element.style
              const floatNum = /[+-]?\d+(\.\d+)?/
              return paragraphStyle.lineHeight.match(floatNum) !== null ? parseFloat(paragraphStyle.lineHeight.match(floatNum)![0]) : -1
            },
            renderHTML: () => ({})
          },
          fontSpacing: {
            default: null,
            parseHTML: element => {
              const paragraphStyle = element.style
              const floatNum = /[+-]?\d+(\.\d+)?/
              return paragraphStyle.letterSpacing.match(floatNum) !== null ? parseFloat(paragraphStyle.letterSpacing.match(floatNum)![0]) : 0
            },
            renderHTML: () => ({})
          },
          size: {
            default: null,
            parseHTML: element => {
              const paragraphStyle = element.style
              return Math.round(parseFloat(paragraphStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100
            },
            renderHTML: () => ({})
          },
          align: {
            default: null,
            parseHTML: element => {
              const paragraphStyle = element.style
              return paragraphStyle.textAlign.replace('text-align-', '')
            },
            renderHTML: attributes => {
              return {
                style: tiptapUtils.textStyles(attributes) + '; margin: 0;'
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
      }
    }
  }
})
