<template lang="pug">
div(class="mobile-slider" :style="containerStyles")
  div(class="mobile-slider__top" :class="theme")
    span(class="mobile-slider__name no-wrap") {{title}}
    input(class="mobile-slider__number"
      :class="theme"
      type="number"
      v-model.number="propsVal"
      :name="name"
      @change="handleChangeStop")
  div(class="mobile-slider__range-input-wrapper")
    input(class="mobile-slider__range-input"
      :class="theme"
      :style="progressStyles()"
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
      class="mobile-slider__range-input mobile-slider__range-input-top"
      :class="theme"
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
    theme: {
      type: String,
      default: 'dark'
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
        padding: this.enableDefaultPadding ? '0 8px 20px 8px' : 'none'
      }
    }
  },
  methods: {
    progressStyles(): {[key: string]: string} {
      return {
        '--progress': (typeof this.value === 'string') ? '50%' : `${(this.value - this.min) / (this.max - this.min) * 100}%`,
        'pointer-events': this.borderTouchArea ? 'none' : 'auto'
      }
    },
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
    &.light {
      color: setColor(white);
    }
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
    background: transparent;
    &.light {
      color: setColor(white);
    }
  }

  &__range-input-wrapper {
    position: relative;
  }

  &__range-input {
    margin: 0;
    --lower-color: #{setColor(black-5)};
    --upper-color: #{setColor(black-6)};
    @include progressSlider($height: 3px, $thumbSize: 16px, $marginTop: -7.5px);
    &::-webkit-slider-thumb {
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
      position: relative;
    }
    &::-moz-range-thumb {
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
      position: relative;
    }
    &.light {
      --lower-color: #{setColor(gray-6)};
      --upper-color: #{setColor(gray-2)};
    }
  }

  &__range-input-top {
    @include progressSlider($height: 3px, $thumbSize: 40px, $marginTop: -20px);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
  }
}
</style>
