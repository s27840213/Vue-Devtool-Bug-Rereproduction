<template lang="pug">
  p(class="nu-text__p" ref="curveText" @click="onClick" :style="pStyle")
    template
      div(v-show="active"  class="nu-text__curve" :style="curveStyle")
        svg-icon(iconName="curve-center"
          iconWidth="13px")
    span(v-for="(span, sIndex) in spans"
      class="nu-text__span"
      :key="sIndex",
      :style="styles(span.styles, sIndex)") {{ span.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations } from 'vuex'
import ControlUtils from '@/utils/controlUtils'
import CssConveter from '@/utils/cssConverter'
import TextEffectUtils from '@/utils/textEffectUtils'
import GroupUtils from '@/utils/groupUtils'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number
  },
  data () {
    return {
      transforms: [] as string[]
    }
  },
  mounted () {
    const { styles } = this.config
    this.handleCurveSpan(this.spans)
    ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: styles.initWidth })
    // ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: width })
    // ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
    // ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
  },
  computed: {
    active(): boolean {
      return this.config.active
    },
    bend(): number {
      const { textEffect } = this.config.styles
      return +textEffect.bend
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
      const { active } = this
      const { initWidth } = this.config.styles
      return {
        pointerEvents: active ? 'none' : 'auto',
        margin: '0.5em 0',
        minWidth: `${initWidth}px`
      }
    },
    curveStyle(): any {
      const { bend } = this
      const style = {} as any
      const radius = 1000 / Math.pow(Math.abs(bend), 0.6)
      if (bend >= 0) {
        style.top = '0.5em'
      } else {
        style.bottom = '0.5em'
      }
      if (bend === 0) {
        style.borderRadius = 0
      }
      return {
        ...style,
        height: `${radius * 2}px`,
        width: `${radius * 2}px`
      }
    }
  },
  watch: {
    bend () {
      this.handleCurveSpan(this.spans)
    },
    spans (newSpans) {
      this.handleCurveSpan(newSpans)
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
        const eleSpans = (this.$refs.curveText as Element).querySelectorAll('span')
        const textWidth = []
        for (let idx = 0; idx < eleSpans.length; idx++) {
          textWidth.push(eleSpans[idx].offsetWidth)
        }
        this.transforms = TextEffectUtils.convertTextShape(textWidth, bend)
      } else {
        this.transforms = []
      }
    },
    onClick () {
      GroupUtils.select([this.layerIndex])
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
    margin: 0;
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
