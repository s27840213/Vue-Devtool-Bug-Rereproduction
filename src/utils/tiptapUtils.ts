import { Editor, EditorEvents } from '@tiptap/vue-2'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import NuTextStyle from '@/utils/nuTextStyle'
import cssConveter from '@/utils/cssConverter'
import layerUtils from '@/utils/layerUtils'
import store from '@/store'
import { IGroup, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText, ITmp } from '@/interfaces/layer'
import { EventEmitter } from 'events'

class TiptapUtils {
  event: any
  eventHandler: undefined | ((editor: Editor) => void)
  editor: Editor | undefined = undefined
  prevText: string | undefined = undefined

  constructor() {
    this.event = new EventEmitter()
    this.eventHandler = undefined
  }

  init(content: string) {
    this.editor = new Editor({
      content: content ?? '',
      extensions: [
        Document,
        Paragraph,
        Text,
        TextStyle,
        NuTextStyle
      ],
      editorProps: {
        attributes: {
          class: 'non-selectable'
        }
      },
      onCreate: ({ editor }) => {
        this.prevText = this.getText(editor as Editor)
        editor.commands.selectAll()
      }
    })
  }

  agent(callback: (editor: Editor) => any) {
    if (this.editor) {
      callback(this.editor)
    }
  }

  destroy() {
    this.agent(editor => {
      editor.destroy()
      this.editor = undefined
    })
  }

  on(event: keyof EditorEvents, handler: (props: any) => void): void {
    this.agent(editor => editor.on(event, handler))
  }

  onForceUpdate(handler: (editor: Editor) => void): void {
    const fullHandler = () => {
      this.agent(editor => handler(editor))
    }
    if (this.eventHandler) {
      this.event.off('update', this.eventHandler)
    }
    this.eventHandler = fullHandler
    this.event.on('update', fullHandler)
  }

  forceUpdate() {
    this.event.emit('update')
  }

  isValidHexColor = (value: string): boolean => value.match(/^#[0-9A-F]{6}$/) !== null
  componentToHex = (c: number) => c.toString(16).length === 1 ? '0' + c.toString(16).toUpperCase() : c.toString(16).toUpperCase()
  rgbToHex = (rgb: string) => {
    const rgbArr = rgb.match(/\d+/g)
    if (rgbArr && rgbArr.length === 3) {
      return '#' + this.componentToHex(parseInt(rgbArr[0])) + this.componentToHex(parseInt(rgbArr[1])) + this.componentToHex(parseInt(rgbArr[2]))
    } else {
      return rgb
    }
  }

  textStylesRaw(styles: any): {[key: string]: any} {
    const textStyles = cssConveter.convertFontStyle(styles)
    return Object.assign(textStyles, {
      '-webkit-text-decoration-line': textStyles['text-decoration']
    })
  }

  textStyles(styles: any): string {
    return Object.entries(this.textStylesRaw(styles)).map(([k, v]) => `${k}: ${v}`).join('; ')
  }

  toJSON(paragraphs: IParagraph[]): any {
    return {
      type: 'doc',
      content: paragraphs.map(p => {
        const pObj = {
          type: 'paragraph'
        } as {[key: string]: any}
        const attrs = this.makeParagraphStyle(p.styles)
        if (p.spanStyle) {
          attrs.spanStyle = p.spanStyle as string
          const sStyles = this.generateSpanStyle(this.str2css(p.spanStyle as string))
          Object.assign(attrs, this.extractSpanStyleForParagraph(sStyles))
        }
        pObj.attrs = attrs
        if (p.spans.length > 1 || p.spans[0].text !== '') {
          pObj.content = p.spans.map(s => {
            return {
              type: 'text',
              text: s.text,
              marks: [{
                type: 'textStyle',
                attrs: this.makeSpanStyle(s.styles)
              }]
            }
          })
        }
        return pObj
      })
    }
  }

  makeParagraphStyle(attributes: any): IParagraphStyle {
    const { font, lineHeight, fontSpacing, size, align } = attributes
    return { font, lineHeight, fontSpacing, size, align }
  }

  generateSpanStyle(spanStyle: CSSStyleDeclaration): ISpanStyle {
    return {
      font: spanStyle.fontFamily.split(',')[0],
      weight: spanStyle.getPropertyValue('-webkit-text-stroke-width').includes('+') ? 'bold' : 'normal',
      size: Math.round(parseFloat(spanStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100,
      decoration: spanStyle.textDecorationLine ? spanStyle.textDecorationLine : spanStyle.getPropertyValue('-webkit-text-decoration-line'),
      style: spanStyle.fontStyle,
      color: this.isValidHexColor(spanStyle.color) ? spanStyle.color : this.rgbToHex(spanStyle.color),
      opacity: parseInt(spanStyle.opacity)
    } as ISpanStyle
  }

  makeSpanStyle(attributes: any): ISpanStyle {
    const { font, weight, size, decoration, style, color, opacity } = attributes
    return { font, weight, size, decoration, style, color, opacity } as ISpanStyle
  }

  extractSpanStyleForParagraph(attributes: any): Partial<ISpanStyle> {
    const { weight, decoration, style, color } = attributes
    return { weight, decoration, style, color }
  }

  str2css(str: string): CSSStyleDeclaration {
    const el = document.createElement('div')
    el.style.cssText = str
    return el.style
  }

  toIParagraph(tiptapJSON: any): { paragraphs: IParagraph[], isSetContentRequired: boolean } {
    if (!this.editor) return { paragraphs: [], isSetContentRequired: false }
    let isSetContentRequired = false
    const defaultStyle = this.editor.storage.nuTextStyle.spanStyle as string
    const result: IParagraph[] = []
    for (const paragraph of tiptapJSON.content) {
      const pStyles = this.makeParagraphStyle(paragraph.attrs)
      let largestSize = 0
      const spans: ISpan[] = []
      for (const span of paragraph.content ?? []) {
        if (span.marks && span.marks.length > 0) {
          const sStyles = this.makeSpanStyle(span.marks[0].attrs)
          if (sStyles.size > largestSize) largestSize = sStyles.size
          spans.push({ text: span.text, styles: sStyles })
        } else {
          isSetContentRequired = true
          let spanStyle: string
          if (paragraph.attrs.spanStyle) {
            spanStyle = paragraph.attrs.spanStyle
          } else {
            spanStyle = defaultStyle
          }
          const sStyles = this.generateSpanStyle(this.str2css(spanStyle))
          if (sStyles.size > largestSize) largestSize = sStyles.size
          spans.push({ text: span.text, styles: sStyles })
        }
      }
      if (spans.length === 0) {
        if (paragraph.attrs.spanStyle) {
          const sStyles = this.generateSpanStyle(this.str2css(paragraph.attrs.spanStyle))
          spans.push({ text: '', styles: sStyles })
          pStyles.size = sStyles.size
          pStyles.font = sStyles.font
          result.push({ spans, styles: pStyles, spanStyle: paragraph.attrs.spanStyle })
        } else {
          isSetContentRequired = true
          const sStyles = this.generateSpanStyle(this.str2css(defaultStyle))
          spans.push({ text: '', styles: sStyles })
          pStyles.size = sStyles.size
          pStyles.font = sStyles.font
          result.push({ spans, styles: pStyles, spanStyle: defaultStyle })
        }
      } else {
        if (pStyles.size !== largestSize) {
          pStyles.size = largestSize
          isSetContentRequired = true
        }
        if (paragraph.attrs.spanStyle) {
          isSetContentRequired = true
        }
        result.push({ spans, styles: pStyles })
      }
    }
    return { paragraphs: result, isSetContentRequired }
  }

  getText(editor: Editor): string {
    const lines: string[] = []
    const json = editor.getJSON()
    const paragraphs = json.content ?? []
    for (const paragraph of paragraphs) {
      const spans = paragraph.content ?? []
      if (spans.length > 0) {
        const fragments: string[] = []
        for (const span of spans) {
          fragments.push(span.text ?? '')
        }
        lines.push(fragments.join(''))
      } else {
        lines.push('')
      }
    }
    return lines.join('\n')
  }

  toText(textLayer: IText): string {
    const lines: string[] = []
    const paragraphs = textLayer.paragraphs
    for (const paragraph of paragraphs) {
      const spans = paragraph.spans
      if (spans.length > 0) {
        const fragments: string[] = []
        for (const span of spans) {
          fragments.push(span.text ?? '')
        }
        lines.push(fragments.join(''))
      } else {
        lines.push('')
      }
    }
    return lines.join('\n')
  }

  applySpanStyle(key: string, value: any, applyToRange: boolean | undefined = undefined) {
    const item: {[string: string]: any} = {}
    item[key] = value
    const { subLayerIdx, getCurrLayer } = layerUtils
    const contentEditable = subLayerIdx === -1 ? getCurrLayer.contentEditable : (getCurrLayer as IGroup).layers[subLayerIdx].contentEditable
    this.agent(editor => {
      if (contentEditable && (applyToRange !== false)) { // contentEditable and (applyToRange not set or isRanged (set font for range))
        const ranges = editor.state.selection.ranges
        if (ranges.length > 0) {
          if (ranges[0].$from.pos === ranges[0].$to.pos) {
            const attr = this.generateSpanStyle(this.str2css(editor.storage.nuTextStyle.spanStyle))
            attr[key] = value
            editor.storage.nuTextStyle.spanStyle = this.textStyles(attr)
            editor.chain().setMark('textStyle', attr).run()
            setTimeout(() => {
              editor.commands.focus()
            }, 10)
          } else {
            editor.chain().updateAttributes('textStyle', item).run()
            setTimeout(() => {
              editor.chain().focus().selectPrevious().run()
            }, 10)
          }
        }
      } else {
        editor.chain().selectAll().updateAttributes('textStyle', item).run()
      }
    })
  }

  applyParagraphStyle(key: string, value: any, setFocus = true) {
    const item: {[string: string]: any} = {}
    item[key] = value
    this.agent(editor => {
      if (layerUtils.getCurrLayer.contentEditable) {
        editor.chain().updateAttributes('paragraph', item).run()
        const ranges = editor.state.selection.ranges
        if (ranges.length > 0) {
          if (ranges[0].$from.pos === ranges[0].$to.pos) {
            const attr = this.generateSpanStyle(this.str2css(editor.storage.nuTextStyle.spanStyle))
            editor.chain().setMark('textStyle', attr).run()
            if (setFocus) {
              setTimeout(() => {
                editor.commands.focus()
              }, 10)
            }
          } else {
            if (setFocus) {
              setTimeout(() => {
                editor.chain().focus().selectPrevious().run()
              }, 10)
            }
          }
        }
      } else {
        editor.chain().updateAttributes('paragraph', item).run()
      }
    })
  }

  focus(options = {} as { scrollIntoView?: boolean }) {
    if (this.editor) {
      this.editor.commands.focus(null, options)
    }
  }

  updateHtml(paragraphs?: IParagraph[]) {
    if (this.editor) {
      if (!paragraphs) {
        const { subLayerIdx, getCurrLayer: currLayer } = layerUtils
        paragraphs = currLayer.type === 'text' ? (currLayer as IText).paragraphs
          : (currLayer as IGroup).layers[subLayerIdx].paragraphs as IParagraph[]
      }
      this.editor.chain().setContent(this.toJSON(paragraphs)).selectPrevious().run()
    }
  }

  getSelection() {
    if (this.editor) {
      const selection = this.editor.view.state.selection
      const from = selection.$from
      const to = selection.$to

      return {
        start: {
          pIndex: from.index(0),
          sIndex: from.index(1),
          offset: from.textOffset
        },
        end: {
          pIndex: to.index(0),
          sIndex: to.index(1),
          offset: to.textOffset
        }
      }
    }
  }

  isCurrLayerContenteditable() {
    const { subLayerIdx, getCurrLayer } = layerUtils
    const targetLayer = subLayerIdx === -1 ? getCurrLayer : (getCurrLayer as IGroup).layers[subLayerIdx]
    return targetLayer.type === 'text' && targetLayer.contentEditable
  }
}

export default new TiptapUtils()
