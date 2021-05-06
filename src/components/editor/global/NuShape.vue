<template lang="pug">
  div(class="nu-shape" :style="styles()" )
    svg(:viewBox="config.viewBox" preserveAspectRatio="xMidYMid slice")
      path(:d="config.path")

</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    config: Object,
    pageIndex: Number
  },
  methods: {
    styles() {
      return {
        // width: `${this.config.styles.initWidth}px`,
        // height: `${this.config.styles.initHeight}px`
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
