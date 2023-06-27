import i18n from '@/i18n'
import { IGroup, IParagraph, ISpan, ISpanStyle, IText, ITmp } from '@/interfaces/layer'
import { ISelection } from '@/interfaces/text'
import store from '@/store'
import text, { ITextState } from '@/store/text/index'
import { LayerType } from '@/store/types'
import logUtils from '@/utils/logUtils'
import _ from 'lodash'
import { nextTick } from 'vue'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import textEffectUtils from './textEffectUtils'
import textUtils from './textUtils'
import tiptapUtils from './tiptapUtils'

const fontPropsMap: { [key: string]: string } = {
  fontSize: 'size',
  fontFamily: 'font',
  bold: 'weight',
  italic: 'style',
  underline: 'decoration',
  color: 'color',
  lineHeight: 'lineHeight',
  fontSpacing: 'fontSpacing',
  textAlign: 'align',
  type: 'type',
  assetId: 'assetId',
  userId: 'userId'
}

enum textPropType {
  paragraph,
  span,
  block
}

class TextPropUtils {
  get pageIndex(): number { return store.getters.getCurrSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrTextProps(): { [key: string]: number | boolean | string } { return (text.state as any).props }
  get getCurrSel(): { start: ISelection, end: ISelection } { return (text.state as any).sel }
  get getTextState() { return text.state as ITextState }
  get getCurrLayer() { return store.getters.getLayer(this.pageIndex, this.layerIndex) }
  get getTextInfo(): { config: IText | IGroup, layerIndex: number, subLayerIndex?: number } {
    return (text.state as any).currTextInfo
  }

  propTypeSorter(propName: string): textPropType {
    if (propName.includes('vertical')) {
      return textPropType.block
    }
    if (propName.includes('text-align') || propName.includes('height')) {
      return textPropType.paragraph
    }
    return textPropType.span
  }

  onPropertyClick(propName: string, value?: string | number, selStart = this.getCurrSel.start, selEnd = this.getCurrSel.end) {
    const currLayer = this.getCurrLayer
    const { layerIndex, subLayerIndex, config } = this.getTextInfo
    if (!currLayer) return

    if (currLayer.type === 'group' || currLayer.type === 'tmp') {
      switch (this.propTypeSorter(propName)) {
        case textPropType.block: {
          const groupLayer = currLayer
          if (typeof subLayerIndex === 'undefined') {
            for (let i = 0; i < groupLayer.layers.length; i++) {
              if (groupLayer.layers[i].type === 'text') {
                this.blockPropertyHandler(propName, value, i)
                textUtils.updateGroupLayerSize(layerUtils.pageIndex, layerIndex, i)
              }
            }
          } else {
            this.blockPropertyHandler(propName, value, subLayerIndex)
            textUtils.updateGroupLayerSize(layerUtils.pageIndex, layerIndex, subLayerIndex)
          }
          break
        }
        case textPropType.span: {
          this.groupHandler(propName, value, selStart, selEnd, layerIndex, subLayerIndex)
        }
      }
    }
    if (currLayer.type === 'text') {
      switch (this.propTypeSorter(propName)) {
        case textPropType.block:
          this.blockPropertyHandler(propName, value)
          break
        case textPropType.span: {
          const prop = this.propIndicator(selStart, selEnd, propName, value || '')
          const newConfig = this.spanPropertyHandler(propName, prop, selStart, selEnd, config as IText)
          layerUtils.updateLayerProps(layerUtils.pageIndex, layerIndex, { paragraphs: newConfig.paragraphs })
          if (textUtils.isSel(selEnd)) {
            nextTick(() => textUtils.focus(this.getCurrSel.start, this.getCurrSel.end))
          } else {
            setTimeout(() => textUtils.focus(this.getCurrSel.start, this.getCurrSel.end), 0)
          }
        }
      }
    }
  }

  blockPropertyHandler(propName: string, value?: string | number, tmpLayerIndex?: number) {
    const updateTextStyles = (styles: { [key: string]: string | number | boolean }) => {
      layerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, styles)
    }
    const updateTextParagraphs = (paragraphs: IParagraph[]) => {
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { paragraphs })
    }
    const updateSelectedLayersStyles = (styles: { [key: string]: string | number | boolean }) => {
      this.updateSelectedLayersStyles(styles, tmpLayerIndex ?? NaN)
    }
    const updateSelectedLayersParagraphs = (paragraphs: IParagraph[]) => {
      this.updateSelectedLayersParagraphs(paragraphs, tmpLayerIndex ?? NaN)
    }
    const handler = typeof tmpLayerIndex === 'undefined' ? updateTextStyles : updateSelectedLayersStyles
    const paragraphHandler = typeof tmpLayerIndex === 'undefined' ? updateTextParagraphs : updateSelectedLayersParagraphs
    switch (propName) {
      case 'font-vertical': {
        const targetIsVertical = !!value
        const targetWritingMode = targetIsVertical ? 'vertical-rl' : 'initial'
        const config = (typeof tmpLayerIndex === 'undefined' ? this.getCurrLayer : this.getCurrLayer.layers[tmpLayerIndex]) as IText
        const writingMode = config.styles.writingMode.includes('vertical') ? 'vertical-rl' : 'initial'
        if (targetIsVertical) {
          const paragraphs = generalUtils.deepCopy(config.paragraphs)
          this.removeInvalidStyles(paragraphs, targetIsVertical, config.isCompensated)
          paragraphHandler(paragraphs)
        }
        handler({ writingMode: targetWritingMode })
        if (typeof tmpLayerIndex === 'undefined' && writingMode !== targetWritingMode) {
          const textHW = textUtils.getTextHW(config, config.widthLimit)
          layerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width: textHW.width, height: textHW.height })
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { spanDataList: textHW.spanDataList })
          // @TODO: need to reallocate position of each layer
        }
        this.updateTextPropsState({ isVertical: targetIsVertical, decoration: 'none', style: 'normal' })
        tiptapUtils.updateHtml()
      }
    }
  }

  removeInvalidStyles(
    paragraphs: IParagraph[], isVertical: boolean, isCompensated?: boolean, {
      pHandler, spanHandler, pPostHandler, spanPostHandler
    }: {
      pHandler?: (paragraph: IParagraph) => void, spanHandler?: (span: ISpan) => void,
      pPostHandler?: (paragraph: IParagraph) => void, spanPostHandler?: (span: ISpan) => void
    } = {}
  ) {
    const minimumFontSize = this.getMinimumFontSize()
    paragraphs.forEach((p) => {
      pHandler && pHandler(p)
      if (isVertical && p.spanStyle) {
        const pStyle = tiptapUtils.generateSpanStyle(p.spanStyle as string)
        if (pStyle.style === 'italic') {
          pStyle.style = 'normal'
        }
        if (pStyle.decoration === 'underline') {
          pStyle.decoration = 'none'
        }
        if (typeof pStyle.size === 'string') {
          pStyle.size = parseFloat(pStyle.size)
        }
        if (pStyle.size < minimumFontSize && !isCompensated) {
          pStyle.size = minimumFontSize
        }
        p.spanStyle = tiptapUtils.textStyles(pStyle)
      }
      const paragraphStyles = p.styles
      if (typeof paragraphStyles.size === 'string') {
        paragraphStyles.size = parseFloat(paragraphStyles.size)
      }
      if (paragraphStyles.size < minimumFontSize && !isCompensated) {
        paragraphStyles.size = minimumFontSize
      }
      for (const span of p.spans) {
        spanHandler && spanHandler(span)
        if (isVertical && span.styles.style === 'italic') {
          span.styles.style = 'normal'
        }
        if (isVertical && span.styles.decoration === 'underline') {
          span.styles.decoration = 'none'
        }
        span.styles.font = paragraphStyles.font as string
        span.styles.type = paragraphStyles.type as string
        span.styles.userId = paragraphStyles.userId as string
        span.styles.assetId = paragraphStyles.assetId as string
        span.styles.fontUrl = paragraphStyles.fontUrl as string
        if (typeof span.styles.size === 'string') {
          span.styles.size = parseFloat(span.styles.size)
        }
        if (span.styles.size < minimumFontSize && !isCompensated) {
          span.styles.size = minimumFontSize
        }
        spanPostHandler && spanPostHandler(span)
      }
      pPostHandler && pPostHandler(p)
    })
  }

  groupHandler(propName: string, value?: string | number, selStart = textUtils.getNullSel(), selEnd = textUtils.getNullSel(),
    layerIndex?: number, subLayerIndex?: number) {
    let flag = false
    let propValue: number | string | undefined
    const groupLayer = this.getCurrLayer
    layerIndex = layerIndex ?? (layerUtils.layerIndex as number)

    const selHandler = (config: IText): { start: ISelection, end: ISelection } => {
      if (textUtils.isSel(selStart)) {
        return {
          start: { ...selStart },
          end: { ...selEnd }
        }
      } else {
        return textUtils.selectAll(config)
      }
    }

    if (typeof subLayerIndex === 'undefined') {
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
            }, propName, value ?? '', tmpLayer
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

      const i = Object.keys(fontPropsMap).indexOf(propName)
      const v = Object.values(fontPropsMap)[i]
      const prop = { [v]: propValue as string | number }

      for (let i = 0; i < groupLayer.layers.length; i++) {
        const config = groupLayer.layers[i]
        if (config.type === 'text') {
          const { start, end } = textUtils.selectAll(config)
          const newConfig = this.spanPropertyHandler(propName, prop, start, end, config)
          layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, i, { paragraphs: newConfig.paragraphs })
        }
      }
    }
    if (typeof subLayerIndex === 'number') {
      const config = (layerUtils.getLayer(this.pageIndex, layerIndex) as IGroup).layers[subLayerIndex] as IText
      const { start, end } = selHandler(config)
      const prop = this.propIndicator(start, end, propName, value ?? '', config)
      const newConfig = this.spanPropertyHandler(propName, prop, start, end, config)
      layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, subLayerIndex, { paragraphs: newConfig.paragraphs })
      // nextTick(() => textUtils.focus(this.getCurrSel.start, this.getCurrSel.end, subLayerIndex))
      textUtils.focus(this.getCurrSel.start, this.getCurrSel.end, subLayerIndex)
    }
  }

  spanPropertyHandler(propName: string, prop: { [key: string]: string | number }, start: ISelection, end: ISelection, _config: IText): IText {
    const config = generalUtils.deepCopy(_config) as IText
    // let isStartContainerDivided = true
    if (textUtils.isSel(end)) {
      this.rangedSelHandler(start, end, config, prop)
      // isStartContainerDivided = this.rangedSelHandler(start, end, config, prop)
      if (propName === 'fontFamily') {
        for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
          config.paragraphs[pidx].styles.font = config.paragraphs[pidx].spans[0].styles.font
          config.paragraphs[pidx].styles.type = config.paragraphs[pidx].spans[0].styles.type
          config.paragraphs[pidx].styles.userId = config.paragraphs[pidx].spans[0].styles.userId
          config.paragraphs[pidx].styles.assetId = config.paragraphs[pidx].spans[0].styles.assetId
          config.paragraphs[pidx].styles.fontUrl = config.paragraphs[pidx].spans[0].styles.fontUrl
        }
      }
    }
    if (!textUtils.isSel(end)) {
      const styles = config.paragraphs[start.pIndex].spans[start.sIndex].styles
      // this.noRangedHandler(styles, propName, prop[propName], config)
      Object.assign(styles, prop)
      if (propName !== 'fontSize') {
        // [start, end] = this.spanMerger(config.paragraphs, start, end)
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

    // @ Obsolete code
    // if (textUtils.isSel(end)) {
    //   if (isStartContainerDivided) {
    //     if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
    //       start.sIndex++
    //       start.offset = 0
    //       end.sIndex++
    //       end.offset = config.paragraphs[end.pIndex].spans[end.sIndex].text.length
    //     } else {
    //       start.sIndex++
    //     }
    //   }
    // } else {
    //   if (propName === 'fontFamily' || propName === 'fontSize') {
    //     if (textUtils.isSel(start))
    //     start.offset = 0
    //     Object.assign(end, start)
    //     end.offset = config.paragraphs[start.pIndex].spans[start.sIndex].text.length
    //   } else {
    //     end = textUtils.getNullSel()
    //   }
    // }
    // textUtils.updateSelection(start, end)

    return config
  }

  spanParagraphPropertyHandler(propName: string, prop: { [key: string]: string | number }, start: ISelection, end: ISelection, _config: IText): IText {
    const config = generalUtils.deepCopy(_config) as IText
    const spIndex = start.pIndex
    const epIndex = end.pIndex
    for (let pIndex = spIndex; pIndex <= epIndex; pIndex++) {
      const paragraph = config.paragraphs[pIndex]
      Object.assign(paragraph.styles, prop)
      if (paragraph.spanStyle) {
        const spanStyle = tiptapUtils.generateSpanStyle(paragraph.spanStyle as string)
        Object.assign(spanStyle, prop)
        paragraph.spanStyle = tiptapUtils.textStyles(spanStyle)
      }
      for (const span of paragraph.spans) {
        Object.assign(span.styles, prop)
      }
    }
    return config
  }

  rangedSelHandler(start: ISelection, end: ISelection, config: IText, prop: { [key: string]: string | number }): boolean {
    let isStartContainerDivided = true
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
    return isStartContainerDivided
  }

  // /**
  //  *
  //  * @param styles  The styles of span. This para is directly mutated in this function.
  //  * @param propName
  //  * @param value Specify the value of the target prop.
  //  */
  // noRangedHandler(styles: ISpanStyle, propName: string, value?: number | string, config?: IText) {
  //   let prop = {} as { [key: string]: string | number }
  //   switch (propName) {
  //     case 'fontSize':
  //       styles.size = value as number
  //       return
  //     case 'font':
  //     case 'fontFamily':
  //       styles.font = value as string
  //       return
  //     case 'color':
  //       prop = { color: value as string }
  //       break
  //     case 'bold': {
  //       if (this.getCurrTextProps?.weight === 'bold') {
  //         prop = { weight: 'normal' }
  //       } else {
  //         prop = { weight: 'bold' }
  //       }
  //       break
  //     }
  //     case 'italic': {
  //       if (this.getCurrTextProps?.style === 'italic') {
  //         prop = { style: 'normal' }
  //       } else {
  //         prop = { style: 'italic' }
  //       }
  //       break
  //     }
  //     case 'underline': {
  //       if (this.getCurrTextProps?.decoration === 'underline') {
  //         prop = { decoration: 'none' }
  //       } else {
  //         prop = { decoration: 'underline' }
  //       }
  //     }
  //   }
  //   this.updateTextPropsState(prop)

  //   if (['color', 'italic', 'underline', 'bold'].includes(propName)) {
  //     // TODO with subController
  //     const paragraphs = generalUtils.deepCopy(this.getTextInfo.config.paragraphs) as IParagraph[]
  //     const { pIndex, sIndex, offset } = this.getCurrSel.start

  //     paragraphs[pIndex].spans.splice(sIndex + 1, 0, {
  //       text: '',
  //       styles: {
  //         ...styles,
  //         ...prop
  //       }
  //     })
  //     paragraphs[pIndex].spans.splice(sIndex + 2, 0, {
  //       text: paragraphs[pIndex].spans[sIndex].text.substr(offset),
  //       styles: { ...styles }
  //     })
  //     paragraphs[pIndex].spans[sIndex].text = paragraphs[pIndex].spans[sIndex].text.substring(0, offset)
  //     Object.assign(config?.paragraphs as IParagraph[], paragraphs)
  //     textUtils.updateSelection({ pIndex, sIndex: sIndex + 1, offset: 1 }, textUtils.getNullSel())
  //   }
  // }

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

  // spanMerger(paragraphs: IParagraph[], start: ISelection, end: ISelection): [ISelection, ISelection] {
  //   if (!textUtils.isSel(end)) return [start, end]
  //   let isStartMerged = false
  //   let isEndMerged = false
  //   if (start.sIndex - 1 >= 0) {
  //     const preSpan = paragraphs[start.pIndex].spans[start.sIndex - 1]
  //     const span = paragraphs[start.pIndex].spans[start.sIndex]
  //     if (this.isSameSpanStyles(span.styles, preSpan.styles)) {
  //       isStartMerged = true
  //       start.offset = preSpan.text.length
  //       preSpan.text += span.text
  //       paragraphs[start.pIndex].spans.splice(start.sIndex, 1)
  //       start.sIndex -= 1
  //       if (start.pIndex === end.pIndex) {
  //         end.sIndex -= 1
  //       }
  //     }
  //   }
  //   for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
  //     const p = paragraphs[pidx]
  //     const preSpanStyle = {} as ISpanStyle
  //     for (let sidx = 0; sidx < p.spans.length; sidx++) {
  //       if (pidx === end.pIndex && sidx >= end.sIndex) {
  //         break
  //       }
  //       const span = p.spans[sidx]
  //       if (this.isSameSpanStyles(span.styles, preSpanStyle)) {
  //         p.spans[sidx - 1].text += span.text
  //         if (pidx === end.pIndex) {
  //           end.sIndex -= 1
  //         }
  //         paragraphs[pidx].spans.splice(sidx, 1)
  //         sidx -= 1
  //         end.offset = paragraphs[end.pIndex].spans[end.sIndex].text.length
  //       }
  //       Object.assign(preSpanStyle, paragraphs[pidx].spans[sidx].styles)
  //     }
  //   }
  //   if (end.sIndex + 1 < paragraphs[end.pIndex].spans.length) {
  //     const preSpan = paragraphs[end.pIndex].spans[end.sIndex]
  //     const span = paragraphs[end.pIndex].spans[end.sIndex + 1]
  //     if (this.isSameSpanStyles(span.styles, preSpan.styles)) {
  //       isEndMerged = true
  //       if (start.pIndex === end.pIndex && start.sIndex === end.sIndex) {
  //         end.offset = preSpan.text.length
  //       }
  //       preSpan.text += span.text
  //       paragraphs[end.pIndex].spans.splice(end.sIndex + 1, 1)
  //     }
  //   }

  //   if (!isStartMerged && !isEndMerged) {
  //     start.offset = 0
  //     end.offset = paragraphs[end.pIndex].spans[end.sIndex].text.length
  //   } else if (isStartMerged && !isEndMerged) {
  //     end.offset = paragraphs[end.pIndex].spans[end.sIndex].text.length
  //   }
  //   return [start, end]
  // }

  propCompare(propName: string, propValue1: string | number | undefined, propValue2: string | number | undefined): boolean {
    if ((propName === 'fontSize' && typeof propValue1 === 'number' && typeof propValue2 === 'number')) {
      return _.round(propValue1, 2) === _.round(propValue2, 2)
    } else {
      return propValue1 === propValue2
    }
  }

  /**
   * @param propName A string refers to the desired props: fontSize/fontFamily/color/weight/style...
   * @returns The desired props value accord to the current selection range.
   */
  propReader(propName: string): string | number | undefined {
    const { subLayerIdx, getCurrLayer: currLayer } = layerUtils
    switch (currLayer.type) {
      case 'text': {
        return this.propReadOfLayer(propName, currLayer as IText)
      }
      case 'group': {
        const primaryScale = currLayer.styles.scale
        try {
          if (subLayerIdx === -1) {
            let propBuff: number | string | undefined = 'init'
            for (let i = 0; i < (currLayer as IGroup).layers.length; i++) {
              if ((currLayer as IGroup).layers[i].type === 'text') {
                const tmpLayer = (currLayer as IGroup).layers[i] as IText
                if (['italic', 'underline'].includes(propName) && tmpLayer.styles.writingMode.includes('vertical')) {
                  continue
                }
                const propValue = this.propReadOfLayer(propName, tmpLayer, true)
                if (propBuff === 'init') {
                  propBuff = propValue
                } else if (!this.propCompare(propName, propBuff, propValue)) {
                  return undefined
                }
              }
            }
            return (propName === 'fontSize' && typeof propBuff === 'number') ? propBuff * primaryScale : propBuff
          } else {
            const layer = (currLayer as IGroup).layers[subLayerIdx]
            const propBuff = this.propReadOfLayer(propName, layer as IText)
            return (propName === 'fontSize' && typeof propBuff === 'number') ? propBuff * primaryScale : propBuff
          }
        } catch (error) {
          logUtils.setLogForError(error as Error)
        }
        break
      }
      case 'tmp': {
        const tmpLayerGroup = this.getCurrLayer as ITmp
        const primaryScale = tmpLayerGroup.styles.scale
        let propBuff: number | string | undefined
        for (let i = 0; i < tmpLayerGroup.layers.length; i++) {
          if (tmpLayerGroup.layers[i].type === 'text') {
            const tmpLayer = tmpLayerGroup.layers[i] as IText
            if (['italic', 'underline'].includes(propName) && tmpLayer.styles.writingMode.includes('vertical')) {
              continue
            }
            const propValue = this.propReadOfLayer(propName, tmpLayer, true)
            if (typeof propBuff === 'undefined') {
              propBuff = propValue
            } else if (!this.propCompare(propName, propBuff, propValue)) {
              return undefined
            }
          }
        }
        return (propName === 'fontSize' && typeof propBuff === 'number') ? propBuff * primaryScale : propBuff
      }
    }
  }

  propReadOfLayer(_prop: string, layer: IText, allText = false) {
    let res
    const prop = fontPropsMap[_prop]
    const scale = layer.styles.scale
    const isFontSize = prop === 'size'
    if (!allText) {
      tiptapUtils.agent(editor => {
        let isMulti = false
        const selection = editor.view.state.selection
        const from = selection.$from
        const to = selection.$to
        const startPIndex = from.index(0)
        let startSIndex = from.index(1)
        const endPIndex = to.index(0)
        let endSIndex = to.index(1)
        const tiptapJSON = editor.getJSON()
        const paragraphs = tiptapJSON.content ?? []
        let origin

        if (selection.empty) {
          if (from.textOffset === 0 && startSIndex !== 0) {
            startSIndex--
          }
        } else {
          if (to.textOffset === 0 && endSIndex !== 0) {
            endSIndex--
          }
        }

        if (['fontSpacing', 'lineHeight', 'align'].includes(prop)) {
          origin = (paragraphs[startPIndex].attrs ?? {})[prop]
        } else {
          let startStyles: any = {}
          const startP = paragraphs[startPIndex].content
          if (startP) {
            let sIndex = startSIndex
            if (sIndex >= startP.length) sIndex = startP.length - 1
            startStyles = startP[sIndex].marks?.[0]?.attrs ?? {}
          }
          if (Object.keys(startStyles).length === 0) {
            if (editor.getAttributes('paragraph').spanStyle) {
              startStyles = tiptapUtils.makeSpanStyle(editor.getAttributes('paragraph'))
            } else {
              startStyles = tiptapUtils.generateSpanStyle(editor.storage.nuTextStyle.spanStyle)
            }
          }

          origin = startStyles[prop]
        }

        if (selection.empty) {
          res = origin
          return
        }

        let tempStartSIndex = startSIndex
        let tempEndSIndex
        for (let i = startPIndex; i <= endPIndex; i++) {
          if (['fontSpacing', 'lineHeight', 'align'].includes(prop)) { // paragraph props
            if (!this.propCompare(_prop, origin, (paragraphs[i].attrs ?? {})[prop])) {
              isMulti = true
              break
            }
            continue
          }

          const spans = paragraphs[i].content ?? []
          if (i === endPIndex) {
            tempEndSIndex = endSIndex
          } else {
            tempEndSIndex = spans.length - 1
          }
          if (spans.length > 0) {
            for (let j = tempStartSIndex; j <= tempEndSIndex && j < spans.length; j++) {
              if (!this.propCompare(_prop, origin, (spans[j].marks?.[0]?.attrs ?? {})[prop])) {
                isMulti = true
                break
              }
            }
          } else {
            if (!this.propCompare(_prop, origin, (paragraphs[i].attrs ?? {})[prop])) {
              isMulti = true
              break
            }
          }
          if (isMulti) break
          tempStartSIndex = 0
        }
        res = isMulti ? undefined : origin
      })
    } else {
      return this.noEditorRead(_prop, layer)
    }
    if (isFontSize && res !== undefined) {
      res = res * scale
    }
    return res
  }

  noEditorRead(prop: string, layer?: IText) {
    const config = generalUtils.deepCopy(layer ?? this.getCurrLayer) as IText
    const scale = config.styles.scale
    const isFontSize = prop === 'fontSize'
    const start = {
      pIndex: 0,
      sIndex: 0,
      offset: 0
    }
    const pLeng = config.paragraphs.length
    const sLeng = config.paragraphs[pLeng - 1].spans.length
    const end = {
      pIndex: pLeng - 1,
      sIndex: sLeng - 1,
      offset: config.paragraphs[pLeng - 1].spans[sLeng - 1].text.length
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

      // For paragraphs props
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

      // For spans props
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
    return isMulti ? undefined : ((isFontSize && typeof origin === 'number') ? origin * scale : origin)
  }

  fontSizeAllModifier(modifier: (size: number, reverse?: boolean) => number) {
    const currLayer = layerUtils.getCurrLayer
    if (currLayer.type === 'text' || (['tmp', 'group'].includes(currLayer.type) && layerUtils.subLayerIdx !== -1)) {
      tiptapUtils.agent(editor => {
        const selection = editor.view.state.selection
        if (selection.empty) {
          let scale = currLayer.styles.scale
          if (layerUtils.subLayerIdx !== -1) {
            scale *= (currLayer as IGroup).layers[layerUtils.subLayerIdx].styles.scale
          }
          const sAttrs = tiptapUtils.generateSpanStyle(editor.storage.nuTextStyle.spanStyle)
          sAttrs.size = modifier(sAttrs.size)
          editor.storage.nuTextStyle.spanStyle = tiptapUtils.textStyles(sAttrs)
          editor.chain().focus().setMark('textStyle', sAttrs).run()
          this.updateTextPropsState({ fontSize: sAttrs.size * scale })
        } else {
          const from = selection.$from
          const to = selection.$to
          const startPIndex = from.index(0)
          const startSIndex = from.index(1)
          const endPIndex = to.index(0)
          let endSIndex = to.index(1)
          if (to.textOffset === 0 && endSIndex !== 0) {
            endSIndex--
          }

          const tiptapJSON = editor.getJSON()
          const paragraphs = tiptapJSON.content ?? []

          let tempStartSIndex = startSIndex
          let tempEndSIndex
          for (let i = startPIndex; i <= endPIndex; i++) {
            let startSplit = false
            const spans = paragraphs[i].content ?? []
            if (i === endPIndex) {
              tempEndSIndex = endSIndex
            } else {
              tempEndSIndex = spans.length - 1
            }
            if (spans.length > 0) {
              const newSpans = generalUtils.deepCopy(spans) as any[]
              for (let j = tempStartSIndex; j <= tempEndSIndex && j < spans.length; j++) {
                let splitHandled = false
                let splitLength = 0
                if (i === startPIndex && j === startSIndex && from.textOffset !== 0) {
                  startSplit = true
                  const itemBefore = generalUtils.deepCopy(spans[j])
                  const itemAfter = generalUtils.deepCopy(itemBefore)
                  const text = itemBefore.text
                  const textBefore = (text as string).substring(0, from.textOffset)
                  itemBefore.text = textBefore
                  splitLength = textBefore.length
                  const textAfter = (text as string).substring(from.textOffset)
                  itemAfter.text = textAfter
                  const spanAttrsAfter = itemAfter.marks?.[0]?.attrs
                  if (spanAttrsAfter) {
                    spanAttrsAfter.size = modifier(spanAttrsAfter.size)
                  }
                  newSpans.splice(j, 1, itemBefore, itemAfter)
                  splitHandled = true
                }
                if (i === endPIndex && j === endSIndex && to.textOffset !== 0) {
                  const realSIndex = startSplit ? j + 1 : j
                  const itemBefore = generalUtils.deepCopy(newSpans[realSIndex])
                  const itemAfter = generalUtils.deepCopy(itemBefore)
                  const text = itemBefore.text
                  const textBefore = text.substring(0, to.textOffset - splitLength)
                  itemBefore.text = textBefore
                  const spanAttrsBefore = itemBefore.marks?.[0]?.attrs
                  if (spanAttrsBefore && !(startSplit && endSIndex === startSIndex)) { // only when this span has not been startSplit
                    spanAttrsBefore.size = modifier(spanAttrsBefore.size)
                  }
                  const textAfter = text.substring(to.textOffset - splitLength)
                  itemAfter.text = textAfter
                  const spanAttrsAfter = itemAfter.marks?.[0]?.attrs
                  if (spanAttrsAfter && startSplit && endSIndex === startSIndex) { // if this span has been startSplit
                    spanAttrsAfter.size = modifier(spanAttrsAfter.size, true)
                  }
                  newSpans.splice(realSIndex, 1, itemBefore, itemAfter)
                  splitHandled = true
                }
                if (!splitHandled) {
                  const realSIndex = startSplit ? j + 1 : j
                  const spanAttrs = newSpans[realSIndex].marks?.[0]?.attrs
                  if (spanAttrs) {
                    spanAttrs.size = modifier(spanAttrs.size)
                  }
                }
              }
              tempStartSIndex = 0
              paragraphs[i].content = newSpans
            } else {
              const pAttrs = paragraphs[i].attrs ?? {}
              pAttrs.size = modifier(pAttrs.size)
            }
          }
          editor.chain().setContent(tiptapUtils.toJSON(tiptapUtils.toIParagraph(tiptapJSON).paragraphs)).focus().selectPrevious().run()
          // nextTick removed becuz seems not required and messing up the update timing
          // but needs attension for if there are problems occurring after this and review would be needed for the necessity
          tiptapUtils.forceUpdate()
          this.updateTextPropsState()
        }
      })
    } else if (['group', 'tmp'].includes(currLayer.type)) {
      (currLayer as IGroup | ITmp).layers
        .forEach((l, idx) => {
          l.type === 'text' && this.propAppliedAllText(layerUtils.layerIndex, idx, 'size', 0, modifier)
          l.type === 'text' && textUtils.updateGroupLayerSizeByShape(layerUtils.pageIndex, this.layerIndex, idx)
        })
      this.updateTextPropsState()
    }
  }

  fontSizeSteppingCore(step: number, byLayer = false, layerIndex = this.layerIndex, subLayerIndex = -1) {
    const modifier = (size: number, reverse = false) => {
      return reverse ? size - step : size + step
    }
    if (byLayer) {
      this.propAppliedAllText(layerIndex, subLayerIndex, 'size', 0, modifier)
      tiptapUtils.updateHtml()
    } else {
      this.fontSizeAllModifier(modifier)
    }
  }

  fontSizeStepping(step: number) {
    const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
    if (currLayer.type === LayerType.text || subLayerIdx !== -1) {
      let scale = currLayer.styles.scale
      if (subLayerIdx !== -1) {
        scale *= (currLayer as IGroup).layers[subLayerIdx].styles.scale
      }
      let targetStep = step / scale
      if (step < 0) {
        const baseFontSize = this.getBaseFontSizeOfSelection()
        const compensation = this.getScaleCompensation(baseFontSize + targetStep)
        if (compensation.needCompensation) {
          this.fontSizeGaining(1 / compensation.scale, true, layerIndex, subLayerIdx)
          this.applyScaleCompensation(compensation.scale, currLayer as IText | IGroup, pageIndex, layerIndex, subLayerIdx)
          targetStep /= compensation.scale
        }
      }
      this.fontSizeSteppingCore(targetStep)
    } else if (currLayer.type === LayerType.group || currLayer.type === LayerType.tmp) {
      const primaryScale = currLayer.styles.scale
      for (const [sIdx, subLayer] of currLayer.layers.entries()) {
        if (subLayer.type === LayerType.text) {
          const scale = primaryScale * subLayer.styles.scale
          let targetStep = step / scale
          if (step < 0) {
            const baseFontSize = this.getBaseFontSizeOfLayer(subLayer)
            const compensation = this.getScaleCompensation(baseFontSize + targetStep)
            if (compensation.needCompensation) {
              this.fontSizeGaining(1 / compensation.scale, true, layerIndex, sIdx)
              this.applyScaleCompensation(compensation.scale, currLayer, pageIndex, layerIndex, sIdx)
              targetStep /= compensation.scale
            }
          }
          this.fontSizeSteppingCore(targetStep, true, layerIndex, sIdx)
          textUtils.updateTextLayerSizeByShape(layerUtils.pageIndex, layerIndex, sIdx)
        }
      }
      textUtils.updateGroupLayerSize(layerUtils.pageIndex, layerIndex)
      this.updateTextPropsState()
    }
  }

  fontSizeGaining(gain: number, byLayer = false, layerIndex = this.layerIndex, subLayerIndex = -1) {
    const modifier = (size: number, reverse = false) => {
      return reverse ? size / gain : size * gain
    }
    if (byLayer) {
      this.propAppliedAllText(layerIndex, subLayerIndex, 'size', 0, modifier)
      tiptapUtils.updateHtml()
    } else {
      this.fontSizeAllModifier(modifier)
    }
  }

  getBaseFontSizeOfSelection(): number {
    let baseFontSize = Number.MAX_SAFE_INTEGER
    tiptapUtils.agent(editor => {
      const selection = editor.view.state.selection
      if (selection.empty) {
        const sAttrs = tiptapUtils.generateSpanStyle(editor.storage.nuTextStyle.spanStyle)
        baseFontSize = sAttrs.size
      } else {
        const from = selection.$from
        const to = selection.$to
        const startPIndex = from.index(0)
        const startSIndex = from.index(1)
        const endPIndex = to.index(0)
        let endSIndex = to.index(1)
        if (to.textOffset === 0 && endSIndex !== 0) {
          endSIndex--
        }

        const tiptapJSON = editor.getJSON()
        const paragraphs = tiptapJSON.content ?? []

        let tempStartSIndex = startSIndex
        let tempEndSIndex
        for (let i = startPIndex; i <= endPIndex; i++) {
          const spans = paragraphs[i].content ?? []
          if (i === endPIndex) {
            tempEndSIndex = endSIndex
          } else {
            tempEndSIndex = spans.length - 1
          }
          if (spans.length > 0) {
            for (let j = tempStartSIndex; j <= tempEndSIndex && j < spans.length; j++) {
              const sAttrs = spans[j].marks?.[0]?.attrs ?? {}
              if (sAttrs.size < baseFontSize) {
                baseFontSize = sAttrs.size
              }
            }
            tempStartSIndex = 0
          } else {
            const pAttrs = paragraphs[i].attrs ?? {}
            if (pAttrs.size < baseFontSize) {
              baseFontSize = pAttrs.size
            }
          }
        }
      }
    })
    return baseFontSize
  }

  getBaseFontSizeOfParagraphs(paragraphs: IParagraph[]): number {
    let baseFontSize = Number.MAX_SAFE_INTEGER
    for (const paragraph of paragraphs) {
      for (const span of paragraph.spans) {
        if (span.styles.size < baseFontSize) {
          baseFontSize = span.styles.size
        }
      }
    }
    return baseFontSize
  }

  getBaseFontSizeOfLayer(layer: IText): number {
    return this.getBaseFontSizeOfParagraphs(layer.paragraphs)
  }

  propAppliedParagraphs(paragraphs: IParagraph[], prop: 'size' | 'fontSpacing' | 'lineHeight', payload: number, modifier?: (propValue: number) => number): IParagraph[] {
    paragraphs = generalUtils.deepCopy(paragraphs) as IParagraph[]
    paragraphs.forEach(p => {
      if (modifier) {
        Object.prototype.hasOwnProperty.call(p.styles, prop) && typeof p.styles[prop] === 'number' && ((p.styles[prop] as number) = modifier((p.styles[prop] as number)))
      } else {
        Object.prototype.hasOwnProperty.call(p.styles, prop) && typeof p.styles[prop] === 'number' && ((p.styles[prop] as number) = payload)
      }
      p.spans.forEach(s => {
        if (modifier) {
          Object.prototype.hasOwnProperty.call(s.styles, prop) && typeof s.styles[prop] === 'number' && ((s.styles[prop] as number) = modifier((s.styles[prop] as number)))
        } else {
          Object.prototype.hasOwnProperty.call(s.styles, prop) && typeof s.styles[prop] === 'number' && ((s.styles[prop] as number) = payload)
        }
      })
    })
    return paragraphs
  }

  propAppliedAllText(layerIndex: number, subLayerIndex: number, prop: 'size' | 'fontSpacing' | 'lineHeight', payload: number, modifier?: (propValue: number) => number) {
    const primaryLayer = (layerUtils.getLayer(layerUtils.pageIndex, layerIndex) as IGroup | IText | ITmp)
    let targetLayer: IText
    if (subLayerIndex === -1 && primaryLayer.type === 'text') {
      targetLayer = primaryLayer
    } else if ((primaryLayer.type === 'group' || primaryLayer.type === 'tmp') && primaryLayer.layers[subLayerIndex].type === 'text') {
      targetLayer = primaryLayer.layers[subLayerIndex] as IText
    } else {
      return
    }
    const paragraphs = this.propAppliedParagraphs(targetLayer.paragraphs, prop, payload, modifier)
    layerUtils.updateLayerProps(layerUtils.pageIndex, layerIndex, { paragraphs }, subLayerIndex)
  }

  propIndicator(start: { pIndex: number, sIndex: number }, end: { pIndex: number, sIndex: number }, propName: string, value: string | number, tmpLayer?: IText): { [key: string]: string | number } {
    const prop: { [key: string]: string | number } = {}
    const config = generalUtils.deepCopy(tmpLayer ?? this.getCurrLayer) as IText

    if (!textUtils.isSel(end)) {
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
      type: span ? span.styles.type : 'public',
      userId: span ? span.styles.userId : '',
      assetId: span ? span.styles.assetId : '',
      fontUrl: span ? span.styles.fontUrl : '',
      weight: span ? span.styles.weight : '',
      size: span ? span.styles.size : NaN,
      decoration: span ? span.styles.decoration : '',
      style: span ? span.styles.style : '',
      color: span ? span.styles.color : ''
    }
    return Object.assign(spanStyles, prop)
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
      'type',
      'assetId',
      'userId',
      'color',
      'weight',
      'style',
      'decoration',
      'isVertical'
    ]
    const propValues: { [key: string]: string | number | boolean | undefined } = {}
    props.forEach(k => {
      const v = this.updateTextPropState(k)
      propValues[k] = v
    })
    store.commit('text/UPDATE_props', propValues)
  }

  updateTextPropState(propName: string, toCommit = false) {
    const subLayerIdx = layerUtils.subLayerIdx
    const currLayer = this.getCurrLayer
    if (!layerUtils.isOfLayerType(currLayer, LayerType.text, subLayerIdx, true)) return
    let value
    switch (propName) {
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
        const font = this.propReader('fontFamily')
        // const font = this.getTextState.fontStore.find(font => font.face === this.propReader('fontFamily'))?.name
        value = typeof font === 'string' ? font : `_${i18n.global.t('NN0341')}`
        break
      }
      case 'type': {
        const type = this.propReader('type')
        value = typeof type === 'string' ? type : '--'
        break
      }
      case 'assetId': {
        const assetId = this.propReader('assetId')
        value = assetId ?? ''
        break
      }
      case 'userId': {
        const userId = this.propReader('userId')
        value = userId ?? ''
        break
      }
      case 'color': {
        value = typeof this.propReader('color') === 'string' ? (this.propReader('color') as string).toUpperCase() : '--'
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
        if (currLayer.type === 'text') {
          value = currLayer.styles.writingMode.includes('vertical')
        } else if (subLayerIdx !== -1 && currLayer.layers[subLayerIdx].type === 'text') {
          value = currLayer.layers[subLayerIdx].styles.writingMode.includes('vertical')
        } else { // tmp or group w/ subLayerIdx
          value = true
          for (let i = 0; i < currLayer.layers.length; i++) {
            if (currLayer.layers[i].type === 'text') {
              const tmpLayer = currLayer.layers[i] as IText
              value = value && tmpLayer.styles.writingMode.includes('vertical')
            }
          }
        }
        break
      }
    }

    if (toCommit) {
      store.commit('text/UPDATE_props', { [propName]: value })
    } else {
      return value
    }
  }

  updateSelectedLayersStyles(styles: { [key: string]: string | number | boolean }, layerIndex: number) {
    store.commit('UPDATE_selectedLayersStyles', {
      styles,
      layerIndex
    })
  }

  updateSelectedLayersParagraphs(paragraphs: IParagraph[], tmpLayerIndex: number) {
    store.commit('UPDATE_selectedTextParagraphs', {
      paragraphs,
      tmpLayerIndex
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

  applyPropsToAll(propType = 'span', prop: { [key: string]: string | boolean | number }, layerIndex = layerUtils.layerIndex, subLayerIdx = layerUtils.subLayerIdx) {
    const handler = (paragraphs: IParagraph[]) => {
      paragraphs
        .forEach(p => {
          if (propType.includes('paragraph')) {
            Object.assign(p.styles, prop)
            if (p.spanStyle) {
              const spanStyle = tiptapUtils.generateSpanStyle(p.spanStyle as string)
              Object.assign(spanStyle, prop)
              p.spanStyle = tiptapUtils.textStyles(spanStyle)
            }
          }
          if (propType.includes('span')) {
            p.spans.forEach(s => {
              Object.assign(s.styles, prop)
            })
          }
        })
    }

    const layer = layerUtils.getLayer(layerUtils.pageIndex, layerIndex)

    if (subLayerIdx !== -1 && layer.type === 'group') {
      const paragraphs = generalUtils.deepCopy((layer as IGroup).layers[subLayerIdx].paragraphs) as IParagraph[]
      handler(paragraphs)
      layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, subLayerIdx, { paragraphs })
      return
    }
    if (['tmp', 'group'].includes(layer.type)) {
      (layer as IGroup | ITmp).layers
        .forEach((l, idx) => {
          if (l.type === 'text') {
            const paragraphs = generalUtils.deepCopy(l.paragraphs) as IParagraph[]
            handler(paragraphs)
            layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, idx, { paragraphs })
          }
        })
      return
    }
    if (layer.type === 'text') {
      const paragraphs = generalUtils.deepCopy(layer.paragraphs) as IParagraph[]
      handler(paragraphs)
      layerUtils.updateLayerProps(layerUtils.pageIndex, layerIndex, { paragraphs })
    }
  }

  getMinimumFontSize(): number {
    const element = document.createElement('span')
    element.style.fontSize = '1px'
    element.style.position = 'fixed'
    element.style.top = '100%'
    element.style.left = '100%'
    document.body.appendChild(element)
    const res = parseInt(getComputedStyle(element).fontSize.replace('px', ''))
    document.body.removeChild(element)
    return res / 1.333333
  }

  getScaleCompensation(size: number): { scale: number, size: number, needCompensation: boolean } {
    const minimumFontSize = this.getMinimumFontSize()
    if (size < minimumFontSize) {
      return {
        size: minimumFontSize,
        scale: size / minimumFontSize,
        needCompensation: true
      }
    } else {
      return {
        size,
        scale: 1,
        needCompensation: false
      }
    }
  }

  applyScaleCompensation(compensationScale: number, currLayer: IText | IGroup | ITmp, pageIndex: number, layerIndex: number, subLayerIdx = -1) {
    if (currLayer.type === LayerType.text) {
      const scale = currLayer.styles.scale
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        scale: compensationScale * scale
      })
    } else if (currLayer.type === LayerType.group || currLayer.type === LayerType.tmp) {
      if (subLayerIdx === -1 || currLayer.layers[subLayerIdx].type !== LayerType.text) {
        throw new Error(`Only text layer is valid for applyScaleCompensation. subLayerIdx: ${subLayerIdx}, currLayer.layers[subLayerIdx]?.type: ${currLayer.layers[subLayerIdx]?.type}`)
      }
      const scale = currLayer.layers[subLayerIdx].styles.scale
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        scale: compensationScale * scale
      }, subLayerIdx)
    }
  }

  fontSizeHandler(value: number, toRecord = true) {
    const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
    if (currLayer.type === LayerType.text || subLayerIdx !== -1) {
      let targetLayer = currLayer
      let scale = currLayer.styles.scale
      if (subLayerIdx !== -1) {
        targetLayer = (currLayer as IGroup).layers[subLayerIdx]
        scale *= targetLayer.styles.scale
      }
      const compensation = this.getScaleCompensation(value / scale)
      if (compensation.needCompensation) {
        if (targetLayer.contentEditable) {
          this.fontSizeGaining(1 / compensation.scale, true, layerIndex, subLayerIdx)
        }
        this.applyScaleCompensation(compensation.scale, currLayer as IText | IGroup, pageIndex, layerIndex, subLayerIdx)
      }
      tiptapUtils.applySpanStyle('size', compensation.size, undefined, {}, true)
    } else if (currLayer.type === LayerType.group || currLayer.type === LayerType.tmp) {
      const primaryScale = currLayer.styles.scale
      for (const [sIdx, subLayer] of currLayer.layers.entries()) {
        if (subLayer.type === LayerType.text) {
          const scale = primaryScale * subLayer.styles.scale
          const compensation = this.getScaleCompensation(value / scale)
          if (compensation.needCompensation) {
            this.applyScaleCompensation(compensation.scale, currLayer, pageIndex, layerIndex, sIdx)
          }
          this.applyPropsToAll('span,paragraph', { size: compensation.size }, layerIndex, sIdx)
          textUtils.updateTextLayerSizeByShape(layerUtils.pageIndex, layerIndex, sIdx)
        }
      }
      textUtils.updateGroupLayerSize(layerUtils.pageIndex, layerIndex)
    }
    tiptapUtils.forceUpdate(toRecord)
    this.updateTextPropsState({ fontSize: value.toString() })
    textEffectUtils.refreshSize()
    tiptapUtils.updateHtml()
  }
}

export default new TextPropUtils()

export const fontSelectValue = [
  6, 8, 10, 12, 14, 16, 18, 20, 23, 26, 30, 34, 38, 44, 50, 58, 66, 74, 82, 90, 98, 114, 138, 162
]
