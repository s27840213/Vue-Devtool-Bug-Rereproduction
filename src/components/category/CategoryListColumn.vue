<template lang="pug">
  div(class="category-column")
    div(class="category-column__items")
      slot
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  computed: {}
})
</script>

<style lang="scss" scoped>
  .category-column {
    position: relative;
    &__items {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
