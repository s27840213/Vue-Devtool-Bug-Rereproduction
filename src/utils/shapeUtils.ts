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

  styleFormatter(className: string, styleArray: string[], colorArray: string[], sizeArray: number[], dashArray?: number[], linecap?: string): string {
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
      style = style.replace(reg, dashArray.join(' '))
    }
    if (linecap) {
      const reg = new RegExp('\\$cap', 'g')
      style = style.replace(reg, linecap)
    }
    return style
  }

  transFormatter(className: string, transArray: string[], param: any): string {
    let style = ''
    console.log(transArray)
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

  svgFormatter(svgIn: string, className: string, styleNum: number, transNum: number, mTransNum: number, point?: number[]): string {
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
    if (point?.length !== undefined) {
      for (let i = 0; i < point.length; i++) {
        const reg = new RegExp('\\$point\\[' + i + '\\]', 'g')
        svgOut = svgOut.replace(reg, point[i].toString())
      }
    }
    console.log(svgOut)
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

  pointPreprocess(point: number[], markerWidth: number[], trimWidth: number[], scale: number): number[] {
    const { width, height, baseDegree } = this.lineDimension(point)
    const trimxs = scale * markerWidth[0] * Math.cos(baseDegree)
    const trimys = scale * markerWidth[0] * Math.sin(baseDegree)
    const trimxe = scale * markerWidth[1] * Math.cos(baseDegree)
    const trimye = scale * markerWidth[1] * Math.sin(baseDegree)
    const trimedgex = (scale / 2) * Math.cos(baseDegree)
    const trimedgey = (scale / 2) * Math.sin(baseDegree)
    const quadrant = this.getLineQuadrant(point)
    let startPoint: number[]
    let endPoint: number[]
    let startDiff: number[]
    let endDiff: number[]
    let edgeDiff: number[]
    switch (quadrant) {
      case 1:
        startPoint = [0, height]
        endPoint = [width, 0]
        startDiff = [trimxs, -trimys]
        endDiff = [-trimxe, trimye]
        edgeDiff = [trimedgex, -trimedgey]
        break
      case 2:
        startPoint = [width, height]
        endPoint = [0, 0]
        startDiff = [-trimxs, -trimys]
        endDiff = [trimxe, trimye]
        edgeDiff = [-trimedgex, -trimedgey]
        break
      case 3:
        startPoint = [width, 0]
        endPoint = [0, height]
        startDiff = [-trimxs, trimys]
        endDiff = [trimxe, -trimye]
        edgeDiff = [-trimedgex, trimedgey]
        break
      case 4:
        startPoint = [0, 0]
        endPoint = [width, height]
        startDiff = [trimxs, trimys]
        endDiff = [-trimxe, -trimye]
        edgeDiff = [trimedgex, trimedgey]
        break
      default:
        startPoint = [0, 0]
        endPoint = [width, height]
        startDiff = [trimxs, trimys]
        endDiff = [-trimxe, -trimye]
        edgeDiff = [trimedgex, trimedgey]
        break
    }

    if (trimWidth[0]) {
      startPoint = this.vectorAdd(startPoint, startDiff)
      startPoint = this.vectorAdd(startPoint, this.vectorScale(edgeDiff, -1))
    } else {
      startPoint = this.vectorAdd(startPoint, this.vectorScale(edgeDiff, 2))
    }
    if (trimWidth[1]) {
      endPoint = this.vectorAdd(endPoint, endDiff)
      endPoint = this.vectorAdd(endPoint, edgeDiff)
    } else {
      endPoint = this.vectorAdd(endPoint, this.vectorScale(edgeDiff, -2))
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
}

const shapeUtils = new ShapeUtils()

export default shapeUtils
