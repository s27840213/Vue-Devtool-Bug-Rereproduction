<template lang="pug">
  p(class="nu-curve-text__p" :style="pStyle")
    span(v-if="focus"  class="nu-curve-text__circle" :style="circleStyle")
      svg-icon(iconName="curve-center" :style="curveIconStyle")
    span(v-for="(span, sIndex) in spans"
      class="nu-curve-text__span"
      :key="sIndex",
      :style="styles(span.styles, sIndex)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import CssConveter from '@/utils/cssConverter'
import TextShapeUtils from '@/utils/textShapeUtils'
import LayerUtils from '@/utils/layerUtils'
import { IGroup, ISpan } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import textUtils from '@/utils/textUtils'
import asyncUtils from '@/utils/asyncUtils'

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
        height,
        top: y,
        bottom: y,
        left: x + (width / 2)
      },
      asSubLayerSizeBuff: -1
    }
  },
  async created () {
    const { pageIndex, layerIndex } = this
    const key = asyncUtils.generateKeyByIndexes(pageIndex, layerIndex, -1)
    asyncUtils.registerFinalExecutor(key, () => {
      textUtils.fixGroupXcoordinates(pageIndex, layerIndex)
      textUtils.fixGroupYcoordinates(pageIndex, layerIndex)
    })
    this.handleCurveSpan(this.spans, true, () => {
      typeof this.subLayerIndex !== 'undefined' && textUtils.updateGroupLayerSize(pageIndex, layerIndex)
      asyncUtils.completed(key)
    })
  },
  destroyed() {
    const { pageIndex, layerIndex } = this
    const key = asyncUtils.generateKeyByIndexes(pageIndex, layerIndex, -1)
    asyncUtils.registerFinalExecutor(key, () => {
      textUtils.fixGroupXcoordinates(pageIndex, layerIndex)
      textUtils.fixGroupYcoordinates(pageIndex, layerIndex)
    })
    typeof this.subLayerIndex !== 'undefined' && textUtils.updateGroupLayerSize(pageIndex, layerIndex)
    this.$nextTick(() => {
      asyncUtils.completed(key)
    })
  },
  computed: {
    ...mapState('text', ['fontStore']),
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
    editing(): boolean {
      return this.config.editing
    },
    bend(): number {
      const { textShape } = this.config.styles
      return +textShape.bend
    },
    spans(): ISpan[] {
      return TextShapeUtils.flattenSpans(this.config)
    },
    fonts(): Set<string> {
      const { spans } = this
      return new Set(spans.map((span: any) => span.styles.font))
    },
    pStyle(): any {
      const { config, area } = this
      return {
        margin: 0,
        height: `${config.styles.height / config.styles.scale}px`,
        width: `${config.styles.width / config.styles.scale}px`
      }
    },
    circleStyle(): any {
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
    },
    isFontLoaded(): boolean {
      const { fonts, fontStore } = this
      for (const font of fontStore) {
        const { face, name, loaded } = font
        const hasFont = fonts.has(face) || fonts.has(name)
        if (hasFont && !loaded) { return false }
      }
      return true
    }
  },
  watch: {
    dragging(curr, prev) {
      const { x, width } = this.config.styles
      if (prev && !curr) {
        this.resetLimitY()
        this.area.left = x + width / 2
      }
    },
    bend() {
      const { x, width } = this.config.styles
      this.area.left = x + width / 2
      const { pageIndex, layerIndex } = this
      const key = asyncUtils.generateKeyByIndexes(pageIndex, layerIndex, -1)
      asyncUtils.registerFinalExecutor(key, () => {
        textUtils.fixGroupXcoordinates(pageIndex, layerIndex)
        textUtils.fixGroupYcoordinates(pageIndex, layerIndex)
      })
      this.handleCurveSpan(this.spans, false, () => {
        typeof this.subLayerIndex !== 'undefined' && textUtils.updateGroupLayerSize(this.pageIndex, this.layerIndex)
        asyncUtils.completed(key, this.resetLimitY)
      })
    },
    spans(newSpans) {
      const heightOri = this.config.styles.height
      const { x, width } = this.config.styles
      this.area.left = x + width / 2
      this.handleCurveSpan(newSpans, false, () => {
        typeof this.subLayerIndex !== 'undefined' && this.asSubLayerSizeRefresh(this.config.styles.height, heightOri)
        textUtils.fixGroupXcoordinates(this.pageIndex, this.layerIndex)
        textUtils.fixGroupYcoordinates(this.pageIndex, this.layerIndex)
        this.resetLimitY()
      })
    },
    isFontLoaded (curr) {
      const { pageIndex, layerIndex } = this
      const key = asyncUtils.generateKeyByIndexes(pageIndex, layerIndex, -1)
      asyncUtils.registerFinalExecutor(key, () => {
        textUtils.fixGroupXcoordinates(pageIndex, layerIndex)
        textUtils.fixGroupYcoordinates(pageIndex, layerIndex)
      })
      curr && this.handleCurveSpan(this.spans, true, () => {
        typeof this.subLayerIndex !== 'undefined' && textUtils.updateGroupLayerSize(pageIndex, layerIndex)
        asyncUtils.completed(key)
      })
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
      this.area.width = areaWidth
      this.area.height = areaHeight
      this.handleCurveTextUpdate({
        styles: { width: areaWidth, height: areaHeight },
        props: areaWidth > width ? { widthLimit: areaWidth } : {}
      })
    },
    rePosition() {
      const { top, bottom, left, width: areaWidth, height: areaHeight } = this.area
      const y = this.bend >= 0 ? top : bottom - areaHeight
      // const x = Math.max(left - (areaWidth / 2), 0)
      const x = left - (areaWidth / 2) // keep its center anyway
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
    handleCurveSpan (spans: any[], firstInit = false, callback?: () => void) {
      if (spans.length > 1) {
        const { textWidth, textHeight, minHeight } = TextShapeUtils.getTextHWsBySpans(spans)
        this.textHeight = textHeight
        this.minHeight = minHeight
        this.transforms = TextShapeUtils.convertTextShape(textWidth, this.bend)
        this.calcArea()
        firstInit && this.resetLimitY()
        this.rePosition()
        callback && callback()
      } else {
        this.transforms = []
        callback && callback()
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
    },
    resetLimitY () {
      const { config, bend } = this
      const { y } = config.styles
      this.area.bottom = bend >= 0 ? y + this.minHeight : y + this.area.height
      this.area.top = bend >= 0 ? y : this.area.bottom - this.minHeight
    },
    asSubLayerSizeRefresh(height: number, heightOri: number) {
      if (this.asSubLayerSizeBuff === -1) {
        this.asSubLayerSizeBuff = height
      } else if (this.asSubLayerSizeBuff === height) {
        return
      }
      const group = LayerUtils.getCurrLayer as IGroup
      const targetSubLayers = [] as Array<[number, number]>
      if (this.bend >= 0) {
        const lowLine = this.config.styles.y + heightOri
        group.layers
          .forEach((l, idx) => {
            if (l.styles.y >= lowLine && idx !== this.subLayerIndex) {
              targetSubLayers.push([idx, l.styles.y])
            }
          })
        targetSubLayers
          .forEach(data => {
            LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, data[0], {
              y: data[1] + (height - heightOri)
            })
          })
      } else {
        const highLine = this.config.styles.y
        group.layers
          .forEach((l, idx) => {
            if (l.styles.y <= highLine && idx !== this.subLayerIndex) {
              targetSubLayers.push([idx, l.styles.y])
            }
          })
        targetSubLayers
          .forEach(data => {
            LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, data[0], {
              y: data[1] - (height - heightOri)
            })
          })
      }
      textUtils.updateGroupLayerSize(this.pageIndex, this.layerIndex)
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
  }
}
</style>
