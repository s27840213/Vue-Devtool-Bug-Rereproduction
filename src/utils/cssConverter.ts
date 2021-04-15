/**
 * This file is used to convert properties of layers into CSS-readable properties
 */
import { IStyle, ITextStyle } from '@/interfaces/layer'

interface IStyleMap {
  [key: string]: string
}

const styleMap = {
  width: 'width',
  height: 'height',
  x: 'translateX',
  y: 'translateY',
  scaleX: 'scaleX',
  scaleY: 'scaleY',
  font: 'font-family',
  weight: 'font-weight',
  align: 'text-align',
  lineHeight: 'line-height',
  size: 'font-size',
  color: 'color'
} as IStyleMap

const transformProps: string[] = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate']
const fontProps: string[] = ['font', 'weight', 'align', 'lineHeight', 'size', 'color']

class CssConveter {
  convertTransformStyle(x: number, y: number, scale: number, scaleX: number, scaleY: number, rotate: number): { transform?: string } {
    const tmpArr = []
    if (x !== 0 && x) {
      tmpArr.push(`translateX(${x}px)`)
    }
    if (y !== 0 && y) {
      tmpArr.push(`translateY(${y}px)`)
    }
    if (scale !== 0 && scale !== undefined) {
      tmpArr.push(`scale(${scale})`)
    }
    if (scaleX !== 0 && scaleX !== undefined) {
      tmpArr.push(`scaleX(${scaleX})`)
    }
    if (scaleY !== 0 && scaleY !== undefined) {
      tmpArr.push(`scaleY(${scaleY})`)
    }
    if (rotate !== 0 && rotate !== undefined) {
      tmpArr.push(`rotate(${rotate}deg)`)
    }

    return tmpArr.length > 0 ? {
      transform: tmpArr.join(' ')
    } : {}
  }

  convertFontStyle(sourceStyles: IStyle | ITextStyle): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    fontProps.forEach(prop => {
      if (typeof sourceStyles[prop] !== 'undefined') {
        result[styleMap[prop]] = typeof sourceStyles[prop] === 'number' ? `${sourceStyles[prop]}px` : `${sourceStyles[prop]}`
      }
    })
    return result
  }

  convertDefaultStyle(sourceStyles: IStyle | ITextStyle): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    Object.assign(result,
      { width: typeof sourceStyles.width === 'number' ? `${sourceStyles.width}px` : 'initial' },
      { height: typeof sourceStyles.height === 'number' ? `${sourceStyles.height}px` : 'initial' },
      this.convertTransformStyle(sourceStyles.x, sourceStyles.y, sourceStyles.scale, sourceStyles.scaleX, sourceStyles.scaleY, sourceStyles.rotate))
    return result
  }

  convertAllStyles(sourceStyles: IStyle | ITextStyle): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    // create a deep copy to prevent from changing the original state.
    const tmp = JSON.parse(JSON.stringify(sourceStyles))
    Object.assign(result, this.convertTransformStyle(tmp.x, tmp.y, tmp.scale, tmp.scaleX, tmp.scaleY, tmp.rotate))
    // remove transform properties from tmp to prevent from duplicate key value pair
    transformProps.forEach(prop => {
      delete tmp[prop]
    })

    // convert properties excluding transform properties
    Object.entries(tmp).forEach(([k, v]) => {
      result[styleMap[k]] = typeof v === 'number' ? `${v}px` : `${v}`
    })

    return result
  }
}

export default new CssConveter()
