<template lang="pug">
p(class="nu-curve-text__p" :style="pStyle()")
  span(v-if="focus()"  class="nu-curve-text__circle" :style="circleStyle()")
    svg-icon(iconName="curve-center" :style="curveIconStyle")
  span(v-for="(span, sIndex) in spans()"
    class="nu-curve-text__span"
    :class="`nu-curve-text__span-p${pageIndex}l${layerIndex}s${subLayerIndex ? subLayerIndex : -1}`"
    :key="sIndex",
    :style="Object.assign(styles(span.styles, sIndex), extraSpanStyle)") {{ span.text }}
</template>

<script lang="ts">
import { IGroup, ISpan, IText } from '@/interfaces/layer'
import LayerUtils from '@/utils/layerUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import TextShapeUtils from '@/utils/textShapeUtils'
import textUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  props: {
    config: {
      type: Object as PropType<IText>,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    subLayerIndex: {
      type: Number
    },
    extraSpanStyle: {
      type: Object as PropType<Record<string, string>>,
    },
  },
  data () {
    return {
      textWidth: [] as number[],
      textHeight: [] as number[],
      minHeight: 0,
      isDestroyed: false
    }
  },
  async created () {
    await this.computeDimensions(this.spans())
    // textUtils.loadAllFonts(this.config, 1)
    textUtils.loadAllFonts(this.config)
  },
  unmounted() {
    this.isDestroyed = true
  },
  mounted() {
    textUtils.untilFontLoaded(this.config.paragraphs, true).then(() => {
      setTimeout(() => {
        this.resizeCallback()
      }, 100) // for the delay between font loading and dom rendering
    })
  },
  computed: {
    ...mapState('text', ['fontStore']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
  },
  watch: {
    'config.paragraphs': {
      handler(newVal) {
        this.computeDimensions(this.spans())
        textUtils.untilFontLoaded(newVal).then(() => {
          this.computeDimensions(this.spans())
        })
      },
      deep: true
    }
  },
  methods: {
    focus(): boolean {
      const { textShape } = this.config.styles
      return textShape.focus
    },
    bend(): number {
      const { textShape } = this.config.styles
      return +textShape.bend
    },
    spans(): ISpan[] {
      return TextShapeUtils.flattenSpans(this.config)
    },
    pStyle(): any {
      const { height, width, scale } = this.config.styles
      return {
        margin: 0,
        height: `${height / scale}px`,
        width: `${width / scale}px`
      }
    },
    circleStyle(): any {
      const { minHeight, scaleRatio } = this
      const bend = this.bend()
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
    },
    transforms(): string[] {
      return TextShapeUtils.convertTextShape(this.textWidth, this.bend())
    },
    styles(styles: any, idx: number) {
      const { textHeight, minHeight } = this
      const bend = this.bend()
      const transforms = this.transforms()
      const baseline = `${(minHeight - textHeight[idx]) / 2}px`
      const fontStyles = tiptapUtils.textStylesRaw(styles)
      const textEffectStyles = textEffectUtils.convertTextEffect(this.config)
      return Object.assign(
        fontStyles,
        { textIndent: fontStyles['letter-spacing'] || 'initial' },
        { transform: transforms[idx] || 'none' },
        bend >= 0 ? { top: baseline } : { bottom: baseline },
        textEffectStyles,
      )
    },
    async computeDimensions(spans: ISpan[]) {
      const { textWidth, textHeight, minHeight } = await TextShapeUtils.getTextHWsBySpansAsync(spans)
      this.textWidth = textWidth
      this.textHeight = textHeight
      this.minHeight = minHeight
    },
    async resizeCallback() {
      if (this.isDestroyed) return

      // console.log('resize')

      if (typeof this.subLayerIndex === 'undefined' || this.subLayerIndex === -1) {
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, await TextShapeUtils.getCurveTextPropsAsync(this.config))
      } else {
        const group = LayerUtils.getLayer(this.pageIndex, this.layerIndex) as IGroup
        if (group.type !== 'group' || group.layers[this.subLayerIndex].type !== 'text') return
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, await TextShapeUtils.getCurveTextPropsAsync(this.config))
        textUtils.updateGroupLayerSize(this.pageIndex, this.layerIndex)
        textUtils.fixGroupCoordinates(this.pageIndex, this.layerIndex)
      }

      await this.computeDimensions(this.spans())
    }
  }
})
</script>

<style lang="scss">
.nu-curve-text {
  &__p {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  &__circle {
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
    display: inline-block;
  }
}
</style>
