<template lang="pug">
  div(class="panel-spacing")
    mobile-slider(:name="`${$t('NN0109')}`"
      :value="lineHeight"
      :min="fieldRange.lineHeight.min"
      :max="fieldRange.lineHeight.max"
      :step="0.01"
      :propKey="'lh'"
      @update:lh="updateLineHeight")
    mobile-slider(:name="`${$t('NN0110')}`"
      :value="fontSpacing"
      :min="fieldRange.fontSpacing.min"
      :max="fieldRange.fontSpacing.max"
      :step="1"
      :propKey="'fs'"
      @update:fs="updateFontSpacing")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import layerUtils from '@/utils/layerUtils'
import { mapState } from 'vuex'
import textPropUtils from '@/utils/textPropUtils'
import textUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { IGroup, ITmp } from '@/interfaces/layer'
import { toNumber } from 'lodash'
export default Vue.extend({
  components: {
    MobileSlider
  },
  data() {
    return {
      fieldRange: {
        fontSize: { min: 6, max: 800 },
        lineHeight: { min: 0.5, max: 2.5 },
        fontSpacing: { min: -200, max: 800 },
        opacity: { min: 0, max: 100 }
      }
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    opacity(): number {
      return layerUtils.getCurrOpacity
    },
    lineHeight(): number {
      return toNumber(this.props.lineHeight)
    },
    fontSpacing(): number {
      return toNumber(this.props.fontSpacing)
    }
  },
  methods: {
    updateLineHeight(val: number) {
      this.setParagraphProp('lineHeight', val)
    },
    updateFontSpacing(val: number) {
      this.setParagraphProp('fontSpacing', val)
    },
    isValidFloat(value: string) {
      return value.match(/[+-]?\d+(\.\d+)?/)
    },
    boundValue(value: number, min: number, max: number): string {
      if (value < min) return min.toString()
      else if (value > max) return max.toString()
      return value.toString()
    },
    setParagraphProp(prop: 'lineHeight' | 'fontSpacing', _value: number) {
      if (this.isValidFloat(_value.toString())) {
        let value = parseFloat(this.boundValue(_value, this.fieldRange[prop].min, this.fieldRange[prop].max))
        switch (prop) {
          case 'lineHeight':
            value = toNumber((value).toFixed(2))
            break
          case 'fontSpacing':
            value = value / 1000
        }
        const { layerIndex, subLayerIdx, getCurrLayer: currLayer } = layerUtils
        window.requestAnimationFrame(() => {
          if (['group', 'tmp'].includes(currLayer.type) && subLayerIdx === -1) {
            (currLayer as IGroup | ITmp).layers
              .forEach((l, idx) => {
                l.type === 'text' && textPropUtils.propAppliedAllText(layerIndex, idx, prop, value)
                l.type === 'text' && textUtils.updateGroupLayerSizeByShape(layerUtils.pageIndex, layerIndex, idx)
              })
          } else {
            tiptapUtils.applyParagraphStyle(prop, value, false)
            textPropUtils.updateTextPropsState({ [prop]: value })
          }
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-spacing {
  width: 100%;
}
</style>
