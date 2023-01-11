<template lang="pug">
span(v-if="!url")
  slot
a(v-else-if="url.startsWith('http')" :href="url")
  slot
router-link(v-else :to="url")
  slot
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    url: {
      type: String
    }
  }
})
</script>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: unset;
  cursor: pointer;
}
</style>
