import Vue from 'vue'
import { Editor, EditorEvents } from '@tiptap/vue-2'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import NuTextStyle from '@/utils/nuTextStyle'
import cssConveter from '@/utils/cssConverter'
import store from '@/store'
import { IGroup, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText, ITmp } from '@/interfaces/layer'
import { EventEmitter } from 'events'
import textPropUtils from './textPropUtils'

class TiptapUtils {
  event: any
  eventHandler: undefined | ((editor: Editor) => void)
  editor: Editor | undefined = undefined
  prevText: string | undefined = undefined
  hasFocus = false

  get isRanged(): boolean {
    const ranges = this.editor?.state.selection.ranges
    if (ranges) {
      return ranges[0]?.$from !== ranges[0]?.$to
    }
    return false
  }
  // get isFocus(): boolean {
  //   return this.editor?.isFocused || false
  // }

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
        this.prevText = editor.getText()
      },
      onFocus: () => {
        this.hasFocus = true
      }
      // autofocus: 'start', // this is required, otherwise the cursor in Chrome will be shown weirdly
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

  textStyles(styles: any): string {
    const textStyles = cssConveter.convertFontStyle(styles)
    const finalStyles = Object.assign(textStyles, {
      'font-family': this.getFontFamily(textStyles['font-family']),
      '-webkit-text-decoration-line': textStyles['text-decoration']
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
      weight: spanStyle.getPropertyValue('-webkit-text-stroke-width') === '0px' ? 'normal' : 'bold',
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
            editor.chain().setMark('textStyle', attr).run()
            setTimeout(() => {
              editor.chain().focus().run()
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
        setTimeout(() => {
          editor.chain().focus().selectPrevious().run()
        }, 10)
      }
    })
  }

  applyParagraphStyle(key: string, value: any) {
    const item: {[string: string]: any} = {}
    item[key] = value
    this.agent(editor => {
      if (this.hasFocus) {
        editor.chain().updateAttributes('paragraph', item).run()
      } else {
        editor.chain().selectAll().updateAttributes('paragraph', item).run()
      }
    })
  }

  focus() {
    if (this.editor) {
      this.editor.commands.focus()
    }
  }
}

export default new TiptapUtils()
