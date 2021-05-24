import { IShape, IText, IImage, IGroup, IStyle, ITextStyle, ITmp } from '@/interfaces/layer'

import store from '@/store'

class MathUtils {
  cos(angle: number) {
    const angleInRad = angle * Math.PI / 180
    return Math.cos(angleInRad)
  }

  sin(angle: number) {
    const angleInRad = angle * Math.PI / 180
    return Math.sin(angleInRad)
  }

  getCenter(styles: IStyle | ITextStyle) {
    return {
      x: styles.x + ((styles.width as number) / 2),
      y: styles.y + ((styles.height as number) / 2)
    }
  }

  getRotatedPoint(angle: number, origin: { x: number, y: number }, initPos: { x: number, y: number }) {
    const tempX = initPos.x - origin.x
    const tempY = initPos.y - origin.y
    return {
      x: origin.x + tempX * this.cos(angle) - tempY * this.sin(angle),
      y: origin.y + tempX * this.sin(angle) + tempY * this.cos(angle)
    }
  }

  getBounding(layer: IShape | IText | IImage | IGroup | ITmp) {
    const angle = layer.styles.rotate
    const origin = this.getCenter(layer.styles)
    const initStyles = { x: layer.styles.x, y: layer.styles.y, width: layer.styles.width, height: layer.styles.height }
    const points = [
      [initStyles.x, initStyles.y],
      [initStyles.x + initStyles.width, initStyles.y],
      [initStyles.x, initStyles.y + initStyles.height],
      [initStyles.x + initStyles.width, initStyles.y + initStyles.height]
    ]
    let minX = Number.MAX_SAFE_INTEGER
    let minY = Number.MAX_SAFE_INTEGER
    let maxX = Number.MIN_SAFE_INTEGER
    let maxY = Number.MIN_SAFE_INTEGER

    points.forEach((point: number[]) => {
      const tmp = this.getRotatedPoint(angle, origin, { x: point[0], y: point[1] })
      minX = Math.min(minX, tmp.x)
      minY = Math.min(minY, tmp.y)
      maxX = Math.max(maxX, tmp.x)
      maxY = Math.max(maxY, tmp.y)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  getActualMoveOffset(x: number, y: number) {
    const scaleRatio = store.getters.getPageScaleRatio
    // console.log(x, y, x * (100 / scaleRatio), y * (100 / scaleRatio), scaleRatio)
    return {
      offsetX: x * (100 / scaleRatio),
      offsetY: y * (100 / scaleRatio)
    }
  }
}

const mathUtils = new MathUtils()
export default mathUtils
