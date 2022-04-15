<template lang="pug">
  div(class="mobile-slider")
    div
      span(class="mobile-slider__name text-gray-3 body-2") {{$t('NN0030')}}
      input(class="mobile-slider__text body-2 text-gray-2"
        v-if="!noText"
        type="number"
        v-model.number="value"
        @change="handleChangeStop")
    input(class="mobile-slider__range-input input__slider--range"
      v-model.number="value"
      :max="max"
      :min="min"
      :step="step"
      v-ratio-change
      type="range"
      @mouseup="handleChangeStop")
</template>

<script lang="ts">
import mappingUtils from '@/utils/mappingUtils'
import stepsUtils from '@/utils/stepsUtils'
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      step: 1,
      min: 0,
      max: 100
    }
  },
  props: {
    propName: String
  },
  created() {
    const { min, max } = mappingUtils.mappingMinMax(this.propName)

    this.min = min
    this.max = max
  },
  computed: {
  },
  methods: {
    handleChangeStop() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-slider {
  width: 100%;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr;
  row-gap: 10px;
  padding: 0.375rem 0.625rem;

  > div:nth-child(1) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__text {
    text-align: center;
    border: 1px solid setColor(gray-4);
    color: setColor(gray-3);
    border-radius: 0.25rem;
  }
}
</style>
