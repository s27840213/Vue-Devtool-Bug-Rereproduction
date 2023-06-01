<template lang="pug">
div(class="popup-slider"
    :style="styles")
  input(class="popup-slider__range-input input__slider--range"
    v-progress
    v-model.number="value"
    :max="max"
    :min="min"
    :step="step"
    v-ratio-change
    type="range"
    @mouseup="handleChangeStop")
  input(class="popup-slider__text body-2 text-gray-2"
    v-if="!noText"
    type="number"
    v-model.number="value"
    @change="handleChangeStop")
</template>

<script lang="ts">
import { PopupSliderEventType } from '@/store/types'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      popupComponent: 'popup/getPopupComponent'
    }),
    min(): number {
      return popupUtils.sliderConfig.min
    },
    max(): number {
      return popupUtils.sliderConfig.max
    },
    step(): number {
      return popupUtils.sliderConfig.step
    },
    value: {
      get: function (): number {
        return popupUtils.sliderConfig.value
      },
      set(value: number): void {
        popupUtils.event.emit(popupUtils.currEvent, value)
        popupUtils.setSliderConfig({ value })
      }
    },
    noText(): boolean {
      return popupUtils.sliderConfig.noText
    },
    width(): number {
      return popupUtils.sliderConfig.width
    },
    styles(): {[key: string]: string} {
      return {
        width: `${this.width}px`,
        ...(this.noText ? {
          height: '38px',
          gridTemplateColumns: '1fr'
        } : {
          gridTemplateColumns: '2.5fr 1fr'
        }),
      }
    }
  },
  methods: {
    handleChangeStop() {
      stepsUtils.record()
      popupUtils.event.emit(PopupSliderEventType.stop)
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-slider {
  display: grid;
  grid-template-rows: 1fr;
  column-gap: 10px;
  padding: 0.375rem 0.625rem;
  box-sizing: border-box;

  &__text {
    text-align: center;
    border: 1px solid setColor(gray-4);
    border-radius: 0.25rem;
  }
}
</style>
