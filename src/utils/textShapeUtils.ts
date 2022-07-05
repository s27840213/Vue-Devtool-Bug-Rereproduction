import TextEffectUtils from '@/utils/textEffectUtils'
import TextUtils from '@/utils/textUtils'
import { ILayer, ISpan, IText } from '@/interfaces/layer'
import store from '@/store'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import tiptapUtils from './tiptapUtils'
import mathUtils from './mathUtils'
import { ICurveTextPostParams, ICurveTextPreParams } from '@/interfaces/text'

class Controller {
  shapes = {} as { [key: string]: any }
  constructor() {
    this.shapes = this.getDefaultShapes()
  }

  getDefaultShapes() {
    return {
      none: {},
      curve: {
        bend: 4,
        focus: false
      }
    }
  }

  getSpecSubTextLayer(index: number): IText {
    return TextEffectUtils.getSpecSubTextLayer(index)
  }

  getRadiusByBend(bend: number) {
    return bend === 0 ? 10000 : 1000 / Math.pow(Math.abs(bend), 0.6)
  }

  getTextShapeStyles(layer: IText, shape: string, attrs?: any) {
    const {
      textShape: styleTextShape,
      width,
      height,
      x,
      y
    } = layer.styles
    const props = {} as { [key: string]: any }
    const defaultAttrs = this.shapes[shape]
    const styles = {
      textShape: {},
      writingMode: 'initial'
    } as { [key: string]: any }
    if (styleTextShape && (styleTextShape as any).name === shape) {
      Object.assign(styles.textShape, styleTextShape, attrs)
    } else {
      Object.assign(styles.textShape, defaultAttrs, attrs, { name: shape })
    }
    if (shape === 'none') {
      const { bend } = styleTextShape as any
      const textHW = TextUtils.getTextHW(layer, -1)
      Object.assign(styles, {
        ...textHW,
        textShape: {},
        x: x + ((width - textHW.width) / 2),
        y: +bend < 0 ? y + height - textHW.height : y
      })
      props.widthLimit = -1
    } else { // curve
      const { bend } = styles.textShape as any
      Object.assign(styles, this.getCurveTextProps(layer, +bend))
      props.widthLimit = -1
    }
    return { styles, props }
  }

  cast2number(value: string | number): number {
    if (typeof value === 'string') {
      return parseInt(value, 10)
    }
    return value
  }

  isCurvedText(styles: any): boolean {
    return styles.textShape?.name === 'curve'
  }

  setTextShape(shape: string, attrs?: any): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
    const subLayerIndex = layerUtils.subLayerIdx

    if (subLayerIndex === -1 || targetLayer.type === 'text') {
      for (const idx in layers) {
        const { type } = layers[idx] as IText
        if (type === 'text') {
          const heightOri = layers[idx].styles.height
          const { styles, props } = this.getTextShapeStyles(
            layers[idx],
            shape,
            attrs
          )
          store.commit('UPDATE_specLayerData', {
            pageIndex,
            layerIndex,
            subLayerIndex: +idx,
            styles,
            props
          })
          TextUtils.asSubLayerSizeRefresh(pageIndex, layerIndex, +idx, styles.height, heightOri)
        }
      }
      TextUtils.fixGroupCoordinates(pageIndex, layerIndex)
    } else {
      const heightOri = layers[subLayerIndex].styles.height
      const { styles, props } = this.getTextShapeStyles(
        layers[subLayerIndex],
        shape,
        attrs
      )
      store.commit('UPDATE_specLayerData', {
        pageIndex,
        layerIndex,
        subLayerIndex,
        styles,
        props
      })
      TextUtils.asSubLayerSizeRefresh(pageIndex, layerIndex, subLayerIndex, styles.height, heightOri)
      TextUtils.fixGroupCoordinates(pageIndex, layerIndex)
    }
  }

  convertTextShape(textWidth: number[], bend: number): string[] {
    if (textWidth.length === 0) return []
    const angleOffset = bend >= 0 ? 90 : 270
    const ratioFix = bend >= 0 ? 1 : -1
    const radius = this.getRadiusByBend(bend)
    // 每一段文字寬度對應角度
    const textAngles = textWidth.map(w => (360 * w) / (radius * 2 * Math.PI))
    // 總角度
    const totalAngle = textAngles.reduce((prev, angle) => prev + angle)
    const midY = radius * Math.sin(angleOffset * (Math.PI / 180))
    return textAngles.map((angle: number, idx: number) => {
      // 從90 or 270度開始偏移
      const init = angleOffset + ratioFix * ((totalAngle / 2) - (textAngles.slice(0, idx).reduce((p, c) => p + c, 0)) - (angle / 2))
      const x = radius * Math.cos(init * (Math.PI / 180))
      const y = radius * Math.sin(init * (Math.PI / 180))
      return `translate(${x}px, ${Math.abs(y - midY) * ratioFix}px) rotate(${angleOffset - init}deg)`
    })
  }

  flattenSpans(config: IText): ISpan[] {
    return config.paragraphs.flatMap(
      p =>
        p.spans.flatMap(
          span => [...span.text]
            .map(t => ({ text: t, styles: { ...p.styles, ...span.styles } }))
        )
    )
  }

  getTextHWsBySpans(spans: ISpan[]): { textWidth: number[], textHeight: number[], minHeight: number } {
    const body = document.createElement('div')
    const p = document.createElement('p')

    spans.forEach(spanData => {
      const span = document.createElement('span')
      if (spanData.text === ' ') {
        span.innerHTML = '&nbsp;'
      } else {
        span.textContent = spanData.text
      }

      const spanStyleObject = tiptapUtils.textStylesRaw(spanData.styles)
      spanStyleObject.textIndent = spanStyleObject['letter-spacing'] || 'initial'
      Object.assign(span.style, spanStyleObject)

      span.classList.add('nu-curve-text__span')
      p.appendChild(span)
    })

    const pStyleObject = {
      margin: 0
    }
    Object.assign(p.style, pStyleObject)

    p.classList.add('nu-curve-text__p')
    body.appendChild(p)
    body.style.width = 'max-content'
    body.style.height = 'max-content'
    body.style.writingMode = 'initial'
    body.classList.add('nu-text')
    document.body.appendChild(body)

    const eleSpans = p.querySelectorAll('span.nu-curve-text__span')
    const textWidth = []
    const textHeight = []
    let minHeight = 0
    for (const eleSpan of eleSpans) {
      const { offsetWidth, offsetHeight } = eleSpan as HTMLElement
      textWidth.push(offsetWidth)
      textHeight.push(offsetHeight)
      minHeight = Math.max(minHeight, offsetHeight)
    }

    document.body.removeChild(body)
    return { textWidth, textHeight, minHeight }
  }

  getTextHWs(_content: IText): { textWidth: number[], textHeight: number[], minHeight: number } {
    return this.getTextHWsBySpans(this.flattenSpans(generalUtils.deepCopy(_content)))
  }

  calcArea(transforms: string[], minHeight: number, scale: number, config: IText): { areaWidth: number, areaHeight: number } {
    if (transforms.length < 2) {
      const textHW = TextUtils.getTextHW(config, -1)
      return {
        areaWidth: textHW.width,
        areaHeight: textHW.height
      }
    }
    const positionList = transforms.map(transform => transform.match(/[.\d]+/g) || []) as any
    const midLeng = Math.floor(positionList.length / 2)
    const minY = Math.min.apply(null, positionList.map((position: string[]) => position[1]))
    const maxY = Math.max.apply(null, positionList.map((position: string[]) => position[1]))
    const minX = Math.max(
      Math.max.apply(
        null,
        positionList
          .slice(0, midLeng)
          .map((position: string[]) => position[0])
      ),
      0
    )
    const maxX = Math.max
      .apply(
        null,
        positionList
          .slice(midLeng)
          .map((position: string[]) => position[0])
      )
    return {
      areaWidth: Math.abs(maxX + minX) * 1.3 * scale,
      areaHeight: (Math.abs(maxY - minY) + minHeight) * scale
    }
  }

  getAnchors(config: IText, minHeight: number): { top: number, bottom: number, center: number } {
    const { x, y, width, height } = config.styles
    const center = x + width / 2
    if (this.isCurvedText(config.styles)) {
      const bend = +(config.styles as any).textShape.bend
      return {
        top: bend >= 0 ? y : y + height - minHeight,
        bottom: bend >= 0 ? y + minHeight : y + height,
        center
      }
    } else {
      return {
        top: y,
        bottom: y + minHeight,
        center
      }
    }
  }

  getCurveTextHW(config: IText, bend?: number): { areaWidth: number, areaHeight: number, minHeight: number } {
    bend = bend ?? +((config.styles as any).textShape?.bend ?? 0)
    const scale = config.styles.scale
    const { textWidth, minHeight } = this.getTextHWs(config)
    const transforms = this.convertTextShape(textWidth, bend)
    const { areaWidth, areaHeight } = this.calcArea(transforms, minHeight, scale, config)
    return { areaWidth, areaHeight, minHeight }
  }

  getCurveTextPropsByHW(config: IText, curveTextHW: { areaWidth: number, areaHeight: number, minHeight: number }, bend?: number): { width: number, height: number, x: number, y: number } {
    const { areaWidth, areaHeight, minHeight } = curveTextHW
    bend = bend ?? +((config.styles as any).textShape?.bend ?? 0)
    const { top } = this.getAnchors(config, minHeight)
    const { x, y, width, height, rotate, scale } = config.styles
    const hDiff1 = top !== y ? (height - minHeight * scale) / 2 : (minHeight * scale - height) / 2
    const hDiff2 = +bend < 0 ? (minHeight * scale - areaHeight) / 2 : (areaHeight - minHeight * scale) / 2
    return {
      width: areaWidth,
      height: areaHeight,
      ...this.getNewAnchoredPosition({
        hDiff1,
        hDiff2,
        rotate,
        oldPos: { x, y },
        oldSize: { width, height },
        newSize: { width: areaWidth, height: areaHeight }
      })
    }
  }

  getPreParams(config: IText): ICurveTextPreParams {
    const bendOri: number = +((config.styles as any).textShape?.bend ?? 0)
    const { scale, height } = config.styles
    const wasCurveText = this.isCurvedText(config.styles)
    let minHeight = height
    let hDiff1 = (minHeight * scale - height) / 2
    if (wasCurveText) {
      minHeight = this.getCurveTextHW(config).minHeight
      hDiff1 = bendOri < 0 ? (height - minHeight * scale) / 2 : (minHeight * scale - height) / 2
    }
    return { wasCurveText, bendOri, hDiff1, minHeight }
  }

  getPostParams(config: IText, preParams: ICurveTextPreParams, newSize: { width: number, height: number }): ICurveTextPostParams {
    const { wasCurveText, bendOri, hDiff1, minHeight } = preParams
    const { x, y, width, height, rotate, scale } = config.styles
    if (this.isCurvedText(config.styles)) {
      const bend = +(config.styles as any).textShape?.bend
      const hDiff2 = bend < 0 ? (minHeight * scale - newSize.height) / 2 : (newSize.height - minHeight * scale) / 2
      return {
        hDiff1, hDiff2, rotate, oldPos: { x, y }, oldSize: { width, height }, newSize
      }
    } else {
      let hDiff2
      if (wasCurveText) {
        hDiff2 = +bendOri < 0 ? (minHeight * scale - newSize.height) / 2 : (newSize.height - minHeight * scale) / 2
      } else {
        hDiff2 = (newSize.height - minHeight * scale) / 2
      }
      return {
        hDiff1, hDiff2, rotate, oldPos: { x, y }, oldSize: { width, height }, newSize
      }
    }
  }

  getNewAnchoredPosition(postParams: ICurveTextPostParams): { x: number, y: number } {
    const { hDiff1, hDiff2, rotate, oldPos, oldSize, newSize } = postParams
    return {
      x: oldPos.x + oldSize.width / 2 - (hDiff1 + hDiff2) * mathUtils.sin(rotate) - (newSize.width / 2),
      y: oldPos.y + oldSize.height / 2 + (hDiff1 + hDiff2) * mathUtils.cos(rotate) - (newSize.height / 2)
    }
  }

  getCurveTextProps(config: IText, bend?: number): { width: number, height: number, x: number, y: number } {
    return this.getCurveTextPropsByHW(config, this.getCurveTextHW(config, bend), bend)
  }
}

export default new Controller()
