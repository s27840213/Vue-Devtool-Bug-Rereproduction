<template lang="pug">
div(class="mobile-slider" :style="containerStyles")
  div(class="mobile-slider__top")
    span(class="mobile-slider__name no-wrap") {{title}}
    input(class="mobile-slider__number"
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
  emits: ['pointerdown', 'update'],
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
    enableDefaultPadding: {
      type: Boolean,
      default: true
    },
    autoRecord: {
      type: Boolean,
      default: true,
    }
  },
  computed: {
    propsVal: {
      get(): number | string {
        return this.value
      },
      set(val: number): void {
        this.$emit('update', val, this.name)
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
      if (this.autoRecord)stepsUtils.record()
    },
    handlePointerup() {
      this.handleChangeStop()
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-slider {
  @include body-SM;
  width: 100%;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr;
  row-gap: 10px;
  box-sizing: border-box;
  color: setColor(gray-2);

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__number {
    @include body-XS;
    box-sizing: border-box;
    width: 30px;
    height: 24px;
    padding: 0;
    border: 1px solid setColor(gray-4);
    color: setColor(gray-2);
    text-align: center;
    border-radius: 0.25rem;
  }

  &__range-input-wrapper {
    position: relative;
  }

  .input__slider--range {
    height: 16px;
    &::-webkit-slider-thumb {
      width: 16px;
      height: 16px;
      margin-top: -8px;
    }
  }

  &__range-input-top {
    position: absolute;
    opacity: 0;
    &::-webkit-slider-thumb {
      margin-top: -28px;
    }
  }
}
</style>
