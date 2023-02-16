<template lang="pug">
div(class="property-bar px-5 py-10")
  slot
</template>

<script lang="ts">

import { defineComponent } from 'vue'

export default defineComponent({
  emits: []
})
</script>

<style lang="scss" scoped>
</style>
