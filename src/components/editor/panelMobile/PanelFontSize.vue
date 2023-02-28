<template lang="pug">
div(class="panel-font-size")
  font-size-selector
  input(class="panel-font-size__range-input input__slider--range"
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
import tiptapUtils from '@/utils/tiptapUtils'
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
        fontSize: { min: 1, max: 144 },
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
        // layerUtils.initialLayerScale(pageUtils.currFocusPageIndex, this.layerIndex)
        value = this.boundValue(value, this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        const finalValue = value / layerUtils.getCurrLayer.styles.scale
        const compensation = textPropUtils.getScaleCompensation(finalValue)
        textPropUtils.applyScaleCompensation(compensation.scale)
        tiptapUtils.spanStyleHandler('size', compensation.size)
        tiptapUtils.forceUpdate(true)
        textPropUtils.updateTextPropsState({ fontSize: compensation.size.toString() })
        textEffectUtils.refreshSize()
      }
    }
  },
  methods: {
    handleChangeStop() {
      stepsUtils.record()
    },
    boundValue(value: number, min: number, max: number): number {
      return Math.max(Math.min(value, max), min)
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

  &__range-input-button {
    width: fit-content;
  }
}
</style>
