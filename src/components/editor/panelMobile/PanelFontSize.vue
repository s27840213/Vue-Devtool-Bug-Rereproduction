<template lang="pug">
  div(class="panel-font-size")
    font-size-selector
    input(class="panel-font-size__range-input"
      :style="progressStyles()"
      v-model.number="fontSize"
      max="144"
      min="1"
      step="1"
      type="range")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import FontSizeSelector from '@/components/input/FontSizeSelector.vue'
import layerUtils from '@/utils/layerUtils'
import textPropUtils from '@/utils/textPropUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import pageUtils from '@/utils/pageUtils'
import { mapGetters, mapState } from 'vuex'
import { IGroup, ILayer } from '@/interfaces/layer'
export default Vue.extend({
  components: {
    MobileSlider,
    FontSizeSelector
  },
  data() {
    return {
      openValueSelector: false,
      fieldRange: {
        fontSize: { min: 6, max: 800 },
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
        layerUtils.initialLayerScale(pageUtils.currFocusPageIndex, this.layerIndex)
        tiptapUtils.applySpanStyle('size', value)
        tiptapUtils.agent(editor => {
          layerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
        })
        textPropUtils.updateTextPropsState({ fontSize: value.toString() })
        textEffectUtils.refreshSize()
      }
    }
  },
  methods: {
    progressStyles() {
      const finalFontSize = (this.fontSize === '--') ? 0 : this.fontSize as number
      return {
        '--progress': `${(finalFontSize - 1) / (143) * 100}%`
      }
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
    --lower-color: #{setColor(blue-1)};
    --upper-color: #{setColor(gray-4)};
    @include progressSlider($height: 3px, $thumbSize: 16px, $marginTop: -7.5px);
    &::-webkit-slider-thumb {
      box-shadow: none;
      border: 3px solid setColor(blue-1);
      position: relative;
    }
    &::-moz-range-thumb {
      box-shadow: none;
      border: 3px solid setColor(blue-1);
      position: relative;
    }
  }

  &__range-input-button {
    width: fit-content;
  }
}
</style>
