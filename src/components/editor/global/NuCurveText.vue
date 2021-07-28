<template lang="pug">
  p(class="nu-text__p" ref="curveText" :style="pStyle")
    template
      div(v-show="active"  class="nu-text__curve" :style="curveStyle")
        svg-icon(iconName="curve-center" :style="curveIconStyle")
    span(v-for="(span, sIndex) in spans"
      class="nu-text__span"
      :key="sIndex",
      :style="styles(span.styles, sIndex)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters } from 'vuex'
import ControlUtils from '@/utils/controlUtils'
import CssConveter from '@/utils/cssConverter'
import TextShapeUtils from '@/utils/textShapeUtils'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number
  },
  data () {
    return {
      transforms: [] as string[],
      minHeight: 0,
      areaHeight: 0,
      y: 0
    }
  },
  mounted () {
    this.handleCurveSpan(this.spans)
    this.y = this.config.styles.y
  },
  destroyed () {
    ControlUtils.updateLayerProps(
      this.pageIndex,
      this.layerIndex,
      { widthLimit: -1 }
    )
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    active(): boolean {
      return this.config.active
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
      const { active, areaHeight, bend, minHeight, config } = this
      const style = { margin: 0 } as any
      style.height = `${minHeight}px`
      if (bend >= 0) {
        style.paddingBottom = `${areaHeight}px`
      } else {
        style.paddingTop = `${areaHeight}px`
      }
      return {
        ...style,
        minWidth: `${config.styles.width / config.styles.scale}px`,
        pointerEvents: active ? 'none' : 'auto'
      }
    },
    curveStyle(): any {
      const { bend, minHeight } = this
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
      const { areaHeight } = this
      if (prev && !curr) {
        if (this.bend >= 0) {
          this.y = styles.y
        } else {
          this.y = styles.y + (areaHeight * styles.scale)
        }
      }
    },
    areaHeight (val) {
      const { bend, config } = this
      if (bend < 0) {
        ControlUtils.updateLayerPos(
          this.pageIndex,
          this.layerIndex,
          config.styles.x,
          this.y - (val * config.styles.scale)
        )
      } else {
        if (config.styles.y !== this.y) {
          ControlUtils.updateLayerPos(
            this.pageIndex,
            this.layerIndex,
            config.styles.x,
            this.y
          )
        }
      }
    },
    bend (val) {
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
      const areaWidth = Math.abs(maxX + minX) * 1.1 * scale
      this.$nextTick(() => {
        this.areaHeight = Math.abs(maxY - minY)
        if (areaWidth > width) {
          ControlUtils.updateLayerProps(
            this.pageIndex,
            this.layerIndex,
            { width: areaWidth, widthLimit: areaWidth }
          )
        }
      })
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex'
    }),
    styles(styles: any, idx: number) {
      const { transforms } = this
      return Object.assign(
        CssConveter.convertFontStyle(styles),
        { transform: transforms[idx] || 'none' }
      )
    },
    handleCurveSpan (spans: any[]) {
      const { bend } = this
      if (spans.length) {
        this.$nextTick(() => {
          const eleSpans = (this.$refs.curveText as Element).querySelectorAll('span')
          const textWidth = []
          let minHeight = 0
          for (let idx = 0; idx < eleSpans.length; idx++) {
            textWidth.push(eleSpans[idx].offsetWidth)
            minHeight = Math.max(minHeight, eleSpans[idx].offsetHeight)
          }
          this.minHeight = minHeight
          this.transforms = TextShapeUtils.convertTextShape(textWidth, bend)
        })
      } else {
        this.transforms = []
      }
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
