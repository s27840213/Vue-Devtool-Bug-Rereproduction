<template lang="pug">
  div(class="panel-font-size")
    div(class="size-bar relative")
      div(class="pointer"
        @touchstart="fontSizeStepping(-step)") -
      button(class="panel-font-size__range-input-button" @click="handleValueModal")
        input(class="body-2 text-gray-2 center record-selection" type="text" ref="input-fontSize"
              @change="setSize" :value="fontSize")
      div(class="pointer"
        @touchstart="fontSizeStepping(step)") +
    input(class="panel-font-size__range-input input__slider--range"
      v-model.number="fontSize"
      max="144"
      min="1"
      step="1"
      type="range"
      @mouseup="handleChangeStop")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import layerUtils from '@/utils/layerUtils'
import textPropUtils from '@/utils/textPropUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import { mapGetters, mapState } from 'vuex'
import { IGroup, ILayer } from '@/interfaces/layer'
export default Vue.extend({
  components: {
    MobileSlider
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
    opacity(): number {
      return layerUtils.getCurrOpacity
    },
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
    },
    step(): number {
      // const config = LayerUtils.getCurrConfig
      // return 1 / config.styles.scale
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      let scale = currLayer.styles.scale
      if (subLayerIdx !== -1) {
        scale *= (currLayer as IGroup).layers[subLayerIdx].styles.scale
      }
      return 1 / scale
    }
  },
  methods: {
    isValidInt(value: string) {
      return value.match(/^-?\d+$/)
    },
    isValidFloat(value: string) {
      return value.match(/[+-]?\d+(\.\d+)?/)
    },
    isValidHexColor(value: string) {
      return value.match(/^#[0-9A-F]{6}$/)
    },
    boundValue(value: number, min: number, max: number): string {
      if (value < min) return min.toString()
      else if (value > max) return max.toString()
      return value.toString()
    },
    updateLayerOpacity(val: number) {
      layerUtils.updateLayerOpacity(val)
    },
    fontSizeStepping(step: number, tickInterval = 100) {
      const startTime = new Date().getTime()
      const interval = setInterval(() => {
        if (new Date().getTime() - startTime > 500) {
          try {
            textPropUtils.fontSizeStepping(step)
            textEffectUtils.refreshSize()
          } catch (error) {
            console.error(error)
            window.removeEventListener('touchend', onmouseup)
            clearInterval(interval)
          }
        }
      }, tickInterval)

      const onmouseup = () => {
        window.removeEventListener('touchend', onmouseup)
        if (new Date().getTime() - startTime < 500) {
          textPropUtils.fontSizeStepping(step)
          textEffectUtils.refreshSize()
        }
        clearInterval(interval)
        tiptapUtils.agent(editor => {
          if (!editor.state.selection.empty) {
            layerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
          }
        })
      }

      window.addEventListener('touchend', onmouseup)
    },
    setSize(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidFloat(value)) {
        layerUtils.initialLayerScale(pageUtils.currFocusPageIndex, this.layerIndex)
        value = this.boundValue(parseFloat(value), this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        window.requestAnimationFrame(() => {
          tiptapUtils.applySpanStyle('size', value)
          tiptapUtils.agent(editor => {
            layerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
          })
          textPropUtils.updateTextPropsState({ fontSize: value })
          textEffectUtils.refreshSize()
        })
      }
    },
    handleValueModal() {
      this.openValueSelector = !this.openValueSelector
      if (this.openValueSelector) {
        const input = this.$refs['input-fontSize'] as HTMLInputElement
        input.focus()
        input.select()
      }
    },
    handleChangeStop() {
      console.log('hi')
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
