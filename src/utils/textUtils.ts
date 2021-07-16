import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { IParagraph, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import { ISelection } from '@/interfaces/text'
import CssConveter from '@/utils/cssConverter'
import GeneralUtils from './generalUtils'
import Vue from 'vue'

const fontPropsMap = {
  fontSize: 'size',
  fontFamily: 'font',
  bold: 'weight',
  italic: 'style',
  underline: 'decoration',
  color: 'color'
}

class TextUtils {
  get pageIndex(): number { return store.getters.getLastSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IText { return store.getters.getLayer(this.pageIndex, this.layerIndex) }

  onPropertyClick(propName: string, value?: string | number, selStart = { pIndex: NaN, sIndex: NaN, offset: NaN }, selEnd = { pIndex: NaN, sIndex: NaN, offset: NaN }) {
    if (this.isBlockProperty(propName)) {
      this.blockPropertyHandler(propName)
    } else {
      this.spanPropertyHandler(propName, value, selStart, selEnd)
    }
  }

  blockPropertyHandler(propName: string) {
    const config = this.getCurrLayer as IText
    if (config.active) {
      switch (propName) {
        case 'text-align-left':
          this.updateTextStyles(this.pageIndex, this.layerIndex, { align: 'left' })
          break
        case 'text-align-center':
          this.updateTextStyles(this.pageIndex, this.layerIndex, { align: 'center' })
          break
        case 'text-align-right':
          this.updateTextStyles(this.pageIndex, this.layerIndex, { align: 'right' })
          break
        case 'font-vertical': {
          const writingMode = config.styles.writingMode === 'initial' || config.styles.writingMode.includes('horizontal')
            ? 'vertical-lr' : 'initial'
          this.updateTextStyles(this.pageIndex, this.layerIndex, { writingMode })
        }
      }
    }
  }

  spanPropertyHandler(propName: string, value?: string | number, selStart = { pIndex: NaN, sIndex: NaN, offset: NaN }, selEnd = { pIndex: NaN, sIndex: NaN, offset: NaN }) {
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
    if (!sel && !this.isSel(selStart) && !this.isSel(selEnd)) {
      end.pIndex = config.paragraphs.length - 1
      end.sIndex = config.paragraphs[end.pIndex].spans.length - 1
      end.offset = config.paragraphs[end.pIndex].spans[end.sIndex].text.length
    } else if (this.isSel(selStart) || this.isSel(selEnd)) {
      Object.assign(start, selStart)
      Object.assign(end, selEnd)
    } else if (sel) {
      Object.assign(start, sel.start)
      Object.assign(end, sel.end)
    } else {
      return
    }
    let isStartContainerDivided = true
    const prop = this.propIndicator(start, end, propName, value || '')

    if (this.isSel(end)) {
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
              isStartContainerDivided = false
            }

            if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
              newSpan.text = text.substring(start.offset, end.offset)

              const thirdSpan: ISpan = { text: '', styles: this.spanStylesTransformer(undefined, {}) }
              thirdSpan.text = text.substr(end.offset)
              Object.assign(thirdSpan.styles, this.spanStylesTransformer(span, {}))
              if (thirdSpan.text !== '') {
                config.paragraphs[pIndex].spans.splice(isStartContainerDivided ? sIndex + 2 : sIndex + 1, 0, thirdSpan)
              }
              break
            }
            if (start.pIndex === end.pIndex && isStartContainerDivided) {
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
    } else if (!this.isSel(end)) {
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
        case 'color':
          styles.color = value as string
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
      if (this.isSel(end) && div) {
        if (isStartContainerDivided) {
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
        }
      } else {
        const select = window.getSelection()
        if (select && div) {
          const node = div.childNodes[start.pIndex].childNodes[start.sIndex].firstChild as Node
          range.setStart(node, 0)
          range.setEnd(node, config.paragraphs[start.pIndex].spans[start.sIndex].text.length)
          select.removeAllRanges()
          select.addRange(range)
        }
      }
    })
  }

  paragraphPropsHandler(propName: string, value?: string | number, selStart = { pIndex: NaN, sIndex: NaN, offset: NaN }, selEnd = { pIndex: NaN, sIndex: NaN, offset: NaN }) {
    if (value && this.isSel(selStart)) {
      switch (propName) {
        case 'fontSpacing':
          this.updateParagraphStyles(this.pageIndex, this.layerIndex, selStart.pIndex, { fontSpacing: value })
          break
        case 'lineHeight':
          this.updateParagraphStyles(this.pageIndex, this.layerIndex, selStart.pIndex, { lineHeight: value })
      }
    }
    // TODOs: paragraphs with selEnd
  }

  /**
   * @param prop A string refers to the desired props: fontSize/fontFamily/color/weight/style...
   * @returns The desired props value accord to the current selection range.
   */
  propReader (prop: string): string | number |undefined {
    const sel = this.getSelection()
    if (!sel || (sel.div as HTMLElement).id.match('text') === null) return
    const config = this.getCurrLayer as IText
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
    if (this.isSel(start) && !this.isSel(end)) {
      if (prop === 'fontSpacing' || prop === 'lineHeight') {
        return config.paragraphs[start.pIndex].styles[prop]
      } else if (prop === 'fontFamily' || prop === 'fontSize' || prop === 'color' || prop === 'bold' || prop === 'italic') {
        return config.paragraphs[start.pIndex].spans[start.sIndex].styles[fontPropsMap[prop]]
      }
    }

    let flag = false
    let origin: string | number = ''
    switch (prop) {
      case 'fontSpacing':
        origin = config.paragraphs[start.pIndex].styles.fontSpacing
        break
      case 'lineHeight':
        origin = config.paragraphs[start.pIndex].styles.lineHeight
        break
      default:
        if (Object.keys(fontPropsMap).includes(prop)) {
          const i = Object.keys(fontPropsMap).indexOf(prop)
          const v = Object.values(fontPropsMap)[i]
          origin = config.paragraphs[start.pIndex].spans[start.sIndex].styles[v] as string | number
        }
    }

    for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
      const p = config.paragraphs[pidx]
      if (prop === 'lineHeight' && origin !== p.styles.lineHeight) {
        flag = true
        break
      } else if (prop === 'fontSpacing' && origin !== p.styles.fontSpacing) {
        flag = true
        break
      } else if (prop === 'lineHeight' || prop === 'fontSpacing') continue

      for (let sidx = 0; sidx < p.spans.length; sidx++) {
        const span = p.spans[sidx]
        if ((pidx === start.pIndex && sidx < start.sIndex) || (pidx === end.pIndex && sidx > end.sIndex)) continue
        if (Object.keys(fontPropsMap).includes(prop)) {
          const i = Object.keys(fontPropsMap).indexOf(prop)
          const v = Object.values(fontPropsMap)[i]
          if (origin !== span.styles[v]) {
            flag = true
            break
          }
        }
      }
      if (flag) break
    }
    return flag ? undefined : origin
  }

  propIndicator(start: { pIndex: number, sIndex: number }, end: { pIndex: number, sIndex: number }, propName: string, value: string | number): { [key:string]: string | number } {
    const prop: { [key: string]: string | number } = {}
    const config = GeneralUtils.deepCopy(this.getCurrLayer) as IText

    if (!this.isSel(end)) {
      const styles = config.paragraphs[start.pIndex].spans[start.sIndex].styles
      switch (propName) {
        case 'bold': {
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
          case 'color': {
            prop.color = value
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

      if (!div || (div as HTMLElement).id.match('text') === null || !range || !range.startContainer || !range.endContainer) return undefined
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
      p.style.margin = '0.5em'
      body.appendChild(p)
    })
    body.style.border = '1px solid blue'
    body.style.width = width === -1 ? 'fit-content' : `${width}px`
    body.style.height = 'fit-content'
    body.style.whiteSpace = 'pre-wrap'
    body.style.textAlign = 'center'
    body.style.writingMode = content.styles.writingMode
    document.body.appendChild(body)
    const textHW = {
      width: Math.ceil(body.getBoundingClientRect().width),
      height: Math.ceil(body.getBoundingClientRect().height)
    }
    document.body.removeChild(body)
    return textHW
  }

  isSel(sel: { pIndex: number, sIndex: number, offset?: number }): boolean {
    return !Number.isNaN(sel.pIndex) && !Number.isNaN(sel.sIndex) && !Number.isNaN(sel.offset)
  }

  isBlockProperty(propName: string): boolean {
    return propName.includes('text-align') || propName === 'font-vertical'
  }

  updateTextStyles(pageIndex: number, layerIndex: number, styles: { [key: string]: string | number }) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles
    })
  }

  updateParagraphStyles(pageIndex: number, layerIndex: number, pIndex: number, styles: { [key: string]: string | number }) {
    store.commit('UPDATE_paragraphStyles', {
      pageIndex,
      layerIndex,
      pIndex,
      styles
    })
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
