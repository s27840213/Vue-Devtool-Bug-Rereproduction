import { AllLayerTypes, IGroup, IParagraph, IText, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ISelection } from '@/interfaces/text'
import router from '@/router'
import store from '@/store'
import { LayerType } from '@nu/vivi-lib/store/types'
import { IInitSize, IMultiStageRunResult, autoResizePipeLine, autoResizePipeLineSync } from '@/utils/autoResizeUtils'
import controlUtils from '@/utils/controlUtils'
import groupUtils, { calcTmpProps } from '@/utils/groupUtils'
import mappingUtils from '@/utils/mappingUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textPropUtils from '@/utils/textPropUtils'
import Graphemer from 'graphemer'
import _, { pick } from 'lodash'
import cssConverter from './cssConverter'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import logUtils from './logUtils'
import mathUtils from './mathUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'
import textBgUtils from './textBgUtils'
import textShapeUtils from './textShapeUtils'
import tiptapUtils from './tiptapUtils'

export interface ITextHW {
  width: number
  height: number
  spanDataList: DOMRect[][][]
}

export const SYSTEM_FONTS = ['-apple-system', 'Apple Color Emoji']

class TextUtils {
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrTextProps() { return store.state.text.props }
  get getCurrSel(): { start: ISelection, end: ISelection } { return store.state.text.sel }
  get isFontLoading(): boolean { return store.state.text.isFontLoading }

  observer: IntersectionObserver
  observerCallbackMap: { [key: string]: (size: { width: number, height: number }) => void }
  trashDivs: HTMLDivElement[] = []
  toRecordId: string
  toSetFlagId: string
  splitter: Graphemer = new Graphemer()

  get fieldRange() {
    return {
      fontSize: mappingUtils.mappingMinMax('fontSize'),
      lineHeight: mappingUtils.mappingMinMax('lineHeight'),
      fontSpacing: mappingUtils.mappingMinMax('letterSpacing'),
      opacity: mappingUtils.mappingMinMax('opacity'),
    }
  }

  constructor() {
    this.observerCallbackMap = {}
    this.observer = new IntersectionObserver(this.intersectionHandler.bind(this))
    this.toRecordId = ''
    this.toSetFlagId = ''

    setInterval(() => {
      // ---------- snapshot current list in case that new divs are pushed into the list while deleting --------
      const currentDivCount = this.trashDivs.length
      const divsToDelete = this.trashDivs.slice(0, currentDivCount)
      this.trashDivs = this.trashDivs.slice(currentDivCount)
      // -------------------------------------------------------------------------------------------------------
      while (divsToDelete.length) {
        const div = divsToDelete.pop()
        if (!div) break
        if (document.body.contains(div)) document.body.removeChild(div)
      }
    }, 5000)
  }

  intersectionHandler(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      const id = entry.target.id
      if (this.observerCallbackMap[id]) {
        this.observerCallbackMap[id](entry.boundingClientRect)
        this.trashDivs.push(entry.target as HTMLDivElement)
      }
    }
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

  focus(start?: ISelection, end?: ISelection, subLayerIndex?: number, layerIndex = layerUtils.layerIndex) {
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

  getTextHW(_content: IText, widthLimit = -1): ITextHW {
    const body = this.genTextDiv(_content, widthLimit)
    const scale = _content.styles.scale ?? 1
    document.body.appendChild(body)
    const textHW = this.getHWByRect(body, scale, widthLimit)
    document.body.removeChild(body)
    return textHW
  }

  async getTextHWAsync(_content: IText, widthLimit = -1): Promise<ITextHW> {
    const textId = generalUtils.generateRandomString(12)
    const body = this.genTextDiv(_content, widthLimit)
    body.setAttribute('id', textId)
    const scale = _content.styles.scale ?? 1
    return new Promise(resolve => {
      this.observerCallbackMap[textId] = (size) => {
        const textHW = this.getHWBySize(size, body, scale, widthLimit)
        this.observer.unobserve(body)
        resolve(textHW)
      }
      document.body.appendChild(body)
      this.observer.observe(body)
    })
  }

  genTextDiv(_content: IText, widthLimit = -1): HTMLDivElement {
    const body = document.createElement('div')
    const content = generalUtils.deepCopy(_content)
    content.paragraphs.forEach(pData => {
      const p = document.createElement('p')
      let fontSize = 0
      pData.spans.forEach((spanData, index) => {
        const span = document.createElement('span')
        span.textContent = spanData.text

        const spanStyleObject = tiptapUtils.textStylesRaw(spanData.styles)
        const additionalStyle = {
          ...index === pData.spans.length - 1 && spanData.text.match(/^ +$/) ? { whiteSpace: 'pre' } : {},
          ...textBgUtils.fixedWidthStyle(spanData.styles, pData.styles, content)
        }
        Object.assign(span.style, spanStyleObject, additionalStyle)
        // Set CSS var to span
        for (const [key, value] of Object.entries(spanStyleObject)) {
          if (key.startsWith('--')) {
            span.style.setProperty(key, value)
          }
        }

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
    body.style.writingMode = cssConverter.convertVerticalStyle(content.styles.writingMode).writingMode
    body.style.position = 'fixed'
    body.style.top = '100%'
    body.style.left = '100%'
    body.style.opacity = '0'
    return body
  }

  getHWByRect(body: HTMLDivElement, scale: number, widthLimit = -1): ITextHW {
    return this.getHWBySize(body.getBoundingClientRect(), body, scale, widthLimit)
  }

  getHWBySize(size: { width: number, height: number }, body: HTMLDivElement, scale: number, widthLimit = -1): ITextHW {
    const spanDataList = Array.from(body.children).map(
      p => Array.from(p.children).map(
        span => Array.from(span.getClientRects()).map(
          rect => rect.toJSON()
        )
      )
    )
    this.mergeLines(spanDataList)
    return {
      width: body.style.width !== 'max-content' ? widthLimit : size.width * scale,
      height: body.style.height !== 'max-content' ? widthLimit : size.height * scale,
      spanDataList
    }
  }

  mergeLines(spanDataList: DOMRect[][][]) {
    /**
     * The result of getClientRects may contain multiple DOMRects for a single line.
     * This is typically observed when the whitespace immediately preceding a line wrap
     * which is split and represented as a separate DOMRect.
     */
    spanDataList.forEach(p => {
      p.forEach(span => {
        span.forEach((row, index) => {
          const nextIndex = index + 1
          while (nextIndex < span.length) {
            const curr = row
            const next = span[nextIndex]
            const currTop = curr.y
            const currBottom = curr.y + curr.height
            const nextTop = next.y
            const nextBottom = next.y + next.height
            if (((nextTop <= currTop && currTop <= nextBottom &&
              nextTop <= currBottom && currBottom <= nextBottom) ||
              (currTop <= nextTop && nextTop <= currBottom &&
                currTop <= nextBottom && nextBottom <= currBottom))) {
              curr.y = Math.min(curr.y, next.y)
              curr.width += next.width
              curr.height = Math.max(curr.height, next.height)
              span.splice(nextIndex, 1)
            } else break
          }
        })
      })
    })
  }

  updateGroupLayerSize(pageIndex: number, layerIndex: number, subLayerIndex = -1, { noPush = false, keepCorner = false } = {}) {
    const group = layerUtils.getLayer(pageIndex, layerIndex) as IGroup
    if (!group.layers) return
    if (subLayerIndex !== -1) {
      const config = group.layers[subLayerIndex] as IText
      if (config.type !== 'text') throw new Error('updateGroupLayerSize with subLayerIndex argument only accepts text subLayer')
      const originSize = { width: config.styles.width, height: config.styles.height }
      let textHW
      if (textShapeUtils.isCurvedText(config.styles.textShape)) {
        textHW = originSize
      } else {
        textHW = this.getTextHW(config, config.widthLimit)
        layerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, { width: textHW.width, height: textHW.height })
        layerUtils.updateSubLayerProps(pageIndex, layerIndex, subLayerIndex, { spanDataList: textHW.spanDataList })
        const isVertical = config.styles.writingMode.includes('vertical')
        const initData = {
          xSign: (isVertical || keepCorner) ? -1 : 1,
          ySign: 1,
          x: config.styles.x,
          y: config.styles.y,
          angle: config.styles.rotate * Math.PI / 180
        }
        const offsetSize = {
          width: (isVertical || keepCorner) ? textHW.width - originSize.width : 0,
          height: (isVertical || keepCorner) ? 0 : textHW.height - originSize.height
        }
        const trans = controlUtils.getTranslateCompensation(initData, offsetSize)
        layerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, {
          x: trans.x,
          y: trans.y
        })
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
              layerUtils.updateSubLayerStyles(layerUtils.pageIndex, layerIndex, data[0], {
                y: data[1] + diff
              })
            })
        }
      }
    }
    let { width, height } = calcTmpProps(group.layers)
    width *= group.styles.scale
    height *= group.styles.scale
    layerUtils.updateLayerStyles(pageIndex, layerIndex, { width, height })

    this.fixGroupCoordinates(pageIndex, layerIndex)
  }

  asSubLayerSizeRefresh(pageIndex: number, layerIndex: number, subLayerIndex: number, height: number, heightOri: number, noPush = false) {
    const group = layerUtils.getLayer(pageIndex, layerIndex) as IGroup
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
            layerUtils.updateSubLayerStyles(pageIndex, layerIndex, data[0], {
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
            layerUtils.updateSubLayerStyles(pageIndex, layerIndex, data[0], {
              y: data[1] - (height - heightOri)
            })
          })
      }
    }
    this.updateGroupLayerSize(pageIndex, layerIndex)
  }

  updateGroupLayerSizeByShape(pageIndex: number, layerIndex: number, subLayerIndex: number, { noPush = false, keepCorner = false } = {}) {
    const group = layerUtils.getLayer(pageIndex, layerIndex) as IGroup
    if (!group.layers) return
    const config = group.layers[subLayerIndex]
    if (config.type !== 'text') throw new Error('updateGroupLayerSizeByShape only accepts text subLayer')
    if (textShapeUtils.isCurvedText(config.styles.textShape)) {
      const heightOri = config.styles.height
      const textHW = textShapeUtils.getCurveTextProps(config as IText)
      layerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, textHW)
      this.asSubLayerSizeRefresh(pageIndex, layerIndex, subLayerIndex, textHW.height, heightOri, noPush)
      this.fixGroupCoordinates(pageIndex, layerIndex)
    } else {
      this.updateGroupLayerSize(pageIndex, layerIndex, subLayerIndex, { noPush, keepCorner })
    }
  }

  getAutoRescaleResult(
    config: IText,
    textHW: { width: number, height: number },
    x: number,
    y: number,
    { forceFull = true, onlyCentralize = true } = {},
    pageIndex = layerUtils.pageIndex
  ): {
    textHW: { width: number, height: number },
    x: number,
    y: number,
    scale: number
  } {
    const isVertical = config.styles.writingMode.includes('vertical')
    const page = pageUtils.getPage(pageIndex) as IPage
    const pageSize = page[isVertical ? 'height' : 'width']
    const newTmpTextSize = textHW[isVertical ? 'height' : 'width']
    const initScale = config.initScale
    const oldCenter = mathUtils.getCenter({
      x: 0,
      y: 0,
      width: page.width,
      height: page.height
    })
    let scale = config.styles.scale
    if (!onlyCentralize && config.widthLimit === -1 && (newTmpTextSize >= pageSize || forceFull)) {
      let rescale = pageSize / newTmpTextSize
      scale = config.styles.scale * rescale
      if (scale > initScale) {
        rescale = initScale / config.styles.scale
        scale = initScale
      }
      textHW = {
        width: textHW.width * rescale,
        height: textHW.height * rescale
      }
      x = isVertical ? x : 0
      y = isVertical ? 0 : y
    }
    const newCenter = mathUtils.getCenter({
      width: textHW.width,
      height: textHW.height,
      x,
      y
    })

    const offset = { x: oldCenter.x - newCenter.x, y: oldCenter.y - newCenter.y }
    x += offset.x
    y += offset.y
    return { textHW, x, y, scale }
  }

  handleAutoRescale(options?: { forceFull?: boolean, onlyCentralize?: boolean }, pageIndex = layerUtils.pageIndex, layerIndex = layerUtils.layerIndex) {
    const config = layerUtils.getLayer(pageIndex, layerIndex) as AllLayerTypes
    if (config?.type !== LayerType.text) return
    if (config.styles.rotate !== 0 || !config.inAutoRescaleMode || textShapeUtils.isCurvedText(config.styles.textShape)) return
    const { textHW, x, y, scale } = this.getAutoRescaleResult(
      config,
      this.getTextHW(config, config.widthLimit),
      config.styles.x,
      config.styles.y,
      options,
      pageIndex
    )
    layerUtils.updateLayerStyles(pageIndex, layerIndex, { x, y, width: textHW.width, height: textHW.height, scale })
  }

  turnOffAutoRescaleMode() {
    const { getCurrLayer: config, pageIndex, layerIndex } = layerUtils
    if (config.type === LayerType.text && config.inAutoRescaleMode) {
      layerUtils.updateLayerProps(pageIndex, layerIndex, {
        inAutoRescaleMode: false
      })
    }
  }

  updateTextLayerSizeByShape(pageIndex: number, layerIndex: number, subLayerIndex: number) {
    const targetLayer = layerUtils.getLayer(pageIndex, layerIndex)
    if (subLayerIndex === -1) { // single text layer
      const config = targetLayer as IText
      if (textShapeUtils.isCurvedText(config.styles.textShape)) {
        layerUtils.updateLayerStyles(pageIndex, layerIndex, textShapeUtils.getCurveTextProps(config))
      } else {
        const widthLimit = config.widthLimit
        const textHW = this.getTextHW(config, widthLimit)
        const isVertical = config.styles.writingMode.includes('vertical')
        let x = config.styles.x
        let y = config.styles.y
        if (config.widthLimit === -1 && config.styles.rotate === 0) {
          if (isVertical) {
            x = config.styles.x - (textHW.width - config.styles.width)
            y = config.styles.y - (textHW.height - config.styles.height) / 2
          } else {
            x = config.styles.x - (textHW.width - config.styles.width) / 2
          }
        } else {
          const initData = {
            xSign: isVertical ? -1 : 1,
            ySign: 1,
            x,
            y,
            angle: config.styles.rotate * Math.PI / 180
          }
          const offsetSize = {
            width: isVertical ? textHW.width - config.styles.width : 0,
            height: isVertical ? 0 : textHW.height - config.styles.height
          }
          const trans = controlUtils.getTranslateCompensation(initData, offsetSize)
          x = trans.x
          y = trans.y
        }
        layerUtils.updateLayerStyles(pageIndex, layerIndex, { x, y, width: textHW.width, height: textHW.height })
        layerUtils.updateLayerProps(pageIndex, layerIndex, { spanDataList: textHW.spanDataList })
      }
    } else { // sub text layer in a group
      const group = targetLayer as IGroup
      const config = group.layers[subLayerIndex] as IText
      if (textShapeUtils.isCurvedText(config.styles.textShape)) {
        layerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, textShapeUtils.getCurveTextProps(config))
        this.updateGroupLayerSize(pageIndex, layerIndex)
      } else {
        const widthLimit = config.widthLimit
        const textHW = this.getTextHW(config, widthLimit)
        layerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, { width: textHW.width, height: textHW.height })
        layerUtils.updateSubLayerProps(pageIndex, layerIndex, subLayerIndex, { spanDataList: textHW.spanDataList })
        const { width, height } = calcTmpProps(group.layers, group.styles.scale)
        layerUtils.updateLayerStyles(pageIndex, layerIndex, { width, height })
      }
    }
  }

  fixGroupXCoordinates(pageIndex: number, layerIndex: number) {
    const group = layerUtils.getLayer(pageIndex, layerIndex) as IGroup
    let minX = Number.MAX_SAFE_INTEGER
    if (!group.layers) return
    group.layers
      .forEach(l => {
        minX = Math.min(minX, mathUtils.getBounding(l.styles).x)
      })
    if (minX === 0) return
    for (const [idx, layer] of Object.entries(group.layers)) {
      layerUtils.updateSubLayerStyles(pageIndex, layerIndex, +idx, {
        x: layer.styles.x - minX
      })
    }
    layerUtils.updateLayerStyles(pageIndex, layerIndex, {
      x: group.styles.x + minX * group.styles.scale
    })
  }

  fixGroupYCoordinates(pageIndex: number, layerIndex: number) {
    const group = layerUtils.getLayer(pageIndex, layerIndex) as IGroup
    let minY = Number.MAX_SAFE_INTEGER
    if (!group.layers) return
    group.layers
      .forEach(l => {
        minY = Math.min(minY, mathUtils.getBounding(l.styles).y)
      })
    if (minY === 0) return
    for (const [idx, layer] of Object.entries(group.layers)) {
      layerUtils.updateSubLayerStyles(pageIndex, layerIndex, +idx, {
        y: layer.styles.y - minY
      })
    }
    layerUtils.updateLayerStyles(pageIndex, layerIndex, {
      y: group.styles.y + minY * group.styles.scale
    })
  }

  fixGroupCoordinates(pageIndex: number, layerIndex: number) {
    this.fixGroupXCoordinates(pageIndex, layerIndex)
    this.fixGroupYCoordinates(pageIndex, layerIndex)
  }

  getAddPosition(width: number, height: number, pageIndex?: number): { x: number, y: number, center: boolean } {
    const targePageIndex = pageIndex || pageUtils.currFocusPageIndex
    const page = layerUtils.getPage(targePageIndex)
    const x = (page.width - width) / 2
    const y = (page.height - height) / 2

    if (targePageIndex === pageUtils.currFocusPageIndex) {
      const currLayer = layerUtils.getLayer(targePageIndex, layerUtils.layerIndex)
      if (currLayer.styles) {
        const specx = currLayer.styles.x + (currLayer.styles.width - width) / 2
        const specy = currLayer.styles.y + currLayer.styles.height
        if ((specy + height) < page.height) {
          return { x: specx, y: specy, center: false }
        }
      }
    }
    return { x, y, center: true }
  }

  // TODO: In addStandardText call resetTextField, textLayer is Partial<IText>, need more type check here.
  resetTextField(textLayer: IText, pageIndex: number, field?: string) {
    const page = layerUtils.getPage(pageIndex) as IPage
    /**
     * Add the response font-size for each paragraph
     */
    const paragraphSizes = this.getParagraphSize(textLayer)
    for (const i in textLayer.paragraphs) {
      textLayer.paragraphs[i].styles.size = paragraphSizes[i]
    }

    const textHW = this.getTextHW(textLayer)
    const size = pick(textHW, ['width', 'height'])
    const position = {} as { [key: string]: number }

    textLayer.spanDataList = textHW.spanDataList

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

  loadDefaultFonts(extraFonts: { type: string, face: string, url: string, userId: string, assetId: string, ver: string }[] = []) {
    for (const defaultFont of store.getters['text/getDefaultFontsList']) {
      store.dispatch('text/addFont', defaultFont).catch(e => console.error(e))
    }
    for (const extraFont of extraFonts) {
      store.dispatch('text/addFont', extraFont).catch(e => console.error(e))
    }
  }

  // loadAllFonts(config: IText, times: number) {
  loadAllFonts(config: IText) {
    /*
      Gary: 因為預設字型檔案較大，剛進入畫面時的下載過程可能會佔用網路頻寬，
      造成後續api呼叫及圖片載入等等被卡住而有畫面延遲。
      因此，需確保預設字型載入會晚於取得template list的api呼叫
      (剛進入編輯器時，左側欄會顯示在模板的panel)
    */

    // 僅剛進入editor需要判斷
    // if (!store.state.text.firstLoad && window.location.pathname === '/editor') {
    //   if (!(store.state.templates.categories.length > 0) && times < 5) {
    //     setTimeout(() => {
    //       this.loadAllFonts(config, times + 1)
    //     }, 3000)
    //     return
    //   }
    //   // 第一次載入的等待結束，firstLoad -> true
    //   store.commit('text/SET_firstLoad', true)
    // }

    // Disable the above mechanism, since the font file is now divided into sub files and thus not large anymore.

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

  getFirstPText(config: IText): string {
    return config.paragraphs[0].spans.map(span => span.text).join('')
  }

  async autoResize(config: IText, initSize: { width: number, height: number, widthLimit: number, spanDataList?: DOMRect[][][] }): Promise<number> {
    if (config.widthLimit === -1) return config.widthLimit
    const { widthLimit, otherDimension, stageLoops } = await this.autoResizeCore(config, initSize)
    const dimension = config.styles.writingMode.includes('vertical') ? 'width' : 'height'
    const limitDiff = Math.abs(widthLimit - initSize.widthLimit)
    const firstPText = this.getFirstPText(config)
    if (router.currentRoute.value.name === 'Preview') {
      const writingMode = config.styles.writingMode.includes('vertical') ? 'hw' : 'wh'
      console.log(`TEXT RESIZE DONE: id-${config.id ?? ''} ${initSize.widthLimit} ${initSize[dimension]} ${widthLimit} ${otherDimension} ${writingMode} ${firstPText} loops: ${stageLoops}`)
    }
    if (limitDiff / initSize.widthLimit > 0.20) {
      return initSize.widthLimit
    } else {
      return widthLimit
    }
  }

  autoResizeCoreSync(config: IText, initSize: IInitSize): IMultiStageRunResult {
    return autoResizePipeLineSync(config, initSize, ['height', 'spanDataList2'])
  }

  async autoResizeCore(config: IText, initSize: IInitSize): Promise<IMultiStageRunResult> {
    return await autoResizePipeLine(config, initSize, ['height', 'spanDataList2'])
  }

  async setParagraphProp(prop: 'lineHeight' | 'fontSpacing', _value: number) {
    return new Promise<void>((resolve) => {
      if (generalUtils.isValidFloat(_value.toString())) {
        _value = generalUtils.boundValue(_value, this.fieldRange[prop].min, this.fieldRange[prop].max)

        let preprocessedValue: number
        switch (prop) {
          case 'lineHeight':
            preprocessedValue = _.toNumber((_value).toFixed(2))
            break
          case 'fontSpacing':
            preprocessedValue = _value / 1000
        }
        const { layerIndex, subLayerIdx, getCurrLayer: currLayer } = layerUtils
        window.requestAnimationFrame(() => {
          if (['group', 'tmp'].includes(currLayer.type) && subLayerIdx === -1) {
            (currLayer as IGroup | ITmp).layers
              .forEach((l, idx) => {
                l.type === 'text' && textPropUtils.propAppliedAllText(layerIndex, idx, prop, preprocessedValue)
                l.type === 'text' && this.updateGroupLayerSizeByShape(layerUtils.pageIndex, layerIndex, idx)
              })
            textPropUtils.updateTextPropsState({ [prop]: _value })
          } else {
            tiptapUtils.applyParagraphStyle(prop, preprocessedValue, false)
            textPropUtils.updateTextPropsState({ [prop]: _value })
          }
          resolve()
        })
      }
    })
  }

  isAppleColorEmoji(font: string) {
    return font === 'YepeErhdbqhfT4iwUvmH'
  }

  async untilFontLoadedForPage(page: IPage, toSetFlag = false): Promise<void> {
    const setFlagId = generalUtils.generateRandomString(12)
    if (toSetFlag) {
      this.toSetFlagId = setFlagId
      this.setIsFontLoading(true)
    }
    const textLayers: IText[] = []
    for (const layer of page.layers) {
      if (layer.type === 'text') {
        textLayers.push(layer as IText)
      }
      if (['tmp', 'group'].includes(layer.type)) {
        // Theoretically, there shouldn't be any tmp layers, because the page should be from S3.
        // But still put tmp here just in case.
        textLayers.push(...((layer as IGroup).layers.filter(l => l.type === 'text') as IText[]))
      }
    }
    let isError = false
    try {
      isError = await Promise.race([
        Promise.all(textLayers.map(l => this.untilFontLoaded(l.paragraphs))),
        new Promise<boolean>(resolve => {
          setTimeout(() => {
            resolve(true)
          }, 40000)
        })
      ]) === true
    } catch (error) {
      logUtils.setLogForError(error as Error)
      isError = true
    } finally {
      if (isError === true) {
        logUtils.setLogAndConsoleLog('Font loading exceeds timeout 40s or error occurs, run callback anyways')
      }
      if (toSetFlag && this.toSetFlagId === setFlagId) {
        this.setIsFontLoading(false)
      }
    }
  }

  async untilFontLoaded(paragraphs: IParagraph[], toSetFlag = false): Promise<void> {
    const setFlagId = generalUtils.generateRandomString(12)
    if (toSetFlag) {
      this.toSetFlagId = setFlagId
      this.setIsFontLoading(true)
    }

    let isError = false
    try {
      isError = await Promise.race([
        Promise.all(paragraphs.map(p => this.untilFontLoadedForP(p))),
        new Promise<boolean>(resolve => {
          setTimeout(() => {
            resolve(true)
          }, 40000)
        })
      ]) === true
    } catch (error) {
      logUtils.setLogForError(error as Error)
      isError = true
    } finally {
      if (isError === true) {
        logUtils.setLogAndConsoleLog('Font loading exceeds timeout 40s or error occurs, run callback anyways')
      }
      if (toSetFlag && this.toSetFlagId === setFlagId) {
        this.setIsFontLoading(false)
      }
    }
  }

  async untilFontLoadedForP(paragraph: IParagraph): Promise<void> {
    const fontList = cssConverter.getFontFamily(paragraph.styles.font as string)
      .split(',')
      .map(font => font.trim())
      .filter(id => !SYSTEM_FONTS.includes(id))
    const isFontAppleColorEmoji = this.isAppleColorEmoji(paragraph.styles.font as string)
    if (isFontAppleColorEmoji) {
      await Promise.all(fontList.map(fontListItem => store.dispatch('text/checkFontLoaded', fontListItem)))
    } else {
      await Promise.all([
        (async (): Promise<void> => {
          const valid = await store.dispatch('text/checkFontLoaded', fontList[0])
          if (!valid) {
            throw new Error(`Font ${fontList[0]} not added by 'addFont' before timeout`)
          }
        })(),
        ...fontList.slice(1).map(fontListItem => store.dispatch('text/checkFontLoaded', fontListItem))
      ])
    }
    // wait until the css files of fonts are loaded
    const allCharacters = paragraph.spans.flatMap(s => this.splitter.splitGraphemes(s.text))
    await Promise.all(allCharacters.map(c => this.untilFontLoadedForChar(c, fontList)))
  }

  async untilFontLoadedForChar(char: string, fontList: string[]): Promise<void> {
    try {
      for (const font of fontList) {
        const fontFileList = await window.document.fonts.load(`14px ${font}`, char)
        if (fontFileList.length !== 0) return
      }
    } catch (error) {
      logUtils.setLogForError(error as Error)
      throw error
    }
  }

  setIsFontLoading(isFontLoading: boolean) {
    store.commit('text/SET_isFontLoading', isFontLoading)
  }

  waitFontLoadingAndRecord(paragraphs: IParagraph[], callback: (() => void) | undefined = undefined) {
    const recordId = generalUtils.generateRandomString(12)
    this.toRecordId = recordId
    this.toSetFlagId = recordId
    this.setIsFontLoading(true)
    const finalCallBack = (isError: boolean | void) => {
      if (isError === true) {
        logUtils.setLogAndConsoleLog('Font loading exceeds timeout 40s or error occurs, run callback anyways')
      }
      setTimeout(() => {
        if (callback) {
          callback()
        }
        if (this.toRecordId === recordId) {
          // console.log('record')
          stepsUtils.record()
        }
        if (this.toSetFlagId === recordId) {
          this.setIsFontLoading(false)
        }
      }, 100)
    }
    Promise.race([
      this.untilFontLoaded(paragraphs),
      new Promise<boolean>(resolve => {
        setTimeout(() => {
          resolve(true)
        }, 40000)
      })
    ]).then(finalCallBack).catch((error) => {
      logUtils.setLogForError(error as Error)
      finalCallBack(true)
    })
  }

  waitGroupFontLoadingAndRecord(group: IGroup, callback: (() => void) | undefined = undefined) {
    const recordId = generalUtils.generateRandomString(12)
    this.toRecordId = recordId
    this.toSetFlagId = recordId
    this.setIsFontLoading(true)
    const finalCallBack = (isError: boolean | void[]) => {
      if (isError === true) {
        logUtils.setLogAndConsoleLog('Font loading exceeds timeout 40s or error occurs, run callback anyways')
      }
      setTimeout(() => {
        if (callback) {
          callback()
        }
        if (this.toRecordId === recordId) {
          // console.log('record')
          stepsUtils.record()
        }
        if (this.toSetFlagId === recordId) {
          this.setIsFontLoading(false)
        }
      }, 100)
    }
    Promise.race([
      Promise.all(
        group.layers
          .filter(l => l.type === 'text')
          .map(l => this.untilFontLoaded((l as IText).paragraphs))
      ),
      new Promise<boolean>(resolve => {
        setTimeout(() => {
          resolve(true)
        }, 40000)
      })
    ]).then(finalCallBack).catch((error) => {
      logUtils.setLogForError(error as Error)
      finalCallBack(true)
    })
  }

  resetScaleForLayer(layer: AllLayerTypes, preMount = false): AllLayerTypes {
    layer = generalUtils.deepCopy(layer)
    let targetScale = 1
    let subLayers
    let newStyles
    let stylesBuffer = {} as { [key: string]: any }
    let originHW
    let newHW
    switch (layer.type) {
      case LayerType.text:
        stylesBuffer = pick(layer.styles, ['scale'])
        if (layer.styles.scale < 1) {
          const baseFontSize = textPropUtils.getBaseFontSizeOfLayer(layer)
          const { scale } = textPropUtils.getScaleCompensation(baseFontSize * layer.styles.scale)
          targetScale = scale
        }
        layer.styles.scale = targetScale
        layer.paragraphs = textPropUtils.propAppliedParagraphs(layer.paragraphs, 'size', 0, (size) => {
          return size * stylesBuffer.scale / targetScale
        })
        if (!preMount) {
          // if it's before mounting layers, don't change the size and position since fonts are not loaded yet,
          // and let the mounted hook of NuText to deal with size and position
          originHW = { width: layer.styles.width, height: layer.styles.height, x: layer.styles.x, y: layer.styles.y }
          if (textShapeUtils.isCurvedText(layer.styles.textShape)) {
            newHW = textShapeUtils.getCurveTextProps(layer)
            Object.assign(layer.styles, newHW)
          } else {
            if (layer.widthLimit !== -1) {
              layer.widthLimit = this.autoResizeCoreSync(layer, {
                width: originHW.width,
                height: originHW.height,
                widthLimit: layer.widthLimit
              }).widthLimit
            }
            newHW = this.getTextHW(layer, layer.widthLimit)
            Object.assign(layer.styles, {
              width: newHW.width,
              height: newHW.height,
              x: originHW.x + (newHW.width - originHW.width) / 2,
              y: originHW.y + (newHW.height - originHW.height) / 2
            })
            layer.spanDataList = newHW.spanDataList
          }
        }
        if (layer.styles.textEffect.fontSize !== undefined) {
          layer.styles.textEffect.fontSize = textEffectUtils.getLayerFontSize(layer.paragraphs)
        }
        break
      case LayerType.tmp:
      case LayerType.group:
        /**
         * record the opacity of group/tmp and reset it before ungrouping and re-apply it to the re-formed group/tmp,
         * because opacity behaves differently on group from on individual layers.
         * map the layers back to page to apply the scale to all sub-layers,
         * and reset the scale individually for certain typed sub-layers.
         * after that, re-form the group/tmp with those sub-layers.
         */
        stylesBuffer = pick(layer.styles, ['opacity', 'rotate', 'horizontalFlip', 'verticalFlip'])
        if (layer.type === LayerType.group) {
          layer.layers.forEach((subLayer: AllLayerTypes, index: number) => {
            subLayer.styles.zindex = layer.styles.zindex + index
          }) // some subLayers in template have inconsistent zindexes with layer indexes, fix them here
        }
        layer.styles.opacity = 100
        layer.styles.rotate = 0
        layer.styles.horizontalFlip = false
        layer.styles.verticalFlip = false
        layer.layers
          .forEach(l => {
            if (l.type === LayerType.image) {
              l.styles.scale *= layer.styles.scale
            }
            l.parentLayerStyles = undefined
          })
        subLayers = groupUtils.mapLayersToPage(layer.layers, layer).map(l => this.resetScaleForLayer(l, preMount) as Exclude<AllLayerTypes, ITmp>)
        newStyles = calcTmpProps(subLayers)
        subLayers = groupUtils.mapLayersToTmp(subLayers, newStyles)
        Object.assign(layer.styles, newStyles)
        Object.assign(layer.styles, stylesBuffer)
        layer.styles.scale = 1
        layer.layers = subLayers
        break
    }
    return layer
  }

  resetScale(page: IPage, preLoad = false): void {
    page.layers = page.layers.map(layer => this.resetScaleForLayer(layer, preLoad))
  }
}

export default new TextUtils()
