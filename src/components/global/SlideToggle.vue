<template lang="pug">
div(class="toggle"
    :class="`bg-${bgColor}`"
    :style="outsideStyle")
  div(v-for="op, idx in options" class="toggle-text"
    :class="`text-${insideIndex === idx ? activeColor : inActiveColor} ${textSize}`"
    :key="op.label"
    :style="textStyle" @click="setValue(idx)") {{op.label}}
  div(class="toggle-inside"
    :class="`bg-${switchColor}`"
    :style="insideStyle")
</template>

<script lang="ts">
import _ from 'lodash'
import { PropType, defineComponent } from 'vue'
/**
 * Usage1: Text slide toggle
 * options: [{
      label: i18n.global.t('NN0514'),
      value: 'monthly'
    }, {
      label: i18n.global.t('NN0515'),
      value: 'yearly'
    }, {
      label: i18n.global.t('?'),
      value: '?'
    }]
 * slide-toggle(:options="options" v-model="test" bgColor="#F4F5F7")
 *
 * Usage2: Non-text slide toggle, need optionWidth === optionHeight
 * options: [{
      label: '',
      value: '0'
    }, {
      label: '',
      value: '1'
    }]
 * slide-toggle(:options="options" v-model="test" optionWidth="32px")
 */

export default defineComponent({
  name: 'SlideToggle',
  props: {
    // Only accept {label, value}[]
    options: {
      type: Array as PropType<{label: string, value: string}[]>,
      required: true
    },
    // Use v-model to two way bindings this props, don't use :modelValue.
    // If value cannot found in options, will be set to first option automatically.
    modelValue: {
      type: String,
      required: true
    },
    optionWidth: {
      type: String,
      default: '90px'
    },
    optionHeight: {
      type: String,
      default: '32px'
    },
    margin: {
      type: String,
      default: '4px'
    },
    bgColor: {
      type: String,
      default: 'blue-1'
    },
    switchColor: {
      type: String,
      default: 'white'
    },
    textSize: {
      type: String,
      default: 'body-XS'
    },
    activeColor: {
      type: String,
      default: 'blue-1'
    },
    inActiveColor: {
      type: String,
      default: 'gray-2'
    }
  },
  emits: ['update:modelValue'],
  computed: {
    insideIndex():number {
      return _.findIndex(this.options, ['value', this.modelValue])
    },
    outsideStyle():Record<string, string> {
      return {
        width: `calc(${this.optionWidth} * ${this.options.length})`,
        height: this.optionHeight
      }
    },
    insideStyle():Record<string, string> {
      return {
        width: `calc(${this.optionWidth} - ${this.margin} * 2)`,
        height: `calc(${this.optionHeight} - ${this.margin} * 2)`,
        margin: this.margin,
        left: `calc(${this.optionWidth} * ${this.insideIndex})`
      }
    },
    textStyle():Record<string, string> {
      return {
        width: `calc(${this.optionWidth} - ${this.margin} * 2)`,
        height: `calc(${this.optionHeight} - ${this.margin} * 2)`,
        margin: this.margin
      }
    }
  },
  mounted() {
    if (this.insideIndex === -1) this.setValue(0)
  },
  methods: {
    setValue(index: number) {
      this.$emit('update:modelValue', this.options[index].value)
    },
  }
})
</script>

<style lang="scss" scoped>
.toggle {
  display: flex;
  position: relative;
  border-radius: 100px;
}

.toggle-inside {
  position: absolute;
  border-radius: 100px;
  transition: 0.3s;
}

.toggle-text {
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  transition: 0.3s;
}
</style>
