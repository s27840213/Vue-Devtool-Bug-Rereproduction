/**
 * This file is used to convert properties of layers into CSS-readable properties
 */
import { IParagraphStyle, ISpanStyle, IStyle, ITextStyle } from '@/interfaces/layer'
import store from '@/store'

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
  weight: '-webkit-text-stroke-width',
  align: 'text-align',
  lineHeight: 'line-height',
  fontSpacing: 'letter-spacing',
  size: 'font-size',
  color: 'color',
  opacity: 'opacity',
  writingMode: 'writing-mode',
  decoration: 'text-decoration-line',
  style: 'font-style',
  caretColor: 'caret-color',
  // below are not css valid properties, only for tiptap to record
  type: 'font-type',
  assetId: 'asset-id',
  userId: 'user-id',
  fontUrl: 'font-url'
} as IStyleMap

// const fontStyleMap = {
//   'font-family': 'fontFamily',
//   'font-weight': 'fontWeight',
//   'font-align': 'fontAlign',
//   'line-height': 'lineHeight',
//   'font-spacing': 'fontSpacing',
//   'font-size': 'fontSize',
//   'writing-mode': 'writingMode',
//   'font-style': 'fontStyle',
//   'text-decoration-line': 'decoration',
//   'text-decoration-thickness': 'decoration',
//   'text-decoration-style': 'decoration',
//   'text-decoration-color': 'decoration',
//   'letter-spacing': 'letterSpacing',
//   color: 'color'
// } as IStyleMap

const transformProps: string[] = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate']
const fontProps: string[] = ['font', 'weight', 'align', 'lineHeight', 'fontSpacing',
  'size', 'writingMode', 'decoration', 'color', 'style', 'caretColor',
  'type', 'assetId', 'userId', 'fontUrl'
]

class CssConveter {
  convertTransformStyle(x: number, y: number, zindex: number, rotate: number, cancel3D = false, contentScaleRatio = 1): { transform: string } {
    //  The scale feature only applied on "layer-scale" as a child-container of the layer
    return {
      transform: cancel3D ? `translate(${x * contentScaleRatio}px, ${y * contentScaleRatio}px) rotate(${rotate}deg)` : `translate3d(${x * contentScaleRatio}px, ${y * contentScaleRatio}px, ${zindex}px) rotate(${rotate}deg)`
    }
  }

  convertFlipStyle(horizontalFlip: boolean, verticalFlip: boolean): { transform: string } {
    if (horizontalFlip && verticalFlip) {
      return {
        transform: 'scaleX(-1) scaleY(-1)'
      }
    } else if (horizontalFlip) {
      return {
        transform: 'scaleX(-1)'
      }
    } else if (verticalFlip) {
      return {
        transform: 'scaleY(-1)'
      }
    } else {
      return { transform: '' }
    }
  }

  convertFontStyle(sourceStyles: IStyle | ITextStyle | IParagraphStyle | ISpanStyle | { [key: string]: string | number }): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    fontProps.forEach(prop => {
      if (prop === 'size') {
        result[styleMap[prop]] = `${(sourceStyles[prop] as number) * 1.333333}px`
      } else if (prop === 'weight') {
        result[styleMap[prop]] = sourceStyles[prop] === 'bold' ? `calc(var(--base-stroke) + ${(sourceStyles.size as number) / 32}px)` : 'calc(var(--base-stroke))'
      } else if (prop === 'fontSpacing') {
        result[styleMap[prop]] = typeof sourceStyles[prop] === 'number' ? `${sourceStyles[prop]}em` : `${sourceStyles[prop]}`
      } else if (prop === 'lineHeight') {
        result[styleMap[prop]] = `${sourceStyles[prop]}`
      } else if (['boxDecorationBreak'].includes(prop)) { // For -webkit CSS
        result[styleMap[prop]] = `${sourceStyles[prop]}`
        result[`-webkit-${styleMap[prop]}`] = `${sourceStyles[prop]}`
      } else if (prop === 'font') {
        result[styleMap[prop]] = this.getFontFamily(sourceStyles[prop] as string)
      } else if (prop === 'color') { // For color
        result[styleMap[prop]] = `${sourceStyles[prop]}`
        result['text-decoration-color'] = `${sourceStyles[prop]}`
      } else if (typeof sourceStyles[prop] !== 'undefined') {
        result[styleMap[prop]] = typeof sourceStyles[prop] === 'number' ? `${sourceStyles[prop]}px` : `${sourceStyles[prop]}`
      }
    })
    return result
  }

  getFontFamily(font: string): string {
    return (font + ',').concat(store.getters['text/getDefaultFonts'])
  }

  convertDefaultStyle(sourceStyles: IStyle | ITextStyle, cancel3D = false, contentScaleRatio = 1): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    Object.assign(result, {
      width: typeof sourceStyles.width === 'number' ? `${sourceStyles.width * contentScaleRatio}px` : 'initial',
      height: typeof sourceStyles.height === 'number' ? `${sourceStyles.height * contentScaleRatio}px` : 'initial',
      ...(sourceStyles.opacity !== 100 && { opacity: `${sourceStyles.opacity / 100}` }),
      ...this.convertTransformStyle(sourceStyles.x, sourceStyles.y, sourceStyles.zindex, sourceStyles.rotate, cancel3D, contentScaleRatio)
    })
    return result
  }

  convertAllStyles(sourceStyles: IStyle | ITextStyle): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    // create a deep copy to prevent from changing the original state.
    const tmp = JSON.parse(JSON.stringify(sourceStyles))
    Object.assign(result, this.convertTransformStyle(tmp.x, tmp.y, tmp.zindex, tmp.rotate))
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

  getKeyByValue(object: any, value: string): string {
    return Object.keys(object).find(key => object[key] === value)!
  }

  // fontStyleKeyMap(prop: string): string {
  //   const propInCss = this.getKeyByValue(fontStyleMap, prop)
  //   return this.getKeyByValue(styleMap, propInCss)
  // }

  convertTextShadow(x: number, y: number, color: string, blur?: number): Partial<CSSStyleDeclaration> {
    return {
      textShadow: `${color} ${x}px ${y}px ${blur || 0}px`
    }
  }

  convertTextStorke(width: number, color: string, fill: string): Partial<CSSStyleDeclaration> {
    return {
      webkitTextStroke: `${width}px ${color}`,
      webkitTextFillColor: fill
    }
  }
}

export default new CssConveter()
