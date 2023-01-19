<template lang="pug">
select(class="select" :value="modelValue" autofocus required
      @input="input")
  option(v-if="ph" value="" disabled hidden selected) {{ph}}
  option(v-for="op in options"
        :value="typeof op === 'string' ? op : op.value") {{typeof op === 'string' ? op : op.label}}
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'Options',
  props: {
    options: {
      type: Array as PropType<{value: string, label: string}[] | string[]>,
      required: true
    },
    // Use v-model to two way bindings this props, don't use :modelValue.
    modelValue: {
      type: String,
      default: ''
    },
    // To use placeholder, you need to pass ph.
    // And keep initial v-model value as empty string or null.
    ph: {
      type: String
    }
  },
  emits: ['update:modelValue'],
  methods: {
    input(e: Event) {
      this.$emit('update:modelValue', (e.target as HTMLInputElement).value)
    }
  }
})
</script>

<style lang="scss" scoped>
.select {
  @include body-SM;
  height: 40px;
  padding: 6px 10px;
  border: 1px solid setColor(gray-4);
  border-radius: 4px;
  &:invalid {
    // For placeholder text color
    color: setColor(gray-3);
  }
  // Remove safari glass effect and add self-defined arrow to all browser. https://stackoverflow.com/a/57510283
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='black'><polygon points='0,0 100,0 50,50'/></svg>")
    no-repeat;
  background-size: 12px;
  background-position: right 0.8em top 60%;
}
</style>
