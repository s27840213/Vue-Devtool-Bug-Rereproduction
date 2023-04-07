<template lang="pug">
div(class="mobile-slider" :style="containerStyles")
  div
    span(class="mobile-slider__name text-gray-1 body-MD no-wrap") {{title}}
    input(class="mobile-slider__text body-2 text-gray-2"
      type="number"
      v-model.number="propsVal"
      :name="name"
      @change="handleChangeStop")
  div(class="mobile-slider__range-input-wrapper")
    input(class="input__slider--range"
      :style="{ 'pointer-events': borderTouchArea ? 'none' : 'auto' }"
      v-model.number="propsVal"
      :name="name"
      :max="max"
      :min="min"
      :step="step"
      v-ratio-change
      type="range"
      @pointerdown="!borderTouchArea ? $emit('pointerdown', $event) : null"
      @pointerup="!borderTouchArea ? handlePointerup : null")
    input(v-if="borderTouchArea"
      class="mobile-slider__range-input mobile-slider__range-input-top input-top__slider--range"
      v-model.number="propsVal"
      :name="name"
      :max="max"
      :min="min"
      :step="step"
      v-ratio-change
      type="range"
      @pointerdown="$emit('pointerdown', $event)"
      @pointerup="handlePointerup")
</template>

<script lang="ts">
import stepsUtils from '@/utils/stepsUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
    }
  },
  props: {
    title: {
      type: String,
      required: true
    },
    name: {
      type: String,
    },
    borderTouchArea: {
      type: Boolean,
      default: false
    },
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
    },
    enableDefaultPadding: {
      type: Boolean,
      default: true
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
        // The below line is necessary for value that would be rounded.
        // If a value is rounded and not changed compared to previous value after rounded,
        // the value in this component will not be synced with the rounded value (since not change happens).
        this.$forceUpdate()
      }
    },
    containerStyles() {
      return {
        padding: this.enableDefaultPadding ? '0.375rem 0.625rem' : 'none'
      }
    }
  },
  methods: {
    handleChangeStop() {
      stepsUtils.record()
    },
    handlePointerup(e: Event) {
      this.$emit('pointerup', e)
      this.handleChangeStop()
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

  &__range-input-wrapper {
    margin: 12px 0;
    position: relative;
  }

  &__range-input-top {
    position: absolute;
    opacity: 0;
  }
}
</style>
