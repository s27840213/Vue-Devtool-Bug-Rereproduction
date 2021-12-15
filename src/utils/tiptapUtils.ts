import { Editor, EditorEvents } from '@tiptap/vue-2'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import NuTextStyle from '@/utils/nuTextStyle'
import cssConveter from '@/utils/cssConverter'
import store from '@/store'
import { IParagraph, IParagraphStyle, ISpan, ISpanStyle } from '@/interfaces/layer'
import { EventEmitter } from 'events'

class TiptapUtils {
  event: any
  eventHandler: undefined | ((editor: Editor) => void)
  editor: Editor | undefined = undefined
  prevText: string | undefined = undefined
  hasFocus = false

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
      autofocus: 'start', // this is required, otherwise the cursor in Chrome will be shown weirdly
      onCreate: ({ editor }) => {
        editor.commands.selectAll()
        this.prevText = editor.getText()
      },
      onFocus: () => {
        this.hasFocus = true
      }
      // parseOptions: {
      //   preserveWhitespace: true
      // },
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
    if (this.eventHandler) {
      this.event.off('update', this.eventHandler)
    }
    this.eventHandler = handler
    this.event.on('update', () => {
      this.agent(editor => handler(editor))
    })
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

  textStyles(styles: any): string {
    const textStyles = cssConveter.convertFontStyle(styles)
    const finalStyles = Object.assign(textStyles, {
      'font-family': this.getFontFamily(textStyles['font-family'])
    })
    return Object.entries(finalStyles).map(([k, v]) => `${k}: ${v}`).join('; ')
  }

  getFontFamily(font: string): string {
    return (font + ',').concat(store.getters['text/getDefaultFonts'])
  }

  toHTML(paragraphs: IParagraph[]): string {
    return (paragraphs as IParagraph[]).map((p) => {
      return `<p style="${this.textStyles(p.styles)}"${p.spanStyle ? ` data-span-style="${p.spanStyle}"` : ''}>${
        (p.spans.map((span) => {
          return `<span style="${this.textStyles(span.styles)}">${
            (!span.text && p.spans.length === 1)
              ? '<br/>'
              : span.text.replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/"/g, '&quot;')
                          .replace(/'/g, '&#039;')
                          .replace(/ /g, '&nbsp;')
          }</span>`
        })).join('')
      }</p>`
    }).join('')
  }

  makeParagraphStyle(attributes: any): IParagraphStyle {
    const { font, lineHeight, fontSpacing, size, align } = attributes
    return { font, lineHeight, fontSpacing, size, align }
  }

  generateSpanStyle(spanStyle: CSSStyleDeclaration): ISpanStyle {
    return {
      font: spanStyle.fontFamily.split(',')[0],
      weight: spanStyle.fontWeight,
      size: Math.round(parseFloat(spanStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100,
      decoration: spanStyle.textDecorationLine,
      style: spanStyle.fontStyle,
      color: this.isValidHexColor(spanStyle.color) ? spanStyle.color : this.rgbToHex(spanStyle.color),
      opacity: parseInt(spanStyle.opacity)
    } as ISpanStyle
  }

  makeSpanStyle(attributes: any): ISpanStyle {
    const { font, weight, size, decoration, style, color, opacity } = attributes
    return { font, weight, size, decoration, style, color, opacity } as ISpanStyle
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
        isSetContentRequired = true
        const sStyles = this.generateSpanStyle(this.str2css(defaultStyle))
        spans.push({ text: '', styles: sStyles })
        pStyles.size = sStyles.size
        pStyles.font = sStyles.font
        result.push({ spans, styles: pStyles, spanStyle: defaultStyle })
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

  applySpanStyle(key: string, value: any) {
    const item: {[string: string]: any} = {}
    item[key] = value
    this.agent(editor => {
      if (this.hasFocus) {
        const ranges = editor.state.selection.ranges
        if (ranges.length > 0) {
          if (ranges[0].$from.pos === ranges[0].$to.pos) {
            const attr = this.generateSpanStyle(this.str2css(editor.storage.nuTextStyle.spanStyle))
            attr[key] = value
            editor.storage.nuTextStyle.spanStyle = this.textStyles(attr)
            editor.chain().focus().setMark('textStyle', attr).run()
            // const chainedCommands = editor.chain().focus().setMark('textStyle', attr)
            // const spanStyle = editor.getAttributes('paragraph').spanStyle
            // if (spanStyle) {
            //   const sStyles = this.generateSpanStyle(this.str2css(spanStyle))
            //   sStyles[key] = value
            //   chainedCommands.updateAttributes('paragraph', { spanStyle: this.textStyles(sStyles) }).run()
            // } else {
            //   chainedCommands.run()
            // }
          } else {
            editor.chain().focus().updateAttributes('textStyle', item).run()
          }
        }
      } else {
        editor.chain().focus().selectAll().updateAttributes('textStyle', item).run()
      }
    })
  }

  applyParagraphStyle(key: string, value: any) {
    const item: {[string: string]: any} = {}
    item[key] = value
    this.agent(editor => {
      if (this.hasFocus) {
        editor.chain().focus().updateAttributes('paragraph', item).run()
      } else {
        editor.chain().focus().selectAll().updateAttributes('paragraph', item).run()
      }
    })
  }
}

export default new TiptapUtils()
