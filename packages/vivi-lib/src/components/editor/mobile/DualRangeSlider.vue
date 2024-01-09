<template lang="pug">
div(class="range-slider w-full pointer-events-none")
  div(v-if="showBubble" class="w-full relative flex")
    div(class="flex-center w-33 py-2 mb-8 rounded-30 typo-body-sm relative bg-lighter/50" :style="bubbleStyles.from") {{ propsValFrom }}
      svg-icon(iconName="cm_arrow-down-tooltip" iconWidth="8px" iconHeight="4px" class="absolute bottom-[-4px]")
    div(class="flex-center w-33 py-2 mb-8 rounded-30 typo-body-sm relative bg-lighter/50" :style="bubbleStyles.to") {{ propsValTo }}
      svg-icon(iconName="cm_arrow-down-tooltip" iconWidth="8px" iconHeight="4px" class="absolute bottom-[-4px]")
  div(class="w-full relative")
    range-slider(
      class="pointer-events-none"
      v-model.number="propsValFrom"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :progress="false"
      ref="cRangeSlider")
    range-slider(
      class="top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full pointer-events-none"
      :style="{ position: 'absolute' }"
      v-model.number="propsValTo"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :progress="false")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import RangeSlider from '@/components/editor/mobile/RangeSlider.vue'
import { round } from 'lodash'

export default defineComponent({
  emits: ['pointerdown', 'update:valueFrom', 'update:valueTo', 'pointerup'],
  components: {
    RangeSlider
  },
  data() {
    return {
      elSlider: null as HTMLInputElement | null
    }
  },
  props: {
    valueFrom: {
      type: Number,
      default: 0,
    },
    valueTo: {
      type: Number,
      default: 1,
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
    disabled: {
      type: Boolean,
      default: false,
    },
    showBubble: {
      type: Boolean,
      default: true,
    }
  },
  computed: {
    propsValFrom: {
      get(): number {
        this.setProgressStyle(this.valueFrom, this.propsValTo)
        return this.valueFrom
      },
      set(val: number): void {
        if (round(this.valueTo - val, 3) < this.step) return
        this.$emit('update:valueFrom', val)
        // The below line is necessary for value that would be rounded.
        // If a value is rounded and not changed compared to previous value after rounded,
        // the value in this component will not be synced with the rounded value (since not change happens).
        this.$forceUpdate()
      }
    },
    propsValTo: {
      get(): number {
        this.setProgressStyle(this.valueFrom, this.propsValTo)
        return this.valueTo
      },
      set(val: number): void {
        if (round(val - this.valueFrom, 3) < this.step) return
        this.$emit('update:valueTo', val)
        // The below line is necessary for value that would be rounded.
        // If a value is rounded and not changed compared to previous value after rounded,
        // the value in this component will not be synced with the rounded value (since not change happens).
        this.$forceUpdate()
      }
    },
    bubbleStyles(): { from: { [key: string]: string }, to: { [key: string]: string } } {
      const thumbWidth = 16
      const fractionFrom = this.propsValFrom / (this.max - this.min)
      const fractionTo = this.propsValTo / (this.max - this.min)
      return {
        from: {
          left: `calc(${fractionFrom * 100}% + ${(0.5 - fractionFrom) * thumbWidth}px)`,
          transform: 'translateX(-50%)'
        },
        to: {
          left: `calc(${fractionTo * 100}% + ${(0.5 - fractionTo) * thumbWidth}px)`,
          transform: 'translateX(-150%)'
        }
      }
    }
  },
  methods: {
    setProgressStyle(from: number, to: number) {
      this.$nextTick(() => {
        const { elSlider: el, max, min }  = this
        if (!el) return
        if (el.disabled) {
          el.style.setProperty('--base', '100%')
          el.style.setProperty('--progress', '0%')
        } else {
          el.style.setProperty(
            '--base',
            `${from / (max - min) * 100}%`
          )
          el.style.setProperty(
            '--progress',
            `${to / (max - min) * 100}%`
          )
        }
      })
    }
  },
  mounted() {
    this.elSlider = (this.$refs.cRangeSlider as any).$refs.el
    this.setProgressStyle(this.valueFrom, this.valueTo)
  }
})
</script>

<style lang="scss">
</style>
