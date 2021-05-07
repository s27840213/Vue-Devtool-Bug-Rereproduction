<template lang="pug">
  div(class="nu-shape" :style="styles()" )
    svg(:viewBox="viewBox" preserveAspectRatio="xMidYMid")
      path(:d="config.path")

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
  mounted() {
    console.log(this.config.viewBox)
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
