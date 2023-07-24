<template lang="pug">
p(class="nu-curve-text__p")
  span(v-if="focus === 'shape'"  class="nu-curve-text__circle" :style="circleStyle()")
    svg-icon(iconName="curve-center" :style="curveIconStyle")
  span(v-for="(span, sIndex) in spans()"
    class="nu-curve-text__span"
    :class="`nu-curve-text__span-p${pageIndex}l${layerIndex}s${subLayerIndex ? subLayerIndex : -1}`"
    :key="sIndex",
    :style="Object.assign(spanStyle(span.styles, sIndex), extraSpanStyle)") {{ span.text }}
</template>

<script lang="ts">
import { IGroup, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import LayerUtils from '@/utils/layerUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textShapeUtils from '@/utils/textShapeUtils'
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
    primaryLayer: {
      type: Object,
      default: () => { return undefined }
    },
    extraSpanStyle: {
      type: Object as PropType<Record<string, string|number>>,
    },
  },
  data () {
    return {
      textWidth: [] as number[],
      textHeight: [] as number[],
      minHeight: 0,
      isDestroyed: false,
    }
  },
  async created () {
    await this.computeDimensions()
    // textUtils.loadAllFonts(this.config, 1)
    textUtils.loadAllFonts(this.config)
  },
  unmounted() {
    this.isDestroyed = true
  },
  async mounted() {
    textUtils.untilFontLoaded(this.config.paragraphs, true).then(() => {
      setTimeout(async () => {
        await this.resizeCallback()
        generalUtils.setDoneFlag(this.pageIndex, this.layerIndex, this.subLayerIndex)
      }, 100) // for the delay between font loading and dom rendering
    })
  },
  computed: {
    ...mapState('text', ['fontStore']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    focus() {
      if (!(this.config.active || this.primaryLayer?.active)) return 'none'
      return textEffectUtils.focus
    },
    transforms(): string[] {
      const mainFontSize = textEffectUtils.getLayerFontSize(this.config.paragraphs)
      return textShapeUtils.convertTextShape(this.textWidth, this.bend(), mainFontSize)
    },
  },
  watch: {
    'config.paragraphs': {
      handler(newVal) {
        this.computeDimensions()
        textUtils.untilFontLoaded(newVal).then(() => {
          this.computeDimensions()
        })
      },
      deep: true
    },
  },
  methods: {
    bend(): number {
      const { textShape } = this.config.styles
      return +textShape.bend
    },
    spans(): ISpan[] {
      return textShapeUtils.flattenSpans(this.config)
    },
    circleStyle(): Record<string, string> {
      const { minHeight, scaleRatio } = this
      const bend = this.bend()
      const borderWidth = `${1 / (scaleRatio * 0.01)}px`
      const style = {} as Record<string, string|number>
      const mainFontSize = textEffectUtils.getLayerFontSize(this.config.paragraphs)
      const radius = textShapeUtils.getRadiusByBend(bend, mainFontSize)
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
    curveIconStyle(): Record<string, string> {
      const { config: { styles }, scaleRatio } = this
      const size = 13 / (scaleRatio * 0.01)
      return {
        width: `${size / styles.scale}px`,
        height: `${size / styles.scale}px`
      }
    },
    spanStyle(styles: ISpanStyle, sIndex: number) {
      const fontSize = styles.size
      const { textHeight, minHeight } = this
      const bend = this.bend()
      const transforms = this.transforms
      const baseline = `${(minHeight - textHeight[sIndex]) / 2 - fontSize}px`
      const fontStyles = tiptapUtils.textStylesRaw(styles)
      return Object.assign(
        fontStyles,
        {
          textIndent: fontStyles['letter-spacing'] || 'initial',
          transform: transforms[sIndex] || 'none',
          padding: `${fontSize}px`,
        },
        bend >= 0 ? { top: baseline } : { bottom: baseline },
      )
    },
    async computeDimensions() {
      const { textWidth, textHeight, minHeight } = await textShapeUtils.getTextHWsAsync(this.config)
      this.textWidth = textWidth
      this.textHeight = textHeight
      this.minHeight = minHeight
    },
    async resizeCallback() {
      if (this.isDestroyed) return

      // console.log('resize')

      if (typeof this.subLayerIndex === 'undefined' || this.subLayerIndex === -1) {
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, await textShapeUtils.getCurveTextPropsAsync(this.config))
      } else {
        const group = LayerUtils.getLayer(this.pageIndex, this.layerIndex) as IGroup
        if (group.type !== 'group' || group.layers[this.subLayerIndex].type !== 'text') return
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, await textShapeUtils.getCurveTextPropsAsync(this.config))
        textUtils.updateGroupLayerSize(this.pageIndex, this.layerIndex)
      }

      await this.computeDimensions()
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
    margin: 0;
    width: 100%;
    height: 100%;
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
    white-space: pre; // if use pre-wrap (as in NuText), single space on Safari will have weirdly thin width.
    overflow-wrap: break-word;
    letter-spacing: 0.1px;
    line-height: 1;
    position: absolute;
    display: inline-block;
  }
}
</style>
