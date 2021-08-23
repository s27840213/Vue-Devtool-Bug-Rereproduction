<template lang="pug">
  p(class="nu-text__p" ref="curveText" :style="pStyle")
    template
      div(v-show="focus"  class="nu-text__curve" :style="curveStyle")
        svg-icon(iconName="curve-center" :style="curveIconStyle")
    span(v-for="(span, sIndex) in spans"
      class="nu-text__span"
      :key="sIndex",
      :style="styles(span.styles, sIndex)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
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
    return {
      transforms: [] as string[],
      textHeight: [] as number[],
      minHeight: 0,
      areaHeight: 0,
      y: 0
    }
  },
  mounted () {
    this.handleCurveSpan(this.spans)
    this.y = this.config.styles.y
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    focus(): boolean {
      const { textShape } = this.config.styles
      return textShape.focus
    },
    isLayerDragging(): boolean {
      return this.config.dragging
    },
    bend(): number {
      const { textShape } = this.config.styles
      return +textShape.bend
    },
    spans(): any {
      const { paragraphs } = this.config
      return paragraphs.flatMap(
        (p: any) =>
          p.spans.flatMap(
            (span: any) => [...span.text].map(t => ({ text: t, styles: span.styles }))
          )
      )
    },
    pStyle(): any {
      const { minHeight, config } = this
      return {
        margin: 0,
        height: `${minHeight}px`,
        minWidth: `${config.styles.width / config.styles.scale}px`
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
    isLayerDragging (curr, prev) {
      const { styles } = this.config
      if (prev && !curr) {
        this.y = styles.y
      }
    },
    areaHeight (val) {
      const { bend, config } = this
      if (bend < 0) {
        const y = this.y + (config.styles.height - val)
        this.y = y
        this.handleCurveTextUpdate({
          styles: { y }
        })
      }
    },
    bend () {
      this.handleCurveSpan(this.spans)
    },
    spans (newSpans) {
      this.handleCurveSpan(newSpans)
    },
    transforms (data: string[]) {
      const { scale, width } = this.config.styles
      const positionList = data.map(transform => transform.match(/[.\d]+/g) || []) as any
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
      this.areaHeight = areaHeight
      window.requestAnimationFrame(() => {
        this.handleCurveTextUpdate({
          styles: { width: areaWidth, height: areaHeight },
          props: areaWidth > width ? { widthLimit: areaWidth } : {}
        })
      })
    }
  },
  methods: {
    styles(styles: any, idx: number) {
      const { transforms, bend, textHeight, minHeight } = this
      const baseline = `${(minHeight - textHeight[idx]) / 2}px`
      console.log(`${styles.font} imported: `, document.fonts.check(`16px ${styles.font}`))
      return Object.assign(
        CssConveter.convertFontStyle(styles),
        { transform: transforms[idx] || 'none' },
        bend >= 0 ? { top: baseline } : { bottom: baseline }
      )
    },
    handleCurveSpan (spans: any[]) {
      const { bend } = this
      if (spans.length) {
        this.$nextTick(() => {
          const eleSpans = (this.$refs.curveText as Element).querySelectorAll('span')
          const textWidth = []
          const textHeight = []
          let minHeight = 0
          for (let idx = 0; idx < eleSpans.length; idx++) {
            const { offsetWidth, offsetHeight } = eleSpans[idx]
            textWidth.push(offsetWidth)
            textHeight.push(offsetHeight)
            minHeight = Math.max(minHeight, offsetHeight)
          }
          console.log(textHeight)
          this.textHeight = textHeight
          this.minHeight = minHeight
          this.transforms = TextShapeUtils.convertTextShape(textWidth, bend)
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
    line-height: 1.2;
    position: absolute;
  }
}
</style>
