import { IGroup, ILayer, IShape, IText } from '@/interfaces/layer'
import { EventEmitter } from 'events'
import store from '@/store'
import { IPage } from '@/interfaces/page'
import pageUtils from './pageUtils'

const STOP_POSTFIX = '_st'

class ColorUtils {
  event: any
  eventHash: { [index: string]: (color: string) => void }
  currEvent: string
  currColor: string
  isColorPickerOpen: boolean

  get currPageBackgroundColor() {
    return pageUtils.currFocusPage.backgroundColor
  }

  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
    this.currEvent = ''
    this.currColor = '#ffffff'
    this.isColorPickerOpen = false
  }

  get currStopEvent(): string { return this.currEvent + STOP_POSTFIX }

  on(type: string, callback: (color: string) => void) {
    // replace origin event
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  onStop(type: string, callback: (color: string) => void) {
    this.on(type + STOP_POSTFIX, callback)
  }

  offStop(type: string, callback: (color: string) => void) {
    this.event.off(type + STOP_POSTFIX, callback)
  }

  setCurrEvent(event: string) {
    this.currEvent = event
  }

  setCurrColor(color: string) {
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      this.currColor = color
    }
  }

  setIsColorPickerOpen(bool: boolean) {
    this.isColorPickerOpen = bool
  }

  setCurrPageBackgroundColor(color: string) {
    store.commit('SET_backgroundColor', {
      pageIndex: pageUtils.currFocusPageIndex,
      color
    })
  }
}

export default new ColorUtils()

export function getDocumentColor(pageIndex: number, color: string): Array<string> {
  const page = store.getters.getPage(pageIndex) as IPage
  const docColors = new Set<string>()

  const handler = (layers: Array<ILayer>) => {
    layers
      .forEach(l => {
        switch (l.type) {
          case 'text':
            (l as IText).paragraphs.forEach(p => {
              p.spans.forEach(s => {
                if (!docColors.has(s.styles.color)) {
                  docColors.add(s.styles.color)
                }
              })
            })
            break
          case 'shape': {
            const shape = l as IShape
            for (let i = 0; shape.color && i < shape.color.length && i < 20; i++) {
              if (!docColors.has(shape.color[i])) {
                docColors.add(shape.color[i])
              }
            }
          }
            break
          case 'group':
            handler((l as IGroup).layers)
        }
      })
  }

  handler(page.layers)
  docColors.delete(color)
  return color ? [color, ...docColors].splice(0, 50) : [...docColors].splice(0, 50)
}

export function isValidHexColor(value: string): boolean {
  return value.toUpperCase().match(/^#[0-9A-F]{6}$/) !== null
}

export function componentToHex(c: number): string {
  return c.toString(16).length === 1 ? '0' + c.toString(16).toUpperCase() : c.toString(16).toUpperCase()
}

export function rgb2hex(rgb: string): string {
  const rgbArr = rgb.match(/\d+/g)
  if (rgbArr && rgbArr.length === 3) {
    return '#' + componentToHex(parseInt(rgbArr[0])) + componentToHex(parseInt(rgbArr[1])) + componentToHex(parseInt(rgbArr[2]))
  } else {
    return rgb
  }
}

export function checkAndConvertToHex(color: string): string {
  return isValidHexColor(color) ? color : rgb2hex(color)
}

export function hex2Rgb(hex: string): number[] {
  const splited = hex.replace('#', '').toUpperCase().match(/[0-9A-F]{2}/g)
  if (splited?.length !== 3) return [255, 255, 255]
  return splited.map((color) => parseInt(color, 16))
}

export function rbg2xyz(sRGB: string): number[] {
  const [r, g, b] = hex2Rgb(sRGB)
    .map(c => c / 255)
    .map(c => c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92)
    .map(c => c * 100)
  return [
    0.412453 * r + 0.357580 * g + 0.180423 * b,
    0.212671 * r + 0.715160 * g + 0.072169 * b,
    0.019334 * r + 0.119193 * g + 0.950227 * b
  ]
}

const refX = 95.047
const refY = 100.000
const refZ = 108.883

export function xyz2lab(xyz: number[]): number[] {
  function f(t: number) {
    return t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116
  }
  let [x, y, z] = xyz
  x = f(x / refX)
  y = f(y / refY)
  z = f(z / refZ)
  const l = 116 * y - 16
  const a = 500 * (x - y)
  const b = 200 * (y - z)
  return [l, a, b]
}

export function rgb2lab(sRGB: string): number[] {
  return xyz2lab(rgb2lab(sRGB))
}

export function lab2xyz(lab: number[]): number[] {
  function f(c: number) {
    return c > 0.008856 ? Math.pow(c, 3) : (c - 16 / 116) / 7.787
  }
  const [l, a, b] = lab
  const y = f((l + 16) / 116) * refX
  const x = f(a / 500 + y) * refY
  const z = f(y - b / 200) * refZ
  return [x, y, z]
}

export function xyz2rgb(xyz: number[]): string {
  xyz = xyz.map(c => c / 100)
  const [x, y, z] = xyz
  let rgb = [
    3.240479 * x + -1.53715 * y + -0.498535 * z,
    -0.969256 * x + 1.875991 * y + 0.041556 * z,
    0.055648 * x + -0.204043 * y + 1.057311 * z
  ]
  rgb = rgb.map(c => c > 0.0031308 ? 1.055 * (Math.pow(c, 1 / 2.4)) - 0.055 : 12.92 * c)
    .map(c => c * 255)
  return rgb2hex(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`)
}

export function lab2rgb(lab: number[]): string {
  return xyz2rgb(lab2xyz(lab))
}

// Color conversion reference: http://www.easyrgb.com/en/math.php
// More precise constant: https://github.com/cybertk/opencv/blob/master/opencv/cv/src/cvcolor.cpp#L789
