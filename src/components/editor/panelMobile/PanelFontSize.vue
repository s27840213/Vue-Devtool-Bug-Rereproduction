<template lang="pug">
div(class="panel-font-size")
  font-size-selector
  input(class="panel-font-size__range-input"
    :style="progressStyles()"
    v-model.number="fontSize"
    :max="fieldRange.fontSize.max"
    :min="fieldRange.fontSize.min"
    step="1"
    type="range"
    :disabled="fontSize === '--'"
    @pointerup="handleChangeStop")
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import FontSizeSelector from '@/components/input/FontSizeSelector.vue'
import { IGroup, ILayer } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'
import stepsUtils from '@/utils/stepsUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textPropUtils from '@/utils/textPropUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'
export default defineComponent({
  emits: [],
  components: {
    MobileSlider,
    FontSizeSelector
  },
  data() {
    return {
      openValueSelector: false,
      fieldRange: {
        fontSize: { min: 1, max: 9999 },
        lineHeight: { min: 0.5, max: 2.5 },
        fontSpacing: { min: -200, max: 800 },
        // fontSpacing: { min: -2, max: 8 },
        // lineHeight: { min: 0, max: 300 },
        opacity: { min: 0, max: 100 }
      }
    }
  },
  computed: {
    ...mapGetters({
      layerIndex: 'getCurrSelectedIndex'
    }),
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    scale(): number {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      if (currLayer && currLayer.layers) {
        if (subLayerIdx === -1) {
          const scaleSet = (currLayer as IGroup).layers.reduce((p: Set<number>, c: ILayer) => {
            if (c.type === 'text') { p.add(c.styles.scale) }
            return p
          }, new Set())
          if (scaleSet.size === 1) {
            const [scale] = scaleSet
            return scale * currLayer.styles.scale
          }
          return NaN
        } else {
          return currLayer.styles.scale * (currLayer as IGroup).layers[subLayerIdx].styles.scale
        }
      }
      return currLayer.styles.scale
    },
    fontSize: {
      get(): number | string {
        if (this.props.fontSize === '--' || Number.isNaN(this.scale)) {
          return '--'
        }
        return Math.round((this.scale as number) * this.props.fontSize * 10) / 10
      },
      set(value: number): void {
        textPropUtils.fontSizeStepping(Math.round(value / this.scale * 10) / 10 - parseFloat(this.props.fontSize))
        textEffectUtils.refreshSize()
      }
    }
  },
  methods: {
    progressStyles() {
      const finalFontSize = this.fontSize as number
      return {
        '--progress': (this.fontSize === '--') ? '50%' : `${(finalFontSize - 1) / (143) * 100}%`
      }
    },
    handleChangeStop() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-font-size {
  width: 100%;
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: 3fr 7fr;
  column-gap: 20px;
  align-items: center;

  &__range-input {
    margin: 0;
    --lower-color: #{setColor(black-5)};
    --upper-color: #{setColor(black-6)};
    @include progressSlider($height: 3px, $thumbSize: 16px, $marginTop: -7.5px);
    &::-webkit-slider-thumb {
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
      position: relative;
    }
    &::-moz-range-thumb {
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
      position: relative;
    }
  }

  &__range-input-button {
    width: fit-content;
  }
}
</style>
