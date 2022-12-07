import { round as _round } from 'lodash'

interface IMapUnit {
  [key: string]: number
}

const STR_UNITS = ['px', 'cm', 'mm', 'in']
const DPI = 96
const PRECISION = 3
const MUL_TRANS_UNIT = [
  // px cm mm in
  [1, 1 / DPI * 2.54, 1 / DPI * 25.4, 1 / DPI], // px
  [DPI / 2.54, 1, 10, 1 / 2.54], // cm
  [DPI / 25.4, 1 / 10, 1, 1 / 25.4], // mm
  [DPI, 2.54, 25.4, 1] // in
]

class UnitUtils {
  round(value: number, unit: string): number {
    return _round(value, unit === 'px' ? 0 : PRECISION)
  }

  idxUnit(strUnit: string): number {
    return STR_UNITS.indexOf(strUnit)
  }

  convert(value: number, sourceUnit: string, targetUnit: string): number {
    return this.round(value * MUL_TRANS_UNIT[this.idxUnit(sourceUnit)][this.idxUnit(targetUnit)], targetUnit)
  }

  convertAll(value: number, sourceUnit: string): IMapUnit {
    return Object.fromEntries(MUL_TRANS_UNIT[this.idxUnit(sourceUnit)].map((mulTransUnit, idxUnit) => [STR_UNITS[idxUnit], this.round(value * mulTransUnit, STR_UNITS[idxUnit])]))
  }
}

export default new UnitUtils()
export {
  STR_UNITS,
  IMapUnit
}
