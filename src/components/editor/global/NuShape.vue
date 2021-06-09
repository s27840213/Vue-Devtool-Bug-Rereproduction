<template lang="pug">
  div(class="nu-shape")
    div(ref="svg")

</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  },
  mounted() {
    const svg = this.$refs.svg as HTMLElement
    svg.innerHTML = this.svgFormatter(this.config.svg, this.config.color)
  },
  watch: {
    'config.color': {
      handler: function(newVal) {
        const svg = this.$refs.svg as HTMLElement
        svg.innerHTML = this.svgFormatter(this.config.svg, newVal)
      },
      deep: true
    }
  },
  computed: {
    // viewBox(): string {
    //   return this.config.viewBox.join(' ')
    // }
  },
  props: {
    config: Object,
    pageIndex: Number
  },
  methods: {
    svgFormatter(svg: string, color: [string]): string {
      for (let i = 0; i < color.length; i++) {
        const reg = new RegExp('\\${color\\[' + i + '\\]}', 'g')
        svg = svg.replace(reg, color[i])
      }
      return svg
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-shape {
  display: relative;
}
</style>
