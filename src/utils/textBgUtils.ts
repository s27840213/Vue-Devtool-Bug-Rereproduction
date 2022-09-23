import Vue from 'vue'
import store from '@/store'
import { IStyle, IText } from '@/interfaces/layer'
import { isITextBox, isITextGooey, isITextUnderline, ITextBgEffect, ITextGooey } from '@/interfaces/format'
import LayerUtils from '@/utils/layerUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import localStorageUtils from '@/utils/localStorageUtils'
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
      oldHeight: 0 // to-delete
    })
    this.controlPoints[1].push({
      top: new Point(first.x, first.y),
      bottom: new Point(first.x, first.y),
      oldHeight: 0
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
  process(debug: number) {
    const bRadius = this.bRadius
    let path = null as unknown as Path
    let ps = this.controlPoints[0]
    for (let i = 1; i < ps.length - 1; i++) {
      const curr = ps[i]
      const prev = ps[i - 1]
      const prevMiddle = prev.bottom.middle(curr.top)
      const next = ps[i + 1]
      const nextMiddle = curr.bottom.middle(next.top)
      const radius = debug === 0
        ? curr.top.dist(curr.bottom) * bRadius * 0.005
        : debug === 1 ? Math.min(bRadius, curr.top.dist(curr.bottom) / 2)
          : Math.min(curr.oldHeight * bRadius * 0.005, curr.top.dist(curr.bottom) / 2)
      // const radius = curr.top.dist(curr.bottom) * bRadius * 0.005
      // const radius = Math.min(bRadius, curr.top.dist(curr.bottom) / 2)
      // const radius = Math.min(curr.oldHeight * bRadius * 0.005, curr.top.dist(curr.bottom) / 2)
      const radiusTop = Math.min(radius, curr.top.dist(prevMiddle)) *
        (prev.bottom.x < curr.top.x ? -1 : 1)
      const radiusBottom = Math.min(radius, curr.bottom.dist(nextMiddle)) *
        (curr.bottom.x < next.top.x ? 1 : -1)

      if (i === 1) {
        path = new Path(prevMiddle)
      }
      const curveTopStart = curr.top.add({ x: radiusTop, y: 0 })
      const curveTopEnd = curr.top.add({ x: 0, y: radius })
      path.L(curveTopStart)
      path.C(curr.top.middle(curveTopStart), curr.top.middle(curveTopEnd), curveTopEnd)
      const curveBottomStart = curr.bottom.add({ x: 0, y: -radius })
      const curveBottomEnd = curr.bottom.add({ x: radiusBottom, y: 0 })
      path.L(curveBottomStart)
      path.C(curr.bottom.middle(curveBottomStart), curr.bottom.middle(curveBottomEnd), curveBottomEnd)
    }
    ps = this.controlPoints[1]
    for (let i = ps.length - 2; i > 0; i--) {
      const curr = ps[i]
      const prev = ps[i - 1]
      const prevMiddle = prev.bottom.middle(curr.top)
      const next = ps[i + 1]
      const nextMiddle = curr.bottom.middle(next.top)
      const radius = debug === 0
        ? curr.top.dist(curr.bottom) * bRadius * 0.005
        : debug === 1 ? Math.min(bRadius, curr.top.dist(curr.bottom) / 2)
          : Math.min(curr.oldHeight * bRadius * 0.005, curr.top.dist(curr.bottom) / 2)
      // const radius = curr.top.dist(curr.bottom) * bRadius * 0.005
      // const radius = Math.min(bRadius, curr.top.dist(curr.bottom) / 2)
      // const radius = Math.min(curr.oldHeight * bRadius * 0.005, curr.top.dist(curr.bottom) / 2)
      const radiusTop = Math.min(radius, curr.top.dist(prevMiddle)) *
        (prev.bottom.x < curr.top.x ? -1 : 1)
      const radiusBottom = Math.min(radius, curr.bottom.dist(nextMiddle)) *
        (curr.bottom.x < next.top.x ? 1 : -1)

      const curveBottomStart = curr.bottom.add({ x: radiusBottom, y: 0 })
      const curveBottomEnd = curr.bottom.add({ x: 0, y: -radius })
      path.L(curveBottomStart)
      path.C(curr.bottom.middle(curveBottomStart), curr.bottom.middle(curveBottomEnd), curveBottomEnd)
      const curveTopStart = curr.top.add({ x: 0, y: radius })
      const curveTopEnd = curr.top.add({ x: radiusTop, y: 0 })
      path.L(curveTopStart)
      path.C(curr.top.middle(curveTopStart), curr.top.middle(curveTopEnd), curveTopEnd)
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
        pStroke: 20,
        pColor: '#F1D289'
      },
      'rounded-borderless': {
        opacity: 100,
        bStroke: 0, // unadjustable
        bRadius: 35,
        bColor: 'transparent', // unadjustable
        pStroke: 20,
        pColor: '#F1D289'
      },
      'square-hollow': {
        opacity: 100,
        bStroke: 8,
        bRadius: 0, // unadjustable
        bColor: '#F1D289',
        pStroke: 10, // unadjustable
        pColor: 'transparent' // unadjustable
      },
      'rounded-hollow': {
        opacity: 100,
        bStroke: 8,
        bRadius: 35,
        bColor: '#F1D289',
        pStroke: 10, // unadjustable
        pColor: 'transparent' // unadjustable
      },
      'square-both': {
        opacity: 100,
        bStroke: 8,
        bRadius: 0, // unadjustable
        bColor: '#979B9B',
        pStroke: 10,
        pColor: '#F1D289'
      },
      'rounded-both': {
        opacity: 100,
        bStroke: 8,
        bRadius: 35,
        bColor: '#979B9B',
        pStroke: 10,
        pColor: '#F1D289'
      },
      underline: {
        endpoint: 'rounded',
        height: 20,
        yOffset: 10,
        opacity: 100,
        color: '#F1D289'
      },
      gooey: {
        distance: 20,
        bRadius: 40,
        opacity: 100,
        color: '#F1D289'
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
      const fill = this.rgba(textBg.color, textBg.opacity * 0.01)

      // Add padding.
      rects.forEach((rect: DOMRect) => {
        rect.x -= padding
        rect.y -= padding
        rect.width += padding * 2
        rect.height += padding * 2
      })

      const cps = new Gooey(textBg, rects)
      cps.preProcess()
      const debug = (textBg as any).endpoint
      const d = cps.process(
        debug === 'triangle' ? 0
          : debug === 'rounded' ? 1 : 2
      )

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
      const fill = this.rgba(textBg.color, textBg.opacity * 0.01)
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
      const opacity = textBg.opacity * 0.01
      const boxWidth = (width + 20 * 2 + textBg.bStroke)
      const boxHeight = (height + textBg.pStroke * 2 + textBg.bStroke)
      const boxRadius = Math.max(0, Math.min((textBg.bRadius - textBg.bStroke / 2), boxWidth / 2, boxHeight / 2))

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
          style: `left: ${-textBg.bStroke - 20}px;
            top: ${-textBg.bStroke - textBg.pStroke}px;
            border-radius: ${textBg.bRadius}px;
            overflow: hidden`
        },
        content: [{
          tag: 'path',
          attrs: {
            style: `fill:${textBg.pColor}; stroke:${textBg.bColor}; opacity:${opacity}`,
            'stroke-width': textBg.bStroke,
            d: path.result()
          }
        }]
        // .concat(path.toCircle() as any) // Show control point
      }
    } else return null
  }

  syncShareAttrs(textBg: ITextBgEffect, effectName: string|null) {
    if (textBg.name === 'none') return
    Object.assign(textBg, { name: textBg.name || effectName })
    const shareAttrs = (localStorageUtils.get('textEffectSetting', 'textBgShare') ?? {}) as Record<string, string>
    const newShareAttrs = { opacity: textBg.opacity }
    const newEffect = { opacity: shareAttrs.opacity }
    if (isITextBox(textBg)) {
      if (['square-borderless', 'rounded-borderless',
        'square-both', 'rounded-both'].includes(textBg.name)) {
        Object.assign(newShareAttrs, { color: textBg.pColor })
        Object.assign(newEffect, { pColor: shareAttrs.color })
      }
      if (['square-hollow', 'rounded-hollow',
        'square-both', 'rounded-both'].includes(textBg.name)) {
        Object.assign(newShareAttrs, { bStroke: textBg.bStroke })
        Object.assign(newEffect, { bStroke: shareAttrs.bStroke })
      }
    } else {
      Object.assign(newShareAttrs, { color: textBg.color })
      Object.assign(newEffect, { color: shareAttrs.color })
    }

    // If effectName is null, overwrite share attrs. Otherwise, read share attrs and set to effect.
    if (!effectName) {
      Object.assign(shareAttrs, newShareAttrs)
      localStorageUtils.set('textEffectSetting', 'textBgShare', shareAttrs)
    } else {
      const effect = (localStorageUtils.get('textEffectSetting', effectName) ?? {}) as Record<string, string>
      Object.assign(effect, newEffect)
      localStorageUtils.set('textEffectSetting', effectName, effect)
    }
  }

  resetCurrTextEffect() {
    const effectName = textEffectUtils.getCurrentLayer().styles.textBg.name
    this.setTextBg(effectName, this.effects[effectName])
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
        if (layerTextBg && layerTextBg.name === effect) {
          Object.assign(textBg, layerTextBg, attrs)
          localStorageUtils.set('textEffectSetting', effect, textBg)
          this.syncShareAttrs(textBg, null)
        } else {
          this.syncShareAttrs(textBg, effect)
          const localAttrs = localStorageUtils.get('textEffectSetting', effect)
          Object.assign(textBg, defaultAttrs, localAttrs, attrs, { name: effect })
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
}

export default new TextBg()
