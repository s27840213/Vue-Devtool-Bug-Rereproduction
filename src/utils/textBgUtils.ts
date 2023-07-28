import { CustomElementConfig } from '@/interfaces/editor'
import { isITextBox, isITextGooey, isITextLetterBg, isITextSpeechBubble, isITextUnderline, ITextBg, ITextGooey, tailPositions } from '@/interfaces/format'
import { AllLayerTypes, IParagraphStyle, ISpanStyle, IText, ITextStyle } from '@/interfaces/layer'
import store from '@/store'
import cssConverter from '@/utils/cssConverter'
import layerUtils from '@/utils/layerUtils'
import letterBgData from '@/utils/letterBgData'
import localStorageUtils from '@/utils/localStorageUtils'
import { obj2Point, Path, Point } from '@/utils/mathUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { Editor } from '@tiptap/vue-3'
import _, { cloneDeep, isEqual, maxBy, omit, sum } from 'lodash'
import generalUtils from './generalUtils'
import textUtils from './textUtils'

export class Rect {
  bodyRect = new DOMRect()
  vertical = false
  width = 0
  height = 0
  transform = ''
  rows: {
    rect: DOMRect
    spanData: {
      x: number
      y: number
      width: number
      height: number
      text: string
      letterSpacing: number
      // pIndex, sIndex, and lineHeight were originally used for TextFill, but are currently unused.
      pIndex: number
      sIndex: number
      lineHeight: number
    }[]
  }[] = []

  async waitForRender(div: HTMLElement): Promise<void> {
    const textId = generalUtils.generateRandomString(12)
    div.setAttribute('id', textId)
    return new Promise(resolve => {
      textUtils.observerCallbackMap[textId] = () => {
        textUtils.observer.unobserve(div)
        resolve()
      }
      document.body.appendChild(div)
      textUtils.observer.observe(div)
    })
  }

  async init(config: IText, { splitSpan } = { splitSpan: false }) {
    this.vertical = config.styles.writingMode.includes('vertical')

    let div = document.createElement('div')
    div.classList.add('nu-text__body')
    // Prevent this div to be screenshoted by backend
    if (['test.vivipic.com', 'vivipic.com'].includes(window.location.host)) {
      div.style.opacity = '0'
    }
    config.paragraphs.forEach(para => {
      const p = document.createElement('p')
      p.classList.add('nu-text__p')
      const pStyle = tiptapUtils.textStylesRaw(para.styles)
      Object.assign(p.style, pStyle, { margin: 0 })
      div.appendChild(p)

      para.spans.forEach(spanData => {
        if (!spanData.text) {
          const span = document.createElement('span')
          span.classList.add('nu-text__span')
          span.appendChild(document.createElement('br'))
          p.appendChild(span)
        } else {
          const fixedWidth = textBgUtils.isFixedWidth(config.styles)
          const textArray = splitSpan
            ? textUtils.splitter.splitGraphemes(spanData.text)
            : [spanData.text]
          textArray.forEach(t => {
            const isComposingText = textUtils.splitter.countGraphemes(spanData.text) > 1
            const fixedWidthStyle = fixedWidth && isComposingText ? {
              letterSpacing: 0,
              display: 'inline-block',
            } : fixedWidth ? textBgUtils.fixedWidthStyle(spanData.styles, para.styles, config) : {}

            const span = document.createElement('span')
            span.classList.add('nu-text__span')
            span.textContent = t

            const spanStyleObject = tiptapUtils.textStylesRaw(spanData.styles)
            spanStyleObject.textIndent = spanStyleObject['letter-spacing'] || 'initial'

            Object.assign(span.style, spanStyleObject, fixedWidthStyle)

            p.appendChild(span)
          })
        }
      })
    })

    // const safariStyle = platform.name === 'Safari' ? { lineBreak: 'loose' } : {}
    const safariStyle = generalUtils.safariLike ? { lineBreak: 'normal' } : {}
    // const safariStyle = platform.name === 'Safari' ? { lineBreak: 'strict' } : {}
    Object.assign(div.style, safariStyle)
    div.style.writingMode = cssConverter.convertVerticalStyle(config.styles.writingMode).writingMode
    let { widthLimit } = config
    if (config.styles.textShape.name !== 'none') widthLimit = -1
    const { scale, height } = config.styles
    if (this.vertical) {
      div.style.width = 'max-content'
      div.style.height = widthLimit === -1 ? 'max-content' : `${widthLimit / config.styles.scale}px`
    } else {
      div.style.width = widthLimit === -1 ? 'max-content' : `${widthLimit / config.styles.scale}px`
      div.style.height = 'max-content'
    }
    await this.waitForRender(div)

    // Add width limit to try to fit element height with config height.
    const heightLimit = height / scale
    const target = this.vertical ? 'height' : 'width'
    let resizeTimes = 1
    while (widthLimit !== -1 && resizeTimes < 100 &&
      Math.abs(div.clientHeight - heightLimit) > 5 * scale) {
      resizeTimes++
      if (div.clientHeight > heightLimit) {
        widthLimit += scale * resizeTimes
      } else {
        widthLimit -= scale * resizeTimes
      }
      div = div.cloneNode(true) as HTMLDivElement
      div.style[target] = `${widthLimit / scale}px`
      await this.waitForRender(div)
    }

    this.bodyRect = div.getClientRects()[0]
    this.width = this.bodyRect.width
    this.height = this.bodyRect.height
    this.transform = this.vertical ? 'rotate(90deg) scale(1,-1)' : ''
    this.rows = []

    for (let pIndex = 0; pIndex < div.children.length; pIndex++) {
      const p = div.children[pIndex]
      const fontSize = parseFloat((p as HTMLElement).style.fontSize)
      const letterSpacingEm = parseFloat((p as HTMLElement).style.letterSpacing)
      const lineHeight = parseFloat((p as HTMLElement).style.lineHeight)
      const letterSpacing = fontSize * letterSpacingEm
      for (let sIndex = 0; sIndex < p.children.length; sIndex++) {
        const span = p.children[sIndex]
        for (const cr of span.getClientRects()) {
          // If span is fixedWidth, its display will be inline-block
          // Height of inline-block span will grow with lineHeight
          // Here calc height and y without inline-block effect
          // For vertical text, modify width&x instead of height&y
          const isInlineBolck = (span as HTMLElement).style.display === 'inline-block'
          let { width, height, y, x } = cr
          if (isInlineBolck && this.vertical) {
            width = width / lineHeight * 1.4
            x = cr.x + (cr.width - width) / 2
          } else if (isInlineBolck) {
            height = height / lineHeight * 1.4
            y = cr.y + (cr.height - height) / 2
          }
          this.rows.push({
            rect: cr,
            spanData: [{
              x,
              y,
              width,
              height,
              text: span.textContent ?? '',
              letterSpacing,
              pIndex,
              sIndex,
              lineHeight,
            }]
          })
        }
      }
    }
  }

  // Exchange x, y coordinate, used when text vertical.
  xyExchange() {
    const { rows, bodyRect } = this
    Object.assign(bodyRect, {
      x: bodyRect.y,
      y: bodyRect.x,
      width: bodyRect.height,
      height: bodyRect.width
    })
    rows.forEach((row) => {
      const { rect, spanData } = row
      Object.assign(rect, {
        x: rect.y,
        y: rect.x,
        width: rect.height,
        height: rect.width
      })
      spanData.forEach(data => {
        [data.x, data.y, data.height, data.width] = [data.y, data.x, data.width, data.height]
      })
    })
  }

  // Merge Rect if at the same line.
  mergeLine() {
    const { rows } = this
    rows.forEach((row, index) => {
      const nextIndex = index + 1
      while (nextIndex < rows.length) {
        const curr = row.rect
        const next = rows[nextIndex].rect
        const currTop = curr.y
        const currBottom = curr.y + curr.height
        const nextTop = next.y
        const nextBottom = next.y + next.height
        if (((nextTop <= currTop && currTop <= nextBottom &&
          nextTop <= currBottom && currBottom <= nextBottom) ||
          (currTop <= nextTop && nextTop <= currBottom &&
            currTop <= nextBottom && nextBottom <= currBottom))) {
          curr.y = Math.min(curr.y, next.y)
          curr.width += next.width
          curr.height = Math.max(curr.height, next.height)
          row.spanData = row.spanData.concat(rows[nextIndex].spanData)
          rows.splice(nextIndex, 1)
        } else break
      }
    })
  }

  // Expend empty line width as neibor.
  expandEmptyLine() {
    const { rows, bodyRect } = this
    const defaultLine = {
      rect: { x: bodyRect.x, width: bodyRect.width },
      spanData: []
    }
    rows.forEach((row, index) => {
      const { rect } = row
      if (rect.width < 1) {
        let nextIndex = index + 1
        while (nextIndex < rows.length && rows[nextIndex].rect.width < 1) nextIndex++
        const next = rows[nextIndex] ?? defaultLine
        const prev = rows[index - 1] ?? defaultLine
        const target = (prev.rect.width < next.rect.width) ? prev : next
        rect.x = target.rect.x
        rect.width = target.rect.width
        row.spanData = []
      }
    })
  }

  // Coordinate initial, use bodyRect as origin.
  coordinateInit() {
    const { rows, bodyRect } = this
    rows.forEach((row) => {
      const { rect } = row
      rect.x -= bodyRect.x
      rect.y -= bodyRect.y
      row.spanData.forEach((span) => {
        span.x -= bodyRect.x
        span.y -= bodyRect.y
      })
    })
  }

  preprocess() {
    const { vertical } = this
    if (vertical) this.xyExchange()
    this.mergeLine()
    this.expandEmptyLine()
    this.coordinateInit()
  }

  get() {
    const { vertical, width, height, transform, rows } = this
    return {
      vertical,
      width,
      height,
      transform,
      rows,
      rects: _.map(rows, 'rect')
    }
  }
}

class Gooey {
  controlPoints = [[], []] as { top: Point, bottom: Point, oldHeight: number }[][]
  bRadius: number
  constructor(textBg: ITextGooey, rects: DOMRect[]) {
    this.bRadius = textBg.bRadius
    const first = rects[0]
    this.controlPoints[0].push({
      top: new Point(first.x + first.width, first.y),
      bottom: new Point(first.x + first.width, first.y),
      oldHeight: first.height
    })
    this.controlPoints[1].push({
      top: new Point(first.x, first.y),
      bottom: new Point(first.x, first.y),
      oldHeight: first.height
    })
    rects.forEach((rect: DOMRect) => {
      this.controlPoints[0].push({
        top: new Point(rect.x, rect.y),
        bottom: new Point(rect.x, rect.y + rect.height),
        oldHeight: rect.height
      })
      this.controlPoints[1].push({
        top: new Point(rect.x + rect.width, rect.y),
        bottom: new Point(rect.x + rect.width, rect.y + rect.height),
        oldHeight: rect.height
      })
    })
    const last = (_.nth(rects, -1) as DOMRect)
    this.controlPoints[0].push({
      top: new Point(last.x + last.width, last.y + last.height),
      bottom: new Point(last.x + last.width, last.y + last.height),
      oldHeight: last.height
    })
    this.controlPoints[1].push({
      top: new Point(last.x, last.y + last.height),
      bottom: new Point(last.x, last.y + last.height),
      oldHeight: last.height
    })
  }

  // Merge the area that two Rects overlap.
  merge() {
    this.controlPoints[0].forEach((cps, index, arr) => {
      if (index === 0 || index === arr.length - 1 || index === arr.length - 2) return
      const cpsNext = this.controlPoints[0][index + 1]
      const newY = Math.abs(cps.bottom.x - cpsNext.top.x) < 10 ? (cps.bottom.y + cpsNext.top.y) / 2
        : cps.bottom.x < cpsNext.top.x ? cps.bottom.y : cpsNext.top.y
      cps.bottom.y = cpsNext.top.y = newY
    })
    this.controlPoints[1].forEach((cps, index, arr) => {
      if (index === 0 || index === arr.length - 1 || index === arr.length - 2) return
      const cpsNext = this.controlPoints[1][index + 1]
      const newY = Math.abs(cps.bottom.x - cpsNext.top.x) < 10 ? (cps.bottom.y + cpsNext.top.y) / 2
        : cps.bottom.x > cpsNext.top.x ? cps.bottom.y : cpsNext.top.y
      cps.bottom.y = cpsNext.top.y = newY
    })
  }

  // Delete Rect if its top below bottom after merge.
  delete() {
    let count = 0
    this.controlPoints.forEach(side => {
      for (let i = 1; i < side.length - 1;) {
        const cps = side[i]
        if (side.length > 3 && cps.bottom.y - cps.top.y < cps.oldHeight * 0.1) {
          side.splice(i, 1)
          count++
        } else i++
      }
    })
    return count
  }

  // Keep doing merge and delete until nothing to delete.
  preprocess() {
    do {
      this.merge()
    } while (this.delete())
  }

  // Return svg path
  process() {
    const bRadius = this.bRadius
    let path = null as unknown as Path
    let ps = this.controlPoints[0]
    for (let i = 1; i < ps.length - 1; i++) {
      const curr = ps[i]
      const prev = ps[i - 1]
      const prevMiddle = prev.bottom.middle(curr.top)
      const next = ps[i + 1]
      const nextMiddle = curr.bottom.middle(next.top)
      const radius = Math.min(curr.oldHeight * bRadius * 0.005, curr.top.dist(curr.bottom) / 2)
      const dirTop = (prev.bottom.x < curr.top.x ? -1 : 1)
      const radiusTop = Math.min(radius, curr.top.dist(prevMiddle)) * dirTop

      if (i === 1) {
        path = new Path(prevMiddle)
      }

      const curveTopStart = curr.top.add({ x: radiusTop, y: 0 })
      const curveTopEnd = curr.top.add({ x: 0, y: radius })
      let curveTopStartMiddle = curr.top.middle(curveTopStart)
      const curveTopEndMiddle = curr.top.middle(curveTopEnd)
      let angle = Math.abs(Math.atan(radiusTop / radius) * (180 / Math.PI))
      curveTopStartMiddle = curveTopStartMiddle.rotate((angle * 2 - 90) * dirTop, curveTopStart)
      path.L(curveTopStart)
      path.C(curveTopStartMiddle, curveTopEndMiddle, curveTopEnd)

      const dirBottom = (curr.bottom.x < next.top.x ? 1 : -1)
      const radiusBottom = Math.min(radius, curr.bottom.dist(nextMiddle)) * dirBottom
      const curveBottomStart = curr.bottom.add({ x: 0, y: -radius })
      const curveBottomEnd = curr.bottom.add({ x: radiusBottom, y: 0 })
      const curveBottomStartMiddle = curr.bottom.middle(curveBottomStart)
      let curveBottomEndMiddle = curr.bottom.middle(curveBottomEnd)
      angle = Math.abs(Math.atan(radiusBottom / radius) * (180 / Math.PI))
      curveBottomEndMiddle = curveBottomEndMiddle.rotate((90 - angle * 2) * dirBottom, curveBottomEnd)
      path.L(curveBottomStart)
      path.C(curveBottomStartMiddle, curveBottomEndMiddle, curveBottomEnd)
    }
    ps = this.controlPoints[1]
    for (let i = ps.length - 2; i > 0; i--) {
      const curr = ps[i]
      const prev = ps[i - 1]
      const prevMiddle = prev.bottom.middle(curr.top)
      const next = ps[i + 1]
      const nextMiddle = curr.bottom.middle(next.top)
      const radius = Math.min(curr.oldHeight * bRadius * 0.005, curr.top.dist(curr.bottom) / 2)
      const dirBottom = (curr.bottom.x < next.top.x ? 1 : -1)
      const radiusBottom = Math.min(radius, curr.bottom.dist(nextMiddle)) * dirBottom

      const curveBottomStart = curr.bottom.add({ x: radiusBottom, y: 0 })
      const curveBottomEnd = curr.bottom.add({ x: 0, y: -radius })
      let curveBottomStartMiddle = curr.bottom.middle(curveBottomStart)
      const curveBottomEndMiddle = curr.bottom.middle(curveBottomEnd)
      let angle = Math.abs(Math.atan(radiusBottom / radius) * (180 / Math.PI))
      curveBottomStartMiddle = curveBottomStartMiddle.rotate((90 - angle * 2) * dirBottom, curveBottomStart)
      path.L(curveBottomStart)
      path.C(curveBottomStartMiddle, curveBottomEndMiddle, curveBottomEnd)

      const dirTop = (prev.bottom.x < curr.top.x ? -1 : 1)
      const radiusTop = Math.min(radius, curr.top.dist(prevMiddle)) * dirTop
      const curveTopStart = curr.top.add({ x: 0, y: radius })
      const curveTopEnd = curr.top.add({ x: radiusTop, y: 0 })
      const curveTopStartMiddle = curr.top.middle(curveTopStart)
      let curveTopEndMiddle = curr.top.middle(curveTopEnd)
      angle = Math.abs(Math.atan(radiusTop / radius) * (180 / Math.PI))
      curveTopEndMiddle = curveTopEndMiddle.rotate((angle * 2 - 90) * dirTop, curveTopEnd)
      path.L(curveTopStart)
      path.C(curveTopStartMiddle, curveTopEndMiddle, curveTopEnd)
    }

    return path
  }

  processWithShape(config: IText, maxHeightSpan: Record<'height' | 'y', number>, textWidth: number[], contentScaleRatio: number) {
    let { width: layerWidth, height: layerHeight, scale: layerScale } = config.styles
    layerWidth = layerWidth / layerScale * contentScaleRatio
    layerHeight = layerHeight / layerScale * contentScaleRatio
    const bend = +config.styles.textShape.bend

    const mainFontSize = textEffectUtils.getLayerFontSize(config.paragraphs)
    const padding = (config.styles.textBg as ITextGooey).distance * mainFontSize / 60
    const maxHeightCp = maxBy(this.controlPoints[0].slice(1, -1), cp => cp.oldHeight)!
    const borderHeight = maxHeightCp.top.dist(maxHeightCp.bottom)
    const radius = Math.min(maxHeightCp.oldHeight * this.bRadius * 0.005, borderHeight / 2)
    const shapeRadius = textShapeUtils.getRadiusByBend(bend, mainFontSize)

    const textAngles = [...textWidth, padding, padding].map(w => (360 * w) / (shapeRadius * 2 * Math.PI))
    const totalAngle = sum(textAngles) * (bend >= 0 ? 1 : -1)
    const endpointAngle = radius * 360 / (shapeRadius * 2 * Math.PI) * (bend >= 0 ? 1 : -1)
    const bodyAngle = totalAngle - endpointAngle * 2

    const center = new Point(layerWidth / 2,
      bend >= 0 ? maxHeightSpan.height / 2 + shapeRadius : layerHeight - maxHeightSpan.height / 2 - shapeRadius)
    maxHeightSpan.height += padding * 2
    maxHeightSpan.y -= padding
    const middle = new Point(layerWidth / 2,
      bend >= 0 ? maxHeightSpan.y : layerHeight - maxHeightSpan.height - maxHeightSpan.y)
    const begin = middle.rotate(-bodyAngle / 2, center)

    // Index 0 ~ 3 mean: right-top, right-bottom, left-bottom, left-top.
    const corner = [
      middle.rotate(totalAngle / 2, center),
      middle.add(new Point(0, 1).mul(borderHeight)).rotate(totalAngle / 2, center),
      middle.add(new Point(0, 1).mul(borderHeight)).rotate(-totalAngle / 2, center),
      middle.rotate(-totalAngle / 2, center)
    ]
    const rightBorderDir = new Point(0, 1).rotate(totalAngle / 2)
    const leftBorderDir = new Point(0, 1).rotate(-totalAngle / 2)
    const curveBegin = [
      corner[0].rotate(-endpointAngle, center),
      corner[1].add(rightBorderDir.mul(-radius)),
      corner[2].rotate(endpointAngle, center),
      corner[3].add(leftBorderDir.mul(radius)),
    ]
    const curveEnd = [
      corner[0].add(rightBorderDir.mul(radius)),
      corner[1].rotate(-endpointAngle, center),
      corner[2].add(leftBorderDir.mul(-radius)),
      corner[3].rotate(endpointAngle, center),
    ]

    const path = new Path(begin)
    path.largeArc(bodyAngle, center)
    path.C(curveBegin[0].middle(corner[0]), corner[0].middle(curveEnd[0]), curveEnd[0])
    path.L(curveBegin[1])
    path.C(curveBegin[1].middle(corner[1]), corner[1].middle(curveEnd[1]), curveEnd[1])
    path.largeArc(-bodyAngle, center)
    path.C(curveBegin[2].middle(corner[2]), corner[2].middle(curveEnd[2]), curveEnd[2])
    path.L(curveBegin[3])
    path.C(curveBegin[3].middle(corner[3]), corner[3].middle(curveEnd[3]), curveEnd[3])

    this.controlPoints = [
      Array(3).fill({ top: corner[3], bottom: corner[2], oldHeight: 0 }),
      Array(3).fill({ top: corner[0], bottom: corner[1], oldHeight: 0 }),
    ]

    return path
  }

  // For debug
  toCircle() {
    const circle = [] as CustomElementConfig[]
    this.controlPoints.forEach(side => {
      side.slice(1, -1).forEach(cps => {
        circle.push({
          tag: 'circle',
          attrs: {
            cx: cps.top.x,
            cy: cps.top.y,
            r: '5',
            fill: 'green'
          }
        })
        circle.push({
          tag: 'circle',
          attrs: {
            cx: cps.bottom.x,
            cy: cps.bottom.y,
            r: '5',
            fill: 'blue'
          }
        })
      })
    })
    return circle
  }
}

class TextBg {
  private currColorKey = ''

  rgba = (color: string, opacity: number) =>
    textEffectUtils.convertColor2rgba(color, opacity)

  get effectDefaultOptions() {
    return {
      none: {},
      'square-borderless': {
        opacity: 100,
        bStroke: 0, // unadjustable
        bRadius: 0, // unadjustable
        bColor: 'transparent', // unadjustable
        pStrokeX: 13, // unadjustable in all effects
        pStrokeY: 5,
        pColor: 'fontColorL+-40/BC/00'
      },
      'rounded-borderless': {
        opacity: 100,
        bStroke: 0, // unadjustable
        bRadius: 10,
        bColor: 'transparent', // unadjustable
        pStrokeX: 13, // unadjustable in all effects
        pStrokeY: 5,
        pColor: 'fontColorL+-40/BC/00'
      },
      'square-hollow': {
        opacity: 100,
        bStroke: 3,
        bRadius: 0, // unadjustable
        bColor: 'fontColorL+-40/BC/00',
        pStrokeX: 13, // unadjustable in all effects
        pStrokeY: 5,
        pColor: 'transparent' // unadjustable
      },
      'rounded-hollow': {
        opacity: 100,
        bStroke: 3,
        bRadius: 10,
        bColor: 'fontColorL+-40/BC/00',
        pStrokeX: 13, // unadjustable in all effects
        pStrokeY: 5,
        pColor: 'transparent' // unadjustable
      },
      'square-both': {
        opacity: 100,
        bStroke: 3,
        bRadius: 0, // unadjustable
        bColor: 'fontColor',
        pStrokeX: 13, // unadjustable in all effects
        pStrokeY: 5,
        pColor: 'fontColorL+-40/BC/00'
      },
      'rounded-both': {
        opacity: 100,
        bStroke: 3,
        bRadius: 10,
        bColor: 'fontColor',
        pStrokeX: 13, // unadjustable in all effects
        pStrokeY: 5,
        pColor: 'fontColorL+-40/BC/00'
      },
      'speech-bubble': {
        tailOffset: 50,
        tailPosition: 'right',
        bRadius: 100, // unadjustable
        pStrokeX: 20, // unadjustable in all effects
        pStrokeY: 20,
        opacity: 100,
        pColor: 'fontColorL+-40/BC/00'
      },
      'speech-bubble-triangle': {
        tailOffset: 50,
        tailPosition: 'bottom',
        bRadius: 100,
        pStrokeX: 20, // unadjustable in all effects
        pStrokeY: 20,
        opacity: 100,
        pColor: 'fontColorL+-40/BC/00'
      },
      underline: {
        endpoint: 'rounded',
        height: 20,
        yOffset: 10,
        opacity: 100,
        color: 'fontColorL+-40/F1D289'
      },
      gooey: {
        distance: 10,
        bRadius: 15,
        opacity: 100,
        color: 'fontColorL+-40/BC/00'
      },
      // A part of additional default ITextLetterBg setting is in setExtraDefaultAttrs func.
      ...letterBgData.getDeafultOptions()
    } as Record<string, Record<string, string | number | boolean>>
  }

  inlineSvg(svg: string) {
    return svg.replace(/\n[ ]*/g, '').replace(/#/g, '%23')
  }

  convertTextEffect(/* styles: ITextStyle */): Partial<Record<'div' | 'p' | 'span', Record<string, string | number>>> {
    // const textBg = styles.textBg
    return {}
  }

  // A fixedWith text must be splitSpan, but a splitSpan may not be fixedWidth.
  // Originally, TextFill was also splitSpan, but it is no longer. So isSplitSpan just call isFixedWidth.
  isSplitSpan(styles: ITextStyle) {
    return this.isFixedWidth(styles)
  }

  isFixedWidth(styles: ITextStyle) {
    const { textBg } = styles
    return isITextLetterBg(textBg) && textBg.fixedWidth
  }

  fixedWidthStyle(spanStyle: ISpanStyle, pStyle: IParagraphStyle, config: IText) {
    if (!this.isFixedWidth(config.styles)) return null

    let [w, h] = ['min-width', 'min-height']
    if (config.styles.writingMode.includes('vertical')) [w, h] = [h, w]
    // If tiptap attr have min-w/h, convertFontStyle() in cssConverter.ts will add some style to tiptap.
    return {
      [w]: `${spanStyle.size * 1.333333 * (pStyle.fontSpacing + 1)}px`,
      display: 'inline-block',
      letterSpacing: 0,
      textAlign: 'center',
    }
  }

  async drawTextBg(config: IText): Promise<CustomElementConfig | null> {
    const contentScaleRatio = 1
    const { textBg, textShape } = config.styles
    if (textBg.name === 'none') return null

    let { width: layerWidth, height: layerHeight, scale: layerScale } = config.styles
    layerWidth = layerWidth / layerScale * contentScaleRatio
    layerHeight = layerHeight / layerScale * contentScaleRatio
    const opacity = textBg.opacity * 0.01
    const mainFontSize = textEffectUtils.getLayerFontSize(config.paragraphs)
    const withShape = textShape.name !== 'none'
    const bend = +textShape.bend

    const myRect = new Rect()
    let textShapeData = { textWidth: [] as number[], textHeight: [] as number[], minHeight: -1 }
    await Promise.all([
      myRect.init(config, { splitSpan: isITextLetterBg(textBg) }),
      withShape && (isITextLetterBg(textBg) || isITextUnderline(textBg) || isITextGooey(textBg))
        ? textShapeUtils.getTextHWsAsync(config)
        : { textWidth: [], textHeight: [], minHeight: -1 }
    ]).then(result => {
      textShapeData = result[1]
    })
    myRect.preprocess()
    const { vertical, width, height, transform, rects, rows } = myRect.get()
    const maxHeightSpan = maxBy( // y is accrodding to its row, not entire svg.
      rows.flatMap(row => row.spanData.map(span => ({ height: span.height, y: span.y - row.rect.y }))),
      data => data.height
    ) ?? { height: 0, y: 0 }

    if (isITextGooey(textBg)) {
      const padding = textBg.distance * mainFontSize / 60
      const color = textEffectUtils.colorParser(textBg.color, config)
      const fill = this.rgba(color, opacity)

      // Add padding.
      rects.forEach((rect: DOMRect) => {
        rect.x -= padding
        rect.y -= padding
        rect.width += padding * 2
        rect.height += padding * 2
      })

      const cps = new Gooey(textBg, rects)
      !withShape && cps.preprocess()
      const resultPath = !withShape ? cps.process()
        : cps.processWithShape(config, maxHeightSpan, textShapeData.textWidth, contentScaleRatio)

      return {
        tag: 'svg',
        attrs: { width, height, fill },
        content: [{
          tag: 'path',
          attrs: {
            d: resultPath.result(),
          },
          style: { transform },
        }]
        // .concat(cps.toCircle() as any) // Show control point
        // .concat(resultPath.toCircle() as any)
      }
    } else if (isITextUnderline(textBg)) {
      const color = textEffectUtils.colorParser(textBg.color, config)
      const fill = this.rgba(color, opacity)
      const paths = [] as CustomElementConfig[]

      // Variable for TextShape version
      const shapeCapWidth = maxHeightSpan.height * 0.005 * textBg.height
      const yOffset = (maxHeightSpan.height - shapeCapWidth * 2) * 0.01 * (100 - textBg.yOffset)
      const radius = textShapeUtils.getRadiusByBend(bend, mainFontSize)
      const textAngles = textShapeData.textWidth.map(w => (360 * w) / (radius * 2 * Math.PI))
      const totalAngle = sum(textAngles) * (bend >= 0 ? 1 : -1)
      const endpointAngle = !withShape ? 0 // Will be 0 for non-TextShape
        : shapeCapWidth * 360 / (radius * 2 * Math.PI) * (bend >= 0 ? 1 : -1)
      const bodyAngle = totalAngle - endpointAngle * 2

      const middle = new Point(layerWidth / 2,
        (bend >= 0 ? maxHeightSpan.y : layerHeight - maxHeightSpan.height - maxHeightSpan.y) + yOffset)
      const center = new Point(layerWidth / 2,
        bend >= 0 ? maxHeightSpan.height / 2 + radius : layerHeight - maxHeightSpan.height / 2 - radius)
      const begin = middle.rotate(-bodyAngle / 2, center)

      for (const rect of rects) {
        const capWidth = withShape ? shapeCapWidth : rect.height * 0.005 * textBg.height
        const yOffset = (rect.height - capWidth * 2) * 0.01 * (100 - textBg.yOffset)
        const path = withShape ? new Path(begin)
          : new Path(new Point(rect.x + capWidth, rect.y + yOffset))

        // Step 1: top line
        if (withShape) {
          path.largeArc(bodyAngle, center)
        } else {
          path.h(rect.width - capWidth * 2)
        }

        // Step 2: right endpoint
        switch (textBg.endpoint) {
          case 'triangle':
            withShape ? path.largeArc(endpointAngle, center)
              : path.l(new Point(capWidth, 0))
            // If !withShape, all rotate in step 2, 4 take no effect.
            path.l(new Point(-capWidth, capWidth * 2).rotate((totalAngle - endpointAngle) / 2))
            break
          case 'rounded':
            path.a(new Point(0, capWidth * 2).rotate(bodyAngle / 2))
            break
          case 'square':
            withShape ? path.largeArc(endpointAngle, center)
              : path.l(new Point(capWidth, 0))
            path.l(new Point(0, capWidth * 2).rotate(totalAngle / 2))
            withShape ? path.largeArc(-endpointAngle, center)
              : path.l(new Point(-capWidth, 0))
            break
        }

        // Step 3: bottom line
        if (withShape) {
          path.largeArc(-bodyAngle, center)
        } else {
          path.h(-(rect.width - capWidth * 2))
        }

        // Step 4: left endpoint
        switch (textBg.endpoint) {
          case 'triangle':
            withShape ? path.largeArc(-endpointAngle, center)
              : path.l(new Point(-capWidth, 0))
            break
          case 'rounded':
            path.a(new Point(0, -capWidth * 2).rotate(-bodyAngle / 2))
            break
          case 'square':
            withShape ? path.largeArc(-endpointAngle, center)
              : path.l(new Point(-capWidth, 0))
            path.l(new Point(0, -capWidth * 2).rotate(-totalAngle / 2))
            withShape && path.largeArc(endpointAngle, center)
            break
        }

        paths.push({
          tag: 'path',
          attrs: {
            d: path.result(),
          },
          style: { transform },
        })
        // paths.push(...path.toCircle()) // Show control point
        if (withShape) break // TextShape only have one line.
      }

      return {
        tag: 'svg',
        attrs: {
          width: layerWidth,
          height: layerHeight,
          fill
        },
        content: paths
      }
    } else if (isITextBox(textBg) || isITextSpeechBubble(textBg)) {
      // Tail in bottom or left need inverse offset direction.
      const tailOffset = isITextSpeechBubble(textBg)
        ? ['bottom', 'left'].includes(textBg.tailPosition) ? 1 - textBg.tailOffset * 0.01
            : textBg.tailOffset * 0.01 : 0
      const fill = textEffectUtils.colorParser(textBg.pColor, config)
      const stroke = isITextBox(textBg) ? textEffectUtils.colorParser(textBg.bColor, config) : ''
      const bStroke = (isITextBox(textBg) ? textBg.bStroke : 0) * mainFontSize / 60
      const pStrokeY = textBg.pStrokeY * mainFontSize / 60
      const pStrokeX = textBg.pStrokeX * mainFontSize / 60
      let boxWidth = (layerWidth + bStroke)
      let boxHeight = (layerHeight + bStroke)
      let top = -bStroke
      let left = -bStroke
      if (vertical) {
        boxWidth += pStrokeY * 2
        boxHeight += pStrokeX * 2
        top -= pStrokeX
        left -= pStrokeY
      } else {
        boxWidth += pStrokeX * 2
        boxHeight += pStrokeY * 2
        top -= pStrokeY
        left -= pStrokeX
      }
      const maxRowHeight = Math.max(...rows.map(r => r.rect.height))
      const boxRadius = isITextSpeechBubble(textBg) ? maxRowHeight * (textBg.bRadius / 100) / 2
        : Math.min(boxWidth / 2, boxHeight / 2) * textBg.bRadius * 0.01

      // Start to draw Path.
      const path = new Path(new Point(bStroke / 2, bStroke / 2 + boxRadius))
      for (const [i, section] of tailPositions.entries()) {
        const cornerDir = obj2Point({
          top: { x: 1, y: -1 },
          right: { x: 1, y: 1 },
          bottom: { x: -1, y: 1 },
          left: { x: -1, y: -1 },
        }[section])
        const centerDir = i % 2 ? new Point(0, cornerDir.y) : new Point(cornerDir.x)
        const center = centerDir.mul(boxRadius)

        // Draw corner, insert tail at corner for speech-bubble.
        if (textBg.name === 'speech-bubble' && section === textBg.tailPosition) {
          const tailBegin = new Point().rotate(60 * tailOffset, center)
          const tailEnd = tailBegin.rotate(30, center)
          let tailMid = tailBegin.middle(tailEnd)
          tailMid = tailMid.add(tailMid.sub(center).mul(0.7))
          const arcEnd = tailEnd.rotate(60 * (1 - tailOffset), center)

          path.a(tailBegin, { radius: boxRadius })
          path.q(tailMid.middle(tailBegin).sub(tailBegin).add(cornerDir.mul(boxRadius * 0.1 * cornerDir.y)), tailMid.sub(tailBegin))
          path.q(tailEnd.middle(tailMid).sub(tailMid).add(cornerDir.mul(boxRadius * 0.1 * cornerDir.y)), tailEnd.sub(tailMid))
          path.a(arcEnd.sub(tailEnd), { radius: boxRadius })
        } else { // Normal corner
          path.a(cornerDir.mul(boxRadius), { radius: boxRadius })
        }

        // Draw line, insert tail for speech-bubble-triangle.
        const lineDist = (['top', 'bottom'].includes(section) ? boxWidth : boxHeight) - boxRadius * 2
        const lineEnd = centerDir.mul(lineDist)
        if (textBg.name === 'speech-bubble-triangle' && section === textBg.tailPosition) {
          const tailLength = Math.max(Math.min(maxRowHeight * 0.25, lineDist), 0)
          const tailBegin = centerDir.mul((lineDist - tailLength) * tailOffset)
          const tailEnd = tailBegin.add(centerDir.mul(tailLength))
          const tailMid = tailBegin.middle(tailEnd).add(centerDir.rotate(-90).mul(tailLength * 1.5))

          path.l(tailBegin)
          path.l(tailMid.sub(tailBegin))
          path.l(tailEnd.sub(tailMid))
          path.l(lineEnd.sub(tailEnd))
        } else { // Normal line
          path.l(lineEnd)
        }
      }

      return {
        tag: 'svg',
        attrs: {
          width: boxWidth + bStroke,
          height: boxHeight + bStroke,
        },
        style: {
          left: `${left}px`,
          top: `${top}px`
        },
        content: [{
          tag: 'path',
          attrs: {
            'stroke-width': bStroke,
            d: path.result()
          },
          style: { fill, stroke, opacity }
        }]
        // .concat(path.toCircle() as any) // Show control point
      }
    } else if (isITextLetterBg(textBg)) {
      const scale = textBg.size / 100
      const needRotate = letterBgData.bgNeedRotate(textBg.name)
      const textShapeStyle = textShapeUtils.convertTextShape(textShapeData.textWidth, bend, mainFontSize)
      let { xOffset200: xOffset, yOffset200: yOffset } = textBg
      if (vertical) [xOffset, yOffset] = [yOffset, xOffset]

      const pos = [] as (Record<'i' | 'x' | 'y' | 'width' | 'height', number> & Record<'color' | 'href', string>)[]
      let [i, spaceCount] = [0, 0]
      rows.forEach((row) => {
        row.spanData.forEach((span, spanIndex) => {
          const { x, y, width, height, text } = span
          if (text === ' ') spaceCount += 1
          else {
            pos.push({
              ...letterBgData.getLetterBgSetting(textBg, i - spaceCount, spanIndex === 0, spanIndex === row.spanData.length - 1),
              // 1. Because all letter svg width = height, so need to -(h-w)/2
              // 2. For non-fixedWidth text, since we put svg at center of letter, and a letter contain its letterSpacing.
              // We need to -letterSpacing/2 to put svg at center of letter not contain letterSpacing.
              ...!withShape ? {
                x: x - (height - width) / 2 - (!textBg.fixedWidth ? span.letterSpacing / 2 : 0),
                y,
              } : {
                x: (layerWidth - height) / 2, // Align horizontal center.
                y: (bend >= 0 // Align heighest letter to top/bottom.
                  ? maxHeightSpan.y // bend >= 0, align from top.
                  : layerHeight - maxHeightSpan.height - maxHeightSpan.y) + // bend < 0, align from bottom.
                  (maxHeightSpan.height - height) / 2, // Height correction according to highest letter.
              },
              width,
              height,
              i,
            })
          }
          i += 1
        })
      })

      return {
        tag: 'svg',
        attrs: { width, height },
        style: { opacity },
        content: pos.map(p => {
          // Scale will let width be (scale-1)*p.height times larger than before,
          // So -(scale-1)*p.height/2 to justify it to center.
          let x = p.x - (scale - 1) * p.height / 2
          let y = p.y - (scale - 1) * p.height / 2
          const offset = (vertical && !needRotate)
            ? `translate(${p.height * yOffset / 100}px, ${p.width * xOffset / 100}px)`
            : `translate(${p.width * xOffset / 100}px, ${p.height * yOffset / 100}px)`
          if (vertical && !needRotate) [x, y] = [y, x]
          const colorChangeable = letterBgData.isColorChangeable(p.href)
          return {
            tag: colorChangeable ? 'use' : 'image',
            attrs: {
              href: colorChangeable ? `#${p.href}`
                : require(`@/assets/img/svg/LetterBG/${p.href}.svg`),
              width: p.height * scale,
              height: p.height * scale,
              ...!withShape && { x, y },
            },
            style: {
              color: p.color,
              ...withShape ? { // Transform for TextShape
                transform: `translate(${x}px, ${y}px) ` + textShapeStyle[p.i] + offset,
                // For rotate svg component against its center.
                transformOrigin: `${p.height * scale / 2}px ${p.height * scale / 2}px 0`,
              } : needRotate ? { transform: transform + offset } // If needRotate cancel xy exchange and add transform on it.
                : { transform: offset },
            }
          }
        })
      }
    } else return null
  }

  setColorKey(key: string) {
    this.currColorKey = key
  }

  setColor(color: string) {
    const effectName = textEffectUtils.getCurrentLayer().styles.textBg.name
    this.setTextBg(effectName, { [this.currColorKey]: color })
  }

  get currColor(): string {
    return (textEffectUtils.getCurrentLayer().styles.textBg as Record<string, string>)[this.currColorKey]
  }

  getEffectMainColor(effect: ITextBg) {
    if (isITextBox(effect) &&
      ['square-hollow', 'rounded-hollow'].includes(effect.name)) {
      return ['bColor', effect.bColor]
    } else if (isITextBox(effect) || isITextSpeechBubble(effect)) { // Non-hollow text box
      return ['pColor', effect.pColor]
    } else if (isITextGooey(effect) || isITextUnderline(effect)) {
      return ['color', effect.color]
    } else {
      return ['color', (effect as unknown as { color: string }).color || '']
    }
  }

  // Read/write text effect setting from local storage
  syncShareAttrs(textBg: ITextBg, effectName: string | null) {
    Object.assign(textBg, { name: textBg.name || effectName })
    if (textBg.name === 'none') return

    const shareAttrs = (localStorageUtils.get('textEffectSetting', 'textBgShare') ?? {}) as Record<string, string>
    const newShareAttrs = { opacity: textBg.opacity }
    const newEffect = { opacity: shareAttrs.opacity }
    if (isITextBox(textBg) &&
      ['square-hollow', 'rounded-hollow', 'square-both', 'rounded-both'].includes(textBg.name)) {
      Object.assign(newShareAttrs, { bStroke: textBg.bStroke })
      Object.assign(newEffect, { bStroke: shareAttrs.bStroke })
    }

    // If effectName is null, overwrite share attrs. Otherwise, read share attrs and set to effect.
    if (!effectName) {
      Object.assign(shareAttrs, newShareAttrs)
      localStorageUtils.set('textEffectSetting', 'textBgShare', shareAttrs)
    } else {
      let effect = (localStorageUtils.get('textEffectSetting', effectName) ?? {}) as Record<string, string>
      Object.assign(effect, newEffect)
      effect = _.omit(effect, ['color', 'pColor', 'bColor'])
      localStorageUtils.set('textEffectSetting', effectName, effect)
    }
  }

  async setTextBg(effect: string, attrs?: Record<string, unknown>): Promise<void> {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex) as AllLayerTypes
    const layers = (targetLayer.layers ? targetLayer.layers : [targetLayer]) as AllLayerTypes[]
    const subLayerIndex = layerUtils.subLayerIdx
    const defaultAttrs = this.effectDefaultOptions[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue

      const layer = layers[idx]
      if (layer.type !== 'text') continue
      const currSubLayerIndex = targetLayer.layers ? +idx : subLayerIndex
      const oldTextBg = layer.styles.textBg
      const newTextBg = {} as ITextBg

      // Set lineHeight and fontSpacing by call tiptap
      for (const [key, val] of Object.entries(attrs ?? {})) {
        if (['lineHeight', 'fontSpacing'].includes(key)) {
          await textUtils.setParagraphProp(key as 'lineHeight' | 'fontSpacing', val as number)
        }
      }
      attrs = omit(attrs, ['lineHeight', 'fontSpacing'])

      if (oldTextBg && oldTextBg.name === effect) { // Adjust effect option.
        Object.assign(newTextBg, oldTextBg, attrs)
        localStorageUtils.set('textEffectSetting', effect, newTextBg)
        this.syncShareAttrs(newTextBg, null)
      } else { // Switch to other effect.
        this.syncShareAttrs(newTextBg, effect)
        const localAttrs = localStorageUtils.get('textEffectSetting', effect)
        Object.assign(newTextBg, defaultAttrs, localAttrs, attrs, { name: effect })
        await letterBgData.setExtraDefaultAttrs(effect)

        // Sync setting between different name effect:
        // Bring original effect color to new effect.
        const oldColor = this.getEffectMainColor(oldTextBg)[1]
        const newColorKey = this.getEffectMainColor(newTextBg)[0]
        if (oldColor.startsWith('#') && !(isITextLetterBg(newTextBg) || isITextLetterBg(oldTextBg))) {
          Object.assign(newTextBg, { [newColorKey]: oldColor })
        }
        // Sync setting between TextLetterBg: rainbow, rainbow-dark, circle
        if (isITextLetterBg(newTextBg) && isITextLetterBg(oldTextBg) && newTextBg.name !== oldTextBg.name &&
          ['rainbow', 'rainbow-dark', 'circle'].includes(newTextBg.name) &&
          ['rainbow', 'rainbow-dark', 'circle'].includes(oldTextBg.name)) {
          Object.assign(newTextBg, oldTextBg, { name: newTextBg.name, color: newTextBg.color })
        }
      }

      store.commit('UPDATE_specLayerData', {
        pageIndex,
        layerIndex,
        subLayerIndex: +idx,
        styles: { textBg: newTextBg }
      })

      // If SplitSpan setting changed, force split/unsplit span text
      const oldSplitSpan = this.isSplitSpan({ ...layer.styles, textBg: oldTextBg })
      const newSplitSpan = this.isSplitSpan({ ...layer.styles, textBg: newTextBg })
      this.splitOrMergeSpan(oldSplitSpan, newSplitSpan, layer,
        pageIndex, layerIndex, currSubLayerIndex)

      // Update w/h for layer in tmp/group, which don't have tiptap. For English letter in tmp/group.
      const oldFixedWidth = isITextLetterBg(oldTextBg) && oldTextBg.fixedWidth
      const newFixedWidth = isITextLetterBg(newTextBg) && newTextBg.fixedWidth
      if (oldFixedWidth !== newFixedWidth) {
        textUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, currSubLayerIndex)
      }

      // If user leave LetterBg, reset lineHeight and fontSpacing
      if (isITextLetterBg(oldTextBg) && !isITextLetterBg(newTextBg)) {
        await textUtils.setParagraphProp('lineHeight', 1.4)
        await textUtils.setParagraphProp('fontSpacing', 0)
      }
    }
  }

  splitOrMergeSpan(oldSplitSpan: boolean, newSplitSpan: boolean, layer: IText,
    pageIndex: number, layerIndex: number, subLayerIndex: number) {
    if (oldSplitSpan === newSplitSpan) return

    const paragraphs = cloneDeep(layer.paragraphs)
    if (newSplitSpan) { // Split span, another one in tiptapUtils.toIParagraph
      paragraphs.forEach(p => {
        const newSpans = p.spans.flatMap(span =>
          textUtils.splitter.splitGraphemes(span.text)
            .map(t => ({ text: t, styles: cloneDeep(span.styles) }))
        )
        p.spans = newSpans.length !== 0 ? newSpans : p.spans
      })
    } else { // Merge span
      paragraphs.forEach(p => {
        for (let i = 0; i + 1 < p.spans.length;) {
          const curr = p.spans[i]
          const next = p.spans[i + 1]
          if (isEqual(curr.styles, next.styles)) {
            curr.text += next.text
            p.spans.splice(i + 1, 1)
          } else { i++ }
        }
      })
    }

    layerUtils.updateLayerProps(pageIndex, layerIndex, { paragraphs }, subLayerIndex)
    tiptapUtils.updateHtml() // Vuex config => tiptap

    // When fixedWith true => false, this can force tiptap merge span that have same attrs.
    if (document.querySelector('.ProseMirror') && !newSplitSpan) {
      tiptapUtils.agent((editor: Editor) => {
        editor.commands.selectAll()
        editor.chain().updateAttributes('textStyle', { spanIndex: -1 }).run()
      })
    }
  }

  async resetCurrTextEffect() {
    const effectName = textEffectUtils.getCurrentLayer().styles.textBg.name
    await this.setTextBg(effectName, this.effectDefaultOptions[effectName])
    await letterBgData.setExtraDefaultAttrs(effectName)
  }
}

const textBgUtils = new TextBg()
export default textBgUtils
