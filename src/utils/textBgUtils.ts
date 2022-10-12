import Vue from 'vue'
import store from '@/store'
import { IStyle, IText } from '@/interfaces/layer'
import { isITextBox, isITextGooey, isITextUnderline, ITextBgEffect, ITextGooey } from '@/interfaces/format'
import LayerUtils from '@/utils/layerUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import mathUtils from '@/utils/mathUtils'
import _ from 'lodash'

// For text effect gooey
class Point {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  middle(p: Point) {
    return new Point(
      (this.x + p.x) / 2,
      (this.y + p.y) / 2
    )
  }

  add(p: {x: number, y: number}) {
    return new Point(
      this.x + p.x,
      this.y + p.y
    )
  }

  dist(p: Point) {
    return Math.pow(Math.pow(this.x - p.x, 2) + Math.pow(this.y - p.y, 2), 0.5)
  }

  toString() {
    return `${this.x} ${this.y}`
  }
}
function obj2Point(p: {x: number, y: number}) {
  return new Point(p.x, p.y)
}

// For text effect gooey
class Path {
  pathArray = [] as string[]
  pointArray = [] as Point[]
  currPos: Point
  constructor(p: Point) {
    this.currPos = p
    this.pointArray.push(this.currPos)
    this.pathArray.push(`M${p}`)
  }

  L(end: Point) {
    if (this.currPos.dist(end) < 0.1) return
    this.currPos = end
    this.pointArray.push(this.currPos)
    this.pathArray.push(`L${end}`)
  }

  C(c1: Point, c2: Point, end: Point) {
    if (this.currPos.dist(end) < 0.1) return
    this.currPos = end
    this.pointArray.push(this.currPos)
    this.pathArray.push(`C${c1} ${c2} ${end}`)
  }

  v(dist: number) {
    this.currPos = this.currPos.add(new Point(0, dist))
    this.pointArray.push(this.currPos)
    this.pathArray.push(`v${dist}`)
  }

  h(dist: number) {
    this.currPos = this.currPos.add(new Point(dist, 0))
    this.pointArray.push(this.currPos)
    this.pathArray.push(`h${dist}`)
  }

  l(x: number, y: number) {
    this.currPos = this.currPos.add(new Point(x, y))
    this.pointArray.push(this.currPos)
    this.pathArray.push(`l${x} ${y}`)
  }

  a(rx: number, ry: number, sweepFlag: number, x: number, y: number) {
    this.currPos = this.currPos.add(new Point(x, y))
    this.pointArray.push(this.currPos)
    this.pathArray.push(`a${rx} ${ry} 0 0${sweepFlag}${x} ${y}`)
  }

  result() {
    return this.pathArray.join('') + 'z'
  }

  toCircle() {
    return this.pointArray.map(p => {
      return {
        tag: 'circle',
        attrs: {
          cx: p.x,
          cy: p.y,
          r: '5',
          fill: 'red'
        }
      }
    })
  }
}

class Gooey {
  controlPoints = [[], []] as {top: Point, bottom: Point, oldHeight: number}[][]
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
    const last = _.nth(rects, -1)
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
          Vue.delete(side, i)
          count++
        } else i++
      }
    })
    return count
  }

  // Keep doing merge and delete until nothing to delete.
  preProcess() {
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
      curveTopStartMiddle = obj2Point(mathUtils.getRotatedPoint(
        (angle * 2 - 90) * dirTop,
        curveTopStart, curveTopStartMiddle
      ))
      path.L(curveTopStart)
      path.C(curveTopStartMiddle, curveTopEndMiddle, curveTopEnd)

      const dirBottom = (curr.bottom.x < next.top.x ? 1 : -1)
      const radiusBottom = Math.min(radius, curr.bottom.dist(nextMiddle)) * dirBottom
      const curveBottomStart = curr.bottom.add({ x: 0, y: -radius })
      const curveBottomEnd = curr.bottom.add({ x: radiusBottom, y: 0 })
      const curveBottomStartMiddle = curr.bottom.middle(curveBottomStart)
      let curveBottomEndMiddle = curr.bottom.middle(curveBottomEnd)
      angle = Math.abs(Math.atan(radiusBottom / radius) * (180 / Math.PI))
      curveBottomEndMiddle = obj2Point(mathUtils.getRotatedPoint(
        (90 - angle * 2) * dirBottom,
        curveBottomEnd, curveBottomEndMiddle
      ))
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
      curveBottomStartMiddle = obj2Point(mathUtils.getRotatedPoint(
        (90 - angle * 2) * dirBottom,
        curveBottomStart, curveBottomStartMiddle
      ))
      path.L(curveBottomStart)
      path.C(curveBottomStartMiddle, curveBottomEndMiddle, curveBottomEnd)

      const dirTop = (prev.bottom.x < curr.top.x ? -1 : 1)
      const radiusTop = Math.min(radius, curr.top.dist(prevMiddle)) * dirTop
      const curveTopStart = curr.top.add({ x: 0, y: radius })
      const curveTopEnd = curr.top.add({ x: radiusTop, y: 0 })
      const curveTopStartMiddle = curr.top.middle(curveTopStart)
      let curveTopEndMiddle = curr.top.middle(curveTopEnd)
      angle = Math.abs(Math.atan(radiusTop / radius) * (180 / Math.PI))
      curveTopEndMiddle = obj2Point(mathUtils.getRotatedPoint(
        (angle * 2 - 90) * dirTop,
        curveTopEnd, curveTopEndMiddle
      ))
      path.L(curveTopStart)
      path.C(curveTopStartMiddle, curveTopEndMiddle, curveTopEnd)
    }

    return path.result()
  }

  // For debug
  toCircle() {
    const circle = [] as Record<string, unknown>[]
    this.controlPoints.forEach(side => {
      side.forEach(cps => {
        circle.push({
          tag: 'circle',
          attrs: {
            cx: cps.top.x,
            cy: cps.top.y,
            r: '5',
            fill: 'red'
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
  effects = {} as Record<string, Record<string, string | number>>
  constructor() {
    this.effects = this.getDefaultEffects()
  }

  rgba = (color: string, opacity: number) =>
    textEffectUtils.convertColor2rgba(color, opacity)

  getDefaultEffects() {
    return {
      none: {},
      'square-borderless': {
        opacity: 100,
        bStroke: 0, // unadjustable
        bRadius: 0, // unadjustable
        bColor: 'transparent', // unadjustable
        pStrokeX: 13, // unadjustable in all effects in all effects
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
      }
    }
  }

  inlineSvg(svg: string) {
    return svg.replace(/\n[ ]*/g, '').replace(/#/g, '%23')
  }

  convertTextEffect(styles: IStyle) { // to-delete
    const effect = styles.textBg as ITextBgEffect
    if (!isITextBox(effect)) return {}
  }

  convertTextSpanEffect(effect: ITextBgEffect): Record<string, unknown> { // to-delete
    return {}
  }

  drawSvgBg(config: IText, bodyHtml: Element[]) {
    const textBg = config.styles.textBg
    if (textBg.name === 'none') return null
    const vertical = config.styles.writingMode === 'vertical-lr'
    const rawRects = [] as DOMRect[][]

    const body = _.nth(bodyHtml, -1).cloneNode(true)
    body.style.writingMode = config.styles.writingMode
    const widthLimit = config.widthLimit
    if (vertical) {
      body.style.width = 'max-content'
      body.style.height = widthLimit === -1 ? 'max-content' : `${widthLimit / config.styles.scale}px`
    } else {
      body.style.width = widthLimit === -1 ? 'max-content' : `${widthLimit / config.styles.scale}px`
      body.style.height = 'max-content'
    }
    document.body.appendChild(body)

    const bodyRect = body.getClientRects()[0]
    // common svg attrs
    const width = bodyRect.width
    const height = bodyRect.height
    const transform = vertical ? 'rotate(90) scale(1,-1)' : ''

    for (const p of body.childNodes) {
      for (const span of p.childNodes) {
        rawRects.push(span.getClientRects())
      }
    }
    document.body.removeChild(body)
    const rects = rawRects.reduce((acc, rect) => {
      if (rect) acc.push(...rect)
      return acc
    }, [])

    // If is vertical text, exchange its coordinate.
    if (vertical) {
      Object.assign(bodyRect, {
        x: bodyRect.y,
        y: bodyRect.x,
        width: bodyRect.height,
        height: bodyRect.width
      })
      rects.forEach((rect: DOMRect) => {
        Object.assign(rect, {
          x: rect.y,
          y: rect.x,
          width: rect.height,
          height: rect.width
        })
      })
    }
    // Merge Rect if at the same line.
    rects.forEach((rect: DOMRect, index: number) => {
      const nextIndex = index + 1
      while (nextIndex < rects.length) {
        const next = rects[nextIndex]
        const currTop = rect.y
        const currBottom = rect.y + rect.height
        const nextTop = next.y
        const nextBottom = next.y + next.height
        if (((nextTop <= currTop && currTop <= nextBottom &&
          nextTop <= currBottom && currBottom <= nextBottom) ||
          (currTop <= nextTop && nextTop <= currBottom &&
          currTop <= nextBottom && nextBottom <= currBottom))) {
          rect.y = Math.min(rect.y, next.y)
          rect.width += next.width
          rect.height = Math.max(rect.height, next.height)
        } else break
        Vue.delete(rects, nextIndex)
      }
    })
    // Deal with empty line
    rects.forEach((rect: DOMRect, index: number) => {
      if (rect.width < 1) {
        let nextIndex = index + 1
        while (nextIndex < rects.length && rects[nextIndex].width < 1)nextIndex++
        const next = rects[nextIndex] ?? { x: bodyRect.x, width: bodyRect.width }
        const prev = rects[index - 1] ?? { x: bodyRect.x, width: bodyRect.width }
        const target = (prev.width < next.width) ? prev : next
        rect.x = target.x
        rect.width = target.width
      }
    })
    // Coordinate initial.
    rects.forEach((rect: DOMRect) => {
      rect.x = rect.x - bodyRect.x
      rect.y = rect.y - bodyRect.y
    })

    if (isITextGooey(textBg)) {
      const padding = textBg.distance
      const color = textEffectUtils.colorParser(textBg.color, config)
      const fill = this.rgba(color, textBg.opacity * 0.01)

      // Add padding.
      rects.forEach((rect: DOMRect) => {
        rect.x -= padding
        rect.y -= padding
        rect.width += padding * 2
        rect.height += padding * 2
      })

      const cps = new Gooey(textBg, rects)
      cps.preProcess()
      const d = cps.process()

      return {
        attrs: { width, height, fill },
        content: [{
          tag: 'path',
          attrs: {
            d,
            transform
          }
        }]
        // .concat(cps.toCircle() as any) // Show control point
      }
    } else if (isITextUnderline(textBg)) {
      const color = textEffectUtils.colorParser(textBg.color, config)
      const fill = this.rgba(color, textBg.opacity * 0.01)
      const paths = [] as Record<string, unknown>[]
      rects.forEach(rect => {
        const capWidth = rect.height * 0.005 * textBg.height
        // capWidth = Math.min(capWidth, rect.width / 2)
        const yOffset = (rect.height - capWidth * 2) * 0.01 * (100 - textBg.yOffset)
        const path = new Path(new Point(rect.x + capWidth, rect.y + yOffset))

        switch (textBg.endpoint) {
          case 'triangle':
            path.h(rect.width - capWidth)
            path.l(-capWidth, capWidth * 2)
            path.h(-(rect.width - capWidth))
            break
          case 'rounded':
            path.a(1, 1, 0, 0, capWidth * 2)
            path.h(rect.width - capWidth * 2)
            path.a(1, 1, 0, 0, -capWidth * 2)
            break
          case 'square':
            path.h(rect.width - capWidth)
            path.v(capWidth * 2)
            path.h(-rect.width)
            path.v(-capWidth * 2)
            break
        }

        paths.push({
          tag: 'path',
          attrs: {
            d: path.result(),
            transform
          }
        })
        // paths.push(...path.toCircle()) // Show control point
      })

      return {
        attrs: { width, height, fill },
        content: paths
      }
    } else if (isITextBox(textBg)) {
      const pColor = textEffectUtils.colorParser(textBg.pColor, config)
      const bColor = textEffectUtils.colorParser(textBg.bColor, config)
      const opacity = textBg.opacity * 0.01
      let boxWidth = (width + textBg.bStroke)
      let boxHeight = (height + textBg.bStroke)
      let top = -textBg.bStroke
      let left = -textBg.bStroke
      if (vertical) {
        boxWidth += textBg.pStrokeY * 2
        boxHeight += textBg.pStrokeX * 2
        top -= textBg.pStrokeX
        left -= textBg.pStrokeY
      } else {
        boxWidth += textBg.pStrokeX * 2
        boxHeight += textBg.pStrokeY * 2
        top -= textBg.pStrokeY
        left -= textBg.pStrokeX
      }
      const boxRadius = Math.min(boxWidth / 2, boxHeight / 2) * textBg.bRadius * 0.01

      const path = new Path(new Point(textBg.bStroke / 2, textBg.bStroke / 2 + boxRadius))
      path.a(boxRadius, boxRadius, 1, boxRadius, -boxRadius)
      path.h(boxWidth - boxRadius * 2)
      path.a(boxRadius, boxRadius, 1, boxRadius, boxRadius)
      path.v(boxHeight - boxRadius * 2)
      path.a(boxRadius, boxRadius, 1, -boxRadius, boxRadius)
      path.h(-(boxWidth - boxRadius * 2))
      path.a(boxRadius, boxRadius, 1, -boxRadius, -boxRadius)

      return {
        attrs: {
          width: boxWidth + textBg.bStroke,
          height: boxHeight + textBg.bStroke,
          style: `left: ${left}px;
            top: ${top}px;
            border-radius: ${boxRadius}px;
            overflow: hidden`
        },
        content: [{
          tag: 'path',
          attrs: {
            style: `fill:${pColor}; stroke:${bColor}; opacity:${opacity}`,
            'stroke-width': textBg.bStroke,
            d: path.result()
          }
        }]
        // .concat(path.toCircle() as any) // Show control point
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

  getEffectMainColor(effect: ITextBgEffect) {
    if (isITextBox(effect) &&
      ['square-hollow', 'rounded-hollow'].includes(effect.name)) {
      return ['bColor', effect.bColor]
    } else if (isITextBox(effect)) { // Non-hollow text box
      return ['pColor', effect.pColor]
    } else if (isITextGooey(effect) || isITextUnderline(effect)) {
      return ['color', effect.color]
    } else {
      return ['color', (effect as unknown as {color:string}).color || '']
    }
  }

  syncShareAttrs(textBg: ITextBgEffect, effectName: string | null) {
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

  setTextBg(effect: string, attrs?: Record<string, string | number | boolean>): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
    const subLayerIndex = LayerUtils.subLayerIdx
    const defaultAttrs = this.effects[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue

      const { type, styles: { textBg: layerTextBg } } = layers[idx] as IText
      if (type === 'text') {
        const textBg = {} as ITextBgEffect
        if (layerTextBg && layerTextBg.name === effect) { // Adjust effect option.
          Object.assign(textBg, layerTextBg, attrs)
          localStorageUtils.set('textEffectSetting', effect, textBg)
          this.syncShareAttrs(textBg, null)
        } else { // Switch to other effect.
          this.syncShareAttrs(textBg, effect)
          const localAttrs = localStorageUtils.get('textEffectSetting', effect)
          Object.assign(textBg, defaultAttrs, localAttrs, attrs, { name: effect })

          // Bring original effect color to new effect.
          const oldColor = this.getEffectMainColor(layerTextBg)[1]
          const newColorKey = this.getEffectMainColor(textBg)[0]
          if (oldColor.startsWith('#')) {
            Object.assign(textBg, { [newColorKey]: oldColor })
          }
        }

        store.commit('UPDATE_specLayerData', {
          pageIndex,
          layerIndex,
          subLayerIndex: +idx,
          styles: { textBg }
        })
      }
    }
  }

  resetCurrTextEffect() {
    const effectName = textEffectUtils.getCurrentLayer().styles.textBg.name
    this.setTextBg(effectName, this.effects[effectName])
  }
}

export default new TextBg()
