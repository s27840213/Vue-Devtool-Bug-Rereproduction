<template lang="pug">
  div(class="mobile-slider")
    div
      span(class="mobile-slider__name no-wrap" :class="theme === 'dark' ? 'text-gray-2' : 'text-white'") {{title}}
      div(class="mobile-slider__text")
        input(:class="theme === 'dark' ? 'text-gray-2' : 'text-white'"
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
        @pointerup="!borderTouchArea ? handlePointerup() : null")
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
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    title: String,
    name: String,
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
    theme: {
      type: String,
      default: 'dark'
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
    }
  },
  methods: {
    progressStyles() {
      return {
        '--progress': (typeof this.value === 'string') ? '50%' : `${(this.value - this.min) / (this.max - this.min) * 100}%`,
        'pointer-events': this.borderTouchArea ? 'none' : 'auto'
      }
    },
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
  row-gap: 20px;
  padding: 0 8px 20px 8px;
  box-sizing: border-box;

  > div:nth-child(1) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__name {
    @include body-SM;
  }

  &__text {
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
    width: 54px;
    height: 24px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    & > input {
      background: transparent;
      padding: 0;
      margin: 0;
      border-radius: 0;
      text-align: center;
      width: 100%;
      height: 22px;
      @include body-SM;
      line-height: 22px;
    }
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

  &__range-input-wrapper {
    position: relative;
  }

  &__range-input-top {
    @include progressSlider($height: 3px, $thumbSize: 40px, $marginTop: -20px);
    position: absolute;
    opacity: 0;
  }
}
</style>
