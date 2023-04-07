<template lang="pug">
div(class="mobile-props-toggle flex flex-between items-center full-width body-MD")
  span {{ title }}
  toggle-btn(:modelValue="modelValue" @update:modelValue="(val) => $emit('update:modelValue', val)" :width="40")
</template>

<script lang="ts">
import ToggleBtn from '@/components/global/ToggleBtn.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    ToggleBtn
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    modelValue: [String, Number, Boolean]
  }
})
</script>
