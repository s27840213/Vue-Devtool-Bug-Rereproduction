<template lang="pug">
div(class="panel-font-curve")
  div(class="overflow-hidden text-yellow-0 body-SM") {{ bend }}
  input(class="panel-font-curve__range-input input__slider--range"
    v-progress
    v-model.number="bend"
    :max="option.max"
    :min="option.min"
    step="1"
    type="range"
    @pointerdown="setFocus(true)"
    @pointerup="handleChangeStop"
    @pointercancel="handleChangeStop")
  svg-icon(
    iconName="cm_reset"
    iconColor="yellow-0"
    iconWidth="24px"
    @click="reset")
</template>

<script lang="ts">
import constantData, { IEffectOptionRange } from '@/utils/constantData'
import stepsUtils from '@/utils/stepsUtils'
import _ from 'lodash'
import { defineComponent } from 'vue'
import textShapeUtils from '@/utils/textShapeUtils'
import textEffectUtils, { isFocusState } from '@/utils/textEffectUtils'

export default defineComponent({
  data() {
    return {
      option: constantData.textEffects().content
        .find((category) => category.name === 'shape')
          ?.effects2d[0].find((effect) => effect.key === 'curve')
            ?.options.find((option) => option.key === 'bend') as IEffectOptionRange,
    }
  },
  computed: {
    bend: {
      get(): number | string {
        const bend = textEffectUtils.getCurrentLayer().styles.textShape?.bend ?? 0
        return typeof bend === 'string' ? bend : _.round(bend, 2)
      },
      set(value: number): void {
        const newVal = {
          [this.option.key]: _.clamp(value, this.option.min, this.option.max)
        }
        textShapeUtils.setTextShape('curve', newVal)
      }
    }
  },
  methods: {
    handleChangeStop() {
      this.setFocus(false)
      stepsUtils.record()
    },
    setFocus(focus: boolean) {
      if (focus && isFocusState('shape')) {
        textEffectUtils.setFocus('shape')
      } else if (!focus) {
        textEffectUtils.setFocus('none')
      }
    },
    reset() {
      textShapeUtils.resetCurrTextEffect()
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-font-curve {
  width: 100%;
  display: grid;
  grid-template-columns: 32px 1fr 24px;
  gap: 10px;
}
</style>
