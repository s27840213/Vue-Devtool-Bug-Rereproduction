import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { ISpanCssStyle, ISpanStyle, IText } from '@/interfaces/layer'
import CssConveter from '@/utils/cssConverter'
import { directive } from 'vue/types/umd'

class TextUtils {
  get pageIndex(): number { return store.getters.getLastSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IText { return store.getters.getLayer(this.pageIndex, this.layerIndex) }

  onPropertyClick(iconName: string) {
    if (window.getSelection() && window.getSelection()?.toString() !== '') {
      const sel = window.getSelection()
      const range = sel?.getRangeAt(0)
      let div = range?.commonAncestorContainer
      while (div?.parentNode && div?.nodeName !== 'DIV') {
        div = div?.parentNode
      }
      const observer = new MutationObserver(ControlUtils.onTyping)
      observer.observe(div as HTMLElement, {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: false,
        attributeOldValue: false,
        characterDataOldValue: false
      })
      const start = {
        pIndex: parseInt(range?.startContainer?.parentElement?.parentElement?.dataset.pindex as string),
        sIndex: parseInt(range?.startContainer?.parentElement?.dataset.sindex as string),
        offset: range?.startOffset
      }
      const end = {
        pIndex: parseInt(range?.endContainer?.parentElement?.parentElement?.dataset.pindex as string),
        sIndex: parseInt(range?.endContainer?.parentElement?.dataset.sindex as string),
        offset: range?.endOffset
      }
      if (!div || !range || !range.startContainer || !range.endContainer ||
        typeof start.offset === 'undefined' || typeof end.offset === 'undefined') return

      const prop = this.propIndicator(div, start, end, iconName)
      console.log(prop)
      for (let i = start.pIndex; i < div.childNodes.length; i++) {
        const p = div.childNodes[i]
        const pEl = p as HTMLElement
        const pindex = parseInt(pEl.dataset.pindex as string)
        for (let j = 0; j < p.childNodes.length; j++) {
          const span = p.childNodes[j]
          const spanEl = span as HTMLElement
          const sindex = parseInt(spanEl.dataset.sindex as string)
          const text = spanEl.innerText
          if (pindex === start.pIndex && sindex === start.sIndex) {
            spanEl.innerText = text.substr(0, start.offset)
            const newSpan = document.createElement('span')
            newSpan.innerText = text.substr(start.offset)
            Object.assign(newSpan.style, this.spanStyleTransformer(spanEl, prop))
            span.after(newSpan)
            j++
            if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
              newSpan.innerText = text.substring(start.offset, end.offset)
              console.log(text)
              const thirdSpan = document.createElement('span')
              thirdSpan.innerText = text.substr(end.offset)
              Object.assign(thirdSpan.style, this.spanStyleTransformer(spanEl, {}))
              newSpan.after(thirdSpan)
              break
            }
          } else if (pindex === start.pIndex && sindex < start.sIndex) {
            continue
          } else if (pindex === end.pIndex && sindex === end.sIndex) {
            if (parseInt(spanEl.dataset.sindex as string) === end.sIndex) {
              spanEl.innerText = text.substr(end.offset)
              const newSpan = document.createElement('span')
              newSpan.innerText = text.substr(0, end.offset)
              Object.assign(newSpan.style, this.spanStyleTransformer(spanEl, prop))
              span.before(newSpan)
              break
            }
          } else if (pindex < end.pIndex || (pindex === end.pIndex && sindex <= end.sIndex)) {
            Object.assign(spanEl.style, this.spanStyleTransformer(spanEl, prop))
          }
        }
      }
      // if (iconName.substring(0, 10) === 'text-align') {
      //   this.textAlign(iconName)
      // } else if (iconName === 'bold') {
      //   this.textBold()
      // } else if (iconName === 'underline') {
      //   this.textUnderline()
      // } else if (iconName === 'italic') {
      //   this.textItalic()
      // } else if (iconName === 'font-vertical') {
      //   this.textVertical()
      // }
    }
  }

  propIndicator(text: Node, start: { pIndex: number, sIndex: number }, end: { pIndex: number, sIndex: number }, iconName: string): { [key:string]: string } {
    const prop: { [key: string]: string } = {}
    let flag = false
    for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
      const p = text.childNodes[pidx]
      for (let sidx = 0; sidx < p.childNodes.length; sidx++) {
        const span = p.childNodes[sidx]
        if ((pidx === start.pIndex && sidx < start.sIndex) || (pidx === end.pIndex && sidx > end.sIndex)) continue
        if (iconName === 'bold') {
          prop.fontWeight = 'normal'
          if ((span as HTMLElement).style.fontWeight === 'normal') {
            prop.fontWeight = 'bold'
            flag = true
            break
          }
        } else if (iconName === 'underline') {
          prop.textDecorationLine = 'none'
          if ((span as HTMLElement).style.textDecorationLine === 'none') {
            prop.textDecorationLine = 'underline'
            flag = true
            break
          }
        } else if (iconName === 'italic') {
          prop.fontStyle = 'normal'
          if ((span as HTMLElement).style.fontStyle === 'normal') {
            prop.fontStyle = 'italic'
            flag = true
            break
          }
        }
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

  // TODO: align is for paragraphs
  textAlign(span: HTMLElement, iconName: string) {
    const align = iconName.substring(11, iconName.length)
    // this.updateTextStyles(this.pageIndex, this.layerIndex, { align })
  }

  spanPropsHandler(span: HTMLElement, iconName: string): ISpanCssStyle {
    const prop: { [key: string]: string } = {}
    if (iconName === 'bold') {
      let fontWeight = 'normal'
      if (span.style.fontWeight === 'normal') {
        fontWeight = 'bold'
      }
      prop.fontWeight = fontWeight
    } else if (iconName === 'underline') {
      let textDecorationLine = 'none'
      if (span.style.textDecorationLine === 'none') {
        textDecorationLine = 'underline'
      }
      prop.textDecorationLine = textDecorationLine
    } else if (iconName === 'italic') {
      let fontStyle = 'normal'
      if (span.style.fontStyle === 'normal') {
        fontStyle = 'italic'
      }
      prop.fontStyle = fontStyle
    }
    return this.spanStyleTransformer(span, prop)
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

  // getTextHW(text: string, styles: any, width = `${this.getCurrLayer.widthLimit as number}px`) {
  //   const el = document.createElement('span')
  //   el.style.whiteSpace = 'pre-wrap'
  //   el.style.display = 'inline-block'
  //   el.style.overflowWrap = 'break-word'
  //   el.style.width = width
  //   el.innerHTML = text
  //   Object.assign(el.style, CssConveter.convertFontStyle(styles))
  //   document.body.appendChild(el)
  //   const textHW = {
  //     width: Math.ceil(el.getBoundingClientRect().width),
  //     height: Math.ceil(el.getBoundingClientRect().height)
  //   }
  //   document.body.removeChild(el)
  //   return textHW
  // }
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
