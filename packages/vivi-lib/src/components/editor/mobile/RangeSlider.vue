<template lang="pug">
div(class="range-slider relative")
  //- opacity-100 to override safari default style of disabled range input
  input(class="range-input input__slider--range opacity-100"
    v-progress="progress"
    v-model.number="propsVal"
    :name="name"
    :max="max"
    :min="min"
    :step="step"
    v-ratio-change
    type="range"
    :disabled="disabled"
    ref="el")
  input(
    class="range-input-top input-top__slider--range"
    :class="theme"
    v-model.number="propsVal"
    :name="name"
    :max="max"
    :min="min"
    :step="step"
    v-ratio-change
    type="range"
    :disabled="disabled"
    @pointerdown="$emit('pointerdown', $event)"
    @pointerup="$emit('pointerup', $event)")
</template>

<script lang="ts">
import generalUtils from '@/utils/generalUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['pointerdown', 'update', 'update:modelValue' ,'pointerup'],
  data() {
    return {
    }
  },
  props: {
    name: {
      type: String,
    },
    modelValue: {
      type: [Number, String],
      default: 0,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      default: 1,
      type: Number
    },
    theme: {
      type: String,
      default: (generalUtils.isStk || generalUtils.isCm) ? 'light' : 'dark'
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    progress: {
      type: Boolean,
      default: true,
    }
  },
  computed: {
    propsVal: {
      get(): number | string {
        return this.modelValue
      },
      set(val: number): void {
        this.$emit('update:modelValue', val)
        this.$emit('update', val, this.$refs.el)
        // The below line is necessary for value that would be rounded.
        // If a value is rounded and not changed compared to previous value after rounded,
        // the value in this component will not be synced with the rounded value (since not change happens).
        this.$forceUpdate()
      }
    },
  }
})
</script>

<style lang="scss" scoped>
.range-slider {
  .range-input-top {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
  }
}
</style>
