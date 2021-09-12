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

  styleFormatter(className: string, styleArray: string[], colorArray: string[], sizeArray: number[]): string {
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

  svgFormatter(svgIn: string, className: string, styleNum: number, transNum: number): string {
    let svgOut = svgIn
    for (let i = 0; i < styleNum; i++) {
      const reg = new RegExp('\\$style\\[' + i + '\\]', 'g')
      svgOut = svgOut.replace(reg, `${className}S${i}`)
    }
    for (let i = 0; i < transNum; i++) {
      const reg = new RegExp('\\$trans\\[' + i + '\\]', 'g')
      svgOut = svgOut.replace(reg, `${className}T${i}`)
    }
    console.log(svgOut)
    return svgOut
  }
}

const shapeUtils = new ShapeUtils()

export default shapeUtils
