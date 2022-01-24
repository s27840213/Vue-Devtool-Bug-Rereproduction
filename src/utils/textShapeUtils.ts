import TextEffectUtils from '@/utils/textEffectUtils'
import TextUtils from '@/utils/textUtils'
import { ILayer, ISpan, IText } from '@/interfaces/layer'
import store from '@/store'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import tiptapUtils from './tiptapUtils'

class Controller {
  shapes = {} as { [key: string]: any }
  constructor () {
    this.shapes = this.getDefaultShapes()
  }

  getDefaultShapes () {
    return {
      none: {},
      curve: {
        bend: 4,
        focus: false
      }
    }
  }

  getSpecSubTextLayer (index: number): IText {
    return TextEffectUtils.getSpecSubTextLayer(index)
  }

  getRadiusByBend (bend: number) {
    return bend === 0 ? 10000 : 1000 / Math.pow(Math.abs(bend), 0.6)
  }

  getTextShapeStyles (layer: IText, shape: string, attrs?: any) {
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
    }
    return { styles, props }
  }

  cast2number (value: string | number): number {
    if (typeof value === 'string') {
      return parseInt(value, 10)
    }
    return value
  }

  isCurvedText (styles: any): boolean {
    return styles.textShape?.name === 'curve'
  }

  hasDifferentBend (styles: any, bendToSet: string | number): boolean {
    return this.cast2number(styles.textShape.bend) !== this.cast2number(bendToSet)
  }

  setTextShape (shape: string, attrs?: any): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
    const subLayerIndex = layerUtils.subLayerIdx

    if (subLayerIndex === -1 || targetLayer.type === 'text') {
      for (const idx in layers) {
        const { type } = layers[idx] as IText
        if (type === 'text') {
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
        }
      }
    } else {
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
    }
  }

  convertTextShape (textWidth: number[], bend: number): string[] {
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
      span.textContent = spanData.text

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
}

export default new Controller()
