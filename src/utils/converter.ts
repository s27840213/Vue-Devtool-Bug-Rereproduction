/* eslint-disable dot-notation */
/* eslint-disable arrow-body-style */
/* eslint-disable import/prefer-default-export */
/* eslint-disable quote-props */
import { IStyle, ITextStyle } from '@/interfaces/layer'

interface IStyleMap {
  [key: string]: string
}

const styleMap = {
  'width': 'width',
  'height': 'height',
  'x': 'translateX',
  'y': 'translateY',
  'scaleX': 'scaleX',
  'scaleY': 'scaleY',
  'font': 'font-family',
  'weight': 'font-weight',
  'align': 'text-align',
  'lineHeight': 'line-height',
  'size': 'font-size',
  'color': 'color'
} as IStyleMap

const transformProps: string[] = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate']
const fontProps: string[] = ['font', 'weight', 'align', 'lineHeight', 'size', 'color']

export function convertTransformStyle(x: number, y: number, scale: number, scaleX: number, scaleY: number, rotate: number): { transform?: string } {
  const tmpArr = []
  if (x !== 0) {
    tmpArr.push(`translateX(${x}px)`)
  }
  if (y !== 0) {
    tmpArr.push(`translateY(${x}px)`)
  }
  if (scale !== 0) {
    tmpArr.push(`scale(${scale})`)
  }
  if (scaleX !== 0) {
    tmpArr.push(`scaleX(${scaleX})`)
  }
  if (scaleY !== 0) {
    tmpArr.push(`scaleY(${scaleY})`)
  }
  if (rotate !== 0) {
    tmpArr.push(`rotate(${rotate}deg)`)
  }
  return tmpArr.length > 0 ? {
    transform: tmpArr.join(' ')
  } : {}
}

export function convertFontStyle(sourceStyles: IStyle | ITextStyle): { [key: string]: string } {
  const result: { [key: string]: string } = {}
  fontProps.forEach(prop => {
    if (typeof sourceStyles[prop] !== 'undefined') {
      result[styleMap[prop]] = typeof sourceStyles[prop] === 'number' ? `${sourceStyles[prop]}px` : `${sourceStyles[prop]}`
    }
  })
  return result
}

export function convertDefaultStyle(sourceStyles: IStyle | ITextStyle): { [key: string]: string } {
  const result: { [key: string]: string } = {}
  Object.assign(result,
    { width: typeof sourceStyles.width === 'number' ? `${sourceStyles.width}px` : 'initial' },
    { height: typeof sourceStyles.height === 'number' ? `${sourceStyles.height}px` : 'initial' },
    convertTransformStyle(sourceStyles.x, sourceStyles.y, sourceStyles.scale, sourceStyles.scaleX, sourceStyles.scaleY, sourceStyles.rotate))
  return result
}

export function convertAllStyles(sourceStyles: IStyle | ITextStyle): { [key: string]: string } {
  const result: { [key: string]: string } = {}
  // create a deep copy to prevent from changing the original state.
  const tmp = JSON.parse(JSON.stringify(sourceStyles))
  Object.assign(result, convertTransformStyle(tmp.x, tmp.y, tmp.scale, tmp.scaleX, tmp.scaleY, tmp.rotate))
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
