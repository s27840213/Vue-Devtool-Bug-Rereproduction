<template lang="pug">
div(class="checkbox" @click="$emit('update:modelValue', !modelValue)")
  svg-icon(:iconColor="modelValue ? 'blue-1' : 'light-gray'"
          :iconName="modelValue ? 'checkbox-checked' : 'checkbox'"
          :iconWidth="iconSize")
  slot
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Checkbox',
  props: {
    // Use v-model to two way bindings this props, don't use :modelValue.
    modelValue: {
      type: Boolean,
      required: true
    },
    iconSize: {
      type: String,
      default: '16px'
    }
  },
  emits: ['update:modelValue']
})
</script>

<style lang="scss" scoped>
.checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  svg {
    margin-right: 8px;
  }
}
</style>
