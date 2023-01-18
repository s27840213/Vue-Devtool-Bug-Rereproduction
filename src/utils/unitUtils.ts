import store from '@/store'
import { round } from 'lodash'

export interface IMapUnit {
  [key: string]: number
}

export interface IMapSize {
  [key: string]: {
    width: number,
    height: number
  }
}

const STR_UNITS = ['px', 'cm', 'mm', 'in']
const IDX_UNITS = Object.fromEntries(STR_UNITS.map((v, i) => [v, i]))
const PRECISION = 3

function mulConvUnit(dpi = 96): number[][] {
  return [
    // px cm mm in
    [1, 1 / dpi * 2.54, 1 / dpi * 25.4, 1 / dpi], // px
    [dpi / 2.54, 1, 10, 1 / 2.54], // cm
    [dpi / 25.4, 1 / 10, 1, 1 / 25.4], // mm
    [dpi, 2.54, 25.4, 1] // in
  ]
}

class UnitUtils {
  get dimensionMap() { return store?.getters['user/getDimensionMap'] ?? {} }

  /**
   * Convert value in source unit into target unit.
   * @param value Value to be convert
   * @param sourceUnit Unit of value
   * @param targetUnit Target unit to convert into
   * @param dpi DPI for convertion between px and physical units
   * @returns Converted value
   */
  convert(value: number, sourceUnit: string, targetUnit: string, dpi?: number): number {
    if (dpi === undefined && this.dimensionMap[sourceUnit]?.[value]?.[targetUnit] !== undefined) return this.dimensionMap[sourceUnit][value][targetUnit]
    return value * mulConvUnit(dpi)[IDX_UNITS[sourceUnit]][IDX_UNITS[targetUnit]]
  }

  convertAll(value: number, sourceUnit: string, dpi?: number): IMapUnit {
    return Object.fromEntries(mulConvUnit(dpi)[IDX_UNITS[sourceUnit]].map((mulConvUnit, idxUnit) => {
      if (dpi === undefined && this.dimensionMap[sourceUnit]?.[value]?.[STR_UNITS[idxUnit]] !== undefined) {
        return STR_UNITS[idxUnit] === 'px' ? round(this.dimensionMap[sourceUnit][value][STR_UNITS[idxUnit]])
          : this.dimensionMap[sourceUnit][value][STR_UNITS[idxUnit]]
      }
      return STR_UNITS[idxUnit] === 'px' ? [STR_UNITS[idxUnit], round(value * mulConvUnit)]
        : [STR_UNITS[idxUnit], value * mulConvUnit]
    }))
  }

  convertSize(width: number, height: number, sourceUnit: string, targetUnit: string) {
    if (sourceUnit === targetUnit) return { width, height }
    const aspectRatio = width / height || 1

    // return preset if found in dimensionMap
    const widthFound = this.dimensionMap[sourceUnit]?.[width]?.[targetUnit]
    const heightFound = this.dimensionMap[sourceUnit]?.[height]?.[targetUnit]
    if (widthFound !== undefined || heightFound !== undefined) {
      return targetUnit === 'px' ? { width: widthFound ?? round(heightFound * aspectRatio), height: heightFound ?? round(widthFound / aspectRatio) }
        : { width: widthFound ?? heightFound * aspectRatio, height: heightFound ?? widthFound / aspectRatio }
    }

    // return converted value between physical units (DPI independent)
    if (sourceUnit !== 'px' && targetUnit !== 'px') return { width: this.convert(width, sourceUnit, targetUnit, 96), height: this.convert(height, sourceUnit, targetUnit, 96) }

    let longEdge = Math.max(width, height)
    // physical to px
    if (targetUnit === 'px' && sourceUnit !== 'px') {
      longEdge = this.convert(longEdge, sourceUnit, 'in', 96)
      if (longEdge <= 6) {
        longEdge = this.convert(longEdge, 'in', 'px', 300)
      } else if (longEdge <= 2200 / 96) {
        longEdge = 1800 + this.convert(longEdge - 6, 'in', 'px', (2200 - 1800) / (2200 / 96 - 6))
      } else {
        longEdge = this.convert(longEdge, 'in', 'px', 96)
      }
    }

    // px to physical
    if (targetUnit !== 'px' && sourceUnit === 'px') {
      if (longEdge <= 1800) {
        longEdge = this.convert(longEdge, 'px', targetUnit, 300)
      } else if (longEdge <= 2200) {
        longEdge = this.convert(6, 'in', targetUnit, 96) + this.convert(longEdge - 1800, 'px', targetUnit, (2200 - 1800) / (2200 / 96 - 6))
      } else {
        longEdge = this.convert(longEdge, 'px', targetUnit, 96)
      }
    }

    if (width > height) {
      width = longEdge
      height = longEdge / aspectRatio
    } else {
      height = longEdge
      width = longEdge * aspectRatio
    }

    if (targetUnit === 'px') return { width: round(width), height: round(height) }
    return { width, height }
  }

  convertAllSize(width: number, height: number, sourceUnit: string): IMapSize {
    return Object.fromEntries(STR_UNITS.map((targetUnit) => [targetUnit, this.convertSize(width, height, sourceUnit, targetUnit)]))
  }

  /**
   * Get DPI for conversion between px and physical units
   */
  getConvertDpi(pageSize: { physicalWidth: number, physicalHeight: number, unit: string }) {
    const { physicalWidth: width, physicalHeight: height, unit } = pageSize
    const pxSize = this.convertSize(width, height, unit, 'px')
    const inSize = this.convertSize(width, height, unit, 'in')
    return {
      width: pxSize.width / inSize.width,
      height: pxSize.height / inSize.height
    }
  }
}

export default new UnitUtils()
export {
  STR_UNITS,
  PRECISION
}
