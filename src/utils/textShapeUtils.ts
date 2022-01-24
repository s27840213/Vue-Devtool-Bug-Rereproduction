import TextEffectUtils from '@/utils/textEffectUtils'
import TextUtils from '@/utils/textUtils'
import { ILayer, IText } from '@/interfaces/layer'
import store from '@/store'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'

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

  getTextHWs(_content: IText): { textWidth: number[], textHeight: number[] } {
    const body = document.createElement('div')
    // const content = GeneralUtils.deepCopy(_content) as IText
    // content.paragraphs.forEach(pData => {
    //   const p = document.createElement('p')
    //   let fontSize = 0
    //   pData.spans.forEach(spanData => {
    //     const span = document.createElement('span')
    //     span.textContent = spanData.text

    //     const spanStyleObject = {}
    //     tiptapUtils.textStyles(spanData.styles)
    //       .split(';')
    //       .forEach(s => {
    //         Object.assign(spanStyleObject, {
    //           [s.split(':')[0].trim()]: s.split(': ')[1].trim()
    //         })
    //       })
    //     Object.assign(span.style, spanStyleObject)

    //     span.classList.add('nu-text__span')
    //     p.appendChild(!spanData.text && pData.spans.length === 1 ? document.createElement('br') : span)
    //     if (spanData.styles.size > fontSize) {
    //       fontSize = spanData.styles.size
    //     }
    //   })

    //   const pStyleObject = {}
    //   tiptapUtils.textStyles(pData.styles)
    //     .split(';')
    //     .forEach(s => {
    //       Object.assign(pStyleObject, {
    //         [s.split(':')[0].trim()]: s.split(':')[1].trim()
    //       })
    //     })
    //   Object.assign(p.style, pStyleObject)

    //   p.classList.add('nu-text__p')
    //   body.appendChild(p)
    // })
    // if (content.styles.writingMode.includes('vertical')) {
    //   body.style.height = widthLimit === -1 ? 'max-content' : `${widthLimit / content.styles.scale}px`
    //   body.style.width = 'max-content'
    // } else {
    //   body.style.width = widthLimit === -1 ? 'max-content' : `${widthLimit / content.styles.scale}px`
    //   body.style.height = 'max-content'
    // }
    // body.classList.add('nu-text')
    // body.style.writingMode = content.styles.writingMode
    // document.body.appendChild(body)

    // const scale = content.styles.scale ?? 1
    // const textHW = {
    //   width: body.style.width !== 'max-content' ? Math.ceil(widthLimit) : Math.ceil(body.getBoundingClientRect().width * scale),
    //   height: body.style.height !== 'max-content' ? Math.ceil(widthLimit) : Math.ceil(body.getBoundingClientRect().height * scale),
    //   body: body
    // }
    // document.body.removeChild(body)
    // return textHW
  }
}

export default new Controller()
