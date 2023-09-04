<template lang="pug">
div(class="mobile-slider grid grid-cols-[auto,1fr] grid-rows-1 gap-12")
  div(class="flex gap-4 text-app-text-secondary typo-btn-sm")
    span(class="") {{ `${$t('CM0021')}` }}
    span(class="w-[3ch]") {{ propsVal }}
  input(
    class="accent-app-btn-primary-bg"
    v-model.number="propsVal"
    :name="name"
    :max="max"
    :min="min"
    :step="step"
    type="range"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    :disabled="disabled")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['pointerDown', 'pointerUp', 'update'],
  data() {
    return {}
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    value: {
      type: [Number, String],
      required: true,
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
      type: Number,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
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
      },
    },
  },
  methods: {
    handlePointerDown(e: PointerEvent): void {
      this.$emit('pointerDown', e)
    },
    handlePointerUp(e: PointerEvent): void {
      this.$emit('pointerUp', e)
    },
  },
})
</script>

<style lang="scss" scoped></style>
