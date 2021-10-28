import store from '@/store'
import { IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText, ITmp } from '@/interfaces/layer'
import { ISelection } from '@/interfaces/text'
import GeneralUtils from './generalUtils'
import Vue from 'vue'
import LayerUtils from './layerUtils'
import { ITextState } from '@/store/text'
import TextUtils from './textUtils'
import TextShapeUtils from './textShapeUtils'
import TextEffectUtils from './textEffectUtils'
import StepsUtils from './stepsUtils'
import { dropWhile } from 'lodash'

const fontPropsMap = {
  fontSize: 'size',
  fontFamily: 'font',
  bold: 'weight',
  italic: 'style',
  underline: 'decoration',
  color: 'color'
}

class TextPropUtils {
  get pageIndex(): number { return store.getters.getCurrSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrSel() { return store.state.text?.sel }
  get getCurrTextProps() { return store.state.text?.props }
  get getTextState() { return store.state.text as ITextState }
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
      LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, styles)
    }
    const updateSelectedLayersProps = (styles: { [key: string]: string | number | boolean }) => {
      this.updateSelectedLayersProps(styles, tmpLayerIndex ?? NaN)
    }
    const handler = typeof tmpLayerIndex === 'undefined' ? updateTextStyles : updateSelectedLayersProps
    switch (propName) {
      case 'font-vertical': {
        const config = (typeof tmpLayerIndex === 'undefined' ? this.getCurrLayer : this.getCurrLayer.layers[tmpLayerIndex]) as IText
        const writingMode = !config.styles.writingMode.includes('vertical') ? 'vertical-lr' : 'initial'
        if (typeof tmpLayerIndex === 'undefined') {
          Object.assign(config.styles, writingMode)
          const { width, height } = TextUtils.getTextHW(config)
          writingMode.includes('vertical') && TextShapeUtils.setTextShape('none')
          LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width: height, height: width })
        }
        handler({ writingMode })
      }
    }
  }

  fontSizeStepper(value: number, selStart: ISelection, selEnd: ISelection, tmpLayerIndex?: number) {
    this.spanPropertyHandler('fontSize', value, selStart, selEnd, tmpLayerIndex)
    Vue.nextTick(() => {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
      }
    })
  }

  spanPropertyHandler(propName: string, value?: string | number, selStart?: ISelection, selEnd?: ISelection, tmpLayerIndex?: number) {
    const sel = TextUtils.getSelection()
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
    // if (!sel && !TextUtils.isSel(selStart) && !TextUtils.isSel(selEnd)) {
    //   console.log('1')
    //   /**
    //    * If there is no selection given by either the window or the input params,
    //    * the start will be (0, 0, 0) and the end will be the (last p, last s, at the last offset)
    //    */
    //   end.pIndex = config.paragraphs.length - 1
    //   end.sIndex = config.paragraphs[end.pIndex].spans.length - 1
    //   end.offset = config.paragraphs[end.pIndex].spans[end.sIndex].text.length
    // } else if (TextUtils.isSel(selStart) || TextUtils.isSel(selEnd)) {
    //   console.log('2')
    //   Object.assign(start, selStart)
    //   Object.assign(end, selEnd)
    // } else if (sel) {
    //   console.log(sel.div)
    //   console.log('3')
    //   Object.assign(start, sel.start)
    //   Object.assign(end, sel.end)
    // } else {
    //   return
    // }

    if (TextUtils.isSel(selStart) || TextUtils.isSel(selEnd)) {
      Object.assign(start, selStart)
      Object.assign(end, selEnd)
    } else if (TextUtils.isSel(this.getCurrSel?.start)) {
      Object.assign(start, this.getCurrSel?.start)
      Object.assign(end, this.getCurrSel?.end)
    } else {
      end.pIndex = config.paragraphs.length - 1
      end.sIndex = config.paragraphs[end.pIndex].spans.length - 1
      end.offset = config.paragraphs[end.pIndex].spans[end.sIndex].text.length
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

    if (TextUtils.isSel(end)) {
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
              end.offset -= start.offset
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
      if (propName !== 'fontSize') {
        [start, end] = this.spanMerger(config.paragraphs, start, end)
      }
      if (typeof tmpLayerIndex === 'undefined') {
        TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, config.paragraphs)
      } else {
        TextUtils.updateSelectedParagraphs(tmpLayerIndex, config.paragraphs)
      }
    } else if (!TextUtils.isSel(end)) {
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
      if (propName !== 'fontSize') {
        [start, end] = this.spanMerger(config.paragraphs, start, end)
      }
      if (typeof tmpLayerIndex === 'undefined') {
        TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, config.paragraphs)
      } else {
        TextUtils.updateSelectedParagraphs(tmpLayerIndex, config.paragraphs)
      }
    }

    if (propName === 'fontSize') {
      for (const p of config.paragraphs) {
        let fontSize = 0
        for (const span of p.spans) {
          if (span.styles.size > fontSize) {
            fontSize = span.styles.size
          }
        }
        p.styles.size = fontSize
      }
    }
    // if (!sel || typeof tmpLayerIndex !== 'undefined') return

    if (TextUtils.isSel(end)) {
      if (isStartContainerDivided) {
        if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
          start.sIndex++
          start.offset = 0
          end.sIndex++
          end.offset = config.paragraphs[end.pIndex].spans[end.sIndex].text.length
        } else {
          start.sIndex++
        }
      }
      TextUtils.updateSelection(start, end)
    }
    // sync updating text effect if the color changed
    TextEffectUtils.updateTextEffect(this.pageIndex, this.layerIndex)
    if (!sel || typeof tmpLayerIndex !== 'undefined' || propName === 'color') return

    // Below is used to re-select the caret-range after the props are applied
    Vue.nextTick(() => {
      if (TextUtils.isSel(end)) {
        TextUtils.focus(start, end)
        // TextUtils.updateSelection(start, end)
        this.updateTextPropsState()
      } else {
        const select = window.getSelection()
        if (select) {
          if (propName === 'fontFamily' || propName === 'fontSize') {
            start.offset = 0
            Object.assign(end, start)
            end.offset = config.paragraphs[start.pIndex].spans[start.sIndex].text.length
            this.updateTextPropsState()
            TextUtils.focus(start, end)
            TextUtils.updateSelection(start, end)
          } else {
            TextUtils.focus(start, start, true)
            TextUtils.updateSelection(start, { pIndex: NaN, sIndex: NaN, offset: NaN })
          }
        }
      }
    })
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

  spanMerger(paragraphs: IParagraph[], start: ISelection, end: ISelection): [ISelection, ISelection] {
    if (!TextUtils.isSel(end)) return [start, end]
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

  paragraphPropsHandler(propName: string, value: string | number = '', selStart = { pIndex: NaN, sIndex: NaN, offset: NaN }, selEnd = { pIndex: NaN, sIndex: NaN, offset: NaN }) {
    if (this.currSelectedInfo.layers.length === 1 && !this.currSelectedInfo.types.has('group')) {
      const sel = TextUtils.getSelection()

      if (sel && !TextUtils.isSel(selStart) && !TextUtils.isSel(selEnd)) {
        Object.assign(selStart, sel.start)
        Object.assign(selEnd, TextUtils.isSel(sel.end) ? sel.end : sel.start)
      } else if (TextUtils.isSel(selStart) && !TextUtils.isSel(selEnd)) {
        selEnd.pIndex = selStart.pIndex
      } else if (!TextUtils.isSel(selStart) && !TextUtils.isSel(selEnd)) {
        Object.assign(selStart, { pIndex: 0, sIndex: 0, offset: 0 })
        Object.assign(selEnd, { pIndex: (this.getCurrLayer as IText).paragraphs.length - 1, sIndex: 0, offset: 0 })
      }

      const handler = (prop: { [key: string]: string | number }) => {
        for (let pIndex = selStart.pIndex; pIndex <= selEnd.pIndex; pIndex++) {
          this.updateParagraphStyles(this.pageIndex, this.layerIndex, pIndex, prop)
        }
      }

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
        case 'lineHeight':
          handler({ lineHeight: value })
          break
        case 'fontSpacing':
          handler({ fontSpacing: value })
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
    if (this.currSelectedInfo.layers.length === 1 && !this.currSelectedInfo.types.has('group')) {
      return this.propReadOfLayer(propName)
    } else {
      const tmpLayerGroup = this.getCurrLayer as ITmp
      let propBuff: number | string | undefined
      for (let i = 0; i < tmpLayerGroup.layers.length; i++) {
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
    const sel = TextUtils.isSel(store.state.text?.sel.start)
      ? GeneralUtils.deepCopy(store.state.text?.sel) as { start: ISelection, end: ISelection } : TextUtils.getSelection()
    // If layer is assigned, means the current selected layer is a group/tmp layer
    const config = GeneralUtils.deepCopy(layer ?? this.getCurrLayer) as IText
    let start
    let end
    if (sel && TextUtils.isSel(sel.start)) {
      start = sel.start
      end = sel.end
    } else if (!sel || (sel && !TextUtils.isSel(sel.start) && !TextUtils.isSel(sel.end) && config)) {
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
    if (TextUtils.isSel(start) && !TextUtils.isSel(end)) {
      Object.assign(end, start)
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
      case 'textAlign':
        origin = config.paragraphs[start.pIndex].styles.align
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
      /**
       * For paragraphs props
       */
      if (prop === 'lineHeight' || prop === 'fontSpacing' || prop === 'textAlign') {
        const propsMap = {
          lineHeight: 'lineHeight',
          fontSpacing: 'fontSpacing',
          textAlign: 'align'
        }
        if (p.styles[propsMap[prop]] !== origin) {
          isMulti = true
          break
        }
        continue
      }
      /**
       * For spans props
       */
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

    if (!TextUtils.isSel(end)) {
      console.log(start.pIndex)
      console.log(start.sIndex)
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

  isBlockProperty(propName: string): boolean {
    return propName.includes('text-align') || propName === 'font-vertical'
  }

  updateTextPropsState(prop: { [key: string]: string | number | boolean } | undefined = undefined) {
    if (typeof prop !== 'undefined') {
      store.commit('text/UPDATE_props', prop)
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
          value = this.propReader('textAlign')
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
          const font = this.getTextState.fontStore.find(font => font.face === this.propReader('fontFamily'))?.name
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
          if (this.currSelectedInfo.layers.length === 1 && !this.currSelectedInfo.types.has('group')) {
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
      store.commit('text/UPDATE_props', prop)
    })
  }

  updateSelectedLayersProps(styles: { [key: string]: string | number | boolean }, layerIndex: number) {
    store.commit('UPDATE_selectedLayersStyles', {
      styles,
      layerIndex
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

  updateSelectedParaProps(tmpLayerIndex: number, props: { [key: string]: string | number }) {
    store.commit('UPDATE_selectedTextParagraphsProp', {
      tmpLayerIndex,
      props
    })
  }
}

export default new TextPropUtils()

export const fontSelectValue = [
  6, 8, 10, 12, 14, 16, 18, 20, 23, 26, 30, 34, 38, 44, 50, 58, 66, 74, 82, 90, 98, 114, 138, 162
]
