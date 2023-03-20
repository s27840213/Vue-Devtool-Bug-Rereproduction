<template lang="pug">
div(class="font-size-selector relative")
  div(class="font-size-selector__number")
    div(class="pointer"
      @pointerdown="fontSizeStepping(-1)"
      @contextmenu.prevent)
      svg-icon(iconName="minus-small" iconWidth="24px" iconColor="gray-2")
    button(class="font-size-selector__range-input-button")
      input(class="text-gray-2 center record-selection" type="text" ref="input-fontSize"
            @change="setSize" :value="fontSize" :disabled="fontSize === '--'")
    div(class="pointer"
      @pointerdown="fontSizeStepping(1)"
      @contextmenu.prevent)
      svg-icon(iconName="plus-small" iconWidth="24px" iconColor="gray-2")
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
  &__number {
    border: 1px solid setColor(gray-4);
    border-radius: 3px;
    width: 132px;
    height: 40px;
    display: flex;
    align-items: center;
    > div {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: setColor(gray-2);

      &:nth-child(1) {
        width: 36px;
        border-right: 1px solid setColor(gray-4);
      }

      &:nth-child(3) {
        width: 36px;
        border-left: 1px solid setColor(gray-4);
      }
    }
  }

  &__range-input-button {
    width: 58px;
    & > input {
      padding: 0;
      @include body-MD;
      text-align: center;
    }
  }

  &__value-selector {
    position: absolute;
    z-index: 9;
    transform: translate(45%);
    top: 75%;
  }
}
</style>
