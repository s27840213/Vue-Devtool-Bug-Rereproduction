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

  loopPrevCondition(): boolean {
    this.log('loopPrevCondision')
    this.autoDimension = this.autoSize[this.dimension]
    const currDiff = Math.abs(this.autoDimension - this.originDimension)
    this.log(this.autoDimension, this.originDimension, currDiff, this.widthLimit, this.config.widthLimit)
    if (currDiff < this.minDiff) {
      this.minDiff = currDiff
      this.minDiffWidLimit = this.widthLimit
      this.minDiffDimension = this.autoDimension
    }
    if (currDiff > this.prevDiff) {
      if (this.minDiffWidLimit !== -1) {
        this.runResult = {
          widthLimit: this.minDiffWidLimit,
          otherDimension: this.minDiffDimension,
          loops: Math.abs(this.direction)
        }
        return true
      } else {
        this.runResult = {
          widthLimit: this.initSize.widthLimit,
          otherDimension: this.originDimension,
          loops: Math.abs(this.direction)
        }
        return true
      }
    }
    this.prevDiff = currDiff
    return false
  }

  loopComparison(): boolean {
    this.log('loopComparison')
    if (Math.abs(this.direction) >= this.MAX_LOOP) {
      this.runResult = {
        widthLimit: this.minDiffWidLimit,
        otherDimension: this.minDiffDimension,
        loops: Math.abs(this.direction)
      }
      return true
    }
    this.shouldContinue = false
    if (this.autoDimension - this.originDimension > this.TOLERANCE * this.scale) {
      this.shouldContinue = true
      this.offset = 1
    }
    if (this.originDimension - this.autoDimension > this.TOLERANCE * this.scale) {
      this.shouldContinue = true
      this.offset = -1
    }
    if (!this.shouldContinue) return false
    if (this.direction * this.offset < 0 || this.prevOffset * this.offset < 0) {
      this.shouldContinue = false
      return false
    }
    this.widthLimit += this.offset * this.scale
    this.direction += this.offset
    this.prevOffset = this.offset
    return false
  }

  async run(): Promise<IRunResult> {
    this.log('run start')
    this.autoSize = await textUtils.getTextHWAsync(this.config, this.widthLimit)
    while (this.shouldContinue) {
      if (this.loopPrevCondition()) return this.runResult!
      if (this.loopComparison()) return this.runResult!
      this.autoSize = await textUtils.getTextHWAsync(this.config, this.widthLimit)
    }
    return {
      widthLimit: this.widthLimit,
      otherDimension: this.autoDimension,
      loops: Math.abs(this.direction)
    }
  }
}

export class AutoResizeByHeightSync extends AutoResizeByHeight {
  runSync(): IRunResult {
    this.log('runSync start')
    this.autoSize = textUtils.getTextHW(this.config, this.widthLimit)
    while (this.shouldContinue) {
      if (this.loopPrevCondition()) return this.runResult!
      if (this.loopComparison()) return this.runResult!
      this.autoSize = textUtils.getTextHW(this.config, this.widthLimit)
    }
    return {
      widthLimit: this.widthLimit,
      otherDimension: this.autoDimension,
      loops: Math.abs(this.direction)
    }
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

  loopPrevCondition(): boolean {
    this.log('loopPrevCondision')
    this.autoDimension = this.autoSize[this.dimension]
    if (!this.checkStructMatch(this.autoSize.spanDataList, this.initSize.spanDataList)) {
      this.log('spanData do not match')
      this.runResult = {
        widthLimit: this.widthLimit,
        otherDimension: this.autoDimension,
        loops: Math.abs(this.direction)
      }
      return true
    }
    return false
  }

  loopComparison(): boolean {
    this.log('loopComparison')
    if (Math.abs(this.direction) >= this.MAX_LOOP) {
      this.runResult = {
        widthLimit: this.minDiffWidLimit,
        otherDimension: this.minDiffDimension,
        loops: Math.abs(this.direction)
      }
      return true
    }
    const currSpanDataList = this.autoSize.spanDataList
    const targetSpanDataList = this.initSize.spanDataList!

    for (let i = 0; i < currSpanDataList.length; i++) { // iterating <p>
      const currSpans = currSpanDataList[i]
      const targetSpans = targetSpanDataList[i]

      for (let j = 0; j < currSpans.length; j++) { // iterating <span>
        const currSpanRects = currSpans[j]
        const targetSpanRects = targetSpans[j]

        let sameLines = true
        this.log(currSpanRects.length, targetSpanRects.length)
        // if target has more lines, decrease widthLimit.
        if (currSpanRects.length < targetSpanRects.length) {
          sameLines = false
          this.offset = -1
        }

        // if target has less lines, increase widthLimit.
        if (currSpanRects.length > targetSpanRects.length) {
          sameLines = false
          this.offset = 1
        }

        this.log(i, j)

        if (sameLines) {
          const dimension = this.isVertical ? 'height' : 'width'
          const currLastLineSize = currSpanRects[currSpanRects.length - 1][dimension]
          const targetLastLineSize = targetSpanRects[targetSpanRects.length - 1][dimension]
          this.log(currLastLineSize, targetLastLineSize)

          this.shouldContinue = false

          const currDiff = Math.abs(currLastLineSize - targetLastLineSize)
          this.log(currDiff, this.prevDiff, this.minDiff, this.minDiffWidLimit, this.minDiffDimension)
          if (currDiff < this.minDiff) {
            this.minDiff = currDiff
            this.minDiffWidLimit = this.widthLimit
            this.minDiffDimension = this.autoDimension
          }
          if (currDiff > this.prevDiff) {
            if (this.minDiffWidLimit !== -1) {
              this.runResult = {
                widthLimit: this.minDiffWidLimit,
                otherDimension: this.minDiffDimension,
                loops: Math.abs(this.direction)
              }
              return true
            } else {
              this.runResult = {
                widthLimit: this.initSize.widthLimit,
                otherDimension: this.originDimension,
                loops: Math.abs(this.direction)
              }
              return true
            }
          }
          this.prevDiff = currDiff

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

          if (!this.shouldContinue) continue // same lines and same last line length
        }
        this.log(this.shouldContinue, this.offset, this.direction, this.prevOffset, this.MAX_LOOP, this.TOLERANCE)
        if (this.direction * this.offset < 0 || this.prevOffset * this.offset < 0) {
          this.shouldContinue = false
          return false
        }
        this.widthLimit += this.offset * this.scale
        this.direction += this.offset
        this.prevOffset = this.offset
        return false
      }
    }
    return false
  }
}
