import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { v4 as uuidv4 } from 'uuid'
import { ILayer, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText, ITmp } from '@/interfaces/layer'
import { ISelection } from '@/interfaces/text'
import CssConveter from '@/utils/cssConverter'
import GeneralUtils from './generalUtils'
import Vue from 'vue'
import LayerUtils from './layerUtils'
import { Solarize } from 'konva/types/filters/Solarize'
import { config } from 'dotenv/types'

const fontPropsMap = {
  fontSize: 'size',
  fontFamily: 'font',
  bold: 'weight',
  italic: 'style',
  underline: 'decoration',
  color: 'color'
}

// used for font panel as a temporary test usage
export const tmpFontsPreset = [
  {
    name: 'sans-serif',
    face: 'sans-serif'
  },
  {
    name: 'Manrop',
    face: 'Manrop'
  },
  {
    name: 'Lobster',
    face: 'Lobster'
  },
  {
    name: '思源黑體',
    face: 'NotoSansTC'
  },
  {
    name: '標楷體',
    face: 'cwTeXKai'
  },
  {
    name: '獅尾四季春',
    face: 'SweiSpringCJKtc-Regular'
  },
  {
    name: '裝甲明朝',
    face: 'SoukouMincho'
  },
  {
    name: '瀨戶字體',
    face: 'SetoFont'
  },
  {
    name: '思源柔體',
    face: 'GenJyuuGothicX-P-Regular'
  }
]

class TextUtils {
  public readonly MARGIN_FONTSIZE = 16

  get pageIndex(): number { return store.getters.getCurrSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrSel() { return store.state.text?.sel }
  get getCurrTextProps() { return store.state.text?.props }
  get getLayer() { return store.getters.getLayer }
  get getCurrLayer() { return store.getters.getLayer(this.pageIndex, this.layerIndex) }

  onPropertyClick(propName: string, value?: string | number, selStart = { pIndex: NaN, sIndex: NaN, offset: NaN }, selEnd = { pIndex: NaN, sIndex: NaN, offset: NaN }) {
    if (this.isBlockProperty(propName)) {
      const currLayer = this.getCurrLayer
      if (currLayer.type === 'group' || currLayer.type === 'tmp') {
        const groupLayer = currLayer
        for (let i = 0; i < groupLayer.layers.length; i++) {
          if (groupLayer.layers[i].type === 'text') {
            this.blockPropertyHandler(propName, i)
          }
        }
      } else {
        this.blockPropertyHandler(propName)
      }
    } else {
      const currLayer = this.getCurrLayer
      if (currLayer.type === 'group' || currLayer.type === 'tmp') {
        const nan = {
          pIndex: NaN,
          sIndex: NaN,
          offset: NaN
        }
        /**
         * Check the LayerGroup's property indicated value
         */
        let flag = false
        let propValue: number | string | undefined
        const groupLayer = this.getCurrLayer
        for (let i = 0; i < groupLayer.layers.length && !flag; i++) {
          if (groupLayer.layers[i].type === 'text') {
            const tmpLayer = groupLayer.layers[i] as IText
            const propBuff = this.propIndicator(
              {
                pIndex: 0,
                sIndex: 0
              },
              {
                pIndex: tmpLayer.paragraphs.length - 1,
                sIndex: tmpLayer.paragraphs[tmpLayer.paragraphs.length - 1].spans.length - 1
              }, propName, value || '', tmpLayer
            )
            switch (propName) {
              case 'bold':
                propValue = 'normal'
                if (propBuff.weight === 'bold') {
                  propValue = 'bold'
                  flag = true
                }
                break
              case 'italic':
                propValue = 'normal'
                if (propBuff.style === 'italic') {
                  propValue = 'italic'
                  flag = true
                }
                break
              case 'underline':
                propValue = 'none'
                if (propBuff.decoration === 'underline') {
                  propValue = 'underline'
                  flag = true
                }
                break
              case 'fontSize':
                propValue = value as string
                break
              case 'fontFamily':
                propValue = value as string
                break
              case 'color': {
                propValue = value as string
                flag = true
                break
              }
            }
          }
        }
        for (let i = 0; i < groupLayer.layers.length; i++) {
          const layer = groupLayer.layers[i]
          if (layer.type === 'text') {
            this.spanPropertyHandler(propName, propValue, nan, nan, i)
          }
        }
      } else {
        this.spanPropertyHandler(propName, value, selStart, selEnd)
      }
    }
  }

  blockPropertyHandler(propName: string, tmpLayerIndex?: number) {
    const updateTextStyles = (styles: { [key: string]: string | number | boolean }) => {
      this.updateTextStyles(this.pageIndex, this.layerIndex, styles)
    }
    const updateSelectedLayersProps = (styles: { [key: string]: string | number | boolean }) => {
      this.updateSelectedLayersProps(styles, tmpLayerIndex ?? NaN)
    }
    const handler = typeof tmpLayerIndex === 'undefined' ? updateTextStyles : updateSelectedLayersProps

    switch (propName) {
      case 'text-align-left':
        handler({ align: 'left' })
        break
      case 'text-align-center':
        handler({ align: 'center' })
        break
      case 'text-align-right':
        handler({ align: 'right' })
        break
      case 'font-vertical': {
        const config = (typeof tmpLayerIndex === 'undefined' ? this.getCurrLayer : this.getCurrLayer.layers[tmpLayerIndex]) as IText
        const updateToVertical = config.styles.writingMode === 'initial' || config.styles.writingMode.includes('horizontal')
        const writingMode = updateToVertical ? 'vertical-lr' : 'initial'
        const { width, height } = config.styles
        if (typeof tmpLayerIndex === 'undefined') {
          console.log('dddddfsw')
          LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width: height, height: width })
        }
        handler({ writingMode })
      }
    }
  }

  spanPropertyHandler(propName: string, value?: string | number, selStart?: ISelection, selEnd?: ISelection, tmpLayerIndex?: number) {
    const sel = this.getSelection()
    let config: IText
    if (typeof tmpLayerIndex === 'undefined') {
      config = GeneralUtils.deepCopy(this.getCurrLayer) as IText
    } else {
      config = GeneralUtils.deepCopy((this.getCurrLayer as ITmp).layers[tmpLayerIndex]) as IText
    }
    let start = {
      pIndex: 0,
      sIndex: 0,
      offset: 0
    }
    let end = {
      pIndex: 0,
      sIndex: 0,
      offset: 0
    }
    if (!sel && !this.isSel(selStart) && !this.isSel(selEnd)) {
      /**
       * If there is no selection given by either the window or the input params,
       * the start will be (0, 0, 0) and the end will be the (last p, last s, at the last offset)
       */
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
    let prop: { [key: string]: string | number }
    // If temLayerIndex equals to 'undefined', means this function is now handler non-group-layer
    if (typeof tmpLayerIndex === 'undefined') {
      prop = this.propIndicator(start, end, propName, value || '')
    } else {
      const i = Object.keys(fontPropsMap).indexOf(propName)
      const v = Object.values(fontPropsMap)[i]
      prop = { [v]: value as string | number }
    }

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
      [start, end] = this.spanMerger(config.paragraphs, start, end)
      if (typeof tmpLayerIndex === 'undefined') {
        this.updateTextParagraphs(this.pageIndex, this.layerIndex, config.paragraphs)
      } else {
        this.updateSelectedParagraphs(tmpLayerIndex, config.paragraphs)
      }
    } else if (!this.isSel(end)) {
      const styles = config.paragraphs[start.pIndex].spans[start.sIndex].styles
      switch (propName) {
        case 'fontSize':
          styles.size = value as number
          break
        case 'fontFamily':
          styles.font = value as string
          break
        case 'color':
          this.updateTextPropsState({ color: value as string })
          break
        case 'bold': {
          if (this.getCurrTextProps?.weight === 'bold') {
            this.updateTextPropsState({ weight: 'normal' })
          } else {
            this.updateTextPropsState({ weight: 'bold' })
          }
          break
        }
        case 'italic': {
          if (this.getCurrTextProps?.style === 'italic') {
            this.updateTextPropsState({ style: 'normal' })
          } else {
            this.updateTextPropsState({ style: 'italic' })
          }
          break
        }
        case 'underline': {
          if (this.getCurrTextProps?.decoration === 'underline') {
            this.updateTextPropsState({ decoration: 'none' })
          } else {
            this.updateTextPropsState({ decoration: 'underline' })
          }
        }
      }
      [start, end] = this.spanMerger(config.paragraphs, start, end)
      if (typeof tmpLayerIndex === 'undefined') {
        this.updateTextParagraphs(this.pageIndex, this.layerIndex, config.paragraphs)
      } else {
        this.updateSelectedParagraphs(tmpLayerIndex, config.paragraphs)
      }
    }
    if (!sel || typeof tmpLayerIndex !== 'undefined') return
    // Below is used to re-select the caret-range after the props are applied
    Vue.nextTick(() => {
      if (this.isSel(end)) {
        if (isStartContainerDivided) {
          if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
            start.sIndex++
            end.sIndex++
            end.offset = config.paragraphs[end.pIndex].spans[end.sIndex].text.length
          } else {
            start.sIndex++
          }
        }
        // this.updateTextPropsState()
        this.focus(start, end)
      } else {
        const select = window.getSelection()
        if (select) {
          if (propName === 'fontFamily' || propName === 'fontSize') {
            start.offset = 0
            Object.assign(end, start)
            end.offset = config.paragraphs[start.pIndex].spans[start.sIndex].text.length
            this.updateTextPropsState()
            this.focus(start, end)
            this.updateSelection(start, end)
          } else {
            // Object.assign(end, start)
            this.focus(start, start, true)
            this.updateSelection(start, { pIndex: NaN, sIndex: NaN, offset: NaN })
          }
        }
      }
      // this.updateTextPropsState()
    })
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

  spanMerger(paragraphs: IParagraph[], start: ISelection, end: ISelection): [ISelection, ISelection] {
    if (!this.isSel(end)) return [start, end]
    let isStartMerged = false
    let isEndMerged = false
    if (start.sIndex - 1 >= 0) {
      const preSpan = paragraphs[start.pIndex].spans[start.sIndex - 1]
      const span = paragraphs[start.pIndex].spans[start.sIndex]
      if (this.isSameSpanStyles(span.styles, preSpan.styles)) {
        isStartMerged = true
        start.offset = preSpan.text.length
        preSpan.text += span.text
        paragraphs[start.pIndex].spans.splice(start.sIndex, 1)
        start.sIndex -= 1
        if (start.pIndex === end.pIndex) {
          end.sIndex -= 1
        }
      }
    }
    for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
      const p = paragraphs[pidx]
      const preSpanStyle = {} as ISpanStyle
      for (let sidx = 0; sidx < p.spans.length; sidx++) {
        if (pidx === end.pIndex && sidx >= end.sIndex) {
          break
        }
        const span = p.spans[sidx]
        if (this.isSameSpanStyles(span.styles, preSpanStyle)) {
          p.spans[sidx - 1].text += span.text
          if (pidx === end.pIndex) {
            end.sIndex -= 1
          }
          paragraphs[pidx].spans.splice(sidx, 1)
          sidx -= 1
          end.offset = paragraphs[end.pIndex].spans[end.sIndex].text.length
        }
        Object.assign(preSpanStyle, paragraphs[pidx].spans[sidx].styles)
      }
    }
    if (end.sIndex + 1 < paragraphs[end.pIndex].spans.length) {
      const preSpan = paragraphs[end.pIndex].spans[end.sIndex]
      const span = paragraphs[end.pIndex].spans[end.sIndex + 1]
      if (this.isSameSpanStyles(span.styles, preSpan.styles)) {
        isEndMerged = true
        if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
          end.offset = preSpan.text.length
        }
        preSpan.text += span.text
        paragraphs[end.pIndex].spans.splice(end.sIndex + 1, 1)
      }
    }

    if (!isStartMerged && !isEndMerged) {
      start.offset = 0
      end.offset = paragraphs[end.pIndex].spans[end.sIndex].text.length
    } else if (isStartMerged && !isEndMerged) {
      end.offset = paragraphs[end.pIndex].spans[end.sIndex].text.length
    }
    return [start, end]
  }

  paragraphPropsHandler(propName: string, value: string | number, selStart = { pIndex: NaN, sIndex: NaN, offset: NaN }, selEnd = { pIndex: NaN, sIndex: NaN, offset: NaN }) {
    if (this.currSelectedInfo.layers.length === 1) {
      selStart = GeneralUtils.deepCopy(selStart) as ISelection
      selEnd = GeneralUtils.deepCopy(selEnd) as ISelection
      if (!this.isSel(selStart) && !this.isSel(selEnd)) {
        Object.assign(selStart, { pIndex: 0, sIndex: 0, offset: 0 })
        Object.assign(selEnd, { pIndex: (this.getCurrLayer as IText).paragraphs.length, sIndex: 0, offset: 0 })
      } else {
        selEnd.pIndex = selStart.pIndex
      }
      switch (propName) {
        case 'fontSpacing':
          for (let pIndex = selStart.pIndex; pIndex <= selEnd.pIndex; pIndex++) {
            this.updateParagraphStyles(this.pageIndex, this.layerIndex, pIndex, { fontSpacing: value })
          }
          break
        case 'lineHeight':
          for (let pIndex = selStart.pIndex; pIndex <= selEnd.pIndex; pIndex++) {
            this.updateParagraphStyles(this.pageIndex, this.layerIndex, pIndex, { lineHeight: value })
          }
      }
    } else {
      for (let index = 0; index < this.currSelectedInfo.layers.length; index++) {
        if (this.currSelectedInfo.layers[index].type === 'text') {
          switch (propName) {
            case 'fontSpacing':
              this.updateSelectedParaProps(index, { fontSpacing: value })
              break
            case 'lineHeight':
              this.updateSelectedParaProps(index, { lineHeight: value })
          }
        }
      }
    }
  }

  /**
   * @param propName A string refers to the desired props: fontSize/fontFamily/color/weight/style...
   * @returns The desired props value accord to the current selection range.
   */
  propReader(propName: string): string | number | undefined {
    if (this.currSelectedInfo.layers.length === 1) {
      return this.propReadOfLayer(propName)
    } else {
      const tmpLayerGroup = this.getCurrLayer as ITmp
      let propBuff: number | string | undefined
      for (let i = 0; i < this.currSelectedInfo.layers.length; i++) {
        if (tmpLayerGroup.layers[i].type === 'text') {
          const tmpLayer = tmpLayerGroup.layers[i] as IText
          if (typeof propBuff === 'undefined') {
            propBuff = this.propReadOfLayer(propName, tmpLayer)
          } else if (propBuff !== this.propReadOfLayer(propName, tmpLayer)) {
            return undefined
          }
        }
      }
      return propBuff
    }
  }

  propReadOfLayer(prop: string, layer?: IText) {
    const sel = this.isSel(store.state.text?.sel.start) ? store.state.text?.sel : this.getSelection()
    // If layer is assigned, means the current selected layer is a group/tmp layer
    const config = GeneralUtils.deepCopy(layer ?? this.getCurrLayer) as IText
    let start
    let end
    if (sel && this.isSel(sel.start)) {
      start = sel.start
      end = sel.end
    } else if (!sel || (sel && !this.isSel(sel.start) && !this.isSel(sel.end) && config)) {
      start = {
        pIndex: 0,
        sIndex: 0,
        offset: 0
      }
      const pLeng = config.paragraphs.length
      const sLeng = config.paragraphs[pLeng - 1].spans.length
      end = {
        pIndex: pLeng - 1,
        sIndex: sLeng - 1,
        offset: config.paragraphs[pLeng - 1].spans[sLeng - 1].text.length
      }
    } else {
      return
    }
    /**
     * Selection is not a range (only caret)
     */
    if (this.isSel(start) && !this.isSel(end)) {
      if (prop === 'fontSpacing' || prop === 'lineHeight') {
        return config.paragraphs[start.pIndex].styles[prop]
      } else if (prop === 'fontFamily' || prop === 'fontSize' || prop === 'color' || prop === 'bold' || prop === 'italic') {
        return config.paragraphs[start.pIndex].spans[start.sIndex].styles[fontPropsMap[prop]]
      }
    }

    let isMulti = false
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
    for (let pidx = start.pIndex; pidx <= end.pIndex && config.paragraphs[pidx]; pidx++) {
      const p = config.paragraphs[pidx]
      if (prop === 'lineHeight' && origin !== p.styles.lineHeight) {
        isMulti = true
        break
      } else if (prop === 'fontSpacing' && origin !== p.styles.fontSpacing) {
        isMulti = true
        break
      } else if (prop === 'lineHeight' || prop === 'fontSpacing') continue

      for (let sidx = 0; sidx < p.spans.length; sidx++) {
        const span = p.spans[sidx]
        if ((pidx === start.pIndex && sidx < start.sIndex) || (pidx === end.pIndex && sidx > end.sIndex)) continue
        if (Object.keys(fontPropsMap).includes(prop)) {
          const i = Object.keys(fontPropsMap).indexOf(prop)
          const v = Object.values(fontPropsMap)[i]
          if (origin !== span.styles[v]) {
            isMulti = true
            break
          }
        }
      }
      if (isMulti) break
    }
    return isMulti ? undefined : origin
  }

  propIndicator(start: { pIndex: number, sIndex: number }, end: { pIndex: number, sIndex: number }, propName: string, value: string | number, tmpLayer?: IText): { [key: string]: string | number } {
    const prop: { [key: string]: string | number } = {}
    const config = GeneralUtils.deepCopy(tmpLayer ?? this.getCurrLayer) as IText

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

      if (!this.isSel(start) && !this.isSel(end)) {
        return undefined
      }

      return {
        div,
        start,
        end
      }
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
            if (this.isSameSpanStyles(config.paragraphs[pIndex].spans[sIndex].styles, spanStyleBuff)) {
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

          if (this.isSameSpanStyles(spanStyle, spanStyleBuff)) {
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
      const pStyle: IParagraphStyle = { lineHeight, fontSpacing, align: pEl.style.textAlign.replace('text-align-', '') }
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

  isSameSpanStyles(span: ISpanStyle, preSpan: ISpanStyle): boolean {
    let isSameSpanStyles = true
    for (const k of Object.keys(span)) {
      if (span[k] !== preSpan[k] && span[k] !== '' && !Number.isNaN(span[k])) {
        isSameSpanStyles = false
        break
      }
    }
    return isSameSpanStyles
  }

  isSel(sel?: { pIndex: number, sIndex: number, offset?: number }): boolean {
    return typeof sel !== 'undefined' && (!Number.isNaN(sel.pIndex) && !Number.isNaN(sel.sIndex) && !Number.isNaN(sel.offset))
  }

  isBlockProperty(propName: string): boolean {
    return propName.includes('text-align') || propName === 'font-vertical'
  }

  getTextHW(content: IText, widthLimit = -1): { width: number, height: number } {
    const body = document.createElement('div')
    content.paragraphs.forEach(pData => {
      const p = document.createElement('p')
      pData.spans.forEach(spanData => {
        const span = document.createElement('span')
        span.textContent = spanData.text
        Object.assign(span.style, CssConveter.convertFontStyle(spanData.styles))
        span.style.whiteSpace = 'pre-wrap'
        p.appendChild(span)
      })
      Object.assign(p.style, CssConveter.convertFontStyle(pData.styles))
      p.style.margin = '0.5em'
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

  updateTextStyles(pageIndex: number, layerIndex: number, styles: { [key: string]: string | number | boolean }) {
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

  updateSelectedParagraphs(tmpLayerIndex: number, paragraphs: IParagraph[]) {
    store.commit('UPDATE_selectedTextParagraphs', {
      tmpLayerIndex,
      paragraphs
    })
  }

  updateSelectedLayersProps(styles: { [key: string]: string | number | boolean }, layerIndex: number) {
    store.commit('UPDATE_selectedLayersStyles', {
      styles,
      layerIndex
    })
  }

  updateSelectedParaProps(tmpLayerIndex: number, props: { [key: string]: string | number }) {
    store.commit('UPDATE_selectedTextParagraphsProp', {
      tmpLayerIndex,
      props
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

  updateTextPropsState(prop: { [key: string]: string | number | boolean } | undefined = undefined) {
    if (typeof prop !== 'undefined') {
      store.commit('text/UPDATE_Props', prop)
      return
    }
    const props = [
      'textAlign',
      'fontSize',
      'fontSpacing',
      'lineHeight',
      'font',
      'color',
      'opacity',
      'weight',
      'style',
      'decoration',
      'isVertical'
    ]
    props.forEach(k => {
      let value
      switch (k) {
        case 'textAlign': {
          if (this.currSelectedInfo.layers.length === 1) {
            value = this.getCurrLayer.styles.align
          } else {
            const tmpLayerGroup = this.getCurrLayer as ITmp
            for (let i = 0; i < this.currSelectedInfo.layers.length; i++) {
              if (tmpLayerGroup.layers[i].type === 'text') {
                const tmpLayer = tmpLayerGroup.layers[i] as IText
                if (!value) value = tmpLayer.styles.align
                if (value !== tmpLayer.styles.align) {
                  value = undefined
                  break
                }
              }
            }
          }
          break
        }
        case 'fontSize': {
          const size = this.propReader('fontSize')
          value = typeof size === 'number' ? size.toString() : '--'
          break
        }
        case 'fontSpacing': {
          const space = this.propReader('fontSpacing')
          value = typeof space === 'number' ? ((space as number) * 1000).toString() : '--'
          break
        }
        case 'lineHeight': {
          const height = this.propReader('lineHeight')
          value = typeof height === 'number' && height !== -1 ? height.toString() : '--'
          break
        }
        case 'font': {
          const font = tmpFontsPreset.find(font => font.face === this.propReader('fontFamily'))?.name
          value = typeof font === 'string' ? font : 'multi-fonts'
          break
        }
        case 'color': {
          value = typeof this.propReader('color') === 'string' ? this.propReader('color') as string : '--'
          break
        }
        case 'opacity': {
          value = (this.getCurrLayer as IText).styles.opacity
          break
        }
        case 'decoration': {
          value = this.propReader('underline')
          break
        }
        case 'weight': {
          value = this.propReader('bold')
          break
        }
        case 'style': {
          value = this.propReader('italic')
          break
        }
        case 'isVertical': {
          if (this.currSelectedInfo.layers.length === 1) {
            value = this.getCurrLayer.styles.writingMode.includes('vertical')
          } else {
            const tmpLayerGroup = this.getCurrLayer as ITmp
            value = true
            for (let i = 0; i < this.currSelectedInfo.layers.length && value; i++) {
              if (tmpLayerGroup.layers[i].type === 'text') {
                const tmpLayer = tmpLayerGroup.layers[i] as IText
                value = tmpLayer.styles.writingMode.includes('vertical')
              }
            }
          }
          break
        }
      }

      const prop: { [key: string]: string | number | boolean | undefined } = {}
      prop[k] = value
      store.commit('text/UPDATE_Props', prop)
    })
  }
}

export default new TextUtils()
