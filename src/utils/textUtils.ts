import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { v4 as uuidv4 } from 'uuid'
import { ILayer, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText, ITmp, IGroup, IImage, IShape } from '@/interfaces/layer'
import { IFont, ISelection } from '@/interfaces/text'
import CssConveter from '@/utils/cssConverter'
import GeneralUtils from './generalUtils'
import Vue from 'vue'
import LayerUtils from './layerUtils'
import { IPage } from '@/interfaces/page'
import LayerFactary from '@/utils/layerFactary'
import TextPropUtils from '@/utils/textPropUtils'

class TextUtils {
  public readonly MARGIN_FONTSIZE = 16

  get pageIndex(): number { return store.getters.getCurrSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrTextProps() { return store.state.text?.props }
  get getLayer() { return store.getters.getLayer }
  get getCurrSel() { return store.state.text?.sel }
  get getCurrLayer() { return store.getters.getLayer(this.pageIndex, this.layerIndex) }
  get lastSelectedPageIndex() { return store.getters.getLastSelectedPageIndex }
  get getPage() { return store.getters.getPage }

  isArrowKey(e: KeyboardEvent): boolean {
    return e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight'
  }

  updateLayerSize() {
    const textHW = this.getTextHW(this.getCurrLayer)
    ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, 1)
  }

  getSelection(): { div: Node, start: ISelection, end: ISelection } | undefined {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel?.getRangeAt(0)
    if (range) {
      let div = range.commonAncestorContainer
      while (div?.parentNode && div?.nodeName !== 'DIV') {
        div = div?.parentNode
      }
      const start = {
        pIndex: parseInt(range.startContainer?.parentElement?.parentElement?.dataset.pindex as string),
        sIndex: parseInt(range.startContainer?.parentElement?.dataset.sindex as string),
        offset: range.startOffset as number
      }

      if (!div || (div as HTMLElement).id.match('text') === null || !this.isSel(start) ||
        !range || !range.startContainer || !range.endContainer) return undefined

      const isRanged = window.getSelection()?.toString() !== ''
      const end = {
        pIndex: isRanged ? parseInt(range.endContainer?.parentElement?.parentElement?.dataset.pindex as string) : NaN,
        sIndex: isRanged ? parseInt(range.endContainer?.parentElement?.dataset.sindex as string) : NaN,
        offset: isRanged ? range?.endOffset as number : NaN
      }

      return {
        div,
        start,
        end
      }
    }
  }

  focus(start?: ISelection, end?: ISelection, async = false) {
    const text = document.getElementById(`text-${this.layerIndex}`) as HTMLElement
    const range = new Range()

    if ((!start || !this.isSel(start)) && (this.getCurrSel && this.isSel(this.getCurrSel.start))) {
      start = {} as ISelection
      Object.assign(start, this.getCurrSel.start)
    } else if (!this.getCurrSel || !this.isSel(this.getCurrSel.start)) {
      return
    }
    start = start as ISelection
    range.setStart(text.childNodes[start.pIndex].childNodes[start.sIndex].firstChild as Node, start.offset)

    if (end && this.isSel(end)) {
      range.setEnd(text.childNodes[end.pIndex].childNodes[end.sIndex].firstChild as Node, end.offset)
    }

    const setSelection = () => {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    /**
     * The reason to use setTimeout is because if not put the setSelection inside it,
     * it will not set the single-caret to the desired position.
     * However this problem will not happen in the situation of range-selection,
     * in the other hand, in this situation put the setSelection in the setTimeout function will casue glitch.
     * */
    if (async) {
      setTimeout(() => {
        setSelection()
      }, 0)
    } else {
      setSelection()
    }
  }

  textParser(text: HTMLElement, config: IText): IParagraph[] {
    const paragraphs: IParagraph[] = []
    const div = text
    const ps = div.childNodes
    ps.forEach((p, pIndex) => {
      const spans: ISpan[] = []
      const spanStyleBuff = {} as ISpanStyle
      for (const [sIndex, span] of p.childNodes.entries()) {
        if (span instanceof HTMLElement) {
          let spanEl = span as HTMLElement
          const text = spanEl.innerText as string
          /**
           * If the span is the same without changed, skip parse it
           */
          if (config.paragraphs[pIndex] && config.paragraphs[pIndex].spans[sIndex] && text === config.paragraphs[pIndex].spans[sIndex].text) {
            if (TextPropUtils.isSameSpanStyles(config.paragraphs[pIndex].spans[sIndex].styles, spanStyleBuff)) {
              spans[spans.length - 1].text += text
            } else {
              spans.push(config.paragraphs[pIndex].spans[sIndex])
            }
            Object.assign(spanStyleBuff, config.paragraphs[pIndex].spans[sIndex].styles)
            continue
          }
          /**
           *  If the span and p are deleted as empty string, the style of the span will be removed by the browser
           *  below detecting the situation and use the style of the last span of previous p to replace it.
           */
          if (spanEl.style.fontFamily === '') {
            const leng = div.childNodes[pIndex - 1].childNodes.length
            spanEl = div.childNodes[pIndex - 1].childNodes[leng - 1] as HTMLElement
          }

          const isValidHexColor = (value: string) => value.match(/^#[0-9A-F]{6}$/) !== null
          const componentToHex = (c: number) => c.toString(16).length === 1 ? '0' + c.toString(16).toUpperCase() : c.toString(16).toUpperCase()
          const rgbToHex = (rgb: string) => {
            const rgbArr = rgb.match(/\d+/g)
            if (rgbArr && rgbArr.length === 3) {
              return '#' + componentToHex(parseInt(rgbArr[0])) + componentToHex(parseInt(rgbArr[1])) + componentToHex(parseInt(rgbArr[2]))
            } else {
              return rgb
            }
          }

          const spanStyle = {
            font: spanEl.style.fontFamily,
            weight: spanEl.style.fontWeight,
            size: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
            decoration: spanEl.style.textDecorationLine,
            style: spanEl.style.fontStyle,
            color: isValidHexColor(spanEl.style.color) ? spanEl.style.color : rgbToHex(spanEl.style.color),
            opacity: parseInt(spanEl.style.opacity)
          } as ISpanStyle

          if (TextPropUtils.isSameSpanStyles(spanStyle, spanStyleBuff)) {
            spans[spans.length - 1].text += text
          } else {
            spans.push({ text: text, styles: spanStyle, id: uuidv4() })
          }
          Object.assign(spanStyleBuff, spanStyle)
        }
      }
      const pEl = p as HTMLElement
      const floatNum = /[+-]?\d+(\.\d+)?/
      const lineHeight = pEl.style.lineHeight.match(floatNum) !== null ? parseFloat(pEl.style.lineHeight.match(floatNum)![0]) : -1
      const fontSpacing = pEl.style.letterSpacing.match(floatNum) !== null ? parseFloat(pEl.style.letterSpacing.match(floatNum)![0]) : 0
      const fontSize = parseInt(pEl.style.fontSize.split('px')[0])
      const pStyle: IParagraphStyle = { lineHeight, fontSpacing, size: fontSize, align: pEl.style.textAlign.replace('text-align-', '') }
      paragraphs.push({ styles: pStyle, spans: spans, id: uuidv4() })
    })
    paragraphs.forEach(p => {
      if (p.spans.length === 1 && p.spans[0].text === '') {
        p.spans[0].text = '\n'
      }
    })
    return paragraphs
  }

  newPropsHandler(paragraphs: IParagraph[]): IParagraph[] {
    const sel = this.getSelection()
    if (sel && this.isSel(sel.start)) {
      const currPropsState = this.getCurrTextProps
      if (currPropsState && paragraphs[sel.start.pIndex].spans[sel.start.sIndex]) {
        const isSameSpanStyles = (() => {
          const props = ['weight', 'style', 'decoration', 'color']
          for (const k of props) {
            if (paragraphs[sel.start.pIndex].spans[sel.start.sIndex].styles[k] !== currPropsState[k]) {
              return false
            }
          }
          return true
        })()

        if (!isSameSpanStyles) {
          const selSpan = GeneralUtils.deepCopy(paragraphs[sel.start.pIndex].spans[sel.start.sIndex]) as ISpan
          const originSpanStyles = GeneralUtils.deepCopy(selSpan.styles)
          const newSpanStyles = Object.assign(GeneralUtils.deepCopy(selSpan.styles), {
            weight: currPropsState.weight,
            style: currPropsState.style,
            decoration: currPropsState.decoration,
            color: currPropsState.color
          })
          paragraphs[sel.start.pIndex].spans[sel.start.sIndex].text = selSpan.text.slice(0, sel.start.offset - 1)
          paragraphs[sel.start.pIndex].spans.splice(sel.start.sIndex + 1, 0, {
            styles: newSpanStyles,
            text: selSpan.text[sel.start.offset - 1]
          })
          if (selSpan.text.substr(sel.start.offset)) {
            paragraphs[sel.start.pIndex].spans.splice(sel.start.sIndex + 2, 0, {
              styles: originSpanStyles,
              text: selSpan.text.substr(sel.start.offset)
            })
          }
          Object.assign(sel.start, { sIndex: sel.start.sIndex + 1, offset: 1 })
          this.updateSelection(sel.start, sel.end)
        }
      }
    }
    return paragraphs
  }

  textResizeHandler(pageIndex: number, layerIndex: number, width: number, height: number): [number, number] {
    const text = document.getElementById(`text-${layerIndex}`)
    if (text) {
      const config = this.getLayer(pageIndex, layerIndex) as IText
      const scaleRatio = store.getters.getPageScaleRatio
      const transform = text.style.transform
      text.style.transform = `rotate(${-config.styles.rotate}deg)`
      if (config.styles.writingMode.includes('vertical')) {
        width = text.getBoundingClientRect().width / (scaleRatio / 100) + this.MARGIN_FONTSIZE
        ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: height })
      } else {
        height = text.getBoundingClientRect().height / (scaleRatio / 100) + this.MARGIN_FONTSIZE
        ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: width })
      }
      text.style.transform = transform
    }
    return [width, height]
  }

  isNoCharactor(e: KeyboardEvent): boolean {
    if (e.key === 'Backspace') {
      return false
    }
    return e.key.length !== 1
  }

  isSel(sel?: { pIndex: number, sIndex: number, offset?: number }): boolean {
    const isNotNull = (sel?.pIndex !== null) && (sel?.sIndex !== null)
    return typeof sel !== 'undefined' && (!Number.isNaN(sel.pIndex) && !Number.isNaN(sel.sIndex) && !Number.isNaN(sel.offset)) && isNotNull
  }

  getNullSel(): ISelection {
    return {
      pIndex: NaN,
      sIndex: NaN,
      offset: NaN
    }
  }

  getTextHW(content: IText, widthLimit = -1): { width: number, height: number } {
    const body = document.createElement('div')
    content.paragraphs.forEach(pData => {
      const p = document.createElement('p')
      let fontSize = 0
      pData.spans.forEach(spanData => {
        const span = document.createElement('span')
        span.textContent = spanData.text
        Object.assign(span.style, CssConveter.convertFontStyle(spanData.styles))
        span.style.whiteSpace = 'pre-wrap'
        p.appendChild(span)

        if (spanData.styles.size > fontSize) {
          fontSize = spanData.styles.size
        }
      })
      Object.assign(p.style, CssConveter.convertFontStyle(pData.styles), { size: fontSize })
      // p.style.margin = '0.5em'
      p.style.margin = '0'
      p.style.overflowWrap = 'break-word'
      body.appendChild(p)
    })
    if (content.styles.writingMode.includes('vertical')) {
      body.style.height = widthLimit === -1 ? 'max-content' : `${widthLimit / content.styles.scale}px`
      body.style.width = 'max-content'
    } else {
      body.style.width = widthLimit === -1 ? 'max-content' : `${widthLimit / content.styles.scale}px`
      body.style.height = 'max-content'
    }
    body.style.border = '1px solid blue'
    body.style.whiteSpace = 'pre-wrap'
    body.style.textAlign = 'center'
    body.style.writingMode = content.styles.writingMode
    document.body.appendChild(body)

    const scale = content.styles.scale ?? 1
    const textHW = {
      width: body.style.width !== 'max-content' ? widthLimit : Math.ceil(body.getBoundingClientRect().width * scale),
      height: body.style.height !== 'max-content' ? widthLimit : Math.ceil(body.getBoundingClientRect().height * scale)
    }
    document.body.removeChild(body)
    return textHW
  }

  getAddPosition (width: number, height: number) {
    const { pageIndex, index } = this.currSelectedInfo
    const page = this.getPage(this.lastSelectedPageIndex) as IPage
    const x = (page.width - width) / 2
    const y = (page.height - height) / 2

    if (pageIndex === this.lastSelectedPageIndex) {
      const currLayer = this.getLayer(pageIndex, index) as IShape | IText | IImage | IGroup | ITmp
      const specx = currLayer.styles.x + (currLayer.styles.width - width) / 2
      const specy = currLayer.styles.y + currLayer.styles.height
      if ((specy + height) < page.height) {
        return { x: specx, y: specy }
      }
    }
    return { x, y }
  }

  addStanardText(type: string) {
    import(`@/assets/json/${type}.json`)
      .then(json => {
        const fieldMap = {
          heading: 'isHeading',
          subheading: 'isSubheading',
          body: 'isBody'
        } as { [key: string]: string }
        const field = fieldMap[type]
        this.addText(json, field)
      })
      .catch(() => {
        console.log('Cannot find the file')
      })
  }

  addText (json: any, field?: string) {
    const format = GeneralUtils.deepCopy(json) as IText
    const page = this.getPage(this.lastSelectedPageIndex) as IPage

    /**
     * Add the response font-size for each paragraph
     */
    const paragraphSizes = this.getParagraphSize(format)
    for (const i in format.paragraphs) {
      format.paragraphs[i].styles.size = paragraphSizes[i]
    }

    const size = {} as { [key: string]: number }
    if (format.styles && format.styles.height && format.styles.width) {
      Object.assign(size, { width: format.styles.width, height: format.styles.height })
    } else {
      Object.assign(size, this.getTextHW(format))
    }
    const position = {} as { [key: string]: number }
    if (format.styles && typeof format.styles.x !== 'undefined' && typeof format.styles.y !== 'undefined') {
      Object.assign(position, { x: format.styles.x, y: format.styles.y })
    } else {
      Object.assign(position, this.getAddPosition(size.width, size.height))
    }
    Object.assign(format.styles, position, size)

    /**
     * Check if there already exist an heading on the page. If not, set the new one as.
     */
    if (field && !page.layers.find(l => l.type === 'text' && (l as IText)[field])) {
      Object.assign(format, { [field]: true })
    }
    const newTextLayer = LayerFactary.newText(format)
    LayerUtils.addLayers(this.lastSelectedPageIndex, newTextLayer)
  }

  getParagraphSize(config: IText): Array<number> {
    const sizeArr = []
    for (const p of config.paragraphs) {
      let fontSize = -1
      for (const span of p.spans) {
        if (span.styles.size > fontSize) {
          fontSize = span.styles.size
        }
      }
      sizeArr.push(fontSize)
    }
    return sizeArr
  }

  addGroup (json: any) {
    const { layers, styles } = GeneralUtils.deepCopy(json)
    const position = this.getAddPosition(styles.width, styles.height)
    Object.assign(styles, position)
    const newGroupLayer = LayerFactary.newGroup(styles, layers)
    LayerUtils.addLayers(this.lastSelectedPageIndex, newGroupLayer)
  }

  updateTextStyles(pageIndex: number, layerIndex: number, styles: { [key: string]: string | number | boolean }) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles
    })
  }

  setTextInfo(textInfo: { [key: string]: Array<string> }) {
    store.commit('SET_textInfo', textInfo)
  }

  textInfoUpdater(field: string, paragraphs: IParagraph[]) {
    const textArr = []
    for (const p of paragraphs) {
      let text = ''
      for (const span of p.spans) {
        text += span.text
      }
      textArr.push(text)
    }
    this.setTextInfo({ [field]: textArr })
  }

  updateTextParagraphs(pageIndex: number, layerIndex: number, paragraphs: IParagraph[]) {
    const config = this.getLayer(pageIndex, layerIndex) as IText
    if (config.isHeading) {
      this.textInfoUpdater('heading', paragraphs)
    }
    store.commit('UPDATE_textProps', {
      pageIndex,
      layerIndex,
      paragraphs
    })
  }

  updateSelectedParagraphs(tmpLayerIndex: number, paragraphs: IParagraph[]) {
    store.commit('UPDATE_selectedTextParagraphs', {
      tmpLayerIndex,
      paragraphs
    })
  }

  updateSelection(start: ISelection, end: ISelection) {
    store.commit('text/UPDATE_selection', {
      start,
      end
    })
  }

  setSelectionDefault() {
    const nan = {
      pIndex: NaN,
      sIndex: NaN,
      offset: NaN
    }
    store.commit('text/UPDATE_selection', {
      start: nan,
      end: nan
    })
  }

  updateFontFace(font: IFont) {
    store.commit('text/UPDATE_fontFace', font)
  }
}

export default new TextUtils()
