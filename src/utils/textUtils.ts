import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { ISpan, ISpanCssStyle, ISpanStyle, IText } from '@/interfaces/layer'
import CssConveter from '@/utils/cssConverter'
import { directive } from 'vue/types/umd'
import GeneralUtils from './generalUtils'
import Vue from 'vue'

class TextUtils {
  get pageIndex(): number { return store.getters.getLastSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IText { return store.getters.getLayer(this.pageIndex, this.layerIndex) }

  onPropertyClick(propName: string, value = '', selStart = {}, selEnd = {}, el = {}) {
    const sel = this.getSelection()
    if (sel && Object.keys(sel.end).length !== 0) {
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
      if (Object.keys(selStart).length === 0 && Object.keys(selEnd).length === 0) {
        Object.assign(start, sel.start)
        Object.assign(end, sel.end)
      } else {
        Object.assign(start, selStart)
        Object.assign(end, selEnd)
      }

      const prop = this.propIndicator(div, start, end, propName, value)
      const config = GeneralUtils.deepCopy(this.getCurrLayer) as IText
      let isStartContainerDivide = true
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
                config.paragraphs[pIndex].spans.splice(sIndex + 1, 0, thirdSpan)
              }
              break
            } else if (start.pIndex === end.pIndex && isStartContainerDivide) {
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
            console.log(config.paragraphs[pIndex].spans[sIndex])
            Object.assign(span.styles, this.spanStylesTransformer(span, prop))
          }
        }
      }
      ControlUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, config.paragraphs)
      Vue.nextTick(() => {
        if (sel && Object.keys(sel.end).length !== 0) {
          const range = new Range()
          if (isStartContainerDivide) {
            start.sIndex++
            if (start.pIndex === end.pIndex) {
              end.sIndex++
            }
          }
          const nodeStart = sel.div.childNodes[start.pIndex].childNodes[start.sIndex].firstChild as Node
          const nodeEnd = sel.div.childNodes[end.pIndex].childNodes[end.sIndex].firstChild as Node
          range.setStart(nodeStart, 0)
          range.setEnd(nodeEnd, config.paragraphs[end.pIndex].spans[end.sIndex].text.length)

          const select = window.getSelection()
          if (select) {
            select.removeAllRanges()
            select.addRange(range)
          }
        }
      })
    }
  }
  // const prop = this.propIndicator(div, start, end, propName, value)
  // for (let i = start.pIndex; i < div.childNodes.length; i++) {
  //   const p = div.childNodes[i]
  //   const pEl = p as HTMLElement
  //   const pindex = parseInt(pEl.dataset.pindex as string)
  //   for (let j = 0; j < p.childNodes.length; j++) {
  //     const span = p.childNodes[j]
  //     const spanEl = span as HTMLElement
  //     const sindex = parseInt(spanEl.dataset.sindex as string)
  //     const text = spanEl.innerText
  //     if (pindex === start.pIndex && sindex === start.sIndex) {
  //       spanEl.innerText = text.substr(0, start.offset)
  //       const newSpan = document.createElement('span')
  //       newSpan.innerText = text.substr(start.offset)
  //       // apply props
  //       Object.assign(newSpan.style, this.spanStyleTransformer(spanEl, prop))
  //       span.after(newSpan)
  //       j++
  //       if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
  //         newSpan.innerText = text.substring(start.offset, end.offset)
  //         console.log(text)
  //         const thirdSpan = document.createElement('span')
  //         thirdSpan.innerText = text.substr(end.offset)
  //         Object.assign(thirdSpan.style, this.spanStyleTransformer(spanEl, {}))
  //         newSpan.after(thirdSpan)
  //         break
  //       }
  //     } else if (pindex === start.pIndex && sindex < start.sIndex) {
  //       continue
  //     } else if (pindex === end.pIndex && sindex === end.sIndex) {
  //       if (parseInt(spanEl.dataset.sindex as string) === end.sIndex) {
  //         spanEl.innerText = text.substr(end.offset)
  //         const newSpan = document.createElement('span')
  //         newSpan.innerText = text.substr(0, end.offset)
  //         Object.assign(newSpan.style, this.spanStyleTransformer(spanEl, prop))
  //         span.before(newSpan)
  //         break
  //       }
  //     } else if (pindex < end.pIndex || (pindex === end.pIndex && sindex <= end.sIndex)) {
  //       Object.assign(spanEl.style, this.spanStyleTransformer(spanEl, prop))
  //     }
  //   }
  // }

  /**
   *
   * @param prop A string about the desired props: fontSize/fontFamily.
   * @returns The desired props value accord to the current selection range.
   */
  propReader (prop: string): string | undefined {
    const sel = this.getSelection()
    if (!sel) return
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
    if (Object.keys(end).length === 0) {
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

  propIndicator(text: Node, start: { pIndex: number, sIndex: number }, end: { pIndex: number, sIndex: number }, propName: string, value = ''): { [key:string]: string } {
    const prop: { [key: string]: string } = {}
    let flag = false
    for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
      const p = text.childNodes[pidx]
      for (let sidx = 0; sidx < p.childNodes.length; sidx++) {
        const span = p.childNodes[sidx]
        if ((pidx === start.pIndex && sidx < start.sIndex) || (pidx === end.pIndex && sidx > end.sIndex)) continue
        switch (propName) {
          case 'bold': {
            // prop.fontWeight = 'normal'
            prop.weight = 'normal'
            if ((span as HTMLElement).style.fontWeight === 'normal') {
              // prop.fontWeight = 'bold'
              prop.weight = 'bold'
              flag = true
            }
            break
          }
          case 'underline': {
            // prop.textDecorationLine = 'none'
            prop.decoration = 'none'
            if ((span as HTMLElement).style.textDecorationLine === 'none') {
              // prop.textDecorationLine = 'underline'
              prop.decoration = 'underline'
              flag = true
            }
            break
          }
          case 'italic': {
            // prop.fontStyle = 'normal'
            prop.style = 'normal'
            if ((span as HTMLElement).style.fontStyle === 'normal') {
              // prop.fontStyle = 'italic'
              prop.style = 'italic'
              flag = true
            }
            break
          }
          case 'fontFamily': {
            // prop.fontFamily = value
            prop.font = value
            flag = true
            break
          }
          case 'fontSize': {
            // prop.fontSize = `${value}px`
            prop.size = `${value}px`
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

  spanStyleTransformer(span: HTMLElement, prop: { [key: string]: string }): ISpanCssStyle {
    const spanStyle = {
      fontFamily: span.style.fontFamily,
      fontWeight: span.style.fontWeight,
      fontSize: span.style.fontSize,
      textDecorationLine: span.style.textDecorationLine,
      fontStyle: span.style.fontStyle,
      color: span.style.color,
      opacity: span.style.opacity
    }
    return Object.assign(spanStyle, prop)
  }

  spanStylesTransformer(span: ISpan | undefined, prop: { [key: string]: string }): ISpanStyle {
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
  textAlign(span: HTMLElement, iconName: string) {
    const align = iconName.substring(11, iconName.length)
    // this.updateTextStyles(this.pageIndex, this.layerIndex, { align })
  }

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
    if (window.getSelection()) {
      const sel = window.getSelection()
      const range = sel?.getRangeAt(0)
      let div = range?.commonAncestorContainer
      while (div?.parentNode && div?.nodeName !== 'DIV') {
        div = div?.parentNode
      }
      const start = {
        pIndex: parseInt(range?.startContainer?.parentElement?.parentElement?.dataset.pindex as string),
        sIndex: parseInt(range?.startContainer?.parentElement?.dataset.sindex as string),
        offset: range?.startOffset as number
      }

      if (!div || !range || !range.startContainer || !range.endContainer) return undefined
      const end: { [key: string]: number } = {}

      if (window.getSelection()?.toString() !== '') {
        end.pIndex = parseInt(range?.endContainer?.parentElement?.parentElement?.dataset.pindex as string)
        end.sIndex = parseInt(range?.endContainer?.parentElement?.dataset.sindex as string)
        end.offset = range?.endOffset as number
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
}

export default new TextUtils()
