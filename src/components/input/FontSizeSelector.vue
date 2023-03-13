<template lang="pug">
div(class="font-size-selector size-bar relative")
  div(class="pointer"
    @pointerdown="fontSizeStepping(-1)"
    @contextmenu.prevent) -
  button(class="font-size-selector__range-input-button" @click="handleValueModal")
    input(class="body-2 text-gray-2 center record-selection" type="text" ref="input-fontSize"
          @change="setSize" :value="fontSize" :disabled="fontSize === '--'")
  div(class="pointer"
    @pointerdown="fontSizeStepping(1)"
    @contextmenu.prevent) +
  value-selector(v-if="openValueSelector"
              v-click-outside="handleValueModal"
              :valueArray="fontSelectValue"
              class="font-size-selector__value-selector"
              @update="handleValueUpdate")
</template>

<script lang="ts">
import ValueSelector from '@/components/ValueSelector.vue'
import eventUtils from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textPropUtils, { fontSelectValue } from '@/utils/textPropUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import vClickOutside from 'click-outside-vue3'
import _ from 'lodash'
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
        fontSize: { min: 1, max: 9999 },
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
    fontSize(): number | string {
      return this.props.fontSize === '--' ? this.props.fontSize : _.round(this.props.fontSize, 2)
      // return this.props.fontSize
    },
  },
  methods: {
    handleValueModal() {
      if (this.$isTouchDevice()) return
      this.openValueSelector = !this.openValueSelector
      if (this.openValueSelector) {
        const input = this.$refs['input-fontSize'] as HTMLInputElement
        input.focus()
        input.select()
      }
    },
    handleValueUpdate(value: number) {
      textPropUtils.fontSizeHandler(value)
    },
    setSize(e: Event) {
      const { value } = e.target as HTMLInputElement
      if (generalUtils.isValidFloat(value)) {
        const boundedValue = generalUtils.boundValue(parseFloat(value), this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        textPropUtils.fontSizeHandler(boundedValue)
      }
    },
    fontSizeStepping(step: number, tickInterval = 100) {
      const startTime = new Date().getTime()
      const interval = window.setInterval(() => {
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
