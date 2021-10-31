import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { ILayer, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText, ITmp, IGroup, IImage, IShape } from '@/interfaces/layer'
import { IFont, ISelection } from '@/interfaces/text'
import CssConveter from '@/utils/cssConverter'
import GeneralUtils from './generalUtils'
import LayerUtils from './layerUtils'
import { IPage } from '@/interfaces/page'
import { calcTmpProps } from '@/utils/groupUtils'
import LayerFactary from '@/utils/layerFactary'
import TextPropUtils from '@/utils/textPropUtils'
import { instrumentOutgoingRequests } from '@sentry/tracing/dist/browser'

class TextUtils {
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrTextProps() { return store.state.text?.props }
  get getCurrSel() { return store.state.text?.sel }
  get lastSelectedPageIndex() { return store.getters.getLastSelectedPageIndex }

  isArrowKey(e: KeyboardEvent): boolean {
    return e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight'
  }

  getSelection(): { div: Node, start: ISelection, end: ISelection } | undefined {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel?.getRangeAt(0)
    if (range) {
      /**
       * The div of this function only returns the Text-Body of the controller text
       * which means the other selection ranged in the web will not be considered in here
       * the controller text body would hold a class-tag, such as `text-${layerIndex}` as an identity
       */
      let div: undefined | Node = range.commonAncestorContainer
      const isTextBody = (div: HTMLElement) => {
        try {
          return (div instanceof HTMLElement) && div.id.match('text')
        } catch {
          throw new Error('select range with wrong element!')
        }
      }

      while (div.parentNode && (div.nodeName !== 'DIV' || !isTextBody(div as HTMLElement))) {
        div = div.parentNode
      }

      if (!isTextBody(div as HTMLElement)) {
        div = undefined
      }

      let start = {
        pIndex: parseInt(range.startContainer?.parentElement?.parentElement?.dataset.pindex as string)
      } as ISelection

      let p = range.startContainer
      while (p.nodeName !== 'P' && p.parentElement) {
        p = p.parentElement
      }
      if (p.firstChild) {
        const pChild = p.firstChild
        switch (pChild.nodeName) {
          case 'SPAN':
            start = {
              pIndex: +((p as HTMLElement).dataset.pindex as string) ?? NaN,
              sIndex: +(range.startContainer.parentElement?.dataset.sindex as string) ?? NaN,
              offset: range.startOffset as number
            }
            break
          case 'BR':
            start = {
              pIndex: +((p as HTMLElement).dataset.pindex as string),
              sIndex: 0,
              offset: 1
            }
            break
          case '#text':
            start = {
              pIndex: +((p as HTMLElement).dataset.pindex as string) ?? NaN,
              sIndex: 0,
              offset: range.startOffset as number
            }
            break
          default:
            return div ? {
              div,
              start: { ...store.state.text?.sel.start } as ISelection,
              end: { ...store.state.text?.sel.end } as ISelection
            } : undefined
        }
      } else {
        throw new Error('wrong type node of the p.firstChild')
      }

      if (!div || (div as HTMLElement).id.match('text') === null || !this.isSel(start) ||
        !range || !range.startContainer || !range.endContainer) return undefined

      const isRanged = window.getSelection()?.toString() !== ''
      let end = {
        pIndex: isRanged ? parseInt(range.endContainer?.parentElement?.parentElement?.dataset.pindex as string) : NaN,
        sIndex: isRanged ? parseInt(range.endContainer?.parentElement?.dataset.sindex as string) : NaN,
        offset: isRanged ? range?.endOffset as number : NaN
      }

      if (this.startEqualEnd(start, end)) {
        end = this.getNullSel()
      }

      return {
        div,
        start,
        end
      }
    }
  }

  startEqualEnd (start: ISelection, end: ISelection) {
    return (Object.keys(start) as Array<(keyof ISelection)>)
      .every((k: (keyof ISelection)) => start[k] === end[k])
  }

  focus(start?: ISelection, end?: ISelection, async = false) {
    const text = document.getElementById(`text-${LayerUtils.layerIndex}`) as HTMLElement
    const range = new Range()

    if ((!start || !this.isSel(start)) && (this.getCurrSel && this.isSel(this.getCurrSel.start))) {
      start = {} as ISelection
      Object.assign(start, this.getCurrSel.start)
    } else if (!this.getCurrSel || !this.isSel(this.getCurrSel.start)) {
      return
    }
    start = start as ISelection
    if (text.childNodes[start.pIndex].childNodes[start.sIndex].firstChild) {
      range.setStart(text.childNodes[start.pIndex].childNodes[start.sIndex].firstChild as Node, start.offset)
    } else {
      /**
       * else case for <p> <br></br> </p>
       */
      range.setStart(text.childNodes[start.pIndex].firstChild as Node, 0)
    }

    if (end && this.isSel(end)) {
      if (text.childNodes[end.pIndex].childNodes[end.sIndex].firstChild) {
        range.setEnd(text.childNodes[end.pIndex].childNodes[end.sIndex].firstChild as Node, end.offset)
      } else {
        /**
         * else case for <p> <br></br> </p>
         */
        range.setEnd(text.childNodes[end.pIndex].firstChild as Node, 0)
      }
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

  isEmptyText(config: IText): boolean {
    return config.paragraphs.length === 1 && config.paragraphs[0].spans.length === 1 && config.paragraphs[0].spans[0].text === ''
  }

  textParser(text: HTMLElement, config: IText): IParagraph[] {
    const paragraphs: IParagraph[] = []
    const div = text
    const ps = div.childNodes
    ps.forEach((p, pIndex) => {
      const spans: ISpan[] = []
      const spanStyleBuff = {} as ISpanStyle
      for (const [sIndex, el] of p.childNodes.entries()) {
        let spanEl: HTMLElement
        if (el.nodeName === 'SPAN') {
          spanEl = el as HTMLElement
        } else {
          let child = p
          const span = document.createElement('span')
          while (child.firstChild) {
            child = child.firstChild
          }
          /**
           * If child.textContent is truthy, means the correspond HTML tag is <Font>,
           * else there should be an empty content correspond to <br>
           */
          if (child.textContent) {
            span.textContent = el.textContent
          } else if (child.nodeName === 'BR') {
            span.textContent = ''
          } else {
            throw console.error('wrong text node type:' + el.nodeName)
          }
          spanEl = span as HTMLElement
        }

        const text = spanEl.textContent as string
        /**
         * If the span is the same without changed, skip parse it
         */
        // if (config.paragraphs[pIndex] && config.paragraphs[pIndex].spans[sIndex] && text === config.paragraphs[pIndex].spans[sIndex].text) {
        //   if (TextPropUtils.isSameSpanStyles(config.paragraphs[pIndex].spans[sIndex].styles, spanStyleBuff)) {
        //     spans[spans.length - 1].text += text
        //   } else {
        //     spans.push(config.paragraphs[pIndex].spans[sIndex])
        //   }
        //   Object.assign(spanStyleBuff, config.paragraphs[pIndex].spans[sIndex].styles)
        //   continue
        // }

        let spanStyle = {} as ISpanStyle
        if (!spanEl.style.fontFamily) {
          console.log(pIndex)
          if (pIndex > 0) {
            const leng = div.childNodes[pIndex - 1].childNodes.length
            spanEl = div.childNodes[pIndex - 1].childNodes[leng - 1] as HTMLElement
            // if (spanEl.nodeName !== 'SPAN') {
            // Object.assign(spanStyle, config.paragraphs[pIndex - 1].spans[leng - 1].styles)
            // }
            if (ps.length > config.paragraphs.length) {
              console.warn('sssss')
              console.log(pIndex)
              console.log(spanEl.nodeName)
              Object.assign(spanStyle, config.paragraphs[pIndex - 1].spans[leng - 1].styles)
            } else {
              Object.assign(spanStyle, config.paragraphs[pIndex].spans[0].styles)
            }
          } else if (pIndex === 0 && sIndex === 0) {
            Object.assign(spanStyle, config.paragraphs[0].spans[0].styles)
          }
        }

        if (!Object.keys(spanStyle).length) {
          spanStyle = {
            font: spanEl.style.fontFamily,
            weight: spanEl.style.fontWeight,
            size: spanEl.style.fontSize ? Math.round(parseFloat(spanEl.style.fontSize.split('px')[0]) / 1.333333 * 100) / 100
              : Math.round(parseFloat(this.getCurrTextProps?.fontSize ?? '0') / (LayerUtils.getCurrLayer as IText).styles.scale),
            decoration: spanEl.style.textDecorationLine,
            style: spanEl.style.fontStyle,
            color: this.isValidHexColor(spanEl.style.color) ? spanEl.style.color : this.rgbToHex(spanEl.style.color),
            opacity: parseInt(spanEl.style.opacity)
          } as ISpanStyle
        }

        if (pIndex === 2) {
          console.log(GeneralUtils.deepCopy(spanStyle))
        }

        if (TextPropUtils.isSameSpanStyles(spanStyle, spanStyleBuff)) {
          spans[spans.length - 1].text += text
        } else {
          spans.push({ text, styles: spanStyle, id: GeneralUtils.generateRandomString(8) })
        }
        Object.assign(spanStyleBuff, spanStyle)
      }
      for (let i = 0; i < spans.length; i++) {
        if (!spans[i].text && spans.length !== 1) {
          spans.splice(i, 1)
          i--
        }
      }

      if (spans.length) {
        const pEl = p as HTMLElement
        const floatNum = /[+-]?\d+(\.\d+)?/
        const lineHeight = pEl.style.lineHeight.match(floatNum) !== null ? parseFloat(pEl.style.lineHeight.match(floatNum)![0]) : -1
        const fontSpacing = pEl.style.letterSpacing.match(floatNum) !== null ? parseFloat(pEl.style.letterSpacing.match(floatNum)![0]) : 0
        const fontSize = Math.round(parseFloat(pEl.style.fontSize.split('px')[0]) / 1.333333 * 100) / 100
        const pStyle: IParagraphStyle = { lineHeight, fontSpacing, size: fontSize, align: pEl.style.textAlign.replace('text-align-', '') }
        paragraphs.push({ styles: pStyle, spans: spans, id: GeneralUtils.generateRandomString(8) })
      }
    })
    return paragraphs
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

  newPropsHandler(paragraphs: IParagraph[]): IParagraph[] {
    const sel = this.getSelection()
    if (sel && this.isSel(sel.start)) {
      const { start, end } = sel
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
          const selSpan = GeneralUtils.deepCopy(paragraphs[start.pIndex].spans[start.sIndex]) as ISpan
          const originSpanStyles = GeneralUtils.deepCopy(selSpan.styles)
          const newSpanStyles = Object.assign(GeneralUtils.deepCopy(selSpan.styles), {
            weight: currPropsState.weight,
            style: currPropsState.style,
            decoration: currPropsState.decoration,
            color: currPropsState.color
          })
          paragraphs[start.pIndex].spans[start.sIndex].text = selSpan.text.slice(0, start.offset - 1)

          if (start.sIndex === 0 && start.offset === 1) {
            paragraphs[start.pIndex].spans.splice(0, 0, {
              styles: newSpanStyles,
              text: selSpan.text[0]
            })
            if (selSpan.text.substr(start.offset)) {
              paragraphs[start.pIndex].spans.splice(1, 0, {
                styles: originSpanStyles,
                text: selSpan.text.substr(1)
              })
            }
          } else {
            paragraphs[start.pIndex].spans.splice(start.sIndex + 1, 0, {
              styles: newSpanStyles,
              text: selSpan.text[start.offset - 1]
            })
            if (selSpan.text.substr(start.offset)) {
              paragraphs[start.pIndex].spans.splice(start.sIndex + 2, 0, {
                styles: originSpanStyles,
                text: selSpan.text.substr(start.offset)
              })
            }
          }
          Object.assign(start, { sIndex: start.sIndex + 1, offset: 1 })
          this.updateSelection(start, end)
        }
      }
    }
    return paragraphs
  }

  textResizeHandler(pageIndex: number, layerIndex: number, width: number, height: number): [number, number] {
    const text = document.getElementById(`text-${layerIndex}`)
    if (text) {
      const config = LayerUtils.getLayer(pageIndex, layerIndex) as IText
      const scaleRatio = store.getters.getPageScaleRatio
      const transform = text.style.transform
      text.style.transform = `rotate(${-config.styles.rotate}deg)`
      if (config.styles.writingMode.includes('vertical')) {
        width = text.getBoundingClientRect().width / (scaleRatio / 100)
        ControlUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { widthLimit: height })
      } else {
        height = text.getBoundingClientRect().height / (scaleRatio / 100)
        ControlUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { widthLimit: width })
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
        p.appendChild(spanData.text ? span : document.createElement('br'))

        if (spanData.styles.size > fontSize) {
          fontSize = spanData.styles.size
        }
      })
      Object.assign(p.style, CssConveter.convertFontStyle(pData.styles), { size: fontSize })
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
      width: body.style.width !== 'max-content' ? Math.ceil(widthLimit) : Math.ceil(body.getBoundingClientRect().width * scale),
      height: body.style.height !== 'max-content' ? Math.ceil(widthLimit) : Math.ceil(body.getBoundingClientRect().height * scale)
    }
    document.body.removeChild(body)
    return textHW
  }

  updateLayerSize(config: IText, pageIndex: number = LayerUtils.pageIndex, layerIndex: number = LayerUtils.layerIndex, subLayerIndex: number | undefined = undefined) {
    const textHW = this.getTextHW(config, config.widthLimit)
    if (typeof subLayerIndex === 'undefined') {
      ControlUtils.updateLayerSize(pageIndex, layerIndex, textHW.width, textHW.height, config.styles.scale)
      const currLayer = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
    } else {
      LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, { width: textHW.width, height: textHW.height })
      const currLayer = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
      if (subLayerIndex === currLayer.layers.length - 1) {
        let { width, height } = calcTmpProps(currLayer.layers)
        width *= currLayer.styles.scale
        height *= currLayer.styles.scale
        LayerUtils.updateLayerStyles(pageIndex, layerIndex, { width, height })
      }
    }
  }

  getAddPosition(width: number, height: number, pageIndex?: number) {
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    const page = LayerUtils.getPage(targePageIndex)
    const x = (page.width - width) / 2
    const y = (page.height - height) / 2

    if (targePageIndex === this.lastSelectedPageIndex) {
      const currLayer = LayerUtils.getLayer(targePageIndex, LayerUtils.layerIndex)
      if (currLayer) {
        const specx = currLayer.styles.x + (currLayer.styles.width - width) / 2
        const specy = currLayer.styles.y + currLayer.styles.height
        if ((specy + height) < page.height) {
          return { x: specx, y: specy }
        }
      }
    }
    return { x, y }
  }

  resetTextField (textLayer: IText, pageIndex: number, field?: string) {
    const page = LayerUtils.getPage(pageIndex) as IPage
    /**
     * Add the response font-size for each paragraph
     */
    const paragraphSizes = this.getParagraphSize(textLayer)
    for (const i in textLayer.paragraphs) {
      textLayer.paragraphs[i].styles.size = paragraphSizes[i]
    }

    const size = {} as { [key: string]: number }
    if (textLayer.styles && textLayer.styles.height && textLayer.styles.width) {
      Object.assign(size, { width: textLayer.styles.width, height: textLayer.styles.height })
    } else {
      Object.assign(size, this.getTextHW(textLayer))
    }
    const position = {} as { [key: string]: number }

    if (textLayer.styles && typeof textLayer.styles.x !== 'undefined' && typeof textLayer.styles.y !== 'undefined') {
      Object.assign(position, { x: textLayer.styles.x, y: textLayer.styles.y })
    } else {
      Object.assign(position, this.getAddPosition(size.width, size.height, pageIndex))
    }
    Object.assign(textLayer.styles, position, size)

    if (field) {
      if (!page.layers.find(l => l.type === 'text' && (l as IText)[field])) {
        Object.assign(textLayer, { [field]: true })
      } else {
        Object.assign(textLayer, { [field]: false })
      }
    }
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

  updateTextParagraphs(pageIndex: number, layerIndex: number, paragraphs: IParagraph[]) {
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
    if (this.startEqualEnd(start, end)) {
      end = this.getNullSel()
    }
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

  initialParagraphsScale(data: { [key: string]: number }, paragraphs: any[]): any[] {
    const { scale = 1, diff = 0, size = 0 } = data
    return paragraphs
      .map(paragraph => {
        const result = {
          styles: {
            ...paragraph.styles,
            size: size || (diff + Math.round(paragraph.styles.size * scale * 10) / 10)
          }
        }
        paragraph.spans && Object.assign(result, { spans: this.initialParagraphsScale({ diff, scale, size }, paragraph.spans || []) })
        paragraph.text && Object.assign(result, { text: paragraph.text })
        return result
      })
  }

  updateLayerTextSize({ size = 0, diff = 0 }) {
    const layers = (LayerUtils.getCurrLayer.layers || [LayerUtils.getCurrLayer]) as Array<ILayer>
    for (const idx in layers) {
      const { type, paragraphs } = GeneralUtils.deepCopy(layers[idx]) as IText
      if (type !== 'text') { continue }
      store.commit('UPDATE_specLayerData', {
        pageIndex: LayerUtils.pageIndex,
        layerIndex: LayerUtils.layerIndex,
        subLayerIndex: +idx,
        props: {
          paragraphs: this.initialParagraphsScale({ size, diff }, paragraphs)
        }
      })
    }
  }
}

export default new TextUtils()
