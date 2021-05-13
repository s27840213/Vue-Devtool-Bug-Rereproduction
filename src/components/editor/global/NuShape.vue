<template lang="pug">
  div(class="nu-shape")
    svg(:viewBox="viewBox" preserveAspectRatio="xMidYMid")
      path(:d="config.path" :style="patternStyles()")

</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    viewBox(): string {
      return this.config.viewBox.join(' ')
    }
  },
  props: {
    config: Object,
    pageIndex: Number
  },
  methods: {
    patternStyles() {
      return {
        fill: this.config.styles.color
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-shape {
  display: relative;
}
</style>
