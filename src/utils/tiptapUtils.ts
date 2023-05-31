import { IGroup, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import { checkAndConvertToHex } from '@/utils/colorUtils'
import cssConveter from '@/utils/cssConverter'
import generalUtils from '@/utils/generalUtils'
import layerUtils from '@/utils/layerUtils'
import NuTextStyle from '@/utils/nuTextStyle'
import textEffectUtils from '@/utils/textEffectUtils'
import textPropUtils from '@/utils/textPropUtils'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import { Editor, EditorEvents, FocusPosition, JSONContent } from '@tiptap/vue-3'
import { EventEmitter } from 'events'
import shortcutUtils from './shortcutUtils'
import textBgUtils from './textBgUtils'
import textUtils from './textUtils'

interface ITiptapJson extends JSONContent {
  type: 'doc'
  content: {
    type: 'paragraph'
    attrs: Record<'align' | 'assetId' | 'color' | 'decoration' | 'font' |
      'fontUrl' | 'style' | 'type' | 'userId' | 'weight', string>
    & Record<'fontSpacing' | 'lineHeight' | 'size', number>
    & Record<'spanStyle', boolean>
    content?: {
      type: 'text'
      text: string
      marks?: {
        type: 'textStyle'
        attrs: Record<'assetId' | 'color' | 'decoration' | 'font' | 'fontUrl' |
          'style' | 'type' | 'userId' | 'weight' | 'width', string>
        & Record<'size' | 'spanIndex', number>
        & Record<'pre', string>
      }[]
    }[]
  }[]
}

class TiptapUtils {
  event: any
  eventHandler: undefined | ((toRecord: boolean) => void)
  editor: Editor | undefined = undefined
  prevText: string | undefined = undefined
  prevJSON: any | undefined = undefined

  constructor() {
    this.event = new EventEmitter()
    this.eventHandler = undefined
  }

  init(content: any, editable: boolean) {
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
        },
        handlePaste: (view, event: ClipboardEvent, slice) => {
          if (!event.clipboardData) return false
          const items = event.clipboardData.items
          for (let i = items.length - 1; i >= 0; i--) {
            if (items[i].kind === 'string' && items[i].type === 'text/plain') {
              items[i].getAsString(str => {
                shortcutUtils.textPasteWith(str)
              })
            }
          }
          return true
        }
      },
      parseOptions: {
        preserveWhitespace: 'full'
      },
      editable,
      onCreate: ({ editor }) => {
        this.updatePrevData(editor as Editor)
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

  textStylesRaw(styles: any): { [key: string]: any } {
    const textStyles = cssConveter.convertFontStyle(styles)
    return Object.assign(textStyles, {
      '-webkit-text-decoration-line': textStyles['text-decoration-line']
    })
  }

  textStyles(styles: any): string {
    return Object.entries(this.textStylesRaw(styles)).map(([k, v]) => `${k}: ${v}`).join('; ')
  }

  toJSON(paragraphs: IParagraph[]): ITiptapJson {
    return {
      type: 'doc',
      content: paragraphs.map(p => {
        const pObj = {
          type: 'paragraph'
        } as { [key: string]: any }
        const attrs = this.makeParagraphStyle(p.styles) as any

        // If p is empty, no span exist, so need to store span style in p.spanStyle
        if (p.spanStyle) {
          attrs.spanStyle = true
          const sStyles = this.generateSpanStyle(p.spanStyle as string)
          Object.assign(attrs, this.extractSpanStyleForParagraph(sStyles))
        }
        pObj.attrs = attrs
        if (p.spans.length > 1 || p.spans[0].text !== '') {
          const spans = this.splitLastWhiteSpaces(p.spans)
          const config = layerUtils.getCurrConfig as IText
          const splitSpan = textBgUtils.isSplitSpan(config.styles)
          const textEffectStyles = textEffectUtils.convertTextEffect(config)
          pObj.content = spans.map((s, sIndex) => {
            return {
              type: 'text',
              text: s.text,
              marks: [{
                type: 'textStyle',
                attrs: Object.assign(this.makeSpanStyle(s.styles),
                  textEffectStyles,
                  splitSpan ? { spanIndex: sIndex, ...textBgUtils.fixedWidthStyle(s.styles, p.styles, config) } : {},
                )
              }]
            }
          })
        }
        return pObj
      }) as ITiptapJson['content']
    }
  }

  splitLastWhiteSpaces(spans: ISpan[]): ISpan[] {
    const lastSpan = spans[spans.length - 1]
    if (!lastSpan.text.endsWith(' ')) return spans
    const copiedSpans = generalUtils.deepCopy(spans)
    const lastWhiteSpaces = lastSpan.text.match(/ +$/)?.[0] ?? ''
    const prevText = lastSpan.text.substring(0, lastSpan.text.length - lastWhiteSpaces.length)
    if (prevText === '') {
      copiedSpans[copiedSpans.length - 1].styles.pre = true
      return copiedSpans
    } else {
      copiedSpans[copiedSpans.length - 1].text = prevText
      copiedSpans.push({ text: lastWhiteSpaces, styles: { ...lastSpan.styles, pre: true } })
      return copiedSpans
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
      color: checkAndConvertToHex(spanStyle.color),
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

  toIParagraph(_tiptapJSON: JSONContent): { paragraphs: IParagraph[], isSetContentRequired: boolean } {
    const tiptapJSON = _tiptapJSON as ITiptapJson
    if (!this.editor) return { paragraphs: [], isSetContentRequired: false }

    let isSetContentRequired = false

    // If fixedWidth, all span should split into one text per span
    const splitSpan = tiptapJSON.content?.some(p => {
      return p.content?.some(span => ![-1, undefined].includes(span.marks?.[0].attrs?.spanIndex))
    })
    if (splitSpan) {
      tiptapJSON.content.forEach(p => {
        p.content && p.content.forEach(s => {
          // Check if some text need to be split here.
          if (s.text.length > 1) isSetContentRequired = true

          // Check if letter spacing changed
          if (!s.marks || s.marks.length === 0) return
          const width = parseFloat(s.marks[0].attrs.width)
          if (width !== s.marks[0].attrs.size * 1.333333 * (p.attrs.fontSpacing + 1)) {
            isSetContentRequired = true
          }
        })
      })
    }

    const defaultStyle = this.editor.storage.nuTextStyle.spanStyle as string
    const result: IParagraph[] = []
    for (const paragraph of tiptapJSON.content) {
      const pStyles = this.makeParagraphStyle(paragraph.attrs)
      let largestSize = 0
      const spans: ISpan[] = []
      const pContent = splitSpan && paragraph.content && !this.editor.view.composing
        // Split span for fixedWidth, another one in textBgUtils.setTextBg
        ? paragraph.content.flatMap(span => textUtils.splitter.splitGraphemes(span.text)
          .map(t => Object.assign({}, span, { text: t })))
        : paragraph.content
      for (const span of pContent ?? []) {
        if (span.marks && span.marks.length > 0) {
          const sStyles = this.makeSpanStyle(span.marks[0].attrs)
          if (sStyles.size > largestSize) largestSize = sStyles.size
          if (sStyles.pre && !span.text.match(/^ +$/)) {
            sStyles.pre = undefined
            isSetContentRequired = true
          }
          if (span.text.includes('\ufe0e') || span.text.includes('\ufe0f')) {
            isSetContentRequired = true
          }
          spans.push({ text: span.text.replace(/[\ufe0e\ufe0f]/g, ''), styles: sStyles })
        } else {
          isSetContentRequired = true
          let sStyles: ISpanStyle
          if (paragraph.attrs.spanStyle) {
            sStyles = this.makeSpanStyle(paragraph.attrs)
          } else {
            sStyles = this.generateSpanStyle(defaultStyle)
          }
          if (sStyles.size > largestSize) largestSize = sStyles.size
          if (sStyles.pre && !span.text.match(/^ +$/)) {
            sStyles.pre = undefined
            isSetContentRequired = true
          }
          spans.push({ text: span.text.replace(/[\ufe0e\ufe0f]/g, ''), styles: sStyles })
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
          // keep size of <p> the same as the largest size of <span>s
          pStyles.size = largestSize
          isSetContentRequired = true
        }
        if (pStyles.font === 'undefined') {
          // <p>s of pasted text may have 'undefined' font
          // If so, use the font of the first <span>
          const sStyles = spans[0].styles
          pStyles.font = sStyles.font
          pStyles.type = sStyles.type
          pStyles.userId = sStyles.userId
          pStyles.assetId = sStyles.assetId
          pStyles.fontUrl = sStyles.fontUrl
          isSetContentRequired = true
        }
        if (paragraph.attrs.spanStyle) {
          isSetContentRequired = true
        }
        const lastSpanText = spans[spans.length - 1].text
        if (lastSpanText.endsWith(' ') && !lastSpanText.match(/^ +$/)) {
          isSetContentRequired = true
        }
        result.push({ spans, styles: pStyles })
      }
    }
    return { paragraphs: result, isSetContentRequired }
  }

  getText(json: any): string {
    const lines: string[] = []
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

  updatePrevData(editor: Editor) {
    const json = editor.getJSON()
    this.prevJSON = json
    this.prevText = this.getText(json)
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

  applySpanStyle(key: string, value: any, applyToRange: boolean | undefined = undefined, otherUpdates: { [key: string]: any } = {}, toFocus = true) {
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
            if (toFocus) {
              setTimeout(() => {
                editor.commands.focus()
              }, 10)
            }
          } else {
            editor.chain().updateAttributes('textStyle', item).updateAttributes('paragraph', item).run()
            setTimeout(() => {
              if (toFocus) {
                editor.chain().focus().selectPrevious().run()
              } else {
                editor.chain().selectPrevious().run()
              }
            }, 10)
          }
        }
      } else {
        textPropUtils.applyPropsToAll('span,paragraph', item)
        this.updateHtml()
      }
    })
  }

  spanStyleHandler(updateKey: string, updateValue: string | boolean | number, toFocus = true) {
    const item = { [updateKey]: updateValue }
    const { subLayerIdx, getCurrLayer: currLayer, layerIndex } = layerUtils

    switch (currLayer.type) {
      case 'text':
        this.applySpanStyle(updateKey, updateValue, undefined, {}, toFocus)
        break
      case 'tmp':
      case 'group':
        if (subLayerIdx === -1 || !currLayer.layers[subLayerIdx].contentEditable) {
          textPropUtils.applyPropsToAll('span,paragraph', item, layerIndex, subLayerIdx)
          if (subLayerIdx !== -1) {
            this.updateHtml()
            textUtils.updateTextLayerSizeByShape(layerUtils.pageIndex, layerIndex, subLayerIdx)
          } else {
            for (const [i, subLayer] of currLayer.layers.entries()) {
              if (subLayer.type !== 'text') continue
              textUtils.updateTextLayerSizeByShape(layerUtils.pageIndex, layerIndex, i)
            }
          }
          textUtils.updateGroupLayerSize(layerUtils.pageIndex, layerIndex)
        } else {
          this.applySpanStyle(updateKey, updateValue, undefined, {}, toFocus)
        }
    }
    textPropUtils.updateTextPropsState(item)
  }

  applyParagraphStyle(key: string, value: any, setFocus = true) {
    const item: { [string: string]: any } = {}
    item[key] = value
    this.agent(editor => {
      if (this.isCurrLayerContenteditable()) {
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

  applyDivStyle() { // If you need to add some css to div of tiptap, use it.
    const style = Object.entries({
    }).map(([k, v]) => `${k}: ${v}`).join('; ')

    this.agent(editor => {
      editor.setOptions({
        editorProps: {
          attributes: { style },
        },
      })
    })
  }

  focus(options = {} as { scrollIntoView?: boolean }, pos?: FocusPosition) {
    if (this.editor) {
      this.editor.commands.focus(pos, options)
    }
  }

  getParagraphs(): IParagraph[] | undefined {
    const { subLayerIdx, getCurrLayer: currLayer } = layerUtils
    if (currLayer.type === 'text') {
      return (currLayer as IText).paragraphs
    } else if (subLayerIdx !== -1) {
      return (currLayer as IGroup).layers[subLayerIdx].paragraphs as IParagraph[]
    }
  }

  updateHtml(paragraphs?: IParagraph[]) {
    if (this.editor) {
      if (!paragraphs) {
        const temp = this.getParagraphs()
        if (temp === undefined) return
        paragraphs = temp
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
