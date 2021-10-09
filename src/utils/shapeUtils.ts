import { ICoordinate } from '@/interfaces/frame'

class ShapeUtils {
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

  styleFormatter(className: string, styleArray: string[], colorArray: string[], sizeArray: number[], dashArray?: number[], linecap?: string, filled?: boolean): string {
    let style = ''
    for (let i = 0; i < styleArray.length; i++) {
      const tmpStyle = `.${className}S${i}{${styleArray[i]}}`
      style += `${tmpStyle} `
    }
    for (let j = 0; j < colorArray.length; j++) {
      const reg = new RegExp('\\$color\\[' + j + '\\]', 'g')
      style = style.replace(reg, colorArray[j])
    }
    for (let j = 0; j < sizeArray.length; j++) {
      const reg = new RegExp('\\$size\\[' + j + '\\]', 'g')
      style = style.replace(reg, sizeArray[j].toString())
    }
    if (dashArray) {
      const reg = new RegExp('\\$dash', 'g')
      style = style.replace(reg, dashArray.join(' ').replace('1', ((sizeArray?.[0] ?? 1) * 2.5).toString()))
    }
    if (linecap) {
      const reg = new RegExp('\\$cap', 'g')
      style = style.replace(reg, linecap)
    }
    if (filled !== undefined) {
      const fillcolor = filled ? colorArray[0] : 'none'
      const reg = new RegExp('\\$fillcolor', 'g')
      style = style.replace(reg, fillcolor)
    }
    return style
  }

  transFormatter(className: string, transArray: string[], param: any): string {
    let style = ''
    for (let i = 0; i < transArray.length; i++) {
      const tmpStyle = `.${className}T${i}{${transArray[i]}}`
      style += `${tmpStyle} `
    }

    const cSize = param.cSize
    const pSize = param.pSize
    const pDiff = param.pDiff
    const ratioX = 1 + pDiff[0] / pSize[0]
    const ratioY = 1 + pDiff[1] / pSize[1]
    const translateXP = cSize[0] * (1 - ratioX)
    const translateYP = cSize[1] * (1 - ratioY)
    const translateXC = -1 * pSize[0] * (1 - ratioX)
    const translateYC = -1 * pSize[1] * (1 - ratioY)

    const regRatioX = new RegExp('\\$sx', 'g')
    style = style.replace(regRatioX, ratioX.toString())
    const regRatioY = new RegExp('\\$sy', 'g')
    style = style.replace(regRatioY, ratioY.toString())
    const regTransXP = new RegExp('\\$txp', 'g')
    style = style.replace(regTransXP, translateXP.toString())
    const regTransYP = new RegExp('\\$typ', 'g')
    style = style.replace(regTransYP, translateYP.toString())
    const regTransXC = new RegExp('\\$txc', 'g')
    style = style.replace(regTransXC, translateXC.toString())
    const regTransYC = new RegExp('\\$tyc', 'g')
    style = style.replace(regTransYC, translateYC.toString())

    return style
  }

  svgFormatter(svgIn: string, className: string, styleNum: number, transNum: number, mTransNum: number, point?: number[], svgParameters?: number[]): string {
    let svgOut = svgIn
    for (let i = 0; i < styleNum; i++) {
      const reg = new RegExp('\\$style\\[' + i + '\\]', 'g')
      svgOut = svgOut.replace(reg, `${className}S${i}`)
    }
    for (let i = 0; i < transNum; i++) {
      const reg = new RegExp('\\$trans\\[' + i + '\\]', 'g')
      svgOut = svgOut.replace(reg, `${className}T${i}`)
    }
    for (let i = 0; i < mTransNum; i++) {
      const reg = new RegExp('\\$mtrans\\[' + i + '\\]', 'g')
      svgOut = svgOut.replace(reg, `${className}T${i}`)
    }
    const svgReg = new RegExp('\\$svgId', 'g')
    svgOut = svgOut.replace(svgReg, `${className}SVG`)
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
    return svgOut
  }

  markerTransFormatter(className: string, markerTransArray: string[], sizeArray: number[], point: number[], markerWidth: number[]): string {
    let style = ''
    for (let i = 0; i < markerTransArray.length; i++) {
      const tmpStyle = `.${className}T${i}{${markerTransArray[i]}}`
      style += `${tmpStyle} `
    }

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
    const regRoms = new RegExp('\\$roms', 'g')
    style = style.replace(regRoms, roms.toString())
    const regRome = new RegExp('\\$rome', 'g')
    style = style.replace(regRome, rome.toString())
    const regTransXS = new RegExp('\\$txms', 'g')
    style = style.replace(regTransXS, txms.toString())
    const regTransYS = new RegExp('\\$tyms', 'g')
    style = style.replace(regTransYS, tyms.toString())
    const regTransXE = new RegExp('\\$txme', 'g')
    style = style.replace(regTransXE, txme.toString())
    const regTransYE = new RegExp('\\$tyme', 'g')
    style = style.replace(regTransYE, tyme.toString())
    const regFineTuneS = new RegExp('\\$finetunes', 'g')
    style = style.replace(regFineTuneS, `translate(-${markerWidth[0] * scale}px, -${2 * scale}px)`)
    const regFineTuneE = new RegExp('\\$finetunee', 'g')
    style = style.replace(regFineTuneE, `translate(-${markerWidth[1] * scale}px, -${2 * scale}px)`)

    return style
  }

  lineViewBoxFormatter(point: number[], scale: number): string {
    const { width, height, baseDegree } = this.lineDimension(point)
    const dx = 2 * scale * Math.sin(baseDegree)
    const dy = 2 * scale * Math.cos(baseDegree)
    return `${-dx - 1} ${-dy - 1} ${width + 2 * dx + 2} ${height + 2 * dy + 2}` // add 1px in both directions to compensate float error
  }

  computePointForDimensions(quadrant: number, scale: number, width: number, height: number): {point: number[], realWidth: number, realHeight: number} {
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

  lineDimension(point: number[]): {xDiff: number, yDiff: number, width: number, height: number, baseDegree: number} {
    const xDiff = point[2] - point[0]
    const yDiff = point[3] - point[1]
    const width = Math.abs(xDiff)
    const height = Math.abs(yDiff)
    const baseDegree = Math.atan2(height, width)
    return { xDiff, yDiff, width, height, baseDegree }
  }

  updatedDimensions(point: number[], scale: number, styles: {width: number, height: number, initWidth: number, initHeight: number}):
  {width: number, height: number, initWidth: number, initHeight: number} {
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

  getTranslateCompensationForLineWidth(point: number[], styles: {x: number, y: number}, scale: number, newScale: number):
  {x: number, y: number} {
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
}

const shapeUtils = new ShapeUtils()

export default shapeUtils
