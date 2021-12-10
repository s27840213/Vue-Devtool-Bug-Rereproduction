import { Editor, EditorEvents, markInputRule } from '@tiptap/vue-2'
import { mergeAttributes } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import History from '@tiptap/extension-history'
import NuTextStyle from '@/utils/nuTextStyle'
import cssConveter from '@/utils/cssConverter'
import store from '@/store'
import { IParagraph, IParagraphStyle, ISpan, ISpanStyle } from '@/interfaces/layer'

class TiptapUtils {
  editor: Editor | undefined = undefined

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
      onFocus({ editor }) {
        editor.commands.selectAll()
      }
    })
    // TextStyle.extend({
    //   addInputRules() {
    //     return [
    //       markInputRule({
    //         find: /.+/,
    //         type: this.type
    //       })
    //     ]
    //   },
    //   renderHTML({ HTMLAttributes }) {
    //     let style = {}
    //     if (!HTMLAttributes.style) {
    //       console.log(this.parent)
    //     }
    //     return ['span', mergeAttributes(HTMLAttributes, style), 0]
    //   }
    // }),
  }

  destroy() {
    if (this.editor) {
      this.editor.destroy()
    }
  }

  on(event: keyof EditorEvents, handler: (props: any) => void): void {
    if (this.editor) {
      this.editor.on(event, handler)
    }
  }

  private isValidHexColor = (value: string): boolean => value.match(/^#[0-9A-F]{6}$/) !== null
  private componentToHex = (c: number) => c.toString(16).length === 1 ? '0' + c.toString(16).toUpperCase() : c.toString(16).toUpperCase()
  private rgbToHex = (rgb: string) => {
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
      'font-family': (textStyles['font-family'] + ',').concat(store.getters['text/getDefaultFonts'])
    })
    return Object.entries(finalStyles).map(([k, v]) => `${k}: ${v}`).join('; ')
  }

  toHTML(paragraphs: IParagraph[]): string {
    return (paragraphs as IParagraph[]).map((p) => {
      return `
        <p style="${this.textStyles(p.styles)}">
          ${(p.spans.map((span) => {
            return `
              <span style="${this.textStyles(span.styles)}">
                ${(!span.text && p.spans.length === 1) ? '<br/>' : span.text}
              </span>
            `
          })).join('\n')}
        </p>
      `
    }).join('\n')
  }

  toIParagraph(tiptapJSON: any): IParagraph [] {
    const result: IParagraph[] = []
    for (const paragraph of tiptapJSON.content) {
      const paragraphStyle: CSSStyleDeclaration = paragraph.attrs.style
      const floatNum = /[+-]?\d+(\.\d+)?/
      const lineHeight = paragraphStyle.lineHeight.match(floatNum) !== null ? parseFloat(paragraphStyle.lineHeight.match(floatNum)![0]) : -1
      const fontSpacing = paragraphStyle.letterSpacing.match(floatNum) !== null ? parseFloat(paragraphStyle.letterSpacing.match(floatNum)![0]) : 0
      const fontSize = Math.round(parseFloat(paragraphStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100
      const font = paragraphStyle.fontFamily.split(',')[0]
      const pStyles = {
        font,
        lineHeight,
        fontSpacing,
        size: fontSize,
        align: paragraphStyle.textAlign.replace('text-align-', '')
      } as IParagraphStyle
      const spans: ISpan[] = []
      for (const span of paragraph.content ?? []) {
        const spanStyle: CSSStyleDeclaration = span.marks[0].attrs.style
        const sStyles = {
          font: spanStyle.fontFamily.split(',')[0],
          weight: spanStyle.fontWeight,
          size: Math.round(parseFloat(spanStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100,
          decoration: spanStyle.textDecorationLine,
          style: spanStyle.fontStyle,
          color: this.isValidHexColor(spanStyle.color) ? spanStyle.color : this.rgbToHex(spanStyle.color),
          opacity: parseInt(spanStyle.opacity)
        } as ISpanStyle
        spans.push({ text: span.text, styles: sStyles })
      }
      if (spans.length === 0) {
        const spanStyle = paragraphStyle
        const sStyles = {
          font: spanStyle.fontFamily.split(',')[0],
          weight: spanStyle.fontWeight,
          size: Math.round(parseFloat(spanStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100,
          decoration: spanStyle.textDecorationLine,
          style: spanStyle.fontStyle,
          color: this.isValidHexColor(spanStyle.color) ? spanStyle.color : this.rgbToHex(spanStyle.color),
          opacity: parseInt(spanStyle.opacity)
        } as ISpanStyle
        spans.push({ text: '', styles: sStyles })
      }
      result.push({ spans, styles: pStyles })
    }
    return result
  }
}

export default new TiptapUtils()
