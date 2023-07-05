import { IText } from '@/interfaces/layer'
import textUtils, { ITextHW } from '@/utils/textUtils'

export interface IRunResult {
  widthLimit: number
  otherDimension: number
  loops: number
}

export interface IMultiStageRunResult {
  widthLimit: number
  otherDimension: number
  stageLoops: number[]
}

export interface IInitSize {
  width: number
  height: number
  widthLimit: number
  spanDataList?: DOMRect[][][] | undefined
}

const DEBUG_HEIGHT = false
// const DEBUG_HEIGHT = true
const DEBUG_SPANDATALIST = false
// const DEBUG_SPANDATALIST = true
const DEBUG_LOG_FILTER = (by: string, identity: string) => {
  // return identity.startsWith('“The explosion was')
  return true
}

abstract class AutoResize {
  abstract BY: string
  abstract MAX_LOOP: number
  abstract TOLERANCE: number
  config: IText
  initSize: IInitSize
  widthLimit: number
  autoSize: ITextHW
  runResult: IRunResult | undefined

  isDebugMode = false // for debugging
  identity = '' // for debugging

  constructor(config: IText, initSize: IInitSize) {
    this.config = config
    this.initSize = initSize
    this.widthLimit = initSize.widthLimit
    this.autoSize = { width: 0, height: 0, spanDataList: [] }

    this.identity = textUtils.getFirstPText(config) // for debugging
  }

  log(...args: any[]) {
    if (!this.isDebugMode) return
    if (!DEBUG_LOG_FILTER(this.BY, this.identity)) return
    console.log(this.BY, this.identity.substring(0, 50), '::', ...args)
  }

  async updateSize(): Promise<void> {
    this.autoSize = await textUtils.getTextHWAsync(this.config, this.widthLimit)
  }

  updateSizeSync(): void {
    this.autoSize = textUtils.getTextHW(this.config, this.widthLimit)
  }

  abstract run(): Promise<IRunResult>
  abstract runSync(): IRunResult
}

export class AutoResizeByHeight extends AutoResize {
  BY = 'height'
  MAX_LOOP = 200
  TOLERANCE = 5
  isVertical: boolean
  dimension: 'width' | 'height'
  scale: number
  direction: number
  offset: number
  prevOffset: number
  shouldContinue: boolean
  autoDimension: number
  originDimension: any
  prevDiff: number
  minDiff: number
  minDiffWidLimit: number
  minDiffDimension: number

  isDebugMode = DEBUG_HEIGHT // for debugging

  constructor(config: IText, initSize: IInitSize) {
    super(config, initSize)
    this.isVertical = config.styles.writingMode.includes('vertical')
    this.dimension = this.isVertical ? 'width' : 'height'
    this.scale = config.styles.scale
    this.direction = 0
    this.offset = 0
    this.prevOffset = 0
    this.shouldContinue = true
    this.autoDimension = -1
    this.originDimension = initSize[this.dimension]
    this.prevDiff = Number.MAX_VALUE
    this.minDiff = Number.MAX_VALUE
    this.minDiffWidLimit = -1
    this.minDiffDimension = -1
  }

  static getDiff(config: IText, result: IRunResult, initSize: IInitSize) {
    const isVertical = config.styles.writingMode.includes('vertical')
    const dimension = isVertical ? 'width' : 'height'
    return Math.abs(result.otherDimension - initSize[dimension])
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
    await this.updateSize()
    while (this.shouldContinue) { // results are always returned inside the loop without breaking this while-loop
      if (this.loopPrevCondition()) return this.finalResult()
      if (this.loopComparison()) return this.finalResult()
      await this.updateSize()
    }
    return this.currentResult()
  }

  runSync(): IRunResult {
    this.log('runSync start')
    this.updateSizeSync()
    while (this.shouldContinue) { // results are always returned inside the loop without breaking this while-loop
      if (this.loopPrevCondition()) return this.finalResult()
      if (this.loopComparison()) return this.finalResult()
      this.updateSizeSync()
    }
    return this.currentResult()
  }
}

export class AutoResizeBySpanDataList extends AutoResizeByHeight {
  BY = 'spanDataList'
  MAX_LOOP = 100
  pIndex = 0
  sIndex = 0
  lineOffset = 0
  bound: number

  isDebugMode = DEBUG_SPANDATALIST // for debugging

  constructor(config: IText, initSize: IInitSize, bound: number) {
    super(config, initSize)
    this.bound = bound
  }

  resetParamsForStep() {
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

  checkBound(): boolean {
    return Math.abs(this.autoDimension - this.originDimension) > this.bound
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

  compareByLineSize(currLineSize: number, targetLineSize: number): boolean {
    // @return: whether to go on to next span

    this.log('lineSize:', currLineSize, targetLineSize)

    const currDiff = Math.abs(currLineSize - targetLineSize)
    this.log(currDiff, this.prevDiff, this.minDiff, this.minDiffWidLimit, this.minDiffDimension)
    if (this.checkDiff(currDiff)) {
      this.undoToMinDiff()
      return true
    }

    // if target last line is longer, decrease widthLimit to push more characters to last line.
    if (targetLineSize - currLineSize > this.TOLERANCE) {
      this.offset = -1
      return false
    }

    // if target last line is shorter, increase widthLimit to pull more characters from last line.
    if (currLineSize - targetLineSize > this.TOLERANCE) {
      this.offset = 1
      return false
    }

    return true // close enough, go on to next span
  }

  nextStep(pCount: number, spanCount: number, lineCount: number): boolean {
    this.log('go on to next step')
    if (this.lineOffset >= lineCount - 1) {
      this.lineOffset = 0
      if (this.sIndex === spanCount - 1) {
        this.sIndex = 0
        if (this.pIndex === pCount - 1) {
          this.log('all done')
          return true // all close enough, return currentResult
        } else {
          this.log('next p')
          this.pIndex++
        }
      } else {
        this.log('next span')
        this.sIndex++
      }
    } else {
      this.log('next line')
      this.lineOffset++
    }
    this.resetParamsForStep()
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

    this.log('i, j, offset:', this.pIndex, this.sIndex, this.lineOffset)

    if (this.checkLoop()) {
      this.log('MAX_LOOP reached')
      this.undoToMinDiff()
      return this.nextStep(targetSpanDataList.length, targetSpans.length, targetSpanRects.length)
    }

    if (this.checkBound()) {
      this.log('bound from previous result exceeded')
      this.undoToMinDiff()
      return this.nextStep(targetSpanDataList.length, targetSpans.length, targetSpanRects.length)
    }

    const sameLines = this.compareByLineCount(currSpanRects.length, targetSpanRects.length)

    if (sameLines) {
      this.TOLERANCE = this.config.paragraphs[this.pIndex].spans[this.sIndex].styles.size / 10

      const dimension = this.isVertical ? 'height' : 'width'
      if (this.lineOffset > currSpanRects.length - 1) {
        return this.nextStep(targetSpanDataList.length, targetSpans.length, targetSpanRects.length)
      }

      const currLineSize = currSpanRects[currSpanRects.length - 1 - this.lineOffset][dimension]
      const targetLineSize = targetSpanRects[targetSpanRects.length - 1 - this.lineOffset][dimension]

      const goNextSpan = this.compareByLineSize(currLineSize, targetLineSize)
      if (goNextSpan) {
        return this.nextStep(targetSpanDataList.length, targetSpans.length, targetSpanRects.length)
      }
    }

    this.log(this.offset, this.direction, this.prevOffset, this.MAX_LOOP, this.TOLERANCE)
    if (this.checkDirection()) {
      this.log('different direction encountered')
      this.undoToMinDiff()
      return this.nextStep(targetSpanDataList.length, targetSpans.length, targetSpanRects.length)
    }
    this.applyOffset()
    return false // head to next loop
  }
}

export class AutoResizeBySpanDataList2 extends AutoResizeBySpanDataList {
  BY = 'spanDataList2'
  MAX_LOOP = 200
  TOLERANCE = 0.1

  initDirection() {
    // decide which direction to search
    const widthLimitDiff = this.initSize.widthLimit - this.config.widthLimit
    if (widthLimitDiff !== 0) {
      // if widthLimit has been changed by previous stage, use same direction
      this.offset = widthLimitDiff > 0 ? 1 : -1
    } else {
      if (!this.checkStructMatch(this.autoSize.spanDataList, this.initSize.spanDataList)) return this.bestResult()
      // if widthLimit not changed by previous stage, decide direction by spanDataList
      this.setDirectionBySpanDataList()
    }
  }

  setDirectionBySpanDataList() {
    const currSpanDataList = this.autoSize.spanDataList
    const targetSpanDataList = this.initSize.spanDataList!

    for (let i = 0; i < currSpanDataList.length; i++) {
      const currSpans = currSpanDataList[i]
      const targetSpans = targetSpanDataList[i]

      for (let j = 0; j < currSpans.length; j++) {
        const currSpanRects = currSpans[j]
        const targetSpanRects = targetSpans[j]

        const sameLines = this.compareByLineCount(currSpanRects.length, targetSpanRects.length)

        if (sameLines) {
          for (let k = 0; k < currSpanRects.length; k++) {
            const TOLERANCE = this.config.paragraphs[i].spans[j].styles.size / 10

            const dimension = this.isVertical ? 'height' : 'width'

            const currLineSize = currSpanRects[currSpanRects.length - 1 - k][dimension]
            const targetLineSize = targetSpanRects[targetSpanRects.length - 1 - k][dimension]

            // if target last line is longer, decrease widthLimit to push more characters to last line.
            if (targetLineSize - currLineSize > TOLERANCE) {
              this.offset = -1
              return
            }

            // if target last line is shorter, increase widthLimit to pull more characters from last line.
            if (currLineSize - targetLineSize > TOLERANCE) {
              this.offset = 1
              return
            }
          }
        }
      }
    }
  }

  calcDiff(): boolean {
    // calc mean of width diffs of all lines.
    // @Return if skip calculation when structures don't match
    if (!this.checkStructMatch(this.autoSize.spanDataList, this.initSize.spanDataList)) return true
    const currSpanDataList = this.autoSize.spanDataList
    const targetSpanDataList = this.initSize.spanDataList!

    let diffSum = 0
    let diffCount = 0

    for (let i = 0; i < currSpanDataList.length; i++) {
      const currSpans = currSpanDataList[i]
      const targetSpans = targetSpanDataList[i]

      for (let j = 0; j < currSpans.length; j++) {
        const currSpanRects = currSpans[j]
        const targetSpanRects = targetSpans[j]
        const fontSize = this.config.paragraphs[i].spans[j].styles.size

        // if lines of some span don't match, skip calculation
        if (currSpanRects.length !== targetSpanRects.length) return true

        for (let k = 0; k < currSpanRects.length; k++) {
          const dimension = this.isVertical ? 'height' : 'width'
          diffSum += Math.abs(currSpanRects[k][dimension] - targetSpanRects[k][dimension]) / fontSize
          diffCount++
        }
      }
    }

    const currDiff = diffSum / diffCount

    this.updateDiff(currDiff)

    return false
  }

  async run(): Promise<IRunResult> {
    this.log('run start')
    if (this.initSize.spanDataList === undefined) return this.bestResult()
    await this.updateSize()

    this.initDirection()
    if (this.offset === 0) { // everything is close enough
      return this.bestResult()
    }

    while (this.shouldContinue) {
      this.autoDimension = this.autoSize[this.dimension]
      if (this.checkLoop()) return this.bestResult()
      if (this.checkBound()) return this.bestResult()
      const matched = this.calcDiff()
      if (this.prevDiff < this.TOLERANCE) return this.bestResult()
      this.log(`line count of all spans matched: ${matched}`)
      this.applyOffset()
      await this.updateSize()
    }
    return this.finalResult()
  }

  runSync(): IRunResult {
    this.log('runSync start')
    if (this.initSize.spanDataList === undefined) return this.bestResult()
    this.updateSizeSync()

    this.initDirection()
    if (this.offset === 0) { // everything is close enough
      return this.bestResult()
    }

    while (this.shouldContinue) {
      this.autoDimension = this.autoSize[this.dimension]
      if (this.checkLoop()) return this.bestResult()
      if (this.checkBound()) return this.bestResult()
      const matched = this.calcDiff()
      if (this.prevDiff < this.TOLERANCE) return this.bestResult()
      this.log(`line count of all spans matched: ${matched}`)
      this.applyOffset()
      this.updateSizeSync()
    }
    return this.finalResult()
  }
}

type METHOD = 'height' | 'spanDataList' | 'spanDataList2'

function createAutoResizeObjByMethod(config: IText, initSize: IInitSize, method: METHOD, prevStageRes: IRunResult): AutoResize {
  switch (method) {
    case 'height':
      return new AutoResizeByHeight(config, initSize)
    case 'spanDataList':
      return new AutoResizeBySpanDataList(config, initSize, AutoResizeByHeight.getDiff(config, prevStageRes, initSize))
    case 'spanDataList2':
      return new AutoResizeBySpanDataList2(config, initSize, AutoResizeByHeight.getDiff(config, prevStageRes, initSize))
  }
}

function getPipeLineParams(config: IText, initSize: IInitSize) {
  const stageLoops: number[] = []
  const dimension = config.styles.writingMode.includes('vertical') ? 'width' : 'height'
  const res: IRunResult = { widthLimit: initSize.widthLimit, otherDimension: initSize[dimension], loops: 0 }
  const widthLimit = initSize.widthLimit
  return { stageLoops, dimension, res, widthLimit }
}

function updateParams(params: ReturnType<typeof getPipeLineParams>, res: IRunResult) {
  params.res = res
  params.stageLoops.push(res.loops)
  params.widthLimit = res.widthLimit
}

function getPipeLineResult(params: ReturnType<typeof getPipeLineParams>): IMultiStageRunResult {
  return { widthLimit: params.widthLimit, otherDimension: params.res.otherDimension, stageLoops: params.stageLoops }
}

export function autoResizePipeLineSync(config: IText, initSize: IInitSize, methods: METHOD[]): IMultiStageRunResult {
  const params = getPipeLineParams(config, initSize)
  for (const method of methods) {
    updateParams(params, createAutoResizeObjByMethod(config, { ...initSize, widthLimit: params.widthLimit }, method, params.res).runSync())
  }
  return getPipeLineResult(params)
}

export async function autoResizePipeLine(config: IText, initSize: IInitSize, methods: METHOD[]): Promise<IMultiStageRunResult> {
  const params = getPipeLineParams(config, initSize)
  for (const method of methods) {
    updateParams(params, await createAutoResizeObjByMethod(config, { ...initSize, widthLimit: params.widthLimit }, method, params.res).run())
  }
  return getPipeLineResult(params)
}
