import TextUtils from '@/utils/textUtils'
import { IText } from '@/interfaces/layer'

class Controller {
  shapes = {} as { [key: string]: any }
  constructor () {
    this.shapes = this.getDefaultShapes()
  }

  getDefaultShapes () {
    return {
      none: {},
      curve: {
        bend: 40,
        focus: false
      }
    }
  }

  getCurrentLayer (): IText {
    return TextUtils.getCurrLayer || {}
  }

  getRadiusByBend (bend: number) {
    return bend === 0 ? 10000 : 1000 / Math.pow(Math.abs(bend), 0.6)
  }

  setTextShape (shape: string, attrs?: any): void {
    const { styles: { textShape: styleTextShape } } = this.getCurrentLayer()
    const textShape = {} as any
    const defaultAttrs = this.shapes[shape]
    if (styleTextShape && (styleTextShape as any).name === shape) {
      Object.assign(textShape, styleTextShape, attrs)
    } else {
      Object.assign(textShape, defaultAttrs, attrs, { name: shape })
    }
    TextUtils.updateTextStyles(
      TextUtils.pageIndex,
      TextUtils.layerIndex,
      { textShape }
    )
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
}

export default new Controller()
