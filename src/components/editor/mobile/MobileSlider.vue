<template lang="pug">
  div(class="mobile-slider")
    div
      span(class="mobile-slider__name text-gray-3 body-2 no-wrap") {{title}}
      input(class="mobile-slider__text body-2 text-gray-2"
        type="number"
        v-model.number="propsVal"
        :name="name"
        @change="handleChangeStop")
    input(class="mobile-slider__range-input"
      :class="inputRange"
      v-model.number="propsVal"
      :name="name"
      :max="max"
      :min="min"
      :step="step"
      v-ratio-change
      type="range"
      @pointerdown="$emit('pointerdown', $event)"
      @pointerup="$emit('pointerup', $event); handleChangeStop();")
</template>

<script lang="ts">
import stepsUtils from '@/utils/stepsUtils'
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    title: String,
    type: String,
    name: String,
    value: {
      type: [Number, String],
      required: true
    },
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    step: {
      default: 1,
      type: Number
    },
    /**
     * @param key - use to identify the target we want to update
     */
    propKey: {
      type: String,
      default: ''
    }
  },
  computed: {
    propsVal: {
      get(): number | string {
        return this.value
      },
      set(val: number): void {
        if (this.propKey !== '') {
          this.$emit(`update:${this.propKey}`, val)
        } else {
          this.$emit('update', val, this.name)
        }
      }
    },
    inputRange(): string {
      return this.type === 'top' ? 'input-top__slider--range' : 'input__slider--range'
    }
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
  box-sizing: border-box;

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
    width: 60px;
  }

  &__range-input {
    margin-top: 12px;
  }
}
</style>
