import { Editor, EditorEvents } from '@tiptap/vue-2'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import NuTextStyle from '@/utils/nuTextStyle'
import cssConveter from '@/utils/cssConverter'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText, ITmp } from '@/interfaces/layer'
import { EventEmitter } from 'events'
import textPropUtils from '@/utils/textPropUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textBgUtils from '@/utils/textBgUtils'

class TiptapUtils {
  event: any
  eventHandler: undefined | ((toRecord: boolean) => void)
  editor: Editor | undefined = undefined
  prevText: string | undefined = undefined

  constructor() {
    this.event = new EventEmitter()
    this.eventHandler = undefined
  }

  init(content: string, editable: boolean) {
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
        },
        handleScrollToSelection: () => {
          return this.editor?.storage.nuTextStyle.pasting
        }
      },
      parseOptions: {
        preserveWhitespace: 'full'
      },
      editable,
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

  onForceUpdate(handler: (editor: Editor, toRecord: boolean) => void): void {
    const fullHandler = (toRecord: boolean) => {
      this.agent(editor => handler(editor, toRecord))
    }
    if (this.eventHandler) {
      this.event.off('update', this.eventHandler)
    }
    this.eventHandler = fullHandler
    this.event.on('update', fullHandler)
  }

  forceUpdate(toRecord = false) {
    this.event.emit('update', toRecord)
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
    // console.log(generalUtils.deepCopy(paragraphs))
    return {
      type: 'doc',
      content: paragraphs.map(p => {
        const pObj = {
          type: 'paragraph'
        } as {[key: string]: any}
        const attrs = this.makeParagraphStyle(p.styles) as any
        if (p.spanStyle) {
          attrs.spanStyle = true
          const sStyles = this.generateSpanStyle(p.spanStyle as string)
          Object.assign(attrs, this.extractSpanStyleForParagraph(sStyles))
        }
        pObj.attrs = attrs
        if (p.spans.length > 1 || p.spans[0].text !== '') {
          pObj.content = p.spans.map(s => {
            // To prevent safari tiptap space issue, we need to replace space with
            // other char. There are five char can work, choose other if something happens.
            // const newText = s.text
            // const newText = s.text.replace(' ', '\u2006')
            const newText = s.text.replace(' ', '\u2009')
            // const newText = s.text.replace(' ', '\u200A') // 髮寬空格 能用但是寬度非常窄
            // const newText = s.text.replace(' ', '\u202F')
            // const newText = s.text.replace(' ', '\u205F')
            const layerStyles = textEffectUtils.getCurrentLayer().styles
            const textBg = textBgUtils.convertTextSpanEffect(layerStyles.textBg)
            return {
              type: 'text',
              text: newText,
              marks: [{
                type: 'textStyle',
                attrs: Object.assign(this.makeSpanStyle(s.styles), textBg)
              }]
            }
          })
        }
        return pObj
      })
    }
  }

  makeParagraphStyle(attributes: any): IParagraphStyle {
    const { font, lineHeight, fontSpacing, size, align, type, userId, assetId } = attributes
    return { font, lineHeight, fontSpacing, size, align, type, userId, assetId }
  }

  generateSpanStyle(spanStyleStr: string): ISpanStyle {
    const spanStyle = this.str2css(spanStyleStr)
    const fontProps = this.extractFontProps(spanStyleStr)
    return {
      font: spanStyle.fontFamily.split(',')[0],
      weight: spanStyle.getPropertyValue('-webkit-text-stroke-width').includes('+') ? 'bold' : 'normal',
      size: Math.round(parseFloat(spanStyle.fontSize.split('px')[0]) / 1.333333 * 100) / 100,
      decoration: spanStyle.textDecorationLine ? spanStyle.textDecorationLine : spanStyle.getPropertyValue('-webkit-text-decoration-line'),
      style: spanStyle.fontStyle,
      color: this.isValidHexColor(spanStyle.color) ? spanStyle.color : this.rgbToHex(spanStyle.color),
      ...fontProps
    } as ISpanStyle
  }

  makeSpanStyle(attributes: any): ISpanStyle {
    const { font, weight, size, decoration, style, color, type, userId, assetId, fontUrl, pre } = attributes
    return { font, weight, size, decoration, style, color, type, userId, assetId, fontUrl, pre } as ISpanStyle
  }

  extractSpanStyleForParagraph(attributes: any): Partial<ISpanStyle> {
    const { weight, decoration, style, color, font, size, type, userId, assetId } = attributes
    return { weight, decoration, style, color, font, size, type, userId, assetId }
  }

  str2css(str: string): CSSStyleDeclaration {
    const el = document.createElement('div')
    el.style.cssText = str
    return el.style
  }

  extractFontProps(str: string): { type: string, userId: string, assetId: string, fontUrl: string } {
    // console.trace()
    const result = {
      type: 'public',
      userId: '',
      assetId: '',
      fontUrl: ''
    }
    const pairs = str.match(/[a-z-]+\s*:\s*[^;]*;/g) ?? []
    for (const pair of pairs) {
      const keyValue = pair.match(/([a-z-]+)\s*:\s*([^;]*);/)
      if (!keyValue) continue
      switch (keyValue[1]) {
        case 'font-type':
          result.type = keyValue[2]
          break
        case 'user-id':
          result.userId = keyValue[2]
          break
        case 'asset-id':
          result.assetId = keyValue[2]
          break
        case 'font-url':
          result.fontUrl = keyValue[2]
          break
      }
    }
    return result
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
          let sStyles: ISpanStyle
          if (paragraph.attrs.spanStyle) {
            sStyles = this.makeSpanStyle(paragraph.attrs)
          } else {
            sStyles = this.generateSpanStyle(defaultStyle)
          }
          if (sStyles.size > largestSize) largestSize = sStyles.size
          spans.push({ text: span.text, styles: sStyles })
        }
        if (span.text.includes(' ')) {
          isSetContentRequired = true
        }
      }
      if (spans.length === 0) {
        if (paragraph.attrs.spanStyle) {
          const sStyles = this.makeSpanStyle(paragraph.attrs)
          spans.push({ text: '', styles: sStyles })
          pStyles.size = sStyles.size
          pStyles.font = sStyles.font
          pStyles.type = sStyles.type
          pStyles.userId = sStyles.userId
          pStyles.assetId = sStyles.assetId
          pStyles.fontUrl = sStyles.fontUrl
          result.push({ spans, styles: pStyles, spanStyle: this.textStyles(sStyles) })
        } else {
          isSetContentRequired = true
          const sStyles = this.generateSpanStyle(defaultStyle)
          spans.push({ text: '', styles: sStyles })
          pStyles.size = sStyles.size
          pStyles.font = sStyles.font
          pStyles.type = sStyles.type
          pStyles.userId = sStyles.userId
          pStyles.assetId = sStyles.assetId
          pStyles.fontUrl = sStyles.fontUrl
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

  applySpanStyle(key: string, value: any, applyToRange: boolean | undefined = undefined, otherUpdates: {[key: string]: any} = {}) {
    const item = { [key]: value }
    Object.assign(item, otherUpdates)
    const { subLayerIdx, getCurrLayer } = layerUtils
    const contentEditable = subLayerIdx === -1 ? getCurrLayer.contentEditable : (getCurrLayer as IGroup).layers[subLayerIdx].contentEditable
    this.agent(editor => {
      if (contentEditable && (applyToRange !== false)) { // contentEditable and (applyToRange not set or isRanged (set font for range))
        const ranges = editor.state.selection.ranges
        if (ranges.length > 0) {
          if (ranges[0].$from.pos === ranges[0].$to.pos) {
            const attr = this.generateSpanStyle(editor.storage.nuTextStyle.spanStyle)
            attr[key] = value
            Object.assign(attr, otherUpdates)
            editor.storage.nuTextStyle.spanStyle = this.textStyles(attr)
            editor.chain().setMark('textStyle', attr).run()
            setTimeout(() => {
              editor.commands.focus()
            }, 10)
          } else {
            editor.chain().updateAttributes('textStyle', item).updateAttributes('paragraph', item).run()
            setTimeout(() => {
              editor.chain().focus().selectPrevious().run()
            }, 10)
          }
        }
      } else {
        textPropUtils.applyPropsToAll('span,paragraph', item)
        this.updateHtml()
      }
    })
  }

  spanStyleHandler(updateKey: string, updateValue: string | boolean | number) {
    const item = { [updateKey]: updateValue }
    const { subLayerIdx, getCurrLayer: currLayer, layerIndex } = layerUtils

    switch (currLayer.type) {
      case 'text':
        this.applySpanStyle(updateKey, updateValue)
        break
      case 'tmp':
      case 'group':
        if (subLayerIdx === -1 || !(currLayer as IGroup).layers[subLayerIdx].contentEditable) {
          textPropUtils.applyPropsToAll('span,paragraph', item, layerIndex, subLayerIdx)
          if (subLayerIdx !== -1) {
            this.updateHtml()
          }
        } else {
          this.applySpanStyle(updateKey, updateValue)
        }
    }
    textEffectUtils.refreshColor()
    textPropUtils.updateTextPropsState(item)
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
            const attr = this.generateSpanStyle(editor.storage.nuTextStyle.spanStyle)
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
        if (currLayer.type === 'text') {
          paragraphs = (currLayer as IText).paragraphs
        } else if (subLayerIdx !== -1) {
          paragraphs = (currLayer as IGroup).layers[subLayerIdx].paragraphs as IParagraph[]
        } else {
          return
        }
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
