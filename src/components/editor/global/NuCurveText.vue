<template lang="pug">
  p(class="nu-text__p" ref="curveText" :style="pStyle")
    span(v-if="focus"  class="nu-text__curve" :style="curveStyle")
      svg-icon(iconName="curve-center" :style="curveIconStyle")
    span(v-for="(span, sIndex) in spans"
      class="nu-text__span"
      :key="sIndex",
      :style="styles(span.styles, sIndex)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import FontFaceObserver from 'fontfaceobserver'
import CssConveter from '@/utils/cssConverter'
import TextShapeUtils from '@/utils/textShapeUtils'
import LayerUtils from '@/utils/layerUtils'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    subLayerIndex: Number
  },
  data () {
    const { width, height, y, x } = this.config.styles
    return {
      transforms: [] as string[],
      textHeight: [] as number[],
      minHeight: 0,
      area: {
        width,
        height
      },
      y,
      x: x + (width / 2)
    }
  },
  mounted () {
    this.handleCurveSpan(this.spans, true)
    const promises = [...this.fonts]
      .map(font => (new FontFaceObserver(font)).load(null, 10000))
    Promise
      .all(promises)
      .then(() => {
        [...this.fonts].forEach(font => console.log(font, document.fonts.check(`16px ${font}`)))
        this.handleCurveSpan(this.spans)
      })
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    focus(): boolean {
      const { textShape } = this.config.styles
      return textShape.focus
    },
    dragging(): boolean {
      return this.config.dragging
    },
    bend(): number {
      const { textShape } = this.config.styles
      return +textShape.bend
    },
    spans(): any[] {
      const { paragraphs } = this.config
      return paragraphs.flatMap(
        (p: any) =>
          p.spans.flatMap(
            (span: any) => [...span.text]
              .map(t => ({ text: t, styles: { ...p.styles, ...span.styles } }))
          )
      )
    },
    fonts(): Set<string> {
      const { spans } = this
      return new Set(spans.map((span: any) => span.styles.font))
    },
    pStyle(): any {
      const { area, config } = this
      return {
        margin: 0,
        minHeight: `${area.height / config.styles.scale}px`,
        minWidth: `${area.width / config.styles.scale}px`
      }
    },
    curveStyle(): any {
      const { bend, minHeight, scaleRatio } = this
      const borderWidth = `${1 / (scaleRatio * 0.01)}px`
      const style = {} as any
      const radius = 1000 / Math.pow(Math.abs(bend), 0.6)
      if (bend >= 0) {
        style.top = `${minHeight / 2}px`
      } else {
        style.bottom = `${minHeight / 2}px`
      }
      if (bend === 0) {
        style.borderRadius = 0
      }
      return {
        ...style,
        borderWidth,
        height: `${radius * 2}px`,
        width: `${radius * 2}px`
      }
    },
    curveIconStyle(): any {
      const { config: { styles }, scaleRatio } = this
      const size = 13 / (scaleRatio * 0.01)
      return {
        width: `${size / styles.scale}px`,
        height: `${size / styles.scale}px`
      }
    }
  },
  watch: {
    dragging(curr, prev) {
      const { y, x, width } = this.config.styles
      const { bend, area, minHeight } = this
      if (prev && !curr) {
        this.y = bend < 0 ? y + area.height - minHeight : y
        this.x = x + width / 2
      }
    },
    bend() {
      this.handleCurveSpan(this.spans)
    },
    spans(newSpans) {
      this.handleCurveSpan(newSpans)
    }
  },
  methods: {
    calcArea() {
      const { transforms } = this
      const { scale, width } = this.config.styles
      const positionList = transforms.map(transform => transform.match(/[.\d]+/g) || []) as any
      const midLeng = Math.floor(positionList.length / 2)
      const minY = Math.min.apply(null, positionList.map((position: string[]) => position[1]))
      const maxY = Math.max.apply(null, positionList.map((position: string[]) => position[1]))
      const minX = Math.max
        .apply(
          null,
          positionList
            .slice(0, midLeng)
            .map((position: string[]) => position[0])
        )
      const maxX = Math.max
        .apply(
          null,
          positionList
            .slice(midLeng)
            .map((position: string[]) => position[0])
        )
      const areaWidth = Math.abs(maxX + minX) * 1.3 * scale
      const areaHeight = (Math.abs(maxY - minY) + this.minHeight) * scale
      this.area = {
        width: areaWidth,
        height: areaHeight
      }
      this.handleCurveTextUpdate({
        styles: { width: areaWidth, height: areaHeight },
        props: areaWidth > width ? { widthLimit: areaWidth } : {}
      })
    },
    rePosition() {
      const { scale } = this.config.styles
      const { width: areaWidth, height: areaHeight } = this.area
      let y = this.y
      const x = this.x - (areaWidth / 2)
      if (this.bend < 0) {
        y = this.y + (this.minHeight * scale) - areaHeight
      }

      this.handleCurveTextUpdate({
        styles: { y, x }
      })
    },
    styles(styles: any, idx: number) {
      const { transforms, bend, textHeight, minHeight } = this
      const baseline = `${(minHeight - textHeight[idx]) / 2}px`
      const fontStyles = CssConveter.convertFontStyle(styles)
      return Object.assign(
        fontStyles,
        { textIndent: fontStyles['letter-spacing'] || 'initial' },
        { transform: transforms[idx] || 'none' },
        bend >= 0 ? { top: baseline } : { bottom: baseline }
      )
    },
    handleCurveSpan (spans: any[], firstInit = false) {
      const { bend } = this
      if (spans.length) {
        this.$nextTick(() => {
          const eleSpans = (this.$refs.curveText as Element).querySelectorAll('span.nu-text__span')
          const textWidth = []
          const textHeight = []
          let minHeight = 0
          for (let idx = 0; idx < eleSpans.length; idx++) {
            const { offsetWidth, offsetHeight } = eleSpans[idx] as HTMLElement
            textWidth.push(offsetWidth)
            textHeight.push(offsetHeight)
            minHeight = Math.max(minHeight, offsetHeight)
          }
          this.textHeight = textHeight
          this.minHeight = minHeight
          this.transforms = TextShapeUtils.convertTextShape(textWidth, bend)
          this.calcArea()
          if (firstInit) {
            this.y = +bend < 0 ? this.y + this.area.height - minHeight : this.y
          } else {
            this.rePosition()
          }
        })
      } else {
        this.transforms = []
      }
    },
    handleCurveTextUpdate (updateInfo: { [key: string]: any }) {
      const { styles, props } = updateInfo
      const { pageIndex, layerIndex, subLayerIndex } = this
      LayerUtils.updateSpecLayerData({
        pageIndex,
        layerIndex,
        subLayerIndex,
        styles,
        props
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-text {
  height: 'max-content';
  // margin: auto;
  position: absolute;
  &__p {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  &__curve {
    border: 1px solid rgba(212, 9, 70, 0.5);
    border-radius: 50%;
    position: absolute;
    pointer-events: none;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    letter-spacing: 0.1px;
    line-height: 1;
    position: absolute;
  }
}
</style>
