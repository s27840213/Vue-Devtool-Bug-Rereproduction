<template lang="pug">
nubtn(theme="icon_text" size="mid" icon="plus-origin") {{ text }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    text: {
      type: String,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
