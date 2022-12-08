import { round as _round } from 'lodash'

interface IMapUnit {
  [key: string]: number
}

interface IMapSize {
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
  round(value: number, unit: string): number {
    return _round(value, unit === 'px' ? 0 : PRECISION)
  }

  convert(value: number, sourceUnit: string, targetUnit: string, dpi = 96, round = true): number {
    const r = value * mulConvUnit(dpi)[IDX_UNITS[sourceUnit]][IDX_UNITS[targetUnit]]
    return round ? this.round(r, targetUnit) : r
  }

  convertAll(value: number, sourceUnit: string, dpi = 96): IMapUnit {
    return Object.fromEntries(mulConvUnit(dpi)[IDX_UNITS[sourceUnit]].map((mulConvUnit, idxUnit) => [STR_UNITS[idxUnit], this.round(value * mulConvUnit, STR_UNITS[idxUnit])]))
  }

  convertSize(width: number, height: number, sourceUnit: string, targetUnit: string) {
    if (sourceUnit === targetUnit) return { width, height }
    if (sourceUnit !== 'px' && targetUnit !== 'px') return { width: this.convert(width, sourceUnit, targetUnit), height: this.convert(height, sourceUnit, targetUnit) }
    const aspectRatio = width / height
    let longEdge = Math.max(width, height)

    // physical to px
    if (targetUnit === 'px' && sourceUnit !== 'px') {
      longEdge = this.convert(longEdge, sourceUnit, 'in', 96, false)
      if (longEdge <= 6) {
        longEdge = this.convert(longEdge, 'in', 'px', 300, false)
      } else if (longEdge <= 2200 / 96) {
        longEdge = 1800 + this.convert(longEdge - 6, 'in', 'px', (2200 - 1800) / (2200 / 96 - 6), false)
      } else {
        longEdge = this.convert(longEdge, 'in', 'px', 96, false)
      }
    }

    // px to physical
    if (targetUnit !== 'px' && sourceUnit === 'px') {
      if (longEdge <= 1800) {
        longEdge = this.convert(longEdge, 'px', targetUnit, 300, false)
      } else if (longEdge <= 2200) {
        longEdge = this.convert(6, 'in', targetUnit, 96, false) + this.convert(longEdge - 1800, 'px', targetUnit, (2200 - 1800) / (2200 / 96 - 6), false)
      } else {
        longEdge = this.convert(longEdge, 'px', targetUnit, 96, false)
      }
    }

    if (width > height) {
      width = this.round(longEdge, targetUnit)
      height = this.round(longEdge / aspectRatio, targetUnit)
    } else {
      height = this.round(longEdge, targetUnit)
      width = this.round(longEdge * aspectRatio, targetUnit)
    }

    return { width, height }
  }

  convertAllSize(width: number, height: number, sourceUnit: string): IMapSize {
    return Object.fromEntries(STR_UNITS.map((targetUnit) => [targetUnit, this.convertSize(width, height, sourceUnit, targetUnit)]))
  }
}

export default new UnitUtils()
export {
  STR_UNITS,
  IMapUnit,
  IMapSize
}
