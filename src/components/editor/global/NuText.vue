<template lang="pug">
  div(class="nu-text" :style="wrapperStyles()")
    //- Svg BG for text effex gooey.
    svg(v-if="svgBG" v-bind="svgBG.attrs"
        class="nu-text__BG")
      component(v-for="(elm, idx) in svgBG.content"
                :key="`textSvgBg${idx}`"
                :is="elm.tag"
                v-bind="elm.attrs")
    div(v-for="text in duplicatedText" class="nu-text__body" ref="body"
        :style="Object.assign(bodyStyles(), text.extraBody)")
      nu-curve-text(v-if="isCurveText"
        :config="config"
        :layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :subLayerIndex="subLayerIndex")
      p(v-else
        v-for="(p, pIndex) in config.paragraphs" class="nu-text__p"
        :key="p.id"
        :style="styles(p.styles)")
        span(v-for="(span, sIndex) in p.spans"
          class="nu-text__span"
          :data-sindex="sIndex"
          :key="span.id"
          :style="Object.assign(styles(span.styles), spanEffect, text.extraSpan)") {{ span.text }}
          br(v-if="!span.text && p.spans.length === 1")
    div(v-if="!isCurveText" class="nu-text__observee")
      span(v-for="(span, sIndex) in spans"
        class="nu-text__span"
        :class="`nu-text__span-p${pageIndex}l${layerIndex}s${subLayerIndex ? subLayerIndex : -1}`"
        :data-sindex="sIndex"
        :key="sIndex",
        :style="styles(span.styles, sIndex)") {{ span.text }}
    //- Svg filter for text effect gooey.
    svg(v-if="spanEffect.svgFilter")
      filter(:id="spanEffect.svgId")
        component(v-for="(elm, idx) in spanEffect.svgFilter"
                  :key="`svgFilter${idx}`"
                  :is="elm.tag"
                  v-bind="elm.attrs")
          component(v-for="child in elm.child"
                    :key="child.tag"
                    :is="child.tag"
                    v-bind="child.attrs")
</template>

<script lang="ts">
import Vue from 'vue'
import { IGroup, ISpan, IText } from '@/interfaces/layer'
import { mapState, mapGetters } from 'vuex'
import textUtils from '@/utils/textUtils'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import LayerUtils from '@/utils/layerUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import TextPropUtils from '@/utils/textPropUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import generalUtils from '@/utils/generalUtils'
import textBgUtils from '@/utils/textBgUtils'
import { isITextGooey } from '@/interfaces/format'
import _ from 'lodash'

export default Vue.extend({
  components: { NuCurveText },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number
  },
  data() {
    const dimension = this.config.styles.writingMode.includes('vertical') ? this.config.styles.height : this.config.styles.width
    return {
      uid: generalUtils.generateRandomString(6),
      isDestroyed: false,
      resizeObserver: undefined as ResizeObserver | undefined,
      initSize: {
        width: this.config.styles.width,
        height: this.config.styles.height,
        widthLimit: this.config.widthLimit === -1 ? -1 : dimension
      },
      isLoading: true
    }
  },
  created() {
    // textUtils.loadAllFonts(this.config, 1)
    textUtils.loadAllFonts(this.config)
  },
  destroyed() {
    this.isDestroyed = true
    this.resizeObserver && this.resizeObserver.disconnect()
    this.resizeObserver = undefined
  },
  mounted() {
    if (this.$route.name === 'Editor' || this.$route.name === 'MobileEditor') {
      textUtils.untilFontLoaded(this.config.paragraphs).then(() => {
        setTimeout(() => {
          this.isLoading = false
        }, 500) // for the delay between font loading and dom rendering
      })
    }
    if (this.currSelectedInfo.layers >= 1) {
      TextPropUtils.updateTextPropsState()
    }

    if (LayerUtils.getCurrLayer.type === 'tmp') {
      return
    }

    this.resizeObserver = new (window as any).ResizeObserver((entries: any) => {
      // for (const entry of entries) {
      //   console.log(JSON.stringify(entry.contentRect))
      // }
      const config = generalUtils.deepCopy(this.config) as IText
      if (this.isDestroyed || textShapeUtils.isCurvedText(config.styles)) return

      // console.log('resize')

      let widthLimit
      if (this.isLoading && this.isAutoResizeNeeded) {
        widthLimit = textUtils.autoResize(config, this.initSize)
      } else {
        widthLimit = config.widthLimit
      }
      const textHW = textUtils.getTextHW(config, widthLimit)
      if (typeof this.subLayerIndex === 'undefined') {
        let x = config.styles.x
        let y = config.styles.y
        if (config.widthLimit === -1) {
          if (config.styles.writingMode.includes('vertical')) {
            y = config.styles.y - (textHW.height - config.styles.height) / 2
          } else {
            x = config.styles.x - (textHW.width - config.styles.width) / 2
          }
        }
        // console.log(this.layerIndex, textHW.width, textHW.height, config.styles.x, config.styles.y, x, y, widthLimit)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { x, y, width: textHW.width, height: textHW.height })
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit })
      } else {
        // console.log(this.layerIndex, this.subLayerIndex, textHW.width, textHW.height, widthLimit)
        const group = this.getLayer(this.pageIndex, this.layerIndex) as IGroup
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, { width: textHW.width, height: textHW.height })
        LayerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { widthLimit })
        const { width, height } = calcTmpProps(group.layers, group.styles.scale)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width, height })
      }
    })
    this.observeAllSpans()
  },
  computed: {
    ...mapState('text', ['fontStore']),
    ...mapState('user', ['verUni']),
    ...mapGetters({
      getDefaultFontsList: 'text/getDefaultFontsList',
      pageScaleRatio: 'getPageScaleRatio'
    }),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      getTextInfo: 'getTextInfo'
    }),
    getLayerScale(): number {
      return this.config.styles.scale
    },
    isCurveText(): any {
      const { textShape } = this.config.styles
      return textShape && textShape.name === 'curve'
    },
    isFlipped(): boolean {
      return this.config.styles.horizontalFlip || this.config.styles.verticalFlip
    },
    spans(): ISpan[] {
      return textShapeUtils.flattenSpans(this.config)
    },
    isAutoResizeNeeded(): boolean {
      return LayerUtils.getPage(this.pageIndex).isAutoResizeNeeded
    },
    spanEffect(): Record<string, unknown> {
      // May cause performance issue
      if (isITextGooey(this.config.styles.textBg)) {
        textUtils.updateTextLayerSizeByShape(
          this.pageIndex,
          this.layerIndex,
          this.subLayerIndex ?? -1
        )
      }
      return textBgUtils.convertTextSpanEffect(this.config.styles.textBg)
    },
    svgBG():Record<string, unknown>|null {
      const textBg = this.config.styles.textBg
      if (this.isLoading || !isITextGooey(textBg)) return null
      else {
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
            return Math.pow(Math.pow(this.x - p.x, 2) ^ 2 + Math.pow(this.y - p.y, 2), 0.5)
          }

          toString() {
            return `${this.x} ${this.y}`
          }
        }

        const unused = { // To trigger computed.
          a: this.config.styles.width,
          b: this.config.paragraphs
        }

        const bRadius = textBg.bRadius
        const scaleRatio = 1 / (this.pageScaleRatio * 0.01 * this.config.styles.scale)

        const rawRects = [] as DOMRect[][]
        const body = _.nth(this.$refs.body, -1)
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
        console.log('bodyRect', bodyRect, _.nth(this.$refs.body, -1))
        rects.forEach((rect: DOMRect, index: number) => {
          if (rect.width === 0) {
            const prev = rects[index - 1]
            const next = rects[index + 1]
            const target = ((prev?.width ?? 100000) < (next?.width ?? 100000)) ? prev : next
            rect.x = target.x
            rect.width = target.width
          }
        })
        rects.forEach((rect: DOMRect) => {
          rect.x = (rect.x - bodyRect.x) * scaleRatio
          rect.y = (rect.y - bodyRect.y) * scaleRatio
          rect.width *= scaleRatio
          rect.height *= scaleRatio
        })
        console.log('rects', rects)

        const pathArray = []
        for (let i = 0; i < rects.length; i++) {
          const [first, last] = [i === 0, i === rects.length - 1]

          const rect = rects[i]
          const rectLeftTop = new Point(rect.x, rect.y)
          // const rectLeft = new Point(rect.x, rect.y + rect.height / 2)
          const rectLeftBottom = new Point(rect.x, rect.y + rect.height)
          const rectPrev = rects[i - 1] ?? { x: 99999, y: 99999, width: 99999, height: 99999 }
          const rectPrevLeftBottom = new Point(rectPrev.x, rectPrev.y + rectPrev.height)
          const prevMiddle = first ? new Point(rect.x + rect.width / 2, rect.y)
            : rectPrevLeftBottom.middle(rectLeftTop)
          rectPrevLeftBottom.y = prevMiddle.y
          rectLeftTop.y = prevMiddle.y
          const rectNext = rects[i + 1] ?? { x: 99999, y: 99999, width: 99999, height: 99999 }
          const rectNextLeftTop = new Point(rectNext.x, rectNext.y)
          const nextMiddle = last ? new Point(rect.x + rect.width / 2, rect.y + rect.height)
            : rectLeftBottom.middle(rectNextLeftTop)
          rectLeftBottom.y = nextMiddle.y
          rectNextLeftTop.y = nextMiddle.y
          const radius = Math.min(bRadius, rect.height / 2)
          const radiusTop = Math.min(radius, rectLeftTop.dist(prevMiddle)) *
            (rectPrevLeftBottom.x < rectLeftTop.x ? -1 : 1)
          const radiusBottom = Math.min(radius, rectLeftBottom.dist(nextMiddle)) *
            (rectLeftBottom.x < rectNextLeftTop.x ? 1 : -1)

          if (first) {
            pathArray.push(`m${prevMiddle}`)
          }
          const curveTopStart = rectLeftTop.add({ x: radiusTop, y: 0 })
          const curveTopEnd = rectLeftTop.add({ x: 0, y: radius })
          pathArray.push(`L${curveTopStart}`)
          pathArray.push(`C${rectLeftTop.middle(curveTopStart)} ${rectLeftTop.middle(curveTopEnd)} ${curveTopEnd}`)
          const curveBottomStart = rectLeftBottom.add({ x: 0, y: -radius })
          const curveBottomEnd = rectLeftBottom.add({ x: radiusBottom, y: 0 })
          pathArray.push(`L${curveBottomStart}`)
          pathArray.push(`C${rectLeftBottom.middle(curveBottomStart)} ${rectLeftBottom.middle(curveBottomEnd)} ${curveBottomEnd}`)
        }
        for (let i = rects.length - 1; i >= 0; i--) {
          const [first, last] = [i === 0, i === rects.length - 1]

          const rect = rects[i]
          const rectRightTop = new Point(rect.x + rect.width, rect.y)
          // const rectRight = new Point(rect.x + rect.width, rect.y + rect.height / 2)
          const rectRightBottom = new Point(rect.x + rect.width, rect.y + rect.height)

          const rectPrev = rects[i - 1] ?? { x: 0, y: 0, width: 0, height: 0 }
          const rectPrevRightBottom = new Point(rectPrev.x + rectPrev.width, rectPrev.y + rectPrev.height)
          const prevMiddle = first ? new Point(rect.x + rect.width / 2, rect.y)
            : rectPrevRightBottom.middle(rectRightTop)
          rectPrevRightBottom.y = prevMiddle.y
          rectRightTop.y = prevMiddle.y
          const rectNext = rects[i + 1] ?? { x: 0, y: 0, width: 0, height: 0 }
          const rectNextRightTop = new Point(rectNext.x + rectNext.width, rectNext.y)
          const nextMiddle = last ? new Point(rect.x + rect.width / 2, rect.y + rect.height)
            : rectRightBottom.middle(rectNextRightTop)
          rectRightBottom.y = nextMiddle.y
          rectNextRightTop.y = nextMiddle.y
          const radius = Math.min(bRadius, rect.height / 2)
          const radiusTop = Math.min(radius, rectRightTop.dist(prevMiddle)) *
            (rectPrevRightBottom.x < rectRightTop.x ? -1 : 1)
          const radiusBottom = Math.min(radius, rectRightBottom.dist(nextMiddle)) *
            (rectRightBottom.x < rectNextRightTop.x ? 1 : -1)

          const curveBottomStart = rectRightBottom.add({ x: radiusBottom, y: 0 })
          const curveBottomEnd = rectRightBottom.add({ x: 0, y: -radius })
          pathArray.push(`L${curveBottomStart}`)
          pathArray.push(`C${rectRightBottom.middle(curveBottomStart)} ${rectRightBottom.middle(curveBottomEnd)} ${curveBottomEnd}`)
          const curveTopStart = rectRightTop.add({ x: 0, y: radius })
          const curveTopEnd = rectRightTop.add({ x: radiusTop, y: 0 })
          pathArray.push(`L${curveTopStart}`)
          pathArray.push(`C${rectRightTop.middle(curveTopStart)} ${rectRightTop.middle(curveTopEnd)} ${curveTopEnd}`)
        }
        const path = pathArray.join('')
        console.log('path', path)

        const color = 'purple'
        return {
          attrs: {
            width: bodyRect.width * scaleRatio,
            height: bodyRect.height * scaleRatio,
            fill: color
          },
          content: [{
            tag: 'path',
            attrs: {
              d: path
            }
          }]
        }
      }
    },
    // Use duplicated of text to do some text effect, define there difference css here.
    duplicatedText() {
      const duplicatedBodyBasicCss = {
        position: 'absolute',
        top: '0px',
        width: '100%',
        opacity: 1
      }
      const textShadow = textEffectUtils.convertTextEffect(this.config.styles.textEffect)
      const duplicatedTextShadow = textShadow.duplicatedBody || textShadow.duplicatedSpan
      const textShadowCss = {
        extraBody: Object.assign(duplicatedBodyBasicCss, textShadow.duplicatedBody),
        extraSpan: textShadow.duplicatedSpan
      }
      const textBgSpan = textBgUtils.convertTextSpanEffect(this.config.styles.textBg)
      const duplicatedTextBgSpan = textBgSpan.duplicatedBody || textBgSpan.duplicatedSpan
      const textBgSpanCss = {
        extraBody: Object.assign(duplicatedBodyBasicCss, textBgSpan.duplicatedBody),
        extraSpan: textBgSpan.duplicatedSpan
      }
      return [
        ...(duplicatedTextBgSpan ? [textBgSpanCss] : []),
        ...(duplicatedTextShadow ? [textShadowCss] : []),
        {} // Original text, don't have extra css
      ]
    }
  },
  watch: {
    'config.paragraphs': {
      handler() {
        this.isLoading = false
        if (this.resizeObserver) {
          this.resizeObserver.disconnect()
          this.observeAllSpans()
        }
      }
    }
  },
  methods: {
    styles(styles: any) {
      return tiptapUtils.textStylesRaw(styles)
    },
    bodyStyles() {
      const { editing, contentEditable } = this.config
      const { isCurveText, isFlipped } = this
      const opacity = editing ? (contentEditable ? ((isCurveText || isFlipped) ? 0.2 : 0) : 1) : 1
      const isVertical = this.config.styles.writingMode.includes('vertical')
      return {
        width: isVertical ? 'auto' : '',
        height: isVertical ? '' : '100%',
        textAlign: this.config.styles.align,
        opacity
      }
    },
    wrapperStyles() {
      return {
        writingMode: this.config.styles.writingMode
      }
    },
    // getFontUrl(spanStyles: ISpanStyle): string {
    //   switch (spanStyles.type) {
    //     case 'public':
    //       return `url("https://template.vivipic.com/font/${spanStyles.font}/font")`
    //     case 'private':
    //       return ''
    //     case 'URL':
    //       return 'url("' + spanStyles.fontUrl + '")'
    //   }
    //   return `url("https://template.vivipic.com/font/${spanStyles.font}/font")`
    // },
    observeAllSpans() {
      const spans = document.querySelectorAll(`.nu-text__span-p${this.pageIndex}l${this.layerIndex}s${this.subLayerIndex ? this.subLayerIndex : -1}`) as NodeList
      spans.forEach(span => {
        this.resizeObserver && this.resizeObserver.observe(span as Element)
      })
    }
  }
})
</script>

<style lang="scss">
.nu-text {
  width: 100%;
  height: 100%;
  position: relative;
  &__BG {
    position: absolute;
    left: 0;
    top: 0;
  }
  &__body {
    outline: none;
    padding: 0;
    position: relative;
  }
  &__p {
    margin: 0;
  }
  &__span {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    position: relative;
    // line-break: anywhere;
    &:first-child {
      padding-left: var(--textGooeyPaddingX);
    }
    &:last-child {
      padding-right: var(--textGooeyPaddingX);
    }
  }
  &__observee {
    position: absolute;
    opacity: 0;
    top: 0;
    left: 0;
    & > span {
      display: inline-block;
    }
  }
}
</style>
