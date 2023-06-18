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
  // return identity.startsWith('Meanwhile')
  return false
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
    console.log(this.BY, this.identity, ...args)
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
      otherDimension: this.autoDimension,
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
      return {
        widthLimit: this.initSize.widthLimit,
        otherDimension: this.originDimension,
        loops: Math.abs(this.direction)
      }
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
  MAX_LOOP = 50
  TOLERANCE = 10

  isDebugMode = DEBUG_SPANDATALIST // for debugging

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
    this.log(currLines, targetLines)

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
    this.log(currLastLineSize, targetLastLineSize)

    this.shouldContinue = false

    const currDiff = Math.abs(currLastLineSize - targetLastLineSize)
    this.log(currDiff, this.prevDiff, this.minDiff, this.minDiffWidLimit, this.minDiffDimension)
    if (this.checkDiff(currDiff)) return true

    // if target last line is longer, decrease widthLimit to push more characters to last line.
    if (targetLastLineSize - currLastLineSize > this.TOLERANCE) {
      this.shouldContinue = true
      this.offset = -1
    }

    // if target last line is shorter, increase widthLimit to pull more characters from last line.
    if (currLastLineSize - targetLastLineSize > this.TOLERANCE) {
      this.shouldContinue = true
      this.offset = 1
    }
    return false
  }

  compareBySpanDataList(): boolean {
    const currSpanDataList = this.autoSize.spanDataList
    const targetSpanDataList = this.initSize.spanDataList!

    for (let i = 0; i < currSpanDataList.length; i++) { // iterating <p>
      const currSpans = currSpanDataList[i]
      const targetSpans = targetSpanDataList[i]

      for (let j = 0; j < currSpans.length; j++) { // iterating <span>
        const currSpanRects = currSpans[j]
        const targetSpanRects = targetSpans[j]

        this.log(i, j)

        const sameLines = this.compareByLineCount(currSpanRects.length, targetSpanRects.length)

        if (sameLines) {
          const dimension = this.isVertical ? 'height' : 'width'
          const currLastLineSize = currSpanRects[currSpanRects.length - 1][dimension]
          const targetLastLineSize = targetSpanRects[targetSpanRects.length - 1][dimension]

          if (this.compareByLastLine(currLastLineSize, targetLastLineSize)) return true

          if (!this.shouldContinue) continue // same lines and same last line length, go on to next span
        }

        this.log(this.shouldContinue, this.offset, this.direction, this.prevOffset, this.MAX_LOOP, this.TOLERANCE)
        if (this.checkDirection()) return true
        this.applyOffset()
        return false // head to next loop
      }
    }
    return true // all close enough, return currentResult
  }

  loopPrevCondition(): boolean {
    this.log('loopPrevCondision')
    this.autoDimension = this.autoSize[this.dimension]
    if (!this.checkStructMatch(this.autoSize.spanDataList, this.initSize.spanDataList)) {
      this.log('spanData do not match')
      return true // spanData structures do not match, return currentResult
    }
    return false
  }

  loopComparison(): boolean {
    this.log('loopComparison')
    if (this.checkLoop()) return true
    return this.compareBySpanDataList()
  }
}
