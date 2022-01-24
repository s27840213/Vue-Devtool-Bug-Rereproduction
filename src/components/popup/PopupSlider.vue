<template lang="pug">
  div(class="popup-slider"
      :style="styles")
    input(class="popup-slider__range-input"
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
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  data() {
    return {
      popupUtils
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
    styles(): string {
      return this.noText ? 'grid-template-columns: 1fr; height: 26px' : 'grid-template-columns: 2.5fr 1fr;'
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
  width: 150px;
  display: grid;
  grid-template-rows: 1fr;
  column-gap: 10px;
  padding: 0.375rem 0.625rem;

  &__text {
    text-align: center;
    border: 1px solid setColor(gray-4);
    color: setColor(gray-3);
    border-radius: 0.25rem;
  }

  &__range-input {
    display: block;
    margin: auto;
    appearance: none;
    outline: none;
    background: none;
    &::-webkit-slider-runnable-track {
      height: 2px;
      background-color: #d9dbe1;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 2px solid #3c64b1;
      transition: 0.2s;
      margin-top: -6.5px;
      position: relative;
    }
  }
}
</style>
