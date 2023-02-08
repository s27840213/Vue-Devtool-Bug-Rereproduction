<template lang="pug">
div(class="font-size-selector size-bar relative")
  div(class="pointer"
    @pointerdown="fontSizeStepping(-step)"
    @contextmenu.prevent) -
  button(class="font-size-selector__range-input-button" @click="handleValueModal")
    input(class="body-2 text-gray-2 center record-selection" type="text" ref="input-fontSize"
          @change="setSize" :value="fontSize" :disabled="fontSize === '--'")
  div(class="pointer"
    @pointerdown="fontSizeStepping(step)"
    @contextmenu.prevent) +
  value-selector(v-if="openValueSelector"
              v-click-outside="handleValueModal"
              :valueArray="fontSelectValue"
              class="font-size-selector__value-selector"
              @update="handleValueUpdate")
</template>

<script lang="ts">
import ValueSelector from '@/components/ValueSelector.vue'
import { IGroup, ILayer } from '@/interfaces/layer'
import eventUtils from '@/utils/eventUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textPropUtils, { fontSelectValue } from '@/utils/textPropUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    ValueSelector
  },
  data() {
    return {
      openValueSelector: false,
      fontSelectValue,
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
  directives: {
    clickOutside: vClickOutside.directive
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
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
    fontSize(): number | string {
      if (this.props.fontSize === '--' || Number.isNaN(this.scale)) {
        return '--'
      }
      return Math.round((this.scale as number) * this.props.fontSize * 10) / 10
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
    boundValue(value: number, min: number, max: number): string {
      if (value < min) return min.toString()
      else if (value > max) return max.toString()
      return value.toString()
    },
    handleValueModal() {
      if (this.$isTouchDevice) return
      this.openValueSelector = !this.openValueSelector
      if (this.openValueSelector) {
        const input = this.$refs['input-fontSize'] as HTMLInputElement
        input.focus()
        input.select()
      }
    },
    handleValueUpdate(value: number) {
      // layerUtils.initialLayerScale(pageUtils.currFocusPageIndex, this.layerIndex)
      value = Math.round(value / this.scale * 10) / 10
      tiptapUtils.spanStyleHandler('size', value)
      tiptapUtils.forceUpdate(true)
      textPropUtils.updateTextPropsState({ fontSize: value.toString() })
      textEffectUtils.refreshSize()
    },
    setSize(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidFloat(value)) {
        value = this.boundValue(parseFloat(value), this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        const finalValue = Math.round(parseFloat(value) / this.scale * 10) / 10
        window.requestAnimationFrame(() => {
          tiptapUtils.applySpanStyle('size', finalValue)
          tiptapUtils.agent(editor => {
            layerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
          })
          tiptapUtils.forceUpdate(true)
          textPropUtils.updateTextPropsState({ fontSize: finalValue.toString() })
          textEffectUtils.refreshSize()
        })
      }
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
            eventUtils.removePointerEvent('pointerup', onmouseup)
            clearInterval(interval)
          }
        }
      }, tickInterval)

      const onmouseup = () => {
        eventUtils.removePointerEvent('pointerup', onmouseup)
        if (new Date().getTime() - startTime < 500) {
          textPropUtils.fontSizeStepping(step)
          textEffectUtils.refreshSize()
        }
        clearInterval(interval)
        tiptapUtils.agent(editor => {
          if (!editor.state.selection.empty) {
            layerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
            stepsUtils.record()
          }
        })
      }

      eventUtils.addPointerEvent('pointerup', onmouseup)
    }
  }
})
</script>

<style lang="scss" scoped>
.font-size-selector {
  user-select: none;
  &__range-input-button {
    width: fit-content;
  }

  &__value-selector {
    position: absolute;
    z-index: 9;
    transform: translate(45%);
    top: 75%;
  }
}
</style>
