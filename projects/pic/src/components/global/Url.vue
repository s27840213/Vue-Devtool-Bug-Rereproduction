<template lang="pug">
span(v-if="!url")
  slot
a(v-else-if="url.startsWith('http')" :style="styles"
  :href="url" :target="newTab ? '_blank' : '_self'"
  @click="setActive(true)"
  v-click-outside="() => setActive(false)")
  slot
//- Router-link switch page too fast, so active may not change link color
router-link(v-else :to="url" :style="styles"
  @click="setActive(true)"
  v-click-outside="() => setActive(false)")
  slot
</template>

<script lang="ts">
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    url: {
      type: String
    },
    newTab: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    styles(): Record<string, string> {
      return this.active ? {
        color: '#2DB3FF' // hover-blue
      } : {}
    },
  },
  data() {
    return {
      active: false
    }
  },
  methods: {
    setActive(bool: boolean) {
      this.active = bool
    },
  },
})
</script>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: unset;
  cursor: pointer;
}
</style>
