import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { IParagraph, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import CssConveter from '@/utils/cssConverter'
import GeneralUtils from './generalUtils'
import Vue from 'vue'

class TextUtils {
  get pageIndex(): number { return store.getters.getLastSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IText { return store.getters.getLayer(this.pageIndex, this.layerIndex) }

  onPropertyClick(propName: string, value?: string | number, selStart = { pIndex: NaN, sIndex: NaN, offset: NaN }, selEnd = { pIndex: NaN, sIndex: NaN, offset: NaN }) {
    const sel = this.getSelection()
    const config = GeneralUtils.deepCopy(this.getCurrLayer) as IText
    const start = {
      pIndex: 0,
      sIndex: 0,
      offset: 0
    }
    const end = {
      pIndex: 0,
      sIndex: 0,
      offset: 0
    }
    if (!sel && !this.isSelRanged(selStart) && !this.isSelRanged(selEnd)) {
      end.pIndex = config.paragraphs.length - 1
      end.sIndex = config.paragraphs[end.pIndex].spans.length - 1
      end.offset = config.paragraphs[end.pIndex].spans[end.sIndex].text.length
    } else if (this.isSelRanged(selStart) || this.isSelRanged(selEnd)) {
      Object.assign(start, selStart)
      Object.assign(end, selEnd)
    } else if (sel) {
      Object.assign(start, sel.start)
      Object.assign(end, sel.end)
    } else {
      return
    }

    let isStartContainerDivide = true
    const prop = this.propIndicator(start, end, propName, value || '')

    if (this.isSelRanged(end)) {
      for (let pIndex = start.pIndex; pIndex < config.paragraphs.length; pIndex++) {
        const p = config.paragraphs[pIndex]
        for (let sIndex = 0; sIndex < p.spans.length; sIndex++) {
          const span = p.spans[sIndex]
          const text = span.text
          if (pIndex === start.pIndex && sIndex < start.sIndex) {
            continue
          } else if (pIndex === start.pIndex && sIndex === start.sIndex) {
            span.text = text.substr(0, start.offset)

            const newSpan: ISpan = { text: '', styles: this.spanStylesTransformer(undefined, {}) }
            newSpan.text = text.substr(start.offset, text.length)
            Object.assign(newSpan.styles, this.spanStylesTransformer(span, prop))

            config.paragraphs[pIndex].spans.splice(sIndex + 1, 0, newSpan)
            if (span.text === '') {
              config.paragraphs[pIndex].spans.splice(sIndex, 1)
              isStartContainerDivide = false
            }

            if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
              newSpan.text = text.substring(start.offset, end.offset)

              const thirdSpan: ISpan = { text: '', styles: this.spanStylesTransformer(undefined, {}) }
              thirdSpan.text = text.substr(end.offset)
              Object.assign(thirdSpan.styles, this.spanStylesTransformer(span, {}))
              if (thirdSpan.text !== '') {
                config.paragraphs[pIndex].spans.splice(isStartContainerDivide ? sIndex + 2 : sIndex + 1, 0, thirdSpan)
              }
              break
            }
            if (start.pIndex === end.pIndex && isStartContainerDivide) {
              sIndex++
              end.sIndex++
            }
          } else if (pIndex === end.pIndex && sIndex === end.sIndex) {
            span.text = text.substr(end.offset)

            const newSpan: ISpan = { text: '', styles: this.spanStylesTransformer(undefined, {}) }
            newSpan.text = text.substr(0, end.offset)
            Object.assign(newSpan.styles, this.spanStylesTransformer(span, prop))
            if (span.text === '') {
              config.paragraphs[pIndex].spans.splice(sIndex, 1, newSpan)
            } else {
              config.paragraphs[pIndex].spans.splice(sIndex, 0, newSpan)
            }
            break
          } else if (pIndex < end.pIndex || (pIndex === end.pIndex && sIndex < end.sIndex)) {
            Object.assign(span.styles, this.spanStylesTransformer(span, prop))
          }
        }
      }
      this.updateTextParagraphs(this.pageIndex, this.layerIndex, config.paragraphs)
    } else if (!this.isSelRanged(end)) {
      const styles = config.paragraphs[start.pIndex].spans[start.sIndex].styles
      switch (propName) {
        case 'fontSize':
          styles.size = value as number
          break
        case 'fontFamily':
          styles.font = value as string
          break
        case 'bold':
          styles.weight = prop.weight as string
          break
        case 'underline':
          styles.decoration = prop.decoration as string
          break
        case 'italic':
          styles.style = prop.style as string
          break
        default:
          break
      }
      this.updateTextParagraphs(this.pageIndex, this.layerIndex, config.paragraphs)
    }
    if (!sel) return
    Vue.nextTick(() => {
      const select = window.getSelection()
      const range = new Range()
      const div = document.getElementById(`text-${this.layerIndex}`)
      if (this.isSelRanged(end) && div) {
        if (isStartContainerDivide) {
          if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
            start.sIndex++
            end.sIndex++
          } else {
            start.sIndex++
          }
        }
        const nodeStart = div.childNodes[start.pIndex].childNodes[start.sIndex].firstChild as Node
        const nodeEnd = div.childNodes[end.pIndex].childNodes[end.sIndex].firstChild as Node
        range.setStart(nodeStart, 0)
        range.setEnd(nodeEnd, config.paragraphs[end.pIndex].spans[end.sIndex].text.length)

        if (select) {
          select.removeAllRanges()
          select.addRange(range)
          console.log(range)
        }
      } else {
        const select = window.getSelection()
        if (select && div) {
          const node = div.childNodes[start.pIndex].childNodes[start.sIndex].firstChild as Node
          range.setStart(node, 0)
          range.setEnd(node, config.paragraphs[start.pIndex].spans[start.sIndex].text.length)
          select.removeAllRanges()
          select.addRange(range)
          console.log('2')
        }
      }
    })
  }

  isSelRanged(sel: { pIndex: number, sIndex: number, offset?: number }): boolean {
    return !Number.isNaN(sel.pIndex) && !Number.isNaN(sel.sIndex) && !Number.isNaN(sel.offset)
  }

  /**
   *
   * @param prop A string about the desired props: fontSize/fontFamily.
   * @returns The desired props value accord to the current selection range.
   */
  propReader (prop: string): string | undefined {
    const sel = this.getSelection()
    if (!sel || (sel.div as HTMLElement).id.match('text') === null) return
    const div = sel.div
    const start = {
      pIndex: 0,
      sIndex: 0,
      offset: 0
    }
    const end = {
      pIndex: 0,
      sIndex: 0,
      offset: 0
    }
    Object.assign(start, sel.start)
    Object.assign(end, sel.end)

    // selection is not a range (only caret)
    if (!this.isSelRanged(end)) {
      return (div.childNodes[start.pIndex].childNodes[start.sIndex] as HTMLElement).style[`${prop}` as any]
    }

    let flag = false
    let origin = ''
    if (prop === 'fontFamily') {
      origin = (div.childNodes[start.pIndex].childNodes[start.sIndex] as HTMLElement).style.fontFamily
    } else if (prop === 'fontSize') {
      origin = (div.childNodes[start.pIndex].childNodes[start.sIndex] as HTMLElement).style.fontSize
    }
    for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
      const p = div.childNodes[pidx]
      for (let sidx = 0; sidx < p.childNodes.length; sidx++) {
        const span = p.childNodes[sidx] as HTMLElement
        if ((pidx === start.pIndex && sidx < start.sIndex) || (pidx === end.pIndex && sidx > end.sIndex)) continue
        if (prop === 'fontFamily' && origin !== span.style.fontFamily) {
          flag = true
          break
        } else if (prop === 'fontSize' && origin !== span.style.fontSize) {
          flag = true
          break
        }
      }
      if (flag) break
    }
    return flag ? undefined : origin
  }

  propIndicator(start: { pIndex: number, sIndex: number }, end: { pIndex: number, sIndex: number }, propName: string, value: string | number): { [key:string]: string | number } {
    const prop: { [key: string]: string | number } = {}
    const config = GeneralUtils.deepCopy(this.getCurrLayer) as IText

    if (!this.isSelRanged(end)) {
      console.log('444')
      console.log(end)
      console.log(start)

      const styles = config.paragraphs[start.pIndex].spans[start.sIndex].styles
      switch (propName) {
        case 'bold': {
          console.log(styles.weight)
          prop.weight = styles.weight === 'normal' ? 'bold' : 'normal'
          break
        }
        case 'underline': {
          prop.decoration = styles.decoration === 'none' ? 'underline' : 'none'
          break
        }
        case 'italic': {
          prop.style = styles.style === 'italic' ? 'normal' : 'italic'
          break
        }
        default:
          break
      }
      return prop
    }

    let flag = false
    for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
      const p = config.paragraphs[pidx]
      for (let sidx = 0; sidx < p.spans.length; sidx++) {
        const span = p.spans[sidx]
        if ((pidx === start.pIndex && sidx < start.sIndex) || (pidx === end.pIndex && sidx > end.sIndex)) continue
        switch (propName) {
          case 'bold': {
            prop.weight = 'normal'
            if (span.styles.weight === 'normal') {
              prop.weight = 'bold'
              flag = true
            }
            break
          }
          case 'underline': {
            prop.decoration = 'none'
            if (span.styles.decoration === 'none') {
              prop.decoration = 'underline'
              flag = true
            }
            break
          }
          case 'italic': {
            prop.style = 'normal'
            if (span.styles.style === 'normal') {
              prop.style = 'italic'
              flag = true
            }
            break
          }
          case 'fontFamily': {
            if (typeof value === 'string') {
              prop.font = value
              flag = true
            }
            break
          }
          case 'fontSize': {
            prop.size = value
            flag = true
            break
          }
          default: { }
        }
        if (flag) break
      }
      if (flag) break
    }
    return prop
  }

  spanStylesTransformer(span: ISpan | undefined, prop: { [key: string]: string | number }): ISpanStyle {
    const spanStyles = {
      font: span ? span.styles.font : '',
      weight: span ? span.styles.weight : '',
      size: span ? span.styles.size : NaN,
      decoration: span ? span.styles.decoration : '',
      style: span ? span.styles.style : '',
      color: span ? span.styles.color : '',
      opacity: span ? span.styles.opacity : NaN
    }
    return Object.assign(spanStyles, prop)
  }

  isArrowKey(e: KeyboardEvent): boolean {
    return e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight'
  }

  // TODO: align is for paragraphs
  // textAlign(span: HTMLElement, iconName: string) {
  //   const align = iconName.substring(11, iconName.length)
  //   this.updateTextStyles(this.pageIndex, this.layerIndex, { align })
  // }

  textVertical() {
    let writingMode = 'initial'
    const layer = this.getCurrLayer
    if (layer.styles.writingMode === 'initial') {
      writingMode = 'vertical-lr'
    }

    const textSize = {
      width: layer.styles.height,
      height: layer.styles.width
    }
    ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, layer.styles.size as number)
    ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
    this.updateTextStyles(this.pageIndex, this.layerIndex, { writingMode })
  }

  fontSizeStepping(step: number) {
    this.getSelection()

    let size = this.getCurrLayer.styles.size
    if (size) {
      if (typeof size === 'string') {
        size = parseInt(size) + step
      } else if (typeof size === 'number') {
        size += step
      }
      this.updateTextStyles(this.pageIndex, this.layerIndex, { size })
    }
    this.updateLayerSize()
  }

  updateLayerSize() {
    const textHW = this.getTextHW(this.getCurrLayer)
    // ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getCurrLayer.styles.size)
    ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, 1)
  }

  getSelection(): { div: Node, start: { [key: string]: number }, end: { [key: string]: number } } | undefined {
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

      if (!div || (div as HTMLElement).id.match('text') === null || !range || !range.startContainer || !range.endContainer) return undefined
      console.log(div as HTMLElement)
      const isRanged = window.getSelection()?.toString() !== ''
      const end: { [key: string]: number } = {
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

  getTextHW(content: IText, width = -1) {
    const body = document.createElement('div')
    content.paragraphs.forEach(pData => {
      const p = document.createElement('p')
      pData.spans.forEach(spanData => {
        const span = document.createElement('span')
        span.textContent = spanData.text
        Object.assign(span.style, CssConveter.convertFontStyle(spanData.styles))
        span.style.whiteSpace = 'pre'
        p.appendChild(span)
      })
      Object.assign(p.style, CssConveter.convertFontStyle(pData.styles))
      // p.style.display = 'table'
      p.style.margin = '0.5em'
      body.appendChild(p)
    })
    body.style.border = '1px solid blue'
    body.style.width = width === -1 ? 'fit-content' : `${width}px`
    body.style.whiteSpace = 'pre-wrap'
    body.style.textAlign = 'center'
    document.body.appendChild(body)
    const textHW = {
      width: Math.ceil(body.getBoundingClientRect().width),
      height: Math.ceil(body.getBoundingClientRect().height)
    }
    document.body.removeChild(body)
    return textHW
  }

  updateTextStyles(pageIndex: number, layerIndex: number, styles: { [key: string]: string | number }) {
    store.commit('UPDATE_layerStyles', ({
      pageIndex,
      layerIndex,
      styles
    }))
  }

  updateTextParagraphs(pageIndex: number, layerIndex: number, paragraphs: IParagraph[]) {
    store.commit('UPDATE_textProps', {
      pageIndex,
      layerIndex,
      paragraphs
    })
  }
}

export default new TextUtils()
