<template lang="pug">
div(class="property-bar px-5 py-10" :class="borderStyle")
  slot
</template>

<script lang="ts">

import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    borderColor: {
      type: String,
      default: 'gray-4'
    }
  },
  computed: {
    borderStyle() {
      return `border-${this.borderColor}`
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
