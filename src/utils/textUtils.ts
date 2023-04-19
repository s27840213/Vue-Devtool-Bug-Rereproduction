import { isITextLetterBg } from '@/interfaces/format'
import {
  IGroup, IParagraph, IText, ITmp
} from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ISelection } from '@/interfaces/text'
import router from '@/router'
import store from '@/store'
import { calcTmpProps } from '@/utils/groupUtils'
import TextPropUtils from '@/utils/textPropUtils'
import _ from 'lodash'
import cssConverter from './cssConverter'
import GeneralUtils from './generalUtils'
import LayerUtils from './layerUtils'
import logUtils from './logUtils'
import mathUtils from './mathUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'
import textBgUtils from './textBgUtils'
import textShapeUtils from './textShapeUtils'
import tiptapUtils from './tiptapUtils'

class TextUtils {
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get getCurrTextProps() { return (store.state as any).text.props }
  get getCurrSel(): { start: ISelection, end: ISelection } { return (store.state as any).text.sel }
  get isFontLoading(): boolean { return (store.state as any).text.isFontLoading }

  observer: IntersectionObserver
  observerCallbackMap: { [key: string]: (size: { width: number, height: number }) => void }
  trashDivs: HTMLDivElement[] = []
  toRecordId: string
  toSetFlagId: string
  fieldRange: {
    fontSize: { min: number, max: number }
    lineHeight: { min: number, max: number }
    fontSpacing: { min: number, max: number }
    opacity: { min: number, max: number }
  }

  constructor() {
    this.observerCallbackMap = {}
    this.observer = new IntersectionObserver(this.intersectionHandler.bind(this))
    this.toRecordId = ''
    this.toSetFlagId = ''
    this.fieldRange = {
      fontSize: { min: 6, max: 800 },
      lineHeight: { min: 0.5, max: 2.5 },
      fontSpacing: { min: -200, max: 800 },
      opacity: { min: 0, max: 100 }
    }

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
    const body = this.genTextDiv(_content, widthLimit)
    const scale = _content.styles.scale ?? 1
    document.body.appendChild(body)
    const textHW = this.getHWByRect(body, scale, widthLimit)
    document.body.removeChild(body)
    return textHW
  }

  async getTextHWAsync(_content: IText, widthLimit = -1): Promise<{ width: number, height: number }> {
    const textId = GeneralUtils.generateRandomString(12)
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
    const content = GeneralUtils.deepCopy(_content) as IText
    content.paragraphs.forEach(pData => {
      const p = document.createElement('p')
      let fontSize = 0
      pData.spans.forEach((spanData, index) => {
        const span = document.createElement('span')
        span.textContent = spanData.text

        const spanStyleObject = tiptapUtils.textStylesRaw(spanData.styles)
        const fixedWidth = isITextLetterBg(content.styles.textBg) && content.styles.textBg.fixedWidth
        const additionalStyle = {
          ...index === pData.spans.length - 1 && spanData.text.match(/^ +$/) ? { whiteSpace: 'pre' } : {},
          ...fixedWidth ? textBgUtils.fixedWidthStyle(spanData.styles, pData.styles, content) : {}
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
    body.style.writingMode = content.styles.writingMode
    body.style.position = 'fixed'
    body.style.top = '100%'
    body.style.left = '100%'
    body.style.opacity = '0'
    return body
  }

  getHWByRect(body: HTMLDivElement, scale: number, widthLimit = -1): { width: number, height: number } {
    return this.getHWBySize(body.getBoundingClientRect(), body, scale, widthLimit)
  }

  getHWBySize(size: { width: number, height: number }, body: HTMLDivElement, scale: number, widthLimit = -1): { width: number, height: number } {
    return {
      width: body.style.width !== 'max-content' ? widthLimit : size.width * scale,
      height: body.style.height !== 'max-content' ? widthLimit : size.height * scale
    }
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
      this.updateGroupLayerSize(pageIndex, layerIndex, subLayerIndex, false, noPush)
    }
  }

  updateTextLayerSizeByShape(pageIndex: number, layerIndex: number, subLayerIndex: number) {
    const targetLayer = LayerUtils.getLayer(pageIndex, layerIndex)
    if (subLayerIndex === -1) { // single text layer
      const config = targetLayer as IText
      if (textShapeUtils.isCurvedText(config.styles)) {
        LayerUtils.updateLayerStyles(pageIndex, layerIndex, textShapeUtils.getCurveTextProps(config))
      } else {
        const widthLimit = config.widthLimit
        const textHW = this.getTextHW(config, widthLimit)
        let x = config.styles.x
        let y = config.styles.y
        if (config.widthLimit === -1) {
          if (config.styles.writingMode.includes('vertical')) {
            y = config.styles.y - (textHW.height - config.styles.height) / 2
          } else {
            x = config.styles.x - (textHW.width - config.styles.width) / 2
          }
        }
        LayerUtils.updateLayerStyles(pageIndex, layerIndex, { x, y, width: textHW.width, height: textHW.height })
        LayerUtils.updateLayerProps(pageIndex, layerIndex, { widthLimit })
      }
    } else { // sub text layer in a group
      const group = targetLayer as IGroup
      const config = group.layers[subLayerIndex] as IText
      if (textShapeUtils.isCurvedText(config.styles)) {
        LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, textShapeUtils.getCurveTextProps(config))
        this.updateGroupLayerSize(pageIndex, layerIndex)
        this.fixGroupCoordinates(pageIndex, layerIndex)
      } else {
        const widthLimit = config.widthLimit
        const textHW = this.getTextHW(config, widthLimit)
        LayerUtils.updateSubLayerStyles(pageIndex, layerIndex, subLayerIndex, { width: textHW.width, height: textHW.height })
        LayerUtils.updateSubLayerProps(pageIndex, layerIndex, subLayerIndex, { widthLimit })
        const { width, height } = calcTmpProps(group.layers, group.styles.scale)
        LayerUtils.updateLayerStyles(pageIndex, layerIndex, { width, height })
      }
    }
  }

  fixGroupXCoordinates(pageIndex: number, layerIndex: number) {
    const group = LayerUtils.getLayer(pageIndex, layerIndex) as IGroup
    let minX = Number.MAX_SAFE_INTEGER
    if (!group.layers) return
    group.layers
      .forEach(l => {
        minX = Math.min(minX, mathUtils.getBounding(l.styles).x)
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
        minY = Math.min(minY, mathUtils.getBounding(l.styles).y)
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
    // if (!(store.state as any).text.firstLoad && window.location.pathname === '/editor') {
    //   if (!((store.state as any).templates.categories.length > 0) && times < 5) {
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

  async autoResize(config: IText, initSize: { width: number, height: number, widthLimit: number }): Promise<number> {
    if (config.widthLimit === -1) return config.widthLimit
    const { widthLimit, otherDimension } = await this.autoResizeCore(config, initSize)
    const dimension = config.styles.writingMode.includes('vertical') ? 'width' : 'height'
    const limitDiff = Math.abs(widthLimit - initSize.widthLimit)
    const firstPText = config.paragraphs[0].spans.map(span => span.text).join('')
    if (router.currentRoute.value.name === 'Preview') {
      const writingMode = config.styles.writingMode.includes('vertical') ? 'hw' : 'wh'
      console.log(`TEXT RESIZE DONE: id-${config.id ?? ''} ${initSize.widthLimit} ${initSize[dimension]} ${widthLimit} ${otherDimension} ${writingMode} ${firstPText}`)
    }
    if (limitDiff / initSize.widthLimit > 0.20) {
      return initSize.widthLimit
    } else {
      return widthLimit
    }
  }

  async autoResizeCore(config: IText, initSize: { width: number, height: number, widthLimit: number }): Promise<{
    widthLimit: number,
    otherDimension: number
  }> {
    const dimension = config.styles.writingMode.includes('vertical') ? 'width' : 'height'
    const scale = config.styles.scale
    let direction = 0
    let shouldContinue = true
    let widthLimit = initSize.widthLimit
    let autoDimension = -1
    let autoSize = await this.getTextHWAsync(config, widthLimit)
    const originDimension = initSize[dimension]
    let prevDiff = Number.MAX_VALUE
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
        if (minDiffWidLimit !== -1) {
          return {
            widthLimit: minDiffWidLimit,
            otherDimension: minDiffDimension
          }
        } else {
          return {
            widthLimit: initSize.widthLimit,
            otherDimension: originDimension
          }
        }
      }
      prevDiff = currDiff
      if (autoDimension - originDimension > 5 * scale) {
        if (direction < 0) break
        if (direction >= 100) return { widthLimit: minDiffWidLimit, otherDimension: minDiffDimension }
        widthLimit += scale
        direction += 1
        autoSize = await this.getTextHWAsync(config, widthLimit)
        continue
      }
      if (originDimension - autoDimension > 5 * scale) {
        if (direction > 0) break
        if (direction <= -100) return { widthLimit: minDiffWidLimit, otherDimension: minDiffDimension }
        widthLimit -= scale
        direction -= 1
        autoSize = await this.getTextHWAsync(config, widthLimit)
        continue
      }
      shouldContinue = false
    }
    return {
      widthLimit,
      otherDimension: autoDimension
    }
  }

  async setParagraphProp(prop: 'lineHeight' | 'fontSpacing', _value: number) {
    return new Promise<void>((resolve) => {
      if (GeneralUtils.isValidFloat(_value.toString())) {
        _value = GeneralUtils.boundValue(_value, this.fieldRange[prop].min, this.fieldRange[prop].max)

        let preprocessedValue: number
        switch (prop) {
          case 'lineHeight':
            preprocessedValue = _.toNumber((_value).toFixed(2))
            break
          case 'fontSpacing':
            preprocessedValue = _value / 1000
        }
        const { layerIndex, subLayerIdx, getCurrLayer: currLayer } = LayerUtils
        window.requestAnimationFrame(() => {
          if (['group', 'tmp'].includes(currLayer.type) && subLayerIdx === -1) {
            (currLayer as IGroup | ITmp).layers
              .forEach((l, idx) => {
                l.type === 'text' && TextPropUtils.propAppliedAllText(layerIndex, idx, prop, preprocessedValue)
                l.type === 'text' && this.updateGroupLayerSizeByShape(LayerUtils.pageIndex, layerIndex, idx)
              })
            TextPropUtils.updateTextPropsState({ [prop]: _value })
          } else {
            tiptapUtils.applyParagraphStyle(prop, preprocessedValue, false)
            TextPropUtils.updateTextPropsState({ [prop]: _value })
          }
          resolve()
        })
      }
    })
  }

  async untilFontLoadedForPage(page: IPage, toSetFlag = false): Promise<void> {
    const setFlagId = GeneralUtils.generateRandomString(12)
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
      // console.log(error)
      isError = true
    } finally {
      if (isError === true) {
        // console.log('Font loading exceeds timeout 40s or error occurs, run callback anyways')
      }
      if (toSetFlag && this.toSetFlagId === setFlagId) {
        this.setIsFontLoading(false)
      }
    }
  }

  async untilFontLoaded(paragraphs: IParagraph[], toSetFlag = false): Promise<void> {
    const setFlagId = GeneralUtils.generateRandomString(12)
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
      console.log(error)
      logUtils.setLog(JSON.stringify(error))
      isError = true
    } finally {
      if (isError === true) {
        console.log('Font loading exceeds timeout 40s or error occurs, run callback anyways')
      }
      if (toSetFlag && this.toSetFlagId === setFlagId) {
        this.setIsFontLoading(false)
      }
    }
  }

  async untilFontLoadedForP(paragraph: IParagraph): Promise<void> {
    const fontList = cssConverter.getFontFamily(paragraph.styles.font as string).split(',')
    await Promise.all([
      (async (): Promise<void> => {
        const valid = await store.dispatch('text/checkFontLoaded', fontList[0])
        if (!valid) {
          throw new Error(`Font ${fontList[0]} not added by 'addFont' before timeout`)
        }
      })(),
      ...fontList.slice(1).map(fontListItem => store.dispatch('text/checkFontLoaded', fontListItem))
    ]) // wait until the css files of fonts are loaded
    const allCharacters = paragraph.spans.flatMap(s => {
      console.log(this.tokenizeString(s.text))
      return s.text.split('')
    })
    await Promise.all(allCharacters.map(c => this.untilFontLoadedForChar(c, fontList)))
  }

  async untilFontLoadedForChar(char: string, fontList: string[]): Promise<void> {
    for (const font of fontList) {
      const fontFileList = await window.document.fonts.load(`14px ${font}`, char)
      if (fontFileList.length !== 0) return
    }
  }

  setIsFontLoading(isFontLoading: boolean) {
    store.commit('text/SET_isFontLoading', isFontLoading)
  }

  waitFontLoadingAndRecord(paragraphs: IParagraph[], callback: (() => void) | undefined = undefined) {
    const recordId = GeneralUtils.generateRandomString(12)
    this.toRecordId = recordId
    this.toSetFlagId = recordId
    this.setIsFontLoading(true)
    const finalCallBack = (isError: boolean | void) => {
      if (isError === true) {
        console.log('Font loading exceeds timeout 40s or error occurs, run callback anyways')
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
      console.log(error)
      finalCallBack(true)
    })
  }

  waitGroupFontLoadingAndRecord(group: IGroup, callback: (() => void) | undefined = undefined) {
    const recordId = GeneralUtils.generateRandomString(12)
    this.toRecordId = recordId
    this.toSetFlagId = recordId
    this.setIsFontLoading(true)
    const finalCallBack = (isError: boolean | void[]) => {
      if (isError === true) {
        console.log('Font loading exceeds timeout 40s or error occurs, run callback anyways')
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
      console.log(error)
      finalCallBack(true)
    })
  }

  tokenizeString(str: string): string[] {
    // eslint-disable-next-line no-misleading-character-class
    const tokenPattern = /([\s\S]*?(\p{Emoji}(?:\p{Emoji_Modifier}(?:\u{FE0F}\u{20E3}|\u{E0020}-\u{E007E}+\u{E007F})?|\u{FE0F}\u{20E3}|\u{E0020}-\u{E007E}+\u{E007F})?(?:\u{200D}\p{Emoji}(?:\p{Emoji_Modifier}(?:\u{FE0F}\u{20E3}|\u{E0020}-\u{E007E}+\u{E007F})?|\u{FE0F}\u{20E3}|\u{E0020}-\u{E007E}+\u{E007F})?)*)|[\u{1f900}-\u{1f9ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{0030}-\u{0039}\u{FE0F}\u{20E3}\u{E0020}-\u{E007E}+\u{E007F}]|[\d]|.)/gu
    return str.match(tokenPattern) ?? []
  }
}

export default new TextUtils()
