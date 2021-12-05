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

class TextUtils {
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrTextProps() { return (store.state as any).text.props }
  get getCurrSel(): { start: ISelection, end: ISelection } { return (store.state as any).text.sel }
  get lastSelectedPageIndex() { return store.getters.getLastSelectedPageIndex }

  isArrowKey(e: KeyboardEvent): boolean {
    return e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight'
  }

  getSelection(): { div: Node | undefined, start: ISelection, end: ISelection } {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      return {
        div: undefined,
        start: this.getNullSel(),
        end: this.getNullSel()
      }
    }

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

      /**
       * For start container, the selected html tag could be: #text, SPAN
       */
      let p = range.startContainer
      while (p.nodeName !== 'P' && p.parentElement) {
        p = p.parentElement
      }
      let s = range.startContainer
      while (s.nodeName !== 'SPAN' && s.parentElement) {
        s = s.parentElement
      }

      if (p.firstChild && s) {
        const pChild = p.firstChild
        switch (pChild.nodeName) {
          case 'SPAN':
            start = {
              pIndex: +((p as HTMLElement).dataset.pindex as string) ?? NaN,
              sIndex: +((s as HTMLElement).dataset.sindex as string) ?? NaN,
              offset: range.startOffset as number
            }
            break
          default:
            return {
              div,
              start: { ...this.getCurrSel.start } as ISelection,
              end: { ...this.getCurrSel.end } as ISelection
            }
        }
      } else {
        console.log(new Error('wrong type node of the start container of p.firstChild'))
        return { div: undefined, start: this.getNullSel(), end: this.getNullSel() }
      }

      const isRanged = window.getSelection()?.toString() !== ''
      /**
       * For end container, the selected html tag could be: #text, SPAN, P
       */
      let endP = range.endContainer
      let endSpan = range.endContainer
      if (range.endContainer.nodeName === 'P') {
        endSpan = endSpan.firstChild as Node
      } else {
        while (endP.nodeName !== 'P' && endP.parentElement) {
          endP = endP.parentElement
        }
        while (endSpan.nodeName !== 'SPAN' && endSpan.parentElement) {
          endSpan = endSpan.parentElement
        }
      }

      let end = this.getNullSel()
      if (endP && endSpan) {
        end = {
          pIndex: isRanged ? +((endP as HTMLElement).dataset.pindex as string) : NaN,
          sIndex: isRanged ? +((endSpan as HTMLElement).dataset.sindex as string) : NaN,
          offset: isRanged ? range?.endOffset as number : NaN
        }
      } else {
        throw new Error('wrong type node of the end container')
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
    return { div: undefined, start: this.getNullSel(), end: this.getNullSel() }
  }

  selectAll(config: IText): { start: ISelection, end: ISelection } {
    const pIndex = config.paragraphs.length - 1
    const sIndex = config.paragraphs[pIndex].spans.length - 1
    const offset = config.paragraphs[pIndex].spans[sIndex].text.length
    return {
      start: { pIndex: 0, sIndex: 0, offset: 0 },
      end: {
        pIndex,
        sIndex,
        offset
      }
    }
  }

  startEqualEnd (start: ISelection, end: ISelection) {
    return (Object.keys(start) as Array<keyof ISelection>)
      .every(k => (start[k] as any) === end[k])
  }

  focus(start?: ISelection, end?: ISelection, subLayerIndex?: number, layerIndex = LayerUtils.layerIndex) {
    let text: HTMLElement
    const range = new Range()
    if (typeof subLayerIndex !== 'undefined') {
      text = document.getElementById(`text-sub-${layerIndex}-${subLayerIndex}`) as HTMLElement
    } else {
      text = document.getElementById(`text-${layerIndex}`) as HTMLElement
    }

    if ((!start || !this.isSel(start)) && (this.getCurrSel && this.isSel(this.getCurrSel.start))) {
      start = {} as ISelection
      Object.assign(start, this.getCurrSel.start)
    } else if (!this.isSel(this.getCurrSel.start)) {
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

    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  isEmptyText(config: IText): boolean {
    return config.paragraphs.length === 1 && config.paragraphs[0].spans.length === 1 && config.paragraphs[0].spans[0].text === ''
  }

  textHandler(config: IText, key = ''): IParagraph[] {
    // const { start, end } = this.getSelection()
    const { start, end } = this.getCurrSel
    // console.log('start: pindex: ', start.pIndex, ' sIndex: ', start.sIndex, ' offset: ', start.offset)
    // console.log('end: pindex: ', end.pIndex, ' sIndex: ', end.sIndex, ' offset: ', end.offset)

    if (!this.isSel(end)) {
      return this.noRangeHandler(config, start, key)
    } else {
      const mockConfig = GeneralUtils.deepCopy(config) as IText
      const { paragraphs } = mockConfig
      const startSpan = paragraphs[start.pIndex].spans[start.sIndex]
      const endSpan = GeneralUtils.deepCopy(paragraphs[end.pIndex].spans[end.sIndex]) as ISpan
      const endRestSpans = paragraphs[end.pIndex].spans.slice(end.sIndex + 1)

      // The ranged selection would treat the offset of <br> of 1, for this case the offset should be set to 0
      if (paragraphs[start.pIndex].spans.length === 1 && start.offset === 1 && !paragraphs[start.pIndex].spans[0].text) {
        start.offset = 0
      }

      // Splice the selected range
      paragraphs[start.pIndex].spans.splice(start.sIndex + 1)
      paragraphs.splice(start.pIndex + 1, end.pIndex - start.pIndex)
      startSpan.text = startSpan.text.substring(0, start.offset)

      // Merging spans
      if (TextPropUtils.isSameSpanStyles(startSpan.styles, endSpan.styles)) {
        startSpan.text += endSpan.text.substr(end.offset)
      } else {
        endSpan.text = endSpan.text.substr(end.offset)
        paragraphs[start.pIndex].spans.push(endSpan)
      }
      paragraphs[start.pIndex].spans.push(...endRestSpans)

      if (key !== 'Backspace' && key !== 'Delete') {
        return this.noRangeHandler(mockConfig, start, key)
      } else {
        this.updateSelection(start, this.getNullSel())
      }

      return paragraphs
    }
  }

  // getNoNPrintableKeys(): Array<string> {
  //   return [
  //     'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  //     'Tab', 'CapsLock', 'Shift', 'Control', 'Alt', 'Meta', 'ArrowRight', 'ArrowUp',
  //     'ArrowLeft', 'ArrowDown'
  //   ]
  // }

  noRangeHandler(config: IText, start: ISelection, key: string): IParagraph[] {
    const { paragraphs } = GeneralUtils.deepCopy(config) as IText
    const { pIndex: oriPidx, sIndex: oriSidx, offset: oriOff } = start
    let { pIndex, sIndex, offset } = start
    const p = paragraphs[pIndex]
    const s = p.spans[sIndex]

    switch (key) {
      case 'Enter': {
        const nextText = s.text.substr(offset)
        s.text = s.text.substring(0, offset)
        const restSpan = p.spans.slice(oriSidx + 1)
        p.spans.splice(oriSidx + 1)
        paragraphs.splice(pIndex + 1, 0, {
          id: GeneralUtils.generateRandomString(8),
          spans: [
            {
              id: GeneralUtils.generateRandomString(8),
              text: nextText,
              styles: { ...s.styles }
            },
            ...restSpan
          ],
          styles: { ...p.styles }
        } as IParagraph)
        pIndex += 1
        sIndex = 0
        offset = 0
        break
      }
      case 'Backspace': {
        if (oriSidx === 0 && oriOff === 0) {
          const stash = GeneralUtils.deepCopy(p) as IParagraph
          if (!oriPidx) { return paragraphs }

          pIndex -= 1
          sIndex = paragraphs[pIndex].spans.length - 1
          offset = paragraphs[pIndex].spans[sIndex].text.length + 1
          paragraphs[pIndex].spans.push(...stash.spans)
          paragraphs.splice(pIndex + 1, 1)
          const preSpan = paragraphs[pIndex].spans[sIndex]
          const currSpan = paragraphs[pIndex].spans[sIndex + 1]
          if (TextPropUtils.isSameSpanStyles(preSpan.styles, currSpan.styles)) {
            preSpan.text += currSpan.text
            paragraphs[pIndex].spans.splice(sIndex + 1, 1)
          }
        }
        if (oriSidx !== 0 && oriOff === 0) {
          const preSpan = p.spans[sIndex - 1]
          if (preSpan.text.length > 1) {
            preSpan.text = preSpan.text.substring(0, preSpan.text.length - 1)
            if (TextPropUtils.isSameSpanStyles(s.styles, preSpan.styles)) {
              preSpan.text += s.text
              p.spans.splice(oriSidx, 1)
            }
            sIndex--
          } else {
            p.spans.splice(oriSidx - 1, 1)
            sIndex--
            if (oriSidx >= 2 && TextPropUtils.isSameSpanStyles(p.spans[oriSidx - 2].styles, s.styles)) {
              p.spans[oriSidx - 2].text += s.text
              p.spans.splice(sIndex--, 1)
            }
          }
        } else {
          if (oriOff === 1) {
            const handler = () => {
              if (s.text.length === 1) {
                p.spans.splice(oriSidx, 1)
              } else {
                s.text = s.text.substr(1)
              }
            }

            if (oriSidx === 0) {
              offset = 0
              sIndex = 0
              s.text = s.text.substr(1)
            } else if (oriSidx + 1 < p.spans.length &&
              TextPropUtils.isSameSpanStyles(p.spans[oriSidx - 1].styles, p.spans[oriSidx + 1].styles)) {
              handler()
              offset = p.spans[oriSidx - 1].text.length
              p.spans[oriSidx - 1].text += p.spans[oriSidx].text
              p.spans.splice(oriSidx, 1)
              sIndex = oriSidx - 1
            } else {
              sIndex = oriSidx - 1
              offset = p.spans[sIndex].text.length
              handler()
            }
            if (!p.spans.length) {
              p.spans.push({
                styles: { ...config.paragraphs[oriPidx].spans[0].styles },
                text: ''
              })
            }
          } else {
            s.text = s.text.substring(0, offset - 1)
              .concat(s.text.substr(offset))
            offset--
          }
        }
        break
      }
      default: {
        if (oriSidx === 1 && oriOff === 0 && !p.spans[0].text) {
          p.spans[0].text += key
          sIndex = 0
          offset = 1
          TextPropUtils.updateTextPropsState({
            color: p.spans[0].styles.color,
            decoration: p.spans[0].styles.decoration,
            style: p.spans[0].styles.style,
            weight: p.spans[0].styles.weight
          })
          break
        }
        const preText = s.text.substring(0, oriOff)
        const lastText = s.text.substr(oriOff)

        // const propsTable = ['color', 'decoration', 'weight', 'style']
        // const hasNewProps = (() => {
        //   for (const [k, v] of Object.entries(TextPropUtils.getCurrTextProps)) {
        //     if (propsTable.includes(k) && v !== s.styles[k]) {
        //       return true
        //     }
        //   }
        //   return false
        // })()

        // if (hasNewProps) {
        //   const newStyles = { ...s.styles }
        //   for (const [k, v] of Object.entries(TextPropUtils.getCurrTextProps)) {
        //     if (propsTable.includes(k)) {
        //       newStyles[k] = v as string
        //     }
        //   }

        //   s.text = preText
        //   p.spans.splice(oriSidx + 1, 0, {
        //     text: key,
        //     styles: newStyles
        //   })
        //   if (lastText) {
        //     p.spans.splice(oriSidx + 2, 0, {
        //       text: lastText,
        //       styles: { ...s.styles }
        //     })
        //   }
        //   sIndex = oriSidx + 1
        //   offset = 1
        //   break
        // } else {
        //   s.text = preText + key + lastText
        // }
        s.text = preText + key + lastText

        if (preText) {
          offset++
        } else offset = 1
      }
    }
    // console.log('start: pindex: ', pIndex, ' sIndex: ', sIndex, ' offset: ', offset)
    this.updateSelection({ pIndex, sIndex, offset }, this.getNullSel())
    return paragraphs
  }

  textParser(text: HTMLElement): IParagraph[] {
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
        let spanStyle = {} as ISpanStyle

        spanStyle = {
          font: spanEl.style.fontFamily.split(',')[0],
          weight: spanEl.style.fontWeight,
          size: spanEl.style.fontSize ? Math.round(parseFloat(spanEl.style.fontSize.split('px')[0]) / 1.333333 * 100) / 100
            : Math.round(parseFloat(this.getCurrTextProps?.fontSize ?? '0') / (LayerUtils.getCurrLayer as IText).styles.scale),
          decoration: spanEl.style.textDecorationLine,
          style: spanEl.style.fontStyle,
          color: this.isValidHexColor(spanEl.style.color) ? spanEl.style.color : this.rgbToHex(spanEl.style.color),
          opacity: parseInt(spanEl.style.opacity)
        } as ISpanStyle

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
    // used for test
    // const currlayer = LayerUtils.getCurrLayer as IText
    // currlayer.paragraphs
    //   .forEach((p, pidx) => {
    //     paragraphs[pidx].id = p.id
    //     p.spans.forEach((s, sidx) => {
    //       paragraphs[pidx].spans[sidx].id = s.id
    //     })
    //   })
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

  isSel(sel?: Partial<ISelection>): boolean {
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

  getTextHW(content: IText, widthLimit = -1): { width: number, height: number, body: HTMLDivElement } {
    const body = document.createElement('div')
    content.paragraphs.forEach(pData => {
      const p = document.createElement('p')
      let fontSize = 0
      pData.spans.forEach(spanData => {
        const span = document.createElement('span')
        span.textContent = spanData.text
        Object.assign(span.style, CssConveter.convertFontStyle(spanData.styles))
        span.style.whiteSpace = 'pre-wrap'
        p.appendChild(!spanData.text && pData.spans.length === 1 ? document.createElement('br') : span)

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
      height: body.style.height !== 'max-content' ? Math.ceil(widthLimit) : Math.ceil(body.getBoundingClientRect().height * scale),
      body: body
    }
    document.body.removeChild(body)
    return textHW
  }

  updateLayerSize(config: IText, pageIndex: number, layerIndex = LayerUtils.layerIndex,
    subLayerIndex: number | undefined = undefined) {
    const textHW = this.getTextHW(config, config.widthLimit)
    if (typeof subLayerIndex === 'undefined') {
      ControlUtils.updateLayerSize(pageIndex, layerIndex, textHW.width, textHW.height, config.styles.scale)
    } else {
      LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, { width: textHW.width, height: textHW.height })
      const currLayer = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
      let { width, height } = calcTmpProps(currLayer.layers)
      width *= currLayer.styles.scale
      height *= currLayer.styles.scale
      LayerUtils.updateLayerStyles(pageIndex, layerIndex, { width, height })
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

  setCurrTextInfo(data: { config?: IText | IGroup, layerIndex?: number, subLayerIndex?: number }) {
    store.commit('text/SET_textInfo', data)
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
    store.commit('text/UPDATE_FONTFACE', font)
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
