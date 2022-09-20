import store from '@/store'
import { IStyle, IText } from '@/interfaces/layer'
import { isITextBox, isITextGooey, isITextUnderline, ITextBgEffect } from '@/interfaces/format'
import LayerUtils from '@/utils/layerUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import _ from 'lodash'
import Vue from 'vue'

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
  currPos: Point
  constructor(p: Point) {
    this.currPos = p
    this.pathArray.push(`M${p}`)
  }

  L(end: Point) {
    if (this.currPos.dist(end) < 0.1) return
    this.currPos = end
    this.pathArray.push(`L${end}`)
  }

  C(c1: Point, c2: Point, end: Point) {
    if (this.currPos.dist(end) < 0.1) return
    this.currPos = end
    this.pathArray.push(`C${c1} ${c2} ${end}`)
  }

  result() {
    return this.pathArray.join('')
  }
}

class Gooey {
  controlPoints = [[], []] as {top: Point, bottom: Point}[][]
  constructor(rects: DOMRect[]) {
    const first = rects[0]
    this.controlPoints[0].push({
      top: new Point(first.x + first.width, first.y),
      bottom: new Point(first.x + first.width, first.y)
    })
    this.controlPoints[1].push({
      top: new Point(first.x, first.y),
      bottom: new Point(first.x, first.y)
    })
    rects.forEach((rect: DOMRect) => {
      this.controlPoints[0].push({
        top: new Point(rect.x, rect.y),
        bottom: new Point(rect.x, rect.y + rect.height)
      })
      this.controlPoints[1].push({
        top: new Point(rect.x + rect.width, rect.y),
        bottom: new Point(rect.x + rect.width, rect.y + rect.height)
      })
    })
    const last = _.nth(rects, -1)
    this.controlPoints[0].push({
      top: new Point(last.x + last.width, last.y + last.height),
      bottom: new Point(last.x + last.width, last.y + last.height)
    })
    this.controlPoints[1].push({
      top: new Point(last.x, last.y + last.height),
      bottom: new Point(last.x, last.y + last.height)
    })
  }

  // Merge the area that two Rects overlap.
  merge() {
    this.controlPoints[0].forEach((cps, index) => {
      if (index === this.controlPoints[0].length - 1) return
      const cpsNext = this.controlPoints[0][index + 1]
      const newY = cps.bottom.x < cpsNext.top.x ? cps.bottom.y : cpsNext.top.y
      cps.bottom.y = cpsNext.top.y = newY
    })
    this.controlPoints[1].forEach((cps, index) => {
      if (index === this.controlPoints[1].length - 1) return
      const cpsNext = this.controlPoints[1][index + 1]
      const newY = cps.bottom.x > cpsNext.top.x ? cps.bottom.y : cpsNext.top.y
      cps.bottom.y = cpsNext.top.y = newY
    })
  }

  // Delete Rect if its top below bottom after merge.
  delete() {
    let count = 0
    this.controlPoints.forEach(side => {
      side.forEach((cps, index) => {
        if (cps.top.y > cps.bottom.y) {
          Vue.delete(side, index)
          count++
        }
      })
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
  process(bRadius: number) {
    let path = null as unknown as Path
    let ps = this.controlPoints[0]
    for (let i = 1; i < ps.length - 1; i++) {
      const rect = ps[i]
      const rectPrev = ps[i - 1]
      const prevMiddle = rectPrev.bottom.middle(rect.top)
      const rectNext = ps[i + 1]
      const nextMiddle = rect.bottom.middle(rectNext.top)
      const radius = rect.top.dist(rect.bottom) * bRadius * 0.005
      const radiusTop = Math.min(radius, rect.top.dist(prevMiddle)) *
        (rectPrev.bottom.x < rect.top.x ? -1 : 1)
      const radiusBottom = Math.min(radius, rect.bottom.dist(nextMiddle)) *
        (rect.bottom.x < rectNext.top.x ? 1 : -1)

      if (i === 1) {
        path = new Path(prevMiddle)
      }
      const curveTopStart = rect.top.add({ x: radiusTop, y: 0 })
      const curveTopEnd = rect.top.add({ x: 0, y: radius })
      path.L(curveTopStart)
      path.C(rect.top.middle(curveTopStart), rect.top.middle(curveTopEnd), curveTopEnd)
      const curveBottomStart = rect.bottom.add({ x: 0, y: -radius })
      const curveBottomEnd = rect.bottom.add({ x: radiusBottom, y: 0 })
      path.L(curveBottomStart)
      path.C(rect.bottom.middle(curveBottomStart), rect.bottom.middle(curveBottomEnd), curveBottomEnd)
    }
    ps = this.controlPoints[1]
    for (let i = ps.length - 2; i > 0; i--) {
      const rect = ps[i]
      const rectPrev = ps[i - 1]
      const prevMiddle = rectPrev.bottom.middle(rect.top)
      const rectNext = ps[i + 1]
      const nextMiddle = rect.bottom.middle(rectNext.top)
      const radius = rect.top.dist(rect.bottom) * bRadius * 0.005
      const radiusTop = Math.min(radius, rect.top.dist(prevMiddle)) *
        (rectPrev.bottom.x < rect.top.x ? -1 : 1)
      const radiusBottom = Math.min(radius, rect.bottom.dist(nextMiddle)) *
        (rect.bottom.x < rectNext.top.x ? 1 : -1)

      const curveBottomStart = rect.bottom.add({ x: radiusBottom, y: 0 })
      const curveBottomEnd = rect.bottom.add({ x: 0, y: -radius })
      path.L(curveBottomStart)
      path.C(rect.bottom.middle(curveBottomStart), rect.bottom.middle(curveBottomEnd), curveBottomEnd)
      const curveTopStart = rect.top.add({ x: 0, y: radius })
      const curveTopEnd = rect.top.add({ x: radiusTop, y: 0 })
      path.L(curveTopStart)
      path.C(rect.top.middle(curveTopStart), rect.top.middle(curveTopEnd), curveTopEnd)
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
            r: '5'
          }
        })
        circle.push({
          tag: 'circle',
          attrs: {
            cx: cps.bottom.x,
            cy: cps.bottom.y,
            r: '5'
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
      cloud: {
        bRadius: 48,
        opacity: 100,
        color: '#F1D289'
      },
      gooey: {
        distance: 0,
        bRadius: 48,
        opacity: 100,
        color: '#F1D289'
      }
    }
  }

  inlineSvg(svg: string) {
    return svg.replace(/\n[ ]*/g, '').replace(/#/g, '%23')
  }

  convertTextEffect(styles: IStyle) {
    const effect = styles.textBg as ITextBgEffect
    if (!isITextBox(effect)) return {}

    const opacity = effect.opacity * 0.01
    const width = styles.width + (effect.bStroke + 20) * 2
    const height = styles.height + (effect.bStroke + effect.pStroke) * 2
    const innerWidth = styles.width + 20 * 2 + effect.bStroke
    const innerHeight = styles.height + effect.pStroke * 2 + effect.bStroke
    const innerRadius = Math.max(0, Math.min(effect.bRadius - effect.bStroke / 2, innerWidth / 2, innerHeight / 2))

    return {
      padding: `${effect.bStroke + effect.pStroke}px ${effect.bStroke + 20}px`,
      borderRadius: `${effect.bRadius}px`,
      // How to prevent stroke and color mix, https://stackoverflow.com/a/69290621
      svg: {
        width,
        height,
        content: [{
          tag: 'path',
          attrs: {
            style: `fill:${effect.pColor}; stroke:${effect.bColor}; opacity:${opacity}`,
            'stroke-width': `${effect.bStroke}`,
            d: `
              m${effect.bStroke / 2} ${effect.bStroke / 2 + innerRadius}a${innerRadius} ${innerRadius} 0 01${innerRadius} -${innerRadius}
              h${innerWidth - innerRadius * 2}a${innerRadius} ${innerRadius} 0 01${innerRadius} ${innerRadius}
              v${innerHeight - innerRadius * 2}a${innerRadius} ${innerRadius} 0 01-${innerRadius} ${innerRadius}
              h-${innerWidth - innerRadius * 2}a${innerRadius} ${innerRadius} 0 01-${innerRadius} -${innerRadius}z`
          }
        }]
      }
    }
  }

  convertTextSpanEffect(effect: ITextBgEffect): Record<string, unknown> {
    if (!isITextUnderline(effect) && !isITextGooey(effect)) return {}

    if (isITextUnderline(effect)) {
      const { color } = effect
      const borderWidth = Math.round(effect.height / 2)
      let bgEndpoints = ''

      switch (effect.endpoint) {
        case 'triangle':
          bgEndpoints = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m${borderWidth + 1} 0h-1l-${borderWidth} ${borderWidth * 2}h${borderWidth + 1}z'/>
            </svg>"), url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h${borderWidth + 1}l-${borderWidth} ${borderWidth * 2}h-1z'/>
            </svg>")`
          break
        case 'rounded':
          bgEndpoints = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m${borderWidth + 1} 0h-1a1 1 0 000 ${borderWidth * 2}h1z'/>
            </svg>"), url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h1a1 1 0 010 ${borderWidth * 2}h-1z'/>
            </svg>")`
          break
        case 'square':
          bgEndpoints = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h${borderWidth + 1}v${borderWidth * 2}h-${borderWidth + 1}z'/>
            </svg>"), url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h${borderWidth + 1}v${borderWidth * 2}h-${borderWidth + 1}z'/>
            </svg>")`
          break
      }

      return {
        duplicatedSpan: {
          color: 'transparent',
          opacity: effect.opacity * 0.01,
          boxDecorationBreak: 'clone',
          backgroundRepeat: 'no-repeat',
          backgroundImage: `
            linear-gradient(180deg, ${color}, ${color}),
            ${this.inlineSvg(bgEndpoints)}`,
          backgroundSize: `
            calc(100% - ${borderWidth * 2}px) ${borderWidth * 2}px,
            ${borderWidth + 1}px ${borderWidth * 2}px,
            ${borderWidth + 1}px ${borderWidth * 2}px`,
          backgroundPositionX: `${borderWidth}px, 0, 100%`,
          backgroundPositionY: `${100 - (effect.yOffset)}%`
        }
      }
    } else if (isITextGooey(effect) && effect.name === 'cloud') {
      const color = this.rgba(effect.color, effect.opacity * 0.01)
      return {
        padding: '0 20px',
        boxDecorationBreak: 'clone',
        borderRadius: `${effect.bRadius}px`,
        backgroundColor: color
      }
    } else return {}
  }

  drawSvgBg(config: IText, pageScaleRatio: number, bodyHtml: Element[]) {
    const textBg = config.styles.textBg
    const scaleRatio = 1 / (pageScaleRatio * 0.01 * config.styles.scale)
    const vertical = config.styles.writingMode === 'vertical-lr'
    const rawRects = [] as DOMRect[][]
    const body = _.nth(bodyHtml, -1)
    const bodyRect = body.getClientRects()[0]
    for (const p of body.childNodes) {
      for (const span of p.childNodes) {
        rawRects.push(span.getClientRects())
      }
    }
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
        const rectNext = rects[nextIndex]
        if (rect.y !== rectNext.y) break
        else {
          rect.width += rectNext.width
        }
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
      rect.x = (rect.x - bodyRect.x) * scaleRatio
      rect.y = (rect.y - bodyRect.y) * scaleRatio
      rect.width = rect.width * scaleRatio
      rect.height = rect.height * scaleRatio
    })

    if (isITextGooey(textBg) && textBg.name === 'gooey') {
      const padding = textBg.distance
      const bRadius = textBg.bRadius
      const width = bodyRect.width * scaleRatio
      const height = bodyRect.height * scaleRatio
      const color = this.rgba(textBg.color, textBg.opacity * 0.01)

      // Add padding.
      rects.forEach((rect: DOMRect) => {
        rect.x -= padding
        rect.y -= padding
        rect.width += padding * 2
        rect.height += padding * 2
      })

      const cps = new Gooey(rects)
      cps.preProcess()
      const d = cps.process(bRadius)

      return {
        attrs: {
          width,
          height,
          fill: color
        },
        content: [{
          tag: 'path',
          attrs: {
            d,
            ...vertical ? {
              transform: 'rotate(90) scale(1,-1)'
            } : {}
          }
        }]
      }
    } else if (isITextUnderline(textBg)) {
      const color = this.rgba(textBg.color, textBg.opacity * 0.01)

      return {
        attrs: {
          // width: bodyRect.width * scaleRatio,
          // height: bodyRect.height * scaleRatio,
          // fill: color
        },
        content: [{
          tag: 'path',
          attrs: {
            // d: path.result()
          }
        }]
      }
    } else return null
  }

  syncShareAttrs(textBg: ITextBgEffect, effectName: string|null) {
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
      // Leave text editing mode to show some span text effect.
      layers[idx].contentEditable = false

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

    // Update content in tiptap and focus it if need.
    tiptapUtils.updateHtml()
  }
}

export default new TextBg()
