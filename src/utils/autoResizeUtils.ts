import { IText } from '@/interfaces/layer'
import textUtils from '@/utils/textUtils'

export interface IRunResult {
  widthLimit: number,
  otherDimension: number,
  loops: number
}

const DEBUG_HEIGHT = false
// const DEBUG_HEIGHT = true
const DEBUG_SPANDATALIST = false
// const DEBUG_SPANDATALIST = true
const DEBUG_LOG_FILTER = (by: string, identity: string) => {
  // return identity.startsWith('The cause')
  return true
}

export class AutoResizeByHeight {
  BY = 'height'
  MAX_LOOP = 200
  TOLERANCE = 5
  config: IText
  initSize: { width: number; height: number; widthLimit: number; spanDataList?: DOMRect[][][] | undefined }
  isVertical: boolean
  dimension: 'width' | 'height'
  scale: number
  direction: number
  offset: number
  prevOffset: number
  shouldContinue: boolean
  widthLimit: number
  autoDimension: number
  originDimension: any
  prevDiff: number
  minDiff: number
  minDiffWidLimit: number
  minDiffDimension: number
  autoSize: { width: number; height: number; spanDataList: DOMRect[][][] }
  runResult: IRunResult | undefined

  isDebugMode = DEBUG_HEIGHT // for debugging
  identity = '' // for debugging

  constructor(config: IText, initSize: { width: number, height: number, widthLimit: number, spanDataList?: DOMRect[][][] }) {
    this.config = config
    this.initSize = initSize
    this.isVertical = config.styles.writingMode.includes('vertical')
    this.dimension = this.isVertical ? 'width' : 'height'
    this.scale = config.styles.scale
    this.direction = 0
    this.offset = 0
    this.prevOffset = 0
    this.shouldContinue = true
    this.widthLimit = initSize.widthLimit
    this.autoDimension = -1
    this.originDimension = initSize[this.dimension]
    this.prevDiff = Number.MAX_VALUE
    this.minDiff = Number.MAX_VALUE
    this.minDiffWidLimit = -1
    this.minDiffDimension = -1
    this.autoSize = { width: 0, height: 0, spanDataList: [] }

    this.identity = config.paragraphs[0].spans.map(span => span.text).join('') // for debugging
  }

  log(...args: any[]) {
    if (!this.isDebugMode) return
    if (!DEBUG_LOG_FILTER(this.BY, this.identity)) return
    console.log(this.BY, this.identity.substring(0, 50), '::', ...args)
  }

  updateDiff(currDiff: number) {
    // update minDiff info if currDiff is smaller than previous minDiff.
    if (currDiff < this.minDiff) {
      this.minDiff = currDiff
      this.minDiffWidLimit = this.widthLimit
      this.minDiffDimension = this.autoDimension
    }
    this.prevDiff = currDiff
  }

  checkDiff(currDiff: number): boolean {
    // if current result is worse than previous loop, return bestResult.
    if (currDiff > this.prevDiff) {
      this.runResult = this.bestResult()
      return true
    }
    this.updateDiff(currDiff)
    return false
  }

  checkLoop(): boolean {
    // if current loop count reaches loop limit, return bestResult.
    if (Math.abs(this.direction) >= this.MAX_LOOP) {
      this.runResult = this.bestResult()
      return true
    }
    return false
  }

  checkDirection(): boolean {
    // to avoid infinite oscillation
    // if suggested offset is the opposite of previous offset, return bestResult.
    if (this.prevOffset * this.offset < 0) {
      this.runResult = this.bestResult()
      return true
    }
    return false
  }

  applyOffset() {
    this.widthLimit += this.offset * this.scale
    this.direction += this.offset
    this.prevOffset = this.offset
  }

  undoToMinDiff() {
    if (this.minDiffWidLimit === -1) {
      this.widthLimit = this.initSize.widthLimit
      this.direction = 0
      this.prevOffset = 0
    } else {
      const direction = Math.round((this.widthLimit - this.minDiffWidLimit) / this.scale)
      this.widthLimit = this.minDiffWidLimit
      this.direction = direction
      this.prevOffset = this.direction === 0 ? 0 : (this.direction > 0 ? 1 : -1)
    }
  }

  compareByHeight(): boolean {
    this.shouldContinue = false

    // if target height is larger than current height, decrease widthLimit
    if (this.originDimension - this.autoDimension > this.TOLERANCE * this.scale) {
      this.shouldContinue = true
      this.offset = -1
    }

    // if target height is smaller than current height, increase widthLimit
    if (this.autoDimension - this.originDimension > this.TOLERANCE * this.scale) {
      this.shouldContinue = true
      this.offset = 1
    }

    return !this.shouldContinue // if shouldContinue = false, close enough, return currentResult
  }

  loopPrevCondition(): boolean {
    this.log('loopPrevCondision')
    this.autoDimension = this.autoSize[this.dimension]
    const currDiff = Math.abs(this.autoDimension - this.originDimension)
    this.log(this.autoDimension, this.originDimension, currDiff, this.widthLimit, this.config.widthLimit)
    if (this.checkDiff(currDiff)) return true
    return false
  }

  loopComparison(): boolean {
    this.log('loopComparison')
    if (this.checkLoop()) return true
    if (this.compareByHeight()) return true
    if (this.checkDirection()) return true
    this.applyOffset()
    return false
  }

  currentResult(): IRunResult {
    return {
      widthLimit: this.widthLimit,
      otherDimension: this.autoDimension === -1 ? this.originDimension : this.autoDimension,
      loops: Math.abs(this.direction)
    }
  }

  bestResult(): IRunResult {
    if (this.minDiffWidLimit !== -1) {
      return {
        widthLimit: this.minDiffWidLimit,
        otherDimension: this.minDiffDimension,
        loops: Math.abs(this.direction)
      }
    } else {
      return this.currentResult()
    }
  }

  finalResult(): IRunResult {
    return this.runResult ?? this.currentResult()
  }

  async run(): Promise<IRunResult> {
    this.log('run start')
    this.autoSize = await textUtils.getTextHWAsync(this.config, this.widthLimit)
    while (this.shouldContinue) { // results are always returned inside the loop without breaking this while-loop
      if (this.loopPrevCondition()) return this.finalResult()
      if (this.loopComparison()) return this.finalResult()
      this.autoSize = await textUtils.getTextHWAsync(this.config, this.widthLimit)
    }
    return this.currentResult()
  }
}

export class AutoResizeByHeightSync extends AutoResizeByHeight {
  runSync(): IRunResult {
    this.log('runSync start')
    this.autoSize = textUtils.getTextHW(this.config, this.widthLimit)
    while (this.shouldContinue) { // results are always returned inside the loop without breaking this while-loop
      if (this.loopPrevCondition()) return this.finalResult()
      if (this.loopComparison()) return this.finalResult()
      this.autoSize = textUtils.getTextHW(this.config, this.widthLimit)
    }
    return this.currentResult()
  }
}

export class AutoResizeBySpanDataList extends AutoResizeByHeightSync {
  BY = 'spanDataList'
  MAX_LOOP = 100
  pIndex = 0
  sIndex = 0

  isDebugMode = DEBUG_SPANDATALIST // for debugging

  resetParamsForIJ() {
    this.MAX_LOOP += Math.abs(this.direction)
    // direction is an important information used in undoPrevOffset to decide whether to reset prevOffset to 0
    // so instead of resetting direction, increase MAX_LOOP by direction count to achieve the same loop limit for new i, j

    this.prevDiff = Number.MAX_VALUE
    this.minDiff = Number.MAX_VALUE
    // this.minDiffWidLimit = -1
    // this.minDiffDimension = -1
    // reset diff values to avoid comparing diff values between different i, j
    // but widthLimit and dimension are kept in case bestResult is needed
  }

  checkStructMatch(currSpanDataList: DOMRect[][][], targetSpanDataList: DOMRect[][][] | undefined): boolean {
    if (targetSpanDataList === undefined) return false

    // number of paragraphs doesn't match, unexpected situation, skip comparing by spanDataList
    if (currSpanDataList.length !== targetSpanDataList.length) return false

    for (let i = 0; i < currSpanDataList.length; i++) { // iterating <p>
      // number of spans in some paragraph doesn't match, unexpected situation, skip comparing by spanDataList
      const currSpans = currSpanDataList[i]
      const targetSpans = targetSpanDataList[i]
      if (currSpans.length !== targetSpans.length) return false
    }
    return true
  }

  compareByLineCount(currLines: number, targetLines: number): boolean {
    // @return: whether line counts are the same

    this.log('lineCount:', currLines, targetLines)

    // if target has more lines, decrease widthLimit.
    if (currLines < targetLines) {
      this.offset = -1
      return false
    }

    // if target has less lines, increase widthLimit.
    if (currLines > targetLines) {
      this.offset = 1
      return false
    }
    return true
  }

  compareByLastLine(currLastLineSize: number, targetLastLineSize: number): boolean {
    // @return: whether to go on to next span

    this.log('lastLineSize:', currLastLineSize, targetLastLineSize)

    const currDiff = Math.abs(currLastLineSize - targetLastLineSize)
    this.log(currDiff, this.prevDiff, this.minDiff, this.minDiffWidLimit, this.minDiffDimension)
    if (this.checkDiff(currDiff)) {
      this.undoToMinDiff()
      return true
    }

    // if target last line is longer, decrease widthLimit to push more characters to last line.
    if (targetLastLineSize - currLastLineSize > this.TOLERANCE) {
      this.offset = -1
      return false
    }

    // if target last line is shorter, increase widthLimit to pull more characters from last line.
    if (currLastLineSize - targetLastLineSize > this.TOLERANCE) {
      this.offset = 1
      return false
    }

    return true // close enough, go on to next span
  }

  nextIJ(pCount: number, spanCount: number): boolean {
    if (this.sIndex === spanCount - 1) {
      this.sIndex = 0
      if (this.pIndex === pCount - 1) {
        return true // all close enough, return currentResult
      } else {
        this.pIndex++
      }
    } else {
      this.sIndex++
    }
    this.log('go on to next i, j')
    this.resetParamsForIJ()
    return false // head to next loop without applying any offset
  }

  loopPrevCondition(): boolean {
    this.log('loopPrevCondision')
    this.autoDimension = this.autoSize[this.dimension]
    if (!this.checkStructMatch(this.autoSize.spanDataList, this.initSize.spanDataList)) {
      this.log('spanData do not match')
      return true // spanData structures do not match, return currentResult or bestResult if already set in previous loops
    }
    return false
  }

  loopComparison(): boolean {
    this.log('loopComparison')
    const currSpanDataList = this.autoSize.spanDataList
    const targetSpanDataList = this.initSize.spanDataList!

    const currSpans = currSpanDataList[this.pIndex]
    const targetSpans = targetSpanDataList[this.pIndex]

    const currSpanRects = currSpans[this.sIndex]
    const targetSpanRects = targetSpans[this.sIndex]

    this.log('i, j:', this.pIndex, this.sIndex)

    if (this.checkLoop()) {
      this.log('MAX_LOOP reached')
      this.undoToMinDiff()
      return this.nextIJ(currSpanDataList.length, currSpans.length)
    }

    const sameLines = this.compareByLineCount(currSpanRects.length, targetSpanRects.length)

    if (sameLines) {
      const dimension = this.isVertical ? 'height' : 'width'
      const currLastLineSize = currSpanRects[currSpanRects.length - 1][dimension]
      const targetLastLineSize = targetSpanRects[targetSpanRects.length - 1][dimension]

      const goNextSpan = this.compareByLastLine(currLastLineSize, targetLastLineSize)
      if (goNextSpan) {
        return this.nextIJ(currSpanDataList.length, currSpans.length)
      }
    }

    this.log(this.offset, this.direction, this.prevOffset, this.MAX_LOOP, this.TOLERANCE)
    if (this.checkDirection()) return true
    this.applyOffset()
    return false // head to next loop
  }
}
