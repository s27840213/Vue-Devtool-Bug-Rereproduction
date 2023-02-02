import Vue, { nextTick } from 'vue'
import { IGroup, IText } from '@/interfaces/layer'
import { Extension } from '@tiptap/core'
import { Editor } from '@tiptap/vue-3'
import tiptapUtils from './tiptapUtils'
import layerUtils from './layerUtils'
import stepsUtils from './stepsUtils'
import textPropUtils from './textPropUtils'
import shortcutUtils from './shortcutUtils'
import { checkAndConvertToHex } from '@/utils/colorUtils'

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
      pasting: false
    }
  },
  onSelectionUpdate() {
    const spanAttrs = this.editor.getAttributes('textStyle')
    if (Object.keys(spanAttrs).length) {
      this.storage.spanStyle = tiptapUtils.textStyles(spanAttrs)
    } else {
      const spanStyle = this.editor.getAttributes('paragraph').spanStyle
      if (spanStyle) {
        this.storage.spanStyle = tiptapUtils.textStyles(
          tiptapUtils.makeSpanStyle(this.editor.getAttributes('paragraph'))
        )
      }
    }
    // console.log(this.storage.spanStyle)
    if (textPropUtils.pageIndex >= 0 && textPropUtils.layerIndex >= 0) {
      textPropUtils.updateTextPropsState()
    }
    const selectionRanges = this.editor.view.state.selection.ranges
    if (selectionRanges.length > 0) {
      const from = selectionRanges[0].$from.pos
      const to = selectionRanges[0].$to.pos
      // console.log(from, to)
      this.storage.from = from
      this.storage.to = to
      layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, {
        selection: { from, to }
      })
      if (tiptapUtils.getText((this.editor as Editor).getJSON()) === tiptapUtils.prevText && !this.editor.view.composing) {
        stepsUtils.updateHead(layerUtils.pageIndex, layerUtils.layerIndex, {
          selection: { from, to }
        })
      }
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          font: {
            default: 'undefined',
            parseHTML: element => {
              const spanStyle = element.style
              const font = spanStyle.fontFamily
              if (!font.includes(',')) return null
              const fontFamily = font.split(',')[0]
              if (fontFamily.length !== 20 || !fontFamily.match(/^[A-Za-z0-9]+$/)) return null
              return fontFamily
            },
            renderHTML: () => ({})
          },
          weight: {
            default: 'normal',
            parseHTML: element => {
              const spanStyle = element.style
              const stroke = spanStyle.getPropertyValue('-webkit-text-stroke-width')
              if (spanStyle.fontWeight) {
                return spanStyle.fontWeight === 'bold' ? 'bold' : 'normal'
              }
              if (stroke === '') return null
              return stroke.includes('+') ? 'bold' : 'normal'
            },
            renderHTML: () => ({})
          },
          size: {
            default: 20,
            parseHTML: element => {
              const spanStyle = element.style
              if (!spanStyle.fontSize.includes('px')) return null
              return Math.round(parseFloat(spanStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100
            },
            renderHTML: () => ({})
          },
          decoration: {
            default: 'none',
            parseHTML: element => {
              const spanStyle = element.style
              const decoration = spanStyle.textDecorationLine ? spanStyle.textDecorationLine : spanStyle.getPropertyValue('-webkit-text-decoration-line')
              return decoration === 'underline' ? 'underline' : 'none'
            },
            renderHTML: () => ({})
          },
          style: {
            default: 'normal',
            parseHTML: element => {
              const spanStyle = element.style
              return spanStyle.fontStyle === 'italic' ? 'italic' : 'normal'
            },
            renderHTML: () => ({})
          },
          color: {
            default: '#000000',
            parseHTML: element => {
              const spanStyle = element.style
              if (spanStyle.color === '') return null
              return checkAndConvertToHex(spanStyle.color)
            },
            renderHTML: attributes => {
              return {
                style: tiptapUtils.textStyles(attributes)
              }
            }
          },
          type: {
            default: 'public',
            parseHTML: element => {
              return element.getAttribute('data-font-type')
            },
            renderHTML: attributes => {
              if (!attributes.type) return {}
              return {
                'data-font-type': attributes.type
              }
            }
          },
          userId: {
            default: '',
            parseHTML: element => {
              return element.getAttribute('data-font-userId')
            },
            renderHTML: attributes => {
              if (!attributes.userId) return {}
              return {
                'data-font-userId': attributes.userId
              }
            }
          },
          assetId: {
            default: '',
            parseHTML: element => {
              return element.getAttribute('data-font-assetId')
            },
            renderHTML: attributes => {
              if (!attributes.assetId) return {}
              return {
                'data-font-assetId': attributes.assetId
              }
            }
          },
          fontUrl: {
            default: '',
            parseHTML: element => {
              return element.getAttribute('data-font-fontUrl')
            },
            renderHTML: attributes => {
              if (!attributes.fontUrl) return {}
              return {
                'data-font-fontUrl': attributes.fontUrl
              }
            }
          },
          pre: {
            default: undefined,
            parseHTML: element => {
              const spanStyle = element.style
              const whiteSpace = spanStyle.getPropertyValue('white-space')
              return whiteSpace === 'pre'
            },
            renderHTML: attributes => {
              if (!attributes.pre) return {}
              return {
                style: 'white-space: pre'
              }
            }
          }
        }
      }, {
        types: ['paragraph'],
        attributes: {
          spanStyle: {
            default: false,
            parseHTML: element => {
              const spanStyle = element.getAttribute('data-span-style')
              return spanStyle === 'true'
            },
            renderHTML: attributes => {
              if (!attributes.spanStyle) return {}
              return {
                'data-span-style': attributes.spanStyle.toString()
              }
            }
          },
          font: {
            default: 'undefined',
            parseHTML: element => {
              const paragraphStyle = element.style
              const font = paragraphStyle.fontFamily
              if (!font.includes(',')) return null
              const fontFamily = font.split(',')[0]
              if (fontFamily.length !== 20 || !fontFamily.match(/^[A-Za-z0-9]+$/)) return null
              return fontFamily
            },
            renderHTML: () => ({})
          },
          lineHeight: {
            default: 1.4,
            parseHTML: element => {
              const paragraphStyle = element.style
              const floatNum = /[+-]?\d+(\.\d+)?/
              return paragraphStyle.lineHeight.match(floatNum) !== null ? parseFloat(paragraphStyle.lineHeight.match(floatNum)![0]) : null
            },
            renderHTML: () => ({})
          },
          fontSpacing: {
            default: 0,
            parseHTML: element => {
              const paragraphStyle = element.style
              const floatNum = /[+-]?\d+(\.\d+)?/
              return paragraphStyle.letterSpacing.match(floatNum) !== null ? parseFloat(paragraphStyle.letterSpacing.match(floatNum)![0]) : null
            },
            renderHTML: () => ({})
          },
          size: {
            default: 20,
            parseHTML: element => {
              const paragraphStyle = element.style
              if (!paragraphStyle.fontSize.includes('px')) return null
              return Math.round(parseFloat(paragraphStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100
            },
            renderHTML: () => ({})
          },
          align: {
            default: 'center',
            parseHTML: element => {
              const paragraphStyle = element.style
              const textAlign = paragraphStyle.textAlign
              if (!textAlign.match(/^left|center|right|justify$/)) return null
              return textAlign
            },
            renderHTML: attributes => {
              const pAttrs = attributes.spanStyle ? attributes : tiptapUtils.makeParagraphStyle(attributes)
              return {
                style: tiptapUtils.textStyles(pAttrs) + '; margin: 0;'
              }
            }
          },
          weight: {
            default: 'normal',
            parseHTML: element => {
              return element.getAttribute('data-weight')
            },
            renderHTML: attributes => {
              return {
                'data-weight': attributes.weight
              }
            }
          },
          decoration: {
            default: 'none',
            parseHTML: element => {
              return element.getAttribute('data-decoration')
            },
            renderHTML: attributes => {
              return {
                'data-decoration': attributes.decoration
              }
            }
          },
          style: {
            default: 'normal',
            parseHTML: element => {
              return element.getAttribute('data-style')
            },
            renderHTML: attributes => {
              return {
                'data-style': attributes.style
              }
            }
          },
          color: {
            default: '#000000',
            parseHTML: element => {
              return element.getAttribute('data-color')
            },
            renderHTML: attributes => {
              return {
                'data-color': attributes.color
              }
            }
          },
          type: {
            default: 'public',
            parseHTML: element => {
              return element.getAttribute('data-font-type')
            },
            renderHTML: attributes => {
              if (!attributes.type) return {}
              return {
                'data-font-type': attributes.type
              }
            }
          },
          userId: {
            default: '',
            parseHTML: element => {
              return element.getAttribute('data-font-userId')
            },
            renderHTML: attributes => {
              if (!attributes.userId) return {}
              return {
                'data-font-userId': attributes.userId
              }
            }
          },
          assetId: {
            default: '',
            parseHTML: element => {
              return element.getAttribute('data-font-assetId')
            },
            renderHTML: attributes => {
              if (!attributes.assetId) return {}
              return {
                'data-font-assetId': attributes.assetId
              }
            }
          },
          fontUrl: {
            default: '',
            parseHTML: element => {
              return element.getAttribute('data-font-fontUrl')
            },
            renderHTML: attributes => {
              if (!attributes.fontUrl) return {}
              return {
                'data-font-fontUrl': attributes.fontUrl
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
        stepsUtils.undo().then(() => {
          nextTick(() => {
            const currLayer = layerUtils.getCurrLayer as IText
            if (!currLayer.active) return
            editor.commands.sync()
            tiptapUtils.updatePrevData(editor as Editor)
            textPropUtils.updateTextPropsState()
          })
        })
        return true
      },
      'Shift-Mod-z': ({ editor }) => {
        stepsUtils.redo().then(() => {
          nextTick(() => {
            const currLayer = layerUtils.getCurrLayer as IText
            if (!currLayer.active) return
            editor.commands.sync()
            tiptapUtils.updatePrevData(editor as Editor)
            textPropUtils.updateTextPropsState()
          })
        })
        return true
      },

      // Russian keyboard layouts
      'Mod-я': ({ editor }) => {
        return editor.commands.keyboardShortcut('Mod-z')
      },
      'Shift-Mod-я': ({ editor }) => {
        return editor.commands.keyboardShortcut('Shift-Mod-z')
      },
      'Shift-Enter': ({ editor }) => {
        return editor.commands.keyboardShortcut('Enter')
      },
      'Mod-c': () => {
        shortcutUtils.textCopy()
        return true
      },
      'Mod-x': () => {
        shortcutUtils.textCut()
        return true
      },
      'Mod--': () => {
        shortcutUtils.zoomOut()
        return true
      },
      'Mod-=': () => {
        shortcutUtils.zoomIn()
        return true
      }
    }
  },
  addCommands() {
    return {
      selectPrevious: () => ({ commands }) => {
        const from = this.storage.from ?? 0
        const to = this.storage.to ?? 0
        // console.log(from, to)
        return commands.setTextSelection({ from, to })
      },
      sync: () => ({ chain }) => {
        const currLayer = layerUtils.getCurrLayer
        const subLayerIndex = layerUtils.subLayerIdx
        let targetLayer: IText
        if (currLayer.type === 'group') {
          if (subLayerIndex === -1) return false
          const subLayer = (currLayer as IGroup).layers[subLayerIndex]
          if (subLayer.type !== 'text') return false
          targetLayer = subLayer as IText
        } else if (currLayer.type === 'text') {
          targetLayer = currLayer as IText
        } else {
          return false
        }
        const paragraphs = targetLayer.paragraphs
        const selection = targetLayer.selection
        return chain().setContent(tiptapUtils.toJSON(paragraphs)).setTextSelection(selection).run()
      }
    }
  }
})
