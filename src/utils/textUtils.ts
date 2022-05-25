import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { ILayer, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText, ITmp, IGroup, IImage, IShape } from '@/interfaces/layer'
import { IFont, ISelection } from '@/interfaces/text'
import GeneralUtils from './generalUtils'
import LayerUtils from './layerUtils'
import { IPage } from '@/interfaces/page'
import { calcTmpProps } from '@/utils/groupUtils'
import TextPropUtils from '@/utils/textPropUtils'
import tiptapUtils from './tiptapUtils'
import pageUtils from './pageUtils'
import textShapeUtils from './textShapeUtils'
import mathUtils from './mathUtils'
import router from '@/router'

class TextUtils {
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrTextProps() { return (store.state as any).text.props }
  get getCurrSel(): { start: ISelection, end: ISelection } { return (store.state as any).text.sel }

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

  startEqualEnd(start: ISelection, end: ISelection) {
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
    const { start, end } = this.getSelection()
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
        s.text = preText + key + lastText

        if (preText) {
          offset++
        } else offset = 1
      }
    }
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
    const text = document.getElementById(`text-${layerIndex}`)?.firstElementChild as HTMLElement
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

  getTextHW(_content: IText, widthLimit = -1): { width: number, height: number } {
    const body = document.createElement('div')
    const content = GeneralUtils.deepCopy(_content) as IText
    content.paragraphs.forEach(pData => {
      const p = document.createElement('p')
      let fontSize = 0
      pData.spans.forEach(spanData => {
        const span = document.createElement('span')
        span.textContent = spanData.text

        const spanStyleObject = {}
        tiptapUtils.textStyles(spanData.styles)
          .split(';')
          .forEach(s => {
            Object.assign(spanStyleObject, {
              [s.split(':')[0].trim()]: s.split(': ')[1].trim()
            })
          })
        Object.assign(span.style, spanStyleObject)

        span.classList.add('nu-text__span')
        p.appendChild(!spanData.text && pData.spans.length === 1 ? document.createElement('br') : span)
        if (spanData.styles.size > fontSize) {
          fontSize = spanData.styles.size
        }
      })

      const pStyleObject = {}
      tiptapUtils.textStyles(pData.styles)
        .split(';')
        .forEach(s => {
          Object.assign(pStyleObject, {
            [s.split(':')[0].trim()]: s.split(':')[1].trim()
          })
        })
      Object.assign(p.style, pStyleObject)

      p.classList.add('nu-text__p')
      body.appendChild(p)
    })
    if (content.styles.writingMode.includes('vertical')) {
      body.style.height = widthLimit === -1 ? 'max-content' : `${widthLimit / content.styles.scale}px`
      body.style.width = 'max-content'
    } else {
      body.style.width = widthLimit === -1 ? 'max-content' : `${widthLimit / content.styles.scale}px`
      body.style.height = 'max-content'
    }
    body.classList.add('nu-text')
    body.style.writingMode = content.styles.writingMode
    document.body.appendChild(body)

    const scale = content.styles.scale ?? 1
    const textHW = {
      width: body.style.width !== 'max-content' ? widthLimit : body.getBoundingClientRect().width * scale,
      height: body.style.height !== 'max-content' ? widthLimit : body.getBoundingClientRect().height * scale,
      body: body
    }
    document.body.removeChild(body)
    return textHW
  }

  updateGroupLayerSize(pageIndex: number, layerIndex: number, subLayerIndex = -1, compensateX = false, noPush = false) {
    const group = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
    if (!group.layers) return
    if (subLayerIndex !== -1) {
      const config = group.layers[subLayerIndex] as IText
      if (config.type !== 'text') throw new Error('updateGroupLayerSize with subLayerIndex argument only accepts text subLayer')
      const originSize = { width: config.styles.width, height: config.styles.height }
      let textHW
      if (textShapeUtils.isCurvedText(config.styles)) {
        textHW = originSize
      } else {
        textHW = this.getTextHW(config, config.widthLimit)
        LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, { width: textHW.width, height: textHW.height })
      }
      /**
       * Group layout height compensation
       */
      if (!noPush) {
        const isAllHorizon = !group.layers
          .some(l => l.type === 'text' &&
            ((l as IText).styles.writingMode.includes('vertical') || l.styles.rotate !== 0))
        if (isAllHorizon) {
          const lowLine = config.styles.y + originSize.height
          const diff = textHW.height - originSize.height
          const targetSubLayers: Array<[number, number]> = []
          group.layers
            .forEach((l, idx) => {
              if (l.styles.y >= lowLine) {
                targetSubLayers.push([idx, l.styles.y])
              }
            })
          targetSubLayers
            .forEach(data => {
              LayerUtils.updateSubLayerStyles(LayerUtils.pageIndex, layerIndex, data[0], {
                y: data[1] + diff
              })
            })
        }
      }
    }
    let { width, height } = calcTmpProps(group.layers)
    width *= group.styles.scale
    height *= group.styles.scale
    LayerUtils.updateLayerStyles(pageIndex, layerIndex, { width, height })

    /**
     * Compensate the offset difference to the left-edge of group layer
     */
    if (compensateX) {
      let minX = Number.MAX_SAFE_INTEGER
      group.layers
        .forEach(l => {
          minX = Math.min(minX, l.styles.x)
        })
      if (minX > 0) {
        for (const [idx, layer] of Object.entries(group.layers)) {
          LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, +idx, {
            x: layer.styles.x - minX
          })
        }
      }
    }
  }

  asSubLayerSizeRefresh(pageIndex: number, layerIndex: number, subLayerIndex: number, height: number, heightOri: number, noPush = false) {
    const group = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
    if (!group.layers) return
    const targetSubLayers = [] as Array<[number, number]>
    const config = group.layers[subLayerIndex]
    if (config.type !== 'text') throw new Error('asSubLayerSizeRefresh only accepts text subLayer')
    if (!noPush) {
      const { y, textShape: { bend = 0 } = {} } = config.styles as any
      if (+bend >= 0) {
        const lowLine = y + heightOri
        group.layers
          .forEach((l, idx) => {
            if (l.styles.y >= lowLine && idx !== subLayerIndex) {
              targetSubLayers.push([idx, l.styles.y])
            }
          })
        targetSubLayers
          .forEach(data => {
            LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, data[0], {
              y: data[1] + (height - heightOri)
            })
          })
      } else {
        const highLine = y
        group.layers
          .forEach((l, idx) => {
            if (l.styles.y <= highLine && idx !== subLayerIndex) {
              targetSubLayers.push([idx, l.styles.y])
            }
          })
        targetSubLayers
          .forEach(data => {
            LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, data[0], {
              y: data[1] - (height - heightOri)
            })
          })
      }
    }
    this.updateGroupLayerSize(pageIndex, layerIndex)
  }

  updateGroupLayerSizeByShape(pageIndex: number, layerIndex: number, subLayerIndex: number, noPush = false) {
    const group = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
    if (!group.layers) return
    const config = group.layers[subLayerIndex]
    if (config.type !== 'text') throw new Error('updateGroupLayerSizeByShape only accepts text subLayer')
    if (textShapeUtils.isCurvedText(config.styles)) {
      const heightOri = config.styles.height
      const textHW = textShapeUtils.getCurveTextProps(config as IText)
      LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, textHW)
      this.asSubLayerSizeRefresh(pageIndex, layerIndex, subLayerIndex, textHW.height, heightOri, noPush)
      this.fixGroupCoordinates(pageIndex, layerIndex)
    } else {
      this.updateGroupLayerSize(pageIndex, layerIndex, subLayerIndex, noPush)
    }
  }

  fixGroupXCoordinates(pageIndex: number, layerIndex: number) {
    const group = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
    let minX = Number.MAX_SAFE_INTEGER
    if (!group.layers) return
    group.layers
      .forEach(l => {
        minX = Math.min(minX, mathUtils.getBounding(l).x)
      })
    for (const [idx, layer] of Object.entries(group.layers)) {
      LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, +idx, {
        x: layer.styles.x - minX
      })
    }
    LayerUtils.updateLayerStyles(pageIndex, layerIndex, {
      x: group.styles.x + minX
    })
  }

  fixGroupYCoordinates(pageIndex: number, layerIndex: number) {
    const group = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
    let minY = Number.MAX_SAFE_INTEGER
    if (!group.layers) return
    group.layers
      .forEach(l => {
        minY = Math.min(minY, mathUtils.getBounding(l).y)
      })
    for (const [idx, layer] of Object.entries(group.layers)) {
      LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, +idx, {
        y: layer.styles.y - minY
      })
    }
    LayerUtils.updateLayerStyles(pageIndex, layerIndex, {
      y: group.styles.y + minY
    })
  }

  fixGroupCoordinates(pageIndex: number, layerIndex: number) {
    this.fixGroupXCoordinates(pageIndex, layerIndex)
    this.fixGroupYCoordinates(pageIndex, layerIndex)
  }

  getAddPosition(width: number, height: number, pageIndex?: number) {
    const targePageIndex = pageIndex || pageUtils.currFocusPageIndex
    const page = LayerUtils.getPage(targePageIndex)
    const x = (page.width - width) / 2
    const y = (page.height - height) / 2

    if (targePageIndex === pageUtils.currFocusPageIndex) {
      const currLayer = LayerUtils.getLayer(targePageIndex, LayerUtils.layerIndex)
      if (currLayer.styles) {
        const specx = currLayer.styles.x + (currLayer.styles.width - width) / 2
        const specy = currLayer.styles.y + currLayer.styles.height
        if ((specy + height) < page.height) {
          return { x: specx, y: specy }
        }
      }
    }
    return { x, y }
  }

  resetTextField(textLayer: IText, pageIndex: number, field?: string) {
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

  loadDefaultFonts(extraFonts: { type: string, face: string, url: string, userId: string, assetId: string, ver: number }[] = []) {
    for (const defaultFont of store.getters['text/getDefaultFontsList']) {
      store.dispatch('text/addFont', defaultFont).catch(e => console.error(e))
    }
    for (const extraFont of extraFonts) {
      store.dispatch('text/addFont', extraFont).catch(e => console.error(e))
    }
  }

  loadAllFonts(config: IText, times: number) {
    /*
      Gary: 因為預設字型檔案較大，剛進入畫面時的下載過程可能會佔用網路頻寬，
      造成後續api呼叫及圖片載入等等被卡住而有畫面延遲。
      因此，需確保預設字型載入會晚於取得template list的api呼叫
      (剛進入編輯器時，左側欄會顯示在模板的panel)
    */

    // 僅剛進入editor需要判斷
    if (!(store.state as any).text.firstLoad && window.location.pathname === '/editor') {
      if (!((store.state as any).templates.categories.length > 0) && times < 5) {
        setTimeout(() => {
          this.loadAllFonts(config, times + 1)
        }, 3000)
        return
      }
      // 第一次載入的等待結束，firstLoad -> true
      store.commit('text/SET_firstLoad', true)
    }

    // const promises: Array<Promise<void>> = []
    for (const defaultFont of store.getters['text/getDefaultFontsList']) {
      // promises.push()
      store.dispatch('text/addFont', defaultFont).catch(e => console.error(e))
    }

    for (const p of config.paragraphs) {
      store.dispatch('text/addFont', {
        type: p.styles.type,
        face: p.styles.font,
        url: p.styles.fontUrl,
        assetId: p.styles.assetId,
        userId: p.styles.userId,
        ver: store.getters['user/getVerUni']
      }).catch(e => console.error(e))
      for (const span of p.spans) {
        store.dispatch('text/addFont', {
          type: span.styles.type,
          face: span.styles.font,
          url: span.styles.fontUrl,
          assetId: span.styles.assetId,
          userId: span.styles.userId,
          ver: store.getters['user/getVerUni']
        }).catch(e => console.error(e))
      }
    }
  }

  autoResize(config: IText, initSize: { width: number, height: number, widthLimit: number }): number {
    if (config.widthLimit === -1) return config.widthLimit
    const { widthLimit, otherDimension } = this.autoResizeCore(config, initSize)
    const dimension = config.styles.writingMode.includes('vertical') ? 'width' : 'height'
    const limitDiff = Math.abs(widthLimit - initSize.widthLimit)
    if (router.currentRoute.name === 'Preview') {
      const writingMode = config.styles.writingMode.includes('vertical') ? 'hw' : 'wh'
      console.log(`TEXT RESIZE DONE: id-${config.id ?? ''} ${initSize.widthLimit} ${initSize[dimension]} ${widthLimit} ${otherDimension} ${writingMode}`)
    }
    if (limitDiff / initSize.widthLimit > 0.05) {
      return initSize.widthLimit
    } else {
      return widthLimit
    }
  }

  autoResizeCore(config: IText, initSize: { width: number, height: number, widthLimit: number }): {
    widthLimit: number,
    otherDimension: number
  } {
    const dimension = config.styles.writingMode.includes('vertical') ? 'width' : 'height'
    const scale = config.styles.scale
    let direction = 0
    let shouldContinue = true
    let widthLimit = initSize.widthLimit
    let autoDimension = -1
    let autoSize = this.getTextHW(config, widthLimit)
    const originDimension = initSize[dimension]
    let prevDiff = Number.MAX_VALUE
    let prevWidthLimit = -1
    let prevDimension = -1
    let minDiff = Number.MAX_VALUE
    let minDiffWidLimit = -1
    let minDiffDimension = -1
    while (shouldContinue) {
      autoDimension = autoSize[dimension]
      const currDiff = Math.abs(autoDimension - originDimension)
      // console.log(autoDimension, originDimension, currDiff, widthLimit, config.widthLimit)
      if (currDiff < minDiff) {
        minDiff = currDiff
        minDiffWidLimit = widthLimit
        minDiffDimension = autoDimension
      }
      if (currDiff > prevDiff) {
        if (prevWidthLimit !== -1) {
          return {
            widthLimit: prevWidthLimit,
            otherDimension: prevDimension
          }
        } else {
          return {
            widthLimit: initSize.widthLimit,
            otherDimension: originDimension
          }
        }
      }
      prevDiff = currDiff
      prevWidthLimit = widthLimit
      prevDimension = autoDimension
      if (autoDimension - originDimension > 5 * scale) {
        if (direction < 0) break
        if (direction >= 100) return { widthLimit: minDiffWidLimit, otherDimension: minDiffDimension }
        widthLimit += scale
        direction += 1
        autoSize = this.getTextHW(config, widthLimit)
        continue
      }
      if (originDimension - autoDimension > 5 * scale) {
        if (direction > 0) break
        if (direction <= -100) return { widthLimit: minDiffWidLimit, otherDimension: minDiffDimension }
        widthLimit -= scale
        direction -= 1
        autoSize = this.getTextHW(config, widthLimit)
        continue
      }
      shouldContinue = false
    }
    return {
      widthLimit,
      otherDimension: autoDimension
    }
  }
}

export default new TextUtils()
