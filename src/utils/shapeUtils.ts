import store from '@/store'
import { IListServiceContentDataItem } from '@/interfaces/api'
import { AllLayerTypes, IGroup, ILayer, IShape } from '@/interfaces/layer'
import { IMarker } from '@/interfaces/shape'
import AssetUtils from './assetUtils'
import layerUtils from './layerUtils'
import { ILayerInfo } from '@/store/types'
import mappingUtils from './mappingUtils'
import generalUtils from '@/utils/generalUtils'
import pageUtils from './pageUtils'
import zindexUtils from './zindexUtils'
import layerFactary from './layerFactary'
import _ from 'lodash'

class ShapeUtils {
  get hasMultiColors() {
    const currLayer = layerUtils.getCurrLayer

    if (currLayer.type === 'tmp' || currLayer.type === 'group') {
      return this.getSingleColorObjNum >= 2 && !(currLayer as IGroup).layers
        .some(l => l.type === 'shape' && l.active)
    }
    return false
  }

  get getSingleColorObjNum(): number {
    const currLayer = layerUtils.getCurrLayer
    let oneColorObjNum = 0
    for (const layer of (currLayer as IGroup).layers) {
      if (layer.type === 'shape' && (layer as IShape).color && (layer as IShape).color.length === 1) {
        oneColorObjNum++
      }
    }
    return oneColorObjNum
  }

  addStyleTag(styleText: string): Text {
    const style = document.createElement('style') as HTMLStyleElement
    const textNode = document.createTextNode(styleText)
    style.appendChild(textNode)
    document.head.appendChild(style)
    return textNode
  }

  classGenerator(): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const charLength = chars.length
    let className = '_'
    for (let i = 0; i < 8; i++) {
      const rand = Math.floor(Math.random() * charLength)
      className += chars[rand]
    }
    return className
  }

  styleFormatter(className: string, styleArray: string[], colorArray: string[], sizeArray?: number[], dashArray?: number[], linecap?: string, filled?: boolean): string[] {
    let style = styleArray.join('!!')
    if (colorArray) {
      for (let j = 0; j < colorArray.length; j++) {
        const reg = new RegExp('\\$color\\[' + j + '\\]', 'g')
        style = style.replace(reg, colorArray[j])
      }
    }
    if (sizeArray) {
      for (let j = 0; j < sizeArray.length; j++) {
        const reg = new RegExp('\\$size\\[' + j + '\\]', 'g')
        style = style.replace(reg, sizeArray[j].toString())
      }
    }
    if (dashArray) {
      style = style.replace(/\$dash/g, dashArray.join(' ').replace('1', ((sizeArray?.[0] ?? 1) * 2.5).toString()))
    }
    if (linecap) {
      style = style.replace(/\$cap/g, linecap)
    }
    if (filled !== undefined) {
      const fillcolor = filled ? colorArray[0] : 'none'
      style = style.replace(/\$fillcolor/g, fillcolor)
    }
    return style.split('!!')
  }

  transFormatter(className: string, transArray: string[], param: any): string[] {
    let style = transArray.join('!!')

    const cSize = param.cSize
    const pSize = param.pSize
    const pDiff = param.pDiff
    const ratioX = 1 + pDiff[0] / pSize[0]
    const ratioY = 1 + pDiff[1] / pSize[1]
    const translateXP = cSize[0] * (1 - ratioX)
    const translateYP = cSize[1] * (1 - ratioY)
    const translateXC = -1 * pSize[0] * (1 - ratioX)
    const translateYC = -1 * pSize[1] * (1 - ratioY)

    style = style.replace(/\$sx/g, ratioX.toString())
    style = style.replace(/\$sy/g, ratioY.toString())
    style = style.replace(/\$txp/g, translateXP.toString())
    style = style.replace(/\$typ/g, translateYP.toString())
    style = style.replace(/\$txc/g, translateXC.toString())
    style = style.replace(/\$tyc/g, translateYC.toString())

    return style.split('!!')
  }

  svgFormatter(svgIn: string, className: string, styleTextContent: string[], transTextContent: string[], point?: number[], svgParameters?: number[], pDiff?: number[]): string {
    let svgOut = svgIn
    for (let i = 0; i < styleTextContent.length; i++) {
      const regId = new RegExp('\\$style\\[' + i + '\\]_ID', 'g')
      svgOut = svgOut.replace(regId, `${className}S${i}_ID`)
      const reg = new RegExp('\\$style\\[' + i + '\\]', 'g')
      svgOut = svgOut.replace(reg, `${styleTextContent[i]}`)
    }
    for (let i = 0; i < transTextContent.length; i++) {
      const reg = new RegExp('\\$trans\\[' + i + '\\]', 'g')
      svgOut = svgOut.replace(reg, `${transTextContent[i]}`)
    }
    for (let i = 0; i < transTextContent.length; i++) {
      const reg = new RegExp('\\$mtrans\\[' + i + '\\]', 'g')
      svgOut = svgOut.replace(reg, `${transTextContent[i]}`)
    }
    svgOut = svgOut.replace(/\$svgId/g, `${className}SVG`)
    if (point?.length !== undefined) {
      for (let i = 0; i < point.length; i++) {
        const reg = new RegExp('\\$point\\[' + i + '\\]', 'g')
        svgOut = svgOut.replace(reg, point[i].toString())
      }
    }
    if (svgParameters?.length !== undefined) {
      for (let i = 0; i < svgParameters.length; i++) {
        const reg = new RegExp('\\$svgParam\\[' + i + '\\]', 'g')
        svgOut = svgOut.replace(reg, svgParameters[i].toString())
      }
    }
    if (pDiff !== undefined) {
      svgOut = svgOut.replace(/\$patchedX\(([.\d]+)\)/g, (m, p1) => {
        return Math.max((Number(p1) + pDiff[0]), 0).toString()
      })
      svgOut = svgOut.replace(/\$patchedY\(([.\d]+)\)/g, (m, p1) => {
        return Math.max((Number(p1) + pDiff[1]), 0).toString()
      })
    }
    /**
     * To solve performance issue on Safari, inline style should be used instead of class.
     * However, sometimes the S3 provided svg string has already contained inline style for
     * some svg elements.
     * The following code is meant to merge the style computed from user settings and the style
     * originally on the svg elements.
     */
    // convert svg string to doc object
    const svgDoc = (new DOMParser()).parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${svgOut}</svg>`, 'image/svg+xml')
    // get the parent element containing top-level svg elements
    const svg = svgDoc.childNodes[0]
    this.mergeClassAndStyle(svg)
    svgOut = (new XMLSerializer()).serializeToString(svg)
    // since string produced by XMLSerializer contains root svg tag, remove it in the following:
    svgOut = svgOut.replace(/<svg[^>]*>/g, '')
    svgOut = svgOut.replace(/<\/svg>/g, '')
    return svgOut
  }

  mergeClassAndStyle(root: ChildNode) {
    for (const child of root.childNodes) {
      const node = child as SVGElement
      if (node.attributes) {
        const classContent = node.attributes.getNamedItem('class')?.value ?? ''
        const styleContent = node.attributes.getNamedItem('style')?.value ?? ''
        const mergedContent = classContent + styleContent
        node.removeAttribute('class')
        if (mergedContent) {
          node.setAttribute('style', mergedContent)
        }
      }
      if (child.hasChildNodes()) {
        this.mergeClassAndStyle(child)
      }
    }
  }

  /**
   *
   * Check if the fetched json data is currently converted from svg to img
   * If so, call svgImgHandler to handle the transforming
   */
  isSvgImg(jsonData: any): boolean {
    if (jsonData.is_img) {
      return true
    }
    return false
  }

  async svgImgHandler(layerInfo: ILayerInfo, config: IShape) {
    const { designId, styles: { x, y, width, height, horizontalFlip, verticalFlip, rotate, opacity } } = config
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    // let layerScale = store.state.pageScaleRatio
    let primaryLayer
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      primaryLayer = layerUtils.getLayer(pageIndex, layerIndex) as IGroup
    }
    const srcObj = {
      type: 'svg',
      userId: '',
      assetId: designId
    }
    const image = layerFactary.newImage({
      srcObj,
      styles: { x, y, width, height, horizontalFlip, verticalFlip, rotate, opacity },
      parentLayerStyles: primaryLayer?.styles
    })

    if (primaryLayer) {
      layerUtils.deleteSubLayer(pageIndex, layerIndex, subLayerIdx ?? -1)
      layerUtils.addSubLayer(pageIndex, layerIndex, subLayerIdx ?? -1, image)
    } else {
      layerUtils.deleteLayer(pageIndex, layerIndex)
      layerUtils.addLayersToPos(pageIndex, [image], layerIndex)
      zindexUtils.reassignZindex(pageIndex)
    }
  }

  async fetchSvg(config: IShape): Promise<IShape> {
    const asset = {
      type: 5,
      id: config.designId,
      ver: store.getters['user/getVerUni']
    }
    return (await AssetUtils.fetch(asset)).jsonData as IShape
  }

  async addComputableInfo(layer: ILayer) {
    if (layer.type === 'shape') {
      const theLayer = layer as IShape
      const svgs: string[] = []
      let dummy
      switch (theLayer.category) {
        case 'D':
          theLayer.styleArray = ['stroke:$color[0];stroke-width:$size[0];stroke-dasharray:$dash;stroke-linecap:$cap']
          theLayer.markerTransArray = [
            'transform: translate($txmspx, $tymspx) rotate($romsdeg) $finetunes scale($size[0]);',
            'transform: translate($txmepx, $tymepx) rotate($romedeg) $finetunee scale($size[0]);'
          ]
          theLayer.markerWidth = []
          theLayer.trimWidth = []
          theLayer.trimOffset = []
          for (const markerId of theLayer.markerId ?? []) {
            if (markerId === 'none') {
              theLayer.styleArray.push('')
              dummy = theLayer.markerWidth?.push(0)
              dummy = theLayer.trimWidth?.push(undefined)
              dummy = theLayer.trimOffset?.push(-1)
              svgs.push('')
            } else {
              const marker: IListServiceContentDataItem = {
                id: markerId,
                type: 9,
                ver: store.getters['user/getVerUni']
              }
              const markerContent = (await AssetUtils.get(marker)).jsonData as IMarker
              theLayer.styleArray.push(markerContent.styleArray[0])
              dummy = theLayer.markerWidth?.push(markerContent.vSize[0])
              dummy = theLayer.trimWidth?.push(markerContent.trimWidth)
              dummy = theLayer.trimOffset?.push(markerContent.trimOffset ?? -1)
              svgs.push(markerContent.svg)
            }
          }
          theLayer.svg = shapeUtils.genLineSvgTemplate(svgs[0], svgs[1])
          theLayer.pDiff = [0, 0]
          theLayer.pSize = [0, 0]
          theLayer.cSize = [0, 0]
          theLayer.vSize = [0, 0]
          theLayer.className = theLayer.className ? theLayer.className : shapeUtils.classGenerator()
          break
        case 'E':
          theLayer.styleArray = ['fill:$fillcolor; stroke:$color[0]; stroke-width:calc(2*$size[0]px)']
          theLayer.svg = shapeUtils.genBasicShapeSvgTemplate(theLayer.shapeType ?? '')
          theLayer.pDiff = [0, 0]
          theLayer.pSize = [0, 0]
          theLayer.cSize = [0, 0]
          theLayer.className = theLayer.className ? theLayer.className : shapeUtils.classGenerator()
          break
      }
    }
  }

  markerTransFormatter(className: string, markerTransArray: string[], sizeArray: number[], point: number[], markerWidth: number[]): string[] {
    let style = markerTransArray.join('!!')

    const quadrant = this.getLineQuadrant(point)

    const { width, height, baseDegree } = this.lineDimension(point)
    const baseDegreeDeg = baseDegree / Math.PI * 180
    let roms = 0
    let rome = 0
    let txms = 0
    let tyms = 0
    let txme = 0
    let tyme = 0
    switch (quadrant) {
      case 1:
        [txms, tyms, txme, tyme] = [0, height, width, 0]
        rome = -baseDegreeDeg
        break
      case 2:
        [txms, tyms, txme, tyme] = [width, height, 0, 0]
        rome = baseDegreeDeg + 180
        break
      case 3:
        [txms, tyms, txme, tyme] = [width, 0, 0, height]
        rome = 180 - baseDegreeDeg
        break
      case 4:
        [txms, tyms, txme, tyme] = [0, 0, width, height]
        rome = baseDegreeDeg
        break
    }
    roms = rome + 180

    for (let j = 0; j < sizeArray.length; j++) {
      const reg = new RegExp('\\$size\\[' + j + '\\]', 'g')
      style = style.replace(reg, sizeArray[j].toString())
    }
    const scale = sizeArray[0]
    style = style.replace(/\$roms/g, roms.toString())
    style = style.replace(/\$rome/g, rome.toString())
    style = style.replace(/\$txms/g, txms.toString())
    style = style.replace(/\$tyms/g, tyms.toString())
    style = style.replace(/\$txme/g, txme.toString())
    style = style.replace(/\$tyme/g, tyme.toString())
    if (markerWidth && markerWidth.length > 1) {
      style = style.replace(/\$finetunes/g, `translate(-${markerWidth[0] * scale}px, -${2 * scale}px)`)
      style = style.replace(/\$finetunee/g, `translate(-${markerWidth[1] * scale}px, -${2 * scale}px)`)
    }

    return style.split('!!')
  }

  lineViewBoxFormatter(point: number[], scale: number): string {
    const { width, height, baseDegree } = this.lineDimension(point)
    const dx = 2 * scale * Math.sin(baseDegree)
    const dy = 2 * scale * Math.cos(baseDegree)
    return `${-dx - 1} ${-dy - 1} ${width + 2 * dx + 2} ${height + 2 * dy + 2}` // add 1px in both directions to compensate float error
  }

  computePointForDimensions(quadrant: number, scale: number, width: number, height: number): { point: number[], realWidth: number, realHeight: number } {
    const baseDegree = Math.atan2(height, width)
    const dx = 2 * scale * Math.sin(baseDegree)
    const dy = 2 * scale * Math.cos(baseDegree)
    let point: number[]
    switch (quadrant) {
      case 1:
        point = [0, height, width, 0]
        break
      case 2:
        point = [width, height, 0, 0]
        break
      case 3:
        point = [width, 0, 0, height]
        break
      case 4:
        point = [0, 0, width, height]
        break
      default:
        point = [0, 0, width, height]
        break
    }
    return {
      point: point,
      realWidth: width + 2 * dx + 2,
      realHeight: height + 2 * dy + 2
    }
  }

  computePointForAngle(length: number, angle: number, scale: number): { point: number[], realWidth: number, realHeight: number } {
    const rad = angle * Math.PI / 180
    const vectX = length * Math.cos(rad)
    const vectY = length * Math.sin(rad)
    const point = [0, 0, vectX, vectY]
    const { width, height, baseDegree } = this.lineDimension(point)
    const dx = 2 * scale * Math.sin(baseDegree)
    const dy = 2 * scale * Math.cos(baseDegree)
    return {
      point: point,
      realWidth: width + 2 * dx + 2,
      realHeight: height + 2 * dy + 2
    }
  }

  lineCenterRotate(point: number[], angle: number, scale: number, angleDiff = true): {
    point: number[], realWidth: number, realHeight: number, dx: number, dy: number
  } {
    const { width, height, xDiff, yDiff, baseDegree } = this.lineDimension(point)
    const oldDx = 2 * scale * Math.sin(baseDegree)
    const oldDy = 2 * scale * Math.cos(baseDegree)
    const oldRad = Math.atan2(yDiff, xDiff)
    const oldWidth = width + 2 * oldDx + 2
    const oldHeight = height + 2 * oldDy + 2
    const hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
    const newAngle = angleDiff ? (oldRad / Math.PI * 180 + angle) % 360 : angle % 360
    const { point: newPoint, realWidth, realHeight } = this.computePointForAngle(hypotenuse, newAngle, scale)
    return {
      point: newPoint,
      realWidth,
      realHeight,
      dx: (oldWidth - realWidth) / 2,
      dy: (oldHeight - realHeight) / 2
    }
  }

  getLineQuadrant(point: number[]): number {
    if (point?.length !== 4) {
      throw new Error(`input point coordinates (${point}) are invalid`)
    }

    const quadrantMapping = [
      [2, 1],
      [3, 4]
    ]

    const { xDiff, yDiff, width, height } = this.lineDimension(point)

    const towardRight = Math.round(((xDiff + Number.EPSILON) / (width + Number.EPSILON) + 1) / 2) // 0: left, 1: right
    const towardBottom = Math.round(((yDiff + Number.EPSILON) / (height + Number.EPSILON) + 1) / 2) // 0: top, 1: bottom

    return quadrantMapping[towardBottom][towardRight]
  }

  vectorAdd(point: number[], diff: number[]): number[] {
    const result: number[] = []
    for (let i = 0; i < point.length; i++) {
      result[i] = point[i] + diff[i]
    }
    return result
  }

  vectorScale(point: number[], scale: number): number[] {
    const result: number[] = []
    for (let i = 0; i < point.length; i++) {
      result[i] = point[i] * scale
    }
    return result
  }

  pointPreprocess(point: number[], markerWidth: number[], trimWidth: boolean[], scale: number, linecap: string, trimOffset: number[]): number[] {
    if (markerWidth === undefined || trimWidth === undefined || trimOffset === undefined || trimOffset?.length !== 2) return point
    const { width, height, baseDegree } = this.lineDimension(point)
    const [startTrimOffset, endTrimOffset] = trimOffset
    const cosine = Math.cos(baseDegree)
    const sine = Math.sin(baseDegree)
    const trimxs = scale * markerWidth[0] * cosine
    const trimys = scale * markerWidth[0] * sine
    const trimxe = scale * markerWidth[1] * cosine
    const trimye = scale * markerWidth[1] * sine
    const trimxoffsets = scale * startTrimOffset * cosine
    const trimyoffsets = scale * startTrimOffset * sine
    const trimxoffsete = scale * endTrimOffset * cosine
    const trimyoffsete = scale * endTrimOffset * sine
    const trimedgex = (scale / 2) * cosine
    const trimedgey = (scale / 2) * sine
    const quadrant = this.getLineQuadrant(point)
    let startPoint: number[]
    let endPoint: number[]
    let startDiff: number[]
    let endDiff: number[]
    let edgeDiff: number[]
    let startOffset: number[]
    let endOffset: number[]
    switch (quadrant) {
      case 1:
        startPoint = [0, height]
        endPoint = [width, 0]
        startDiff = [trimxs, -trimys]
        endDiff = [-trimxe, trimye]
        startOffset = [trimxoffsets, -trimyoffsets]
        endOffset = [-trimxoffsete, trimyoffsete]
        edgeDiff = [trimedgex, -trimedgey]
        break
      case 2:
        startPoint = [width, height]
        endPoint = [0, 0]
        startDiff = [-trimxs, -trimys]
        endDiff = [trimxe, trimye]
        startOffset = [-trimxoffsets, -trimyoffsets]
        endOffset = [trimxoffsete, trimyoffsete]
        edgeDiff = [-trimedgex, -trimedgey]
        break
      case 3:
        startPoint = [width, 0]
        endPoint = [0, height]
        startDiff = [-trimxs, trimys]
        endDiff = [trimxe, -trimye]
        startOffset = [-trimxoffsets, trimyoffsets]
        endOffset = [trimxoffsete, -trimyoffsete]
        edgeDiff = [-trimedgex, trimedgey]
        break
      case 4:
        startPoint = [0, 0]
        endPoint = [width, height]
        startDiff = [trimxs, trimys]
        endDiff = [-trimxe, -trimye]
        startOffset = [trimxoffsets, trimyoffsets]
        endOffset = [-trimxoffsete, -trimyoffsete]
        edgeDiff = [trimedgex, trimedgey]
        break
      default:
        startPoint = [0, 0]
        endPoint = [width, height]
        startDiff = [trimxs, trimys]
        endDiff = [-trimxe, -trimye]
        startOffset = [trimxoffsets, trimyoffsets]
        endOffset = [-trimxoffsete, -trimyoffsete]
        edgeDiff = [trimedgex, trimedgey]
        break
    }

    if (startTrimOffset > 0) {
      startPoint = this.vectorAdd(startPoint, startOffset)
    } else if (trimWidth[0]) {
      startPoint = this.vectorAdd(startPoint, startDiff)
      startPoint = this.vectorAdd(startPoint, this.vectorScale(edgeDiff, -1))
    } else if (trimWidth[0] === false || linecap === 'round') { // false or null && round cap
      startPoint = this.vectorAdd(startPoint, edgeDiff)
    }
    if (endTrimOffset > 0) {
      endPoint = this.vectorAdd(endPoint, endOffset)
    } else if (trimWidth[1]) {
      endPoint = this.vectorAdd(endPoint, endDiff)
      endPoint = this.vectorAdd(endPoint, edgeDiff)
    } else if (trimWidth[1] === false || linecap === 'round') { // false or null && round cap
      endPoint = this.vectorAdd(endPoint, this.vectorScale(edgeDiff, -1))
    }

    return [...startPoint, ...endPoint]
  }

  lineDimension(point: number[]): { xDiff: number, yDiff: number, width: number, height: number, baseDegree: number, angle: number } {
    const xDiff = point[2] - point[0]
    const yDiff = point[3] - point[1]
    const width = Math.abs(xDiff)
    const height = Math.abs(yDiff)
    const baseDegree = Math.atan2(height, width)
    const angle = Math.atan2(yDiff, xDiff)
    return { xDiff, yDiff, width, height, baseDegree, angle }
  }

  updatedDimensions(point: number[], scale: number, styles: { width: number, height: number, initWidth: number, initHeight: number }): { width: number, height: number, initWidth: number, initHeight: number } {
    const ratio = styles.width / styles.initWidth
    const { width, height, baseDegree } = this.lineDimension(point)
    const dx = 2 * scale * Math.sin(baseDegree)
    const dy = 2 * scale * Math.cos(baseDegree)

    const res = {
      initWidth: width + 2 * dx + 2,
      initHeight: height + 2 * dy + 2,
      width: 0,
      height: 0
    }

    res.width = res.initWidth * ratio
    res.height = res.initHeight * ratio

    return res
  }

  getTranslateCompensationForLineWidth(point: number[], styles: { x: number, y: number }, scale: number, newScale: number): { x: number, y: number } {
    const { baseDegree } = this.lineDimension(point)
    const dx = 2 * (scale - newScale) * Math.sin(baseDegree)
    const dy = 2 * (scale - newScale) * Math.cos(baseDegree)

    return {
      x: styles.x + dx,
      y: styles.y + dy
    }
  }

  genLineSvgTemplate(startSvg: string, endSvg: string): string {
    return `<g class="$mtrans[0] $style[1]">${startSvg}</g><line class="$style[0]" x1="$point[0]" y1="$point[1]" x2="$point[2]" y2="$point[3]"/><g class="$mtrans[1] $style[2]">${endSvg}</g>`
  }

  genBasicShapeSvgTemplate(shapeType: string): string {
    switch (shapeType) {
      case 'e':
        return '<ellipse id="$svgId" cx="$svgParam[0]" cy="$svgParam[1]" rx="$svgParam[0]" ry="$svgParam[1]"/>'
      case 'r':
        return '<path id="$svgId" d="M $svgParam[0] 0 a $svgParam[0] $svgParam[0] 0 0 0 -$svgParam[0] $svgParam[0] v $svgParam[2] a $svgParam[0] $svgParam[0] 0 0 0 $svgParam[0] $svgParam[0] h $svgParam[1] a $svgParam[0] $svgParam[0] 0 0 0 $svgParam[0] -$svgParam[0] v -$svgParam[2] a $svgParam[0] $svgParam[0] 0 0 0 -$svgParam[0] -$svgParam[0] z"/>'
      case 't':
        return '<path id="$svgId" d="M $svgParam[1] 0 m $svgParam[2] $svgParam[3] a $svgParam[0] $svgParam[0] 0 0 0 -$svgParam[9] 0 l -$svgParam[4] $svgParam[5] a $svgParam[0] $svgParam[0] 0 0 0 $svgParam[6] $svgParam[7] h $svgParam[8] a $svgParam[0] $svgParam[0] 0 0 0 $svgParam[6] -$svgParam[7] z"/>'
      default:
        return '<ellipse id="$svgId" cx="$svgParam[0]" cy="$svgParam[1]" rx="$svgParam[0]" ry="$svgParam[1]"/>'
    }
  }

  svgParameters(shapeType: string, vSize: number[], size: number[]): number[] {
    const appliedCorRadius = this.clipCorRad(shapeType, vSize, size)
    switch (shapeType) {
      case 'e':
        return [vSize[0] / 2, vSize[1] / 2]
      case 'r':
        return [appliedCorRadius, vSize[0] - 2 * appliedCorRadius, vSize[1] - 2 * appliedCorRadius]
      case 't':
        return this.triangleSvgParameters(vSize, appliedCorRadius)
      default:
        return []
    }
  }

  triangleSvgParameters(vSize: number[], corRad: number): number[] {
    const [width, height] = vSize
    const halfWidth = width / 2
    const hypotenuse = Math.sqrt(Math.pow(halfWidth, 2) + Math.pow(height, 2))
    const sineA = height / hypotenuse
    const cosineA = halfWidth / hypotenuse
    const edgeTop = corRad * (height / halfWidth)
    const edgeSide = corRad / Math.sqrt((1 - cosineA) / (1 + cosineA))
    const trimmedH = Math.max(hypotenuse - edgeSide - edgeTop, 0)
    // Math.max(value, 0) prevents computation error from resulting negative value
    return [corRad, halfWidth, edgeTop * cosineA, edgeTop * sineA, trimmedH * cosineA, trimmedH * sineA,
      edgeSide * (1 - cosineA), edgeSide * sineA, Math.max(width - 2 * edgeSide, 0), 2 * edgeTop * cosineA]
    // r W etcosA etsinA (H-es-et)cosA (H-es-et)sinA es-escosA essinA w-2es 2etcosA
  }

  getMaxCorRad(shapeType: string, vSize: number[]): number {
    let smallerSide: number
    let halfWidth: number
    let height: number
    let innerHypotenuse: number

    switch (shapeType) {
      case 'r':
        smallerSide = Math.min(...vSize)
        return smallerSide / 2
      case 't':
        halfWidth = vSize[0] / 2
        height = vSize[1]
        innerHypotenuse = Math.sqrt(Math.pow(height, 2) + Math.pow(halfWidth, 2))
        return halfWidth * Math.sqrt((innerHypotenuse - halfWidth) / (innerHypotenuse + halfWidth))
      default:
        return Number.EPSILON
    }
  }

  clipCorRad(shapeType: string, vSize: number[], size: number[]): number {
    const maxCorRad = this.getMaxCorRad(shapeType, vSize)
    return Math.min(size[1], maxCorRad)
  }

  flipLine(point: number[], horizontalFlip: boolean, verticalFlip: boolean): number[] {
    const newPoint = [...point]
    const { width, height, xDiff, yDiff } = this.lineDimension(point)
    if (horizontalFlip) {
      if (xDiff > 0) {
        newPoint[0] += 2 * width
      } else {
        newPoint[0] -= 2 * width
      }
    }
    if (verticalFlip) {
      if (yDiff > 0) {
        newPoint[1] += 2 * height
      } else {
        newPoint[1] -= 2 * height
      }
    }
    return newPoint
  }

  setLineWidth(value: number) {
    const { min, max } = mappingUtils.mappingMinMax('lineWidth')
    const lineWidth = _.floor(generalUtils.boundValue(value, min, max), 2)
    const { getCurrLayer: currLayer } = layerUtils
    const { point, styles, size } = (currLayer as IShape)

    layerUtils.updateLayerProps(
      pageUtils.currFocusPageIndex,
      layerUtils.layerIndex,
      { size: [lineWidth, ...(size ?? []).slice(1)] }
    )

    const isLine = currLayer.type === 'shape' && currLayer.category === 'D'
    if (isLine) {
      const trans = shapeUtils.getTranslateCompensationForLineWidth(point ?? [], styles, size?.[0] ?? 1, lineWidth)
      layerUtils.updateLayerStyles(
        pageUtils.currFocusPageIndex,
        layerUtils.layerIndex,
        {
          x: trans.x,
          y: trans.y
        }
      )
    }
  }

  isLine(config: AllLayerTypes): boolean {
    return config.type === 'shape' && config.category === 'D'
  }

  isBasicShape(config: AllLayerTypes): boolean {
    return config.type === 'shape' && config.category === 'E'
  }
}

const shapeUtils = new ShapeUtils()

export default shapeUtils
