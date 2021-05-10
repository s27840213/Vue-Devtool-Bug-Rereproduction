import { IShape, IText, IImage, IGroup, IStyle, ITextStyle, ITmpStyle, IGroupStyle } from '@/interfaces/layer'

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

  getInitCenter(styles: ITmpStyle | IGroupStyle) {
    return {
      x: styles.initX + ((styles.initWidth as number) / 2),
      y: styles.initY + ((styles.initHeight as number) / 2)
    }
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
}

const mathUtils = new MathUtils()
export default mathUtils
